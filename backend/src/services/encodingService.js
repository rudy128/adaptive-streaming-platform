import { spawn } from 'node:child_process';
import path from 'node:path';
import { mkdir, readdir } from 'node:fs/promises';
import { uploadFile, getPublicUrl } from './s3Service.js';
import { updateVideo } from '../db/repositories/videoRepository.js';
import { upsertAnalytics } from '../db/repositories/analyticsRepository.js';

const RESOLUTIONS = [
  { name: '1080p', width: 1920, height: 1080, bitrate: '5000k', maxrate: '5350k', bufsize: '7500k' },
  { name: '720p',  width: 1280, height: 720,  bitrate: '2800k', maxrate: '2996k', bufsize: '4200k' },
  { name: '480p',  width: 854,  height: 480,  bitrate: '1400k', maxrate: '1498k', bufsize: '2100k' },
];

/**
 * Run a shell command and return a promise.
 */
function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit' });
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`)),
    );
    proc.on('error', reject);
  });
}

/**
 * Probe a media file and return its duration in seconds.
 */
function probeDuration(filePath) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      filePath,
    ]);
    let output = '';
    proc.stdout.on('data', (chunk) => { output += chunk; });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffprobe exited with code ${code}`));
      const seconds = parseFloat(output.trim());
      resolve(Number.isFinite(seconds) ? seconds : 0);
    });
    proc.on('error', reject);
  });
}

/**
 * Full encoding pipeline for a single video.
 *
 * 1) Transcode to multiple HLS resolutions
 * 2) Generate master playlist
 * 3) Extract thumbnail
 * 4) Upload everything to S3
 * 5) Update database record
 *
 * @param {string} videoId     UUID of the video row
 * @param {string} inputPath   Absolute path to uploaded original file
 */
export async function encodeVideo(videoId, inputPath) {
  const workDir = path.join('/tmp', 'encoding', videoId);
  await mkdir(workDir, { recursive: true });

  console.log(`[Encoder] Starting encode for ${videoId}`);

  // ── 0. Probe duration ───────────────────────────────────────
  let duration = 0;
  try {
    duration = await probeDuration(inputPath);
    console.log(`[Encoder] Duration: ${duration.toFixed(1)}s`);
  } catch (err) {
    console.warn('[Encoder] Could not probe duration:', err.message);
  }

  // ── 1. Transcode each resolution ────────────────────────────
  for (const res of RESOLUTIONS) {
    const resDir = path.join(workDir, res.name);
    await mkdir(resDir, { recursive: true });

    const args = [
      '-i', inputPath,
      '-vf', `scale=w=${res.width}:h=${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-b:v', res.bitrate,
      '-maxrate', res.maxrate,
      '-bufsize', res.bufsize,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-hls_time', '6',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(resDir, 'segment_%03d.ts'),
      '-f', 'hls',
      path.join(resDir, 'index.m3u8'),
    ];

    await runCommand('ffmpeg', args);
    console.log(`[Encoder] ${res.name} done`);
  }

  // ── 2. Generate master playlist ─────────────────────────────
  const masterLines = ['#EXTM3U'];
  for (const res of RESOLUTIONS) {
    masterLines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(res.bitrate) * 1000},RESOLUTION=${res.width}x${res.height}`,
      `${res.name}/index.m3u8`,
    );
  }
  const masterContent = masterLines.join('\n') + '\n';
  const masterPath = path.join(workDir, 'master.m3u8');
  const { writeFile } = await import('node:fs/promises');
  await writeFile(masterPath, masterContent);

  // ── 3. Extract thumbnail at 3 s ─────────────────────────────
  const thumbPath = path.join(workDir, 'thumbnail.jpg');
  await runCommand('ffmpeg', [
    '-i', inputPath,
    '-ss', '00:00:03',
    '-vframes', '1',
    '-q:v', '2',
    thumbPath,
  ]);
  console.log('[Encoder] Thumbnail extracted');

  // ── 4. Upload to S3 ─────────────────────────────────────────
  try {
    const s3Prefix = `videos/${videoId}`;

    // Upload master playlist
    console.log('[Encoder] Uploading master playlist to S3…');
    await uploadFile(`${s3Prefix}/master.m3u8`, masterPath, 'application/x-mpegURL');

    // Upload each resolution's playlist + segments
    for (const res of RESOLUTIONS) {
      const resDir = path.join(workDir, res.name);
      const files = await readdir(resDir);
      console.log(`[Encoder] Uploading ${files.length} files for ${res.name}…`);
      for (const file of files) {
        const contentType = file.endsWith('.m3u8')
          ? 'application/x-mpegURL'
          : 'video/MP2T';
        await uploadFile(`${s3Prefix}/${res.name}/${file}`, path.join(resDir, file), contentType);
      }
      console.log(`[Encoder] ${res.name} uploaded ✓`);
    }

    // Upload thumbnail
    console.log('[Encoder] Uploading thumbnail…');
    const thumbnailUrl = await uploadFile(`${s3Prefix}/thumbnail.jpg`, thumbPath, 'image/jpeg');
    const masterPlaylistUrl = getPublicUrl(`${s3Prefix}/master.m3u8`);

    console.log('[Encoder] All files uploaded to S3 ✓');

    // ── 5. Update DB ────────────────────────────────────────────
    await updateVideo(videoId, {
      thumbnail_url: thumbnailUrl,
      master_playlist_url: masterPlaylistUrl,
      duration,
      status: 'ready',
    });

    // Initialize analytics row
    await upsertAnalytics(videoId, { totalViews: 0, concurrentViewers: 0 });

    console.log(`[Encoder] Video ${videoId} is ready ✓`);
  } catch (uploadErr) {
    console.error(`[Encoder] S3 upload / DB update failed for ${videoId}:`, uploadErr);
    // Mark video as failed so the admin can see it
    await updateVideo(videoId, { status: 'failed' }).catch(() => {});
    throw uploadErr;
  }
}

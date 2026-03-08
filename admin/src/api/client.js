const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export function getVideos() {
  return request('/videos');
}

export function getVideo(id) {
  return request(`/videos/${id}`);
}

export function deleteVideo(id) {
  return request(`/videos/${id}`, { method: 'DELETE' });
}

export function getAnalytics() {
  return request('/analytics');
}

export function getAnalyticsHistory(minutes = 60) {
  return request(`/analytics/history?minutes=${minutes}`);
}

/**
 * Upload a video file with metadata.
 * @param {File} file
 * @param {{ title: string, description?: string }} meta
 */
export async function uploadVideo(file, meta) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', meta.title);
  if (meta.description) formData.append('description', meta.description);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Upload failed');
  }

  return res.json();
}

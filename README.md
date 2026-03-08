# 🎬 Real-Time Adaptive Video Streaming Platform

A full-stack video streaming platform with HLS adaptive bitrate encoding, real-time concurrent viewer tracking via WebSockets, and a live analytics dashboard.

---

## Architecture

```
┌────────────────┐      ┌────────────────┐      ┌─────────────────────┐
│  Users (React)  │◄────►│  Backend (API)  │◄────►│  S3-Compatible Store│
│  :5173          │      │  :4000          │      │  (Supabase / AWS)   │
└────────────────┘      └───────┬─────────┘      └─────────────────────┘
                                │
┌────────────────┐              │         ┌──────────┐   ┌────────────┐
│  Admin (React)  │◄─── WS ────┤         │ PostgreSQL│   │   Redis    │
│  :5174          │             │         └──────────┘   └────────────┘
└────────────────┘              │
                          ┌─────┴──────┐
                          │   FFmpeg    │
                          │  Encoding   │
                          └────────────┘
```

The project is split into three packages:

| Package | Description | Port |
|---------|-------------|------|
| `backend/` | Express 5 API server — uploads, encoding, streaming, WebSocket presence, analytics | `4000` |
| `users/` | React viewer frontend — video catalog, HLS player with quality selector | `5173` |
| `admin/` | React admin dashboard — upload videos, manage catalog, live analytics graphs | `5174` |

---

## Features

- **HLS Adaptive Bitrate Streaming** — Videos are encoded into 1080p, 720p, and 480p variants using FFmpeg and served via an HLS master playlist.
- **Manual Quality Selector** — Viewers can switch between Auto, 1080p, 720p, and 480p directly on the video player overlay.
- **Real-Time Concurrent Viewer Tracking** — WebSocket-based presence system with Redis-backed heartbeat/TTL to track active viewers per video.
- **Live Analytics Dashboard** — Admin panel with real-time concurrent viewer count, historical area chart (powered by Recharts), and per-video breakdown.
- **S3-Compatible Storage** — Upload HLS segments, playlists, and thumbnails to any S3-compatible provider (AWS S3, Supabase Storage, MinIO, etc.).
- **Auto Thumbnail Extraction** — Thumbnails are generated from the video at the 3-second mark during encoding.
- **Video Duration Detection** — `ffprobe` extracts the duration, displayed as a badge on video cards.
- **Dark Mode UI** — YouTube-inspired dark theme across both frontends.

---

## Tech Stack

**Backend:**
- Node.js (ES Modules) + Express 5
- PostgreSQL (database)
- Redis (presence / heartbeat store)
- FFmpeg + ffprobe (video encoding & probing)
- AWS SDK v3 (S3-compatible object storage)
- WebSocket (`ws` library)

**Frontends:**
- React 19 + Vite 7 (SWC)
- hls.js (HLS playback in the users app)
- Recharts (analytics charts in the admin app)

---

## Prerequisites

Make sure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥ 18 | Runtime |
| **pnpm** | ≥ 10 | Package manager |
| **FFmpeg** | Any recent build | Video encoding |
| **ffprobe** | Bundled with FFmpeg | Duration extraction |
| **Docker** | Any recent version | Running Redis locally |
| **PostgreSQL** | ≥ 14 | Database (or use a hosted instance like Supabase) |

---

## Local Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd streaming
```

### 2. Start Redis via Docker

```bash
docker run -d --name streaming-redis -p 6379:6379 redis:7-alpine
```

### 3. Set up PostgreSQL

You can use a local PostgreSQL instance or a hosted one (e.g., Supabase). Make sure you have a database ready and note the connection string.

### 4. Configure the backend environment

Create a `.env` file inside `backend/`:

```bash
cd backend
cp .env.example .env   # or create manually
```

```env
PORT=4000
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/streaming

# Redis
REDIS_URL=redis://localhost:6379

# S3-Compatible Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_ENDPOINT=https://your-s3-endpoint.com        # leave empty for AWS S3
S3_FORCE_PATH_STYLE=true                         # set to true for Supabase/MinIO
S3_PUBLIC_URL=https://your-public-url.com        # public base URL for stored files

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### 5. Install dependencies

From the project root, install dependencies for all three packages:

```bash
cd backend && pnpm install && cd ..
cd admin   && pnpm install && cd ..
cd users   && pnpm install && cd ..
```

### 6. Run database migrations

```bash
cd backend
pnpm run db:migrate
```

This creates the following tables:
- `videos` — video metadata (title, description, status, duration, URLs)
- `video_views` — per-session view records
- `video_analytics` — aggregated view/concurrent counts per video
- `concurrent_history` — time-series snapshots for the analytics chart

### 7. Start the backend

```bash
cd backend
pnpm run dev
```

The server starts at `http://localhost:4000` with file-watching enabled.

### 8. Start the frontends

In separate terminals:

```bash
# Users frontend
cd users
pnpm run dev
```

```bash
# Admin frontend
cd admin
pnpm run dev
```

| Frontend | URL |
|----------|-----|
| Users | http://localhost:5173 |
| Admin | http://localhost:5174 |

Both frontends proxy `/api` and `/ws` requests to the backend automatically via Vite's dev server.

---

## Environment Variables (Frontends)

For production builds or non-proxy setups, the frontends support these Vite environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL for API requests | `https://api.example.com/api` |
| `VITE_WS_URL` | WebSocket URL | `wss://api.example.com` |

Create a `.env` in `users/` or `admin/` to override:

```env
VITE_API_URL=https://api.example.com/api
VITE_WS_URL=wss://api.example.com
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/upload` | Upload a video (multipart/form-data) |
| `GET` | `/api/videos` | List all videos |
| `GET` | `/api/videos/:id` | Get a single video |
| `PATCH` | `/api/videos/:id` | Update video metadata |
| `DELETE` | `/api/videos/:id` | Delete a video |
| `GET` | `/api/stream/:videoId/master.m3u8` | Redirect to the HLS master playlist |
| `GET` | `/api/analytics/snapshot` | Current analytics snapshot |
| `GET` | `/api/analytics/history` | Historical concurrent viewer data |

---

## WebSocket Protocol

Connect to `ws://localhost:4000/ws?role=viewer` or `ws://localhost:4000/ws?role=admin`.

**Viewer → Server:**

```json
{ "type": "play", "videoId": "<uuid>" }
{ "type": "pause" }
{ "type": "heartbeat" }
{ "type": "stop" }
```

**Server → Admin:**

```json
{
  "type": "analytics_update",
  "data": {
    "activeUsers": 12,
    "videos": [
      { "videoId": "...", "title": "...", "concurrentViewers": 5 }
    ]
  }
}
```

---

## Video Encoding Pipeline

When a video is uploaded:

1. The file is saved to a temp directory via Multer.
2. `ffprobe` extracts the video duration.
3. FFmpeg encodes three HLS variants:
   - **1080p** — 5 Mbps
   - **720p** — 2.8 Mbps
   - **480p** — 1.4 Mbps
4. A master playlist (`master.m3u8`) referencing all variants is generated.
5. A thumbnail is extracted at the 3-second mark.
6. All files (segments, playlists, thumbnail) are uploaded to S3.
7. The video record in PostgreSQL is updated to `ready` status.

---

## Project Structure

```
streaming/
├── backend/
│   └── src/
│       ├── index.js                  # Express app + HTTP server
│       ├── config/
│       │   ├── db.js                 # PostgreSQL pool
│       │   ├── env.js                # Environment variables
│       │   ├── redis.js              # Redis client
│       │   └── s3.js                 # S3 client
│       ├── db/
│       │   ├── migrate.js            # Database schema migrations
│       │   └── repositories/         # Data access layer
│       ├── middleware/
│       │   ├── errorHandler.js       # Error + 404 handlers
│       │   └── upload.js             # Multer config (2 GB limit)
│       ├── routes/
│       │   ├── analytics.js          # GET /api/analytics/*
│       │   ├── stream.js             # GET /api/stream/:id/master.m3u8
│       │   ├── upload.js             # POST /api/upload
│       │   └── videos.js             # CRUD /api/videos
│       ├── services/
│       │   ├── analyticsService.js   # Snapshot aggregation
│       │   ├── encodingService.js    # FFmpeg HLS pipeline
│       │   ├── presenceService.js    # Redis-backed viewer presence
│       │   └── s3Service.js          # S3 upload + public URL
│       └── websocket/
│           └── socketServer.js       # WebSocket server (viewer + admin)
├── admin/
│   └── src/
│       ├── App.jsx                   # Tab layout (Upload / Videos / Analytics)
│       ├── api/client.js             # API helper functions
│       ├── hooks/useAdminSocket.js   # WebSocket hook for live analytics
│       └── components/
│           ├── AnalyticsDashboard.jsx # Live chart + stats
│           ├── UploadForm.jsx        # Video upload form
│           └── VideoList.jsx         # Video management table
└── users/
    └── src/
        ├── App.jsx                   # Router (Catalog → Watch)
        ├── api/client.js             # API helper functions
        ├── hooks/useViewerSocket.js  # WebSocket hook for presence
        ├── components/
        │   ├── VideoCard.jsx         # Thumbnail card with duration badge
        │   └── VideoPlayer.jsx       # HLS player + quality selector
        └── pages/
            ├── CatalogPage.jsx       # Video grid
            └── WatchPage.jsx         # Player + sidebar
```

---

## License

ISC

You are a senior backend engineer helping me build a real-time adaptive video streaming platform.

IMPORTANT:
This project must demonstrate real backend engineering concepts such as:

- Adaptive bitrate streaming (HLS)
- Video encoding pipeline using FFmpeg
- Real-time analytics using WebSockets
- Presence tracking for concurrent viewers
- S3-based storage
- Redis for session tracking
- Clean architecture and separation of services

Use JavaScript (NOT TypeScript).

The stack must be:

Backend:
- Node.js
- express
- Redis
- PostgreSQL
- AWS S3
- FFmpeg workers
- WebSockets

Frontend:
- React
- hls.js for video playback

The system has two frontends:
1) Admin Dashboard
2) User Video Platform

------------------------------------------------

SYSTEM ARCHITECTURE

Admin uploads videos.

Upload flow:

Admin UI
   -> Backend API
   -> Video stored in S3
   -> Encoding worker runs FFmpeg
   -> HLS segments generated
   -> Thumbnail generated
   -> Metadata saved in database

Users can browse the catalog and play videos.

Videos must be streamed using HLS adaptive bitrate streaming.

Player must automatically switch quality depending on bandwidth.

------------------------------------------------

DATABASE SCHEMA

Create PostgreSQL tables.

videos table:

- id
- title
- description
- thumbnail_url
- master_playlist_url
- duration
- created_at

video_views table:

- id
- video_id
- session_id
- started_at
- ended_at

video_analytics table:

- video_id
- total_views
- concurrent_viewers

------------------------------------------------

ADMIN FEATURES

Admin dashboard must allow:

1) Upload video
2) Show list of uploaded videos
3) Show analytics for each video

Upload pipeline:

1) Admin uploads video file
2) Backend stores original video in S3
3) Worker triggers FFmpeg

FFmpeg must:

- Generate HLS segments
- Create 3 resolutions:

1080p
720p
480p

Output format:

master.m3u8
1080p/index.m3u8
720p/index.m3u8
480p/index.m3u8

Also extract a thumbnail:

Use FFmpeg to capture frame at second 3.

Thumbnail stored in S3.

Save public URLs in database:

thumbnail_url
master_playlist_url

------------------------------------------------

USER PLATFORM

Users can:

1) Browse catalog
2) See video thumbnails
3) Click video
4) Watch video

Catalog page shows:

- thumbnail
- title

Video page contains:

HTML video player using hls.js

Example player logic:

- load master playlist
- adaptive bitrate streaming
- auto quality switching

------------------------------------------------

VIDEO STREAMING

Streaming must use HLS.

Player loads:

/stream/:videoId/master.m3u8

Segments stored in S3.

Backend handles:

- authentication (if needed later)
- logging
- analytics

------------------------------------------------

REAL-TIME ANALYTICS

We must track:

- total views
- concurrent viewers
- viewers per video

Use WebSockets.

When a user watches a video:

Client sends events:

play
pause
heartbeat
stop

Heartbeat interval:

every 5 seconds

Backend stores active viewers in Redis.

Redis schema:

video:{videoId}:viewers -> set(sessionId)

global:active_users -> set(sessionId)

If heartbeat stops for 15 seconds:

remove viewer.

------------------------------------------------

ADMIN ANALYTICS DASHBOARD

Admin connects via WebSocket.

Dashboard shows real-time metrics:

- active users
- concurrent viewers per video
- total views per video

Example dashboard data:

{
  "activeUsers": 32,
  "videos": [
    {
      "videoId": "123",
      "title": "Kafka Explained",
      "concurrentViewers": 12,
      "totalViews": 240
    }
  ]
}

------------------------------------------------

PROJECT STRUCTURE

backend/

server.js
routes/
    videos.js
    upload.js
services/
    s3Service.js
    analyticsService.js
    presenceService.js
workers/
    encodingWorker.js
websocket/
    socketServer.js

frontend/

admin-dashboard/
user-app/

------------------------------------------------

IMPORTANT IMPLEMENTATION DETAILS

Encoding Worker:

Use FFmpeg to:

1) generate HLS segments
2) generate thumbnail

Example FFmpeg operations:

- transcode to multiple bitrates
- segment video
- create master playlist
- extract thumbnail

------------------------------------------------

WEBSOCKET EVENTS

Client -> Server

play
pause
heartbeat
stop

Server -> Admin Dashboard

analytics_update

------------------------------------------------

DELIVERABLES

Generate:

1) Backend API
2) Encoding worker
3) Redis analytics system
4) WebSocket server
5) Admin dashboard
6) User frontend
7) React video player using hls.js

Make sure code is modular and production-style.

Start by generating:

1) backend folder structure
2) database schema
3) express server setup
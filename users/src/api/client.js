const API_BASE = '/api';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export function getPublishedVideos() {
  return request('/videos?published=true');
}

export function getVideo(id) {
  return request(`/videos/${id}`);
}

import { deleteVideo } from '../api/client.js';

export default function VideoList({ videos, onRefresh }) {
  async function handleDelete(id) {
    if (!confirm('Delete this video?')) return;
    try {
      await deleteVideo(id);
      onRefresh?.();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!videos || videos.length === 0) {
    return <p className="empty">No videos uploaded yet.</p>;
  }

  return (
    <div className="video-list">
      <h2>Videos</h2>
      <table>
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Title</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((v) => (
            <tr key={v.id}>
              <td>
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt={v.title} width={120} />
                ) : (
                  <span className="no-thumb">—</span>
                )}
              </td>
              <td>{v.title}</td>
              <td>
                <span className={`badge badge-${v.status}`}>{v.status}</span>
              </td>
              <td>{new Date(v.created_at).toLocaleDateString()}</td>
              <td>
                <button className="btn-danger" onClick={() => handleDelete(v.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

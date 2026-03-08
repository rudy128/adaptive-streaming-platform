import { useState } from 'react';
import { uploadVideo } from '../api/client.js';

export default function UploadForm({ onUploadComplete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    setError('');

    try {
      await uploadVideo(file, { title, description });
      setTitle('');
      setDescription('');
      setFile(null);
      onUploadComplete?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <h2>Upload Video</h2>

      {error && <p className="error">{error}</p>}

      <div className="field">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="field">
        <label htmlFor="video">Video File *</label>
        <input
          id="video"
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
      </div>

      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  );
}

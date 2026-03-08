import { useState, useEffect, useCallback } from 'react';
import UploadForm from './components/UploadForm.jsx';
import VideoList from './components/VideoList.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import { getVideos } from './api/client.js';
import './App.css';

const TABS = ['videos', 'analytics'];

function App() {
  const [tab, setTab] = useState('videos');
  const [videos, setVideos] = useState([]);

  const fetchVideos = useCallback(async () => {
    try {
      const data = await getVideos();
      setVideos(data);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getVideos();
        if (!cancelled) setVideos(data);
      } catch (err) {
        console.error('Failed to fetch videos:', err);
      }
    }

    load();

    const interval = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📺 Admin Dashboard</h1>
        <nav>
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'videos' && (
          <>
            <UploadForm onUploadComplete={fetchVideos} />
            <VideoList videos={videos} onRefresh={fetchVideos} />
          </>
        )}

        {tab === 'analytics' && <AnalyticsDashboard />}
      </main>
    </div>
  );
}

export default App;

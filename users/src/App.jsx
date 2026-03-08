import { useState } from 'react';
import CatalogPage from './pages/CatalogPage.jsx';
import WatchPage from './pages/WatchPage.jsx';
import './App.css';

function App() {
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={() => setSelectedVideo(null)} style={{ cursor: 'pointer' }}>
          🎬 StreamHub
        </h1>
      </header>

      <main className="app-main">
        {selectedVideo ? (
          <WatchPage
            video={selectedVideo}
            onBack={() => setSelectedVideo(null)}
            onSelectVideo={setSelectedVideo}
          />
        ) : (
          <CatalogPage onSelectVideo={setSelectedVideo} />
        )}
      </main>
    </div>
  );
}

export default App;

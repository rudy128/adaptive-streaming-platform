import { useAdminSocket } from '../hooks/useAdminSocket.js';

export default function AnalyticsDashboard() {
  const { analytics, connected } = useAdminSocket();

  return (
    <div className="analytics-dashboard">
      <h2>
        Real-Time Analytics{' '}
        <span className={`dot ${connected ? 'green' : 'red'}`} />
      </h2>

      {!analytics ? (
        <p>Loading analytics…</p>
      ) : (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-value">{analytics.activeUsers}</span>
              <span className="stat-label">Active Users</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>Status</th>
                <th>Concurrent Viewers</th>
                <th>Total Views</th>
              </tr>
            </thead>
            <tbody>
              {analytics.videos.map((v) => (
                <tr key={v.videoId}>
                  <td>{v.title}</td>
                  <td>
                    <span className={`badge badge-${v.status}`}>{v.status}</span>
                  </td>
                  <td>{v.concurrentViewers}</td>
                  <td>{v.totalViews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

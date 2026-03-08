import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAdminSocket } from '../hooks/useAdminSocket.js';
import { getAnalyticsHistory } from '../api/client.js';

const TIME_RANGES = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '6h', minutes: 360 },
  { label: '24h', minutes: 1440 },
];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AnalyticsDashboard() {
  const { analytics, connected } = useAdminSocket();
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState(60);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAnalyticsHistory(range);
        if (!cancelled) setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    }

    load();
    const interval = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [range]);

  return (
    <div className="analytics-dashboard">
      <h2>
        Real-Time Analytics{' '}
        <span className={`dot ${connected ? 'green' : 'red'}`} />
      </h2>

      {/* ── Summary cards ─────────────────────────── */}
      {analytics && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{analytics.activeUsers}</span>
            <span className="stat-label">Active Users</span>
          </div>
        </div>
      )}

      <div className="chart-section">
        <h3>Concurrent Viewers Over Time</h3>

        <div className="chart-controls">
          {TIME_RANGES.map((r) => (
            <button
              key={r.minutes}
              className={range === r.minutes ? 'active' : ''}
              onClick={() => setRange(r.minutes)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#272727" />
            <XAxis
              dataKey="recorded_at"
              tickFormatter={formatTime}
              stroke="#555"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              stroke="#555"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: 6,
                color: '#e4e4e7',
              }}
              labelFormatter={formatTime}
            />
            <Area
              type="monotone"
              dataKey="active_users"
              name="Users"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorUsers)"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {analytics && analytics.videos.length > 0 && (
        <div className="analytics-table-section">
          <h3>Per-Video Stats</h3>
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
        </div>
      )}
    </div>
  );
}

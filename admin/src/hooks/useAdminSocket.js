import { useEffect, useRef, useState } from 'react';

/**
 * Hook that manages a WebSocket connection to the admin analytics endpoint.
 * Automatically reconnects on disconnect.
 */
export function useAdminSocket() {
  const [analytics, setAnalytics] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const connectRef = useRef(null);

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws?role=admin`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Admin connected');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'analytics_update') {
            setAnalytics(msg.data);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        console.log('[WS] Admin disconnected — reconnecting in 3s');
        setConnected(false);
        retryRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connectRef.current = connect;
    connect();

    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { analytics, connected };
}

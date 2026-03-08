import { useEffect, useRef, useCallback } from 'react';

const HEARTBEAT_INTERVAL = 5000;

/**
 * Hook that manages a WebSocket connection for viewer presence tracking.
 * Sends play / pause / heartbeat / stop events.
 */
export function useViewerSocket() {
  const wsRef = useRef(null);
  const heartbeatRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_URL;
    let wsUrl;
    if (wsBase) {
      wsUrl = `${wsBase}/ws?role=viewer`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${protocol}://${window.location.host}/ws?role=viewer`;
    }
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log('[WS] Viewer connected');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'session') {
          sessionIdRef.current = msg.sessionId;
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => console.log('[WS] Viewer disconnected');
    ws.onerror = () => ws.close();

    return () => {
      clearInterval(heartbeatRef.current);
      ws.close();
    };
  }, []);

  const send = useCallback((payload) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  const play = useCallback(
    (videoId) => {
      send({ type: 'play', videoId });

      // Start heartbeat
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        send({ type: 'heartbeat' });
      }, HEARTBEAT_INTERVAL);
    },
    [send],
  );

  const pause = useCallback(() => {
    send({ type: 'pause' });
    clearInterval(heartbeatRef.current);
  }, [send]);

  const stop = useCallback(() => {
    send({ type: 'stop' });
    clearInterval(heartbeatRef.current);
  }, [send]);

  return { play, pause, stop, sessionId: sessionIdRef };
}

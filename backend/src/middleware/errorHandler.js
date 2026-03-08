export function errorHandler(err, _req, res, _next) {
  console.error('[Error]', err);

  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal Server Error';

  res.status(status).json({ error: message });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not Found' });
}

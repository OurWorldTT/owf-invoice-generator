export function sendError(res, error) {
  const status = Number(error?.statusCode) || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Internal server error.' : error.message, code: error?.code || undefined });
}
export function readJson(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { throw Object.assign(new Error('Request body must be valid JSON.'), { statusCode: 400 }); }
}

export function configuredOrigins() {
  return String(process.env.FRONTEND_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean).map((value) => {
    try { return new URL(value).origin; } catch { return ''; }
  }).filter(Boolean);
}
export function applyCors(req, res) {
  const origin = String(req.headers.origin || '');
  const allowed = configuredOrigins();
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '600');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  if (origin && !allowed.includes(origin)) { res.status(403).json({ error: 'Origin is not allowed.' }); return true; }
  return false;
}

/**
 * Минимальный Node-сервер для приёма заявок: POST /api/lead
 * Локально: `npm run dev:api` (Astro dev проксирует /api сюда).
 * На VPS: запустить под pm2/systemd и проксировать /api/ через nginx.
 */
import { createServer } from 'node:http';
import { handleLead } from './lead-core.mjs';

const PORT = Number(process.env.LEAD_PORT || 8787);
const MAX_BODY = 20 * 1024;

const server = createServer(async (req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };

  if (!['/api/lead', '/api/lead/'].includes(req.url?.split('?')[0] ?? '')) return send(404, { ok: false, error: 'Not found' });
  if (req.method !== 'POST') return send(405, { ok: false, error: 'Method not allowed' });

  let raw = '';
  let tooBig = false;
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) { tooBig = true; break; }
  }
  if (tooBig) return send(413, { ok: false, error: 'Слишком большой запрос.' });

  let body;
  try { body = JSON.parse(raw); } catch { return send(400, { ok: false, error: 'Некорректный запрос.' }); }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
  try {
    const result = await handleLead(body, ip);
    send(result.status, result.body);
  } catch (e) {
    console.error('[lead] Ошибка:', e);
    send(500, { ok: false, error: 'Ошибка сервера.' });
  }
});

server.listen(PORT, () => console.log(`[lead] API заявок слушает http://localhost:${PORT}/api/lead`));

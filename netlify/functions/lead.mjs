// Serverless-функция Netlify: POST /api/lead
// Переменные окружения задаются в панели Netlify (Site settings → Environment variables).
import { handleLead } from '../../server/lead-core.mjs';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
  }
  let body;
  try {
    const raw = await req.text();
    if (raw.length > 20 * 1024) return Response.json({ ok: false, error: 'Слишком большой запрос.' }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: 'Некорректный запрос.' }, { status: 400 });
  }
  const env = { ...process.env, NODE_ENV: 'production' };
  const result = await handleLead(body, context.ip, env);
  return Response.json(result.body, { status: result.status, headers: { 'Cache-Control': 'no-store' } });
};

export const config = { path: ['/api/lead', '/api/lead/'] };

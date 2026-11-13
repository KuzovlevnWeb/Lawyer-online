/**
 * Общая логика приёма заявки. Используется:
 *  - server/lead-server.mjs — Node-сервер (локальная разработка и VPS);
 *  - netlify/functions/lead.mjs — serverless-функция Netlify.
 *
 * Каналы доставки (включаются переменными окружения):
 *  - Telegram-бот: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 *  - E-mail по SMTP: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEAD_EMAIL_TO, (LEAD_EMAIL_FROM)
 */

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 минут
const RATE_MAX = 5; // не более 5 заявок с одного IP за окно
const MIN_FILL_MS = 3000; // форму не заполнить быстрее 3 секунд — признак бота
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > RATE_WINDOW_MS) hits.delete(k);
  return list.length > RATE_MAX;
}

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function validate(body) {
  const data = {
    name: clean(body?.name, 100),
    contact: clean(body?.contact, 150),
    message: clean(body?.message, 3000),
    page: clean(body?.page, 200),
    source: clean(body?.source, 60),
  };
  if (body?.consent !== true && body?.consent !== 'on' && body?.consent !== 'true') {
    return { error: 'Нужно согласие на обработку персональных данных.' };
  }
  if (data.name.length < 2) return { error: 'Укажите имя.' };
  if (data.contact.length < 3) return { error: 'Укажите контакт для связи.' };
  if (data.message.length < 10) return { error: 'Опишите ситуацию чуть подробнее.' };
  return { data };
}

async function sendTelegram(env, d) {
  // TELEGRAM_MINIMAL=1 — в Telegram уходит только уведомление без персональных данных
  // (сама заявка хранится в почте на серверах в РФ — см. README, раздел про 152-ФЗ)
  const text = env.TELEGRAM_MINIMAL === '1'
    ? `<b>Новая заявка с сайта</b>
Подробности — в почте. Страница: ${esc(d.page || '/')}`
    : [
    '<b>Новая заявка с сайта</b>',
    '',
    `<b>Имя:</b> ${esc(d.name)}`,
    `<b>Контакт:</b> ${esc(d.contact)}`,
    '',
    `<b>Ситуация:</b>\n${esc(d.message)}`,
    '',
    `<i>Страница: ${esc(d.page || '/')} · ${esc(d.source || '')}</i>`,
  ].join('\n');
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error(`Telegram: ${res.status} ${await res.text()}`);
}

async function sendEmail(env, d) {
  const { createTransport } = await import('nodemailer');
  const port = Number(env.SMTP_PORT || 465);
  const transport = createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  await transport.sendMail({
    from: env.LEAD_EMAIL_FROM || env.SMTP_USER,
    to: env.LEAD_EMAIL_TO,
    subject: `Заявка с сайта: ${d.name}`,
    text: `Имя: ${d.name}\nКонтакт: ${d.contact}\n\nСитуация:\n${d.message}\n\nСтраница: ${d.page} (${d.source})`,
  });
}

/**
 * @returns {Promise<{status:number, body:{ok:boolean, error?:string}}>}
 */
export async function handleLead(body, ip, env = process.env) {
  // Ловушка для ботов: тихо «принимаем», но ничего не отправляем
  if (body?.website) return { status: 200, body: { ok: true } };
  const ts = Number(body?.ts || 0);
  if (!ts || Date.now() - ts < MIN_FILL_MS) return { status: 200, body: { ok: true } };

  if (rateLimited(ip || 'unknown')) {
    return { status: 429, body: { ok: false, error: 'Слишком много заявок подряд. Попробуйте через несколько минут.' } };
  }

  const { data, error } = validate(body);
  if (error) return { status: 400, body: { ok: false, error } };

  const channels = [];
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) channels.push(sendTelegram(env, data));
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.LEAD_EMAIL_TO) channels.push(sendEmail(env, data));

  if (channels.length === 0) {
    if (env.NODE_ENV !== 'production') {
      console.log('[lead] Каналы не настроены, заявка выведена в консоль (режим разработки):\n', data);
      return { status: 200, body: { ok: true } };
    }
    console.error('[lead] Не настроен ни один канал доставки заявок');
    return { status: 503, body: { ok: false, error: 'Форма временно недоступна.' } };
  }

  const results = await Promise.allSettled(channels);
  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) => console.error('[lead] Ошибка доставки:', r.reason));
  if (failed.length === results.length) {
    return { status: 502, body: { ok: false, error: 'Не удалось отправить заявку.' } };
  }
  return { status: 200, body: { ok: true } };
}

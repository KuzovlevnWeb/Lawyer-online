# Сайт юридической практики

Многостраничный сайт двух юристов, работающих онлайн. Задача — превращать посетителя в обращение: заявка, сообщение в мессенджер или звонок.

## Стек и почему он

**Astro 7 + Tailwind CSS 4**, статическая сборка.

- Astro отдаёт чистый HTML без тяжёлого JS-фреймворка → высокая скорость на телефонах (Lighthouse mobile: Performance 92–98, SEO 100, Accessibility 95+).
- Тексты услуг и юридических страниц лежат в Markdown — их можно править без знания кода.
- Анимации на CSS и ~4 КБ своего JS (без библиотек), учитывают настройку «уменьшить движение».
- Шрифты Manrope (заголовки) и Inter (текст) подключены локально через `@fontsource` — без запросов к Google.

## Быстрый старт

Нужен Node.js 22.12+.

```bash
npm install
```

```bash
npm run dev
```

Сайт откроется на http://localhost:4321. Чтобы форма работала локально, во втором терминале запустите сервер заявок:

```bash
npm run dev:api
```

Без настроенных каналов он просто печатает заявку в консоль.

Сборка в папку `dist/`:

```bash
npm run build
```

## Как править тексты

| Что | Где |
|---|---|
| Контакты, регионы, шаги работы, FAQ | `src/config/site.ts` |
| Услуги (по файлу на услугу = отдельная страница) | `src/content/services/*.md` |
| Политика ПДн, согласие, условия | `src/content/legal/*.md` |
| Главная | `src/pages/index.astro` |
| О нас / Как мы работаем / Контакты | `src/pages/o-nas.astro`, `kak-my-rabotaem.astro`, `kontakty.astro` |
| Цвета, шрифты, анимации | `src/styles/global.css` |
| Картинка для соцсетей | `scripts/make-og.mjs` → `npm run og` |

**Новая услуга:** скопируйте любой файл из `src/content/services/`, поменяйте имя файла (оно станет адресом: `moya-usluga.md` → `/uslugi/moya-usluga/`) и поля. Иконка — одно из: `stack`, `upright`, `arrow`, `envelope`, `parties`, `cube`.

**Плейсхолдеры.** Все места, где нужны ваши данные, помечены `[ЗАПОЛНИТЬ: ...]` и на сайте подсвечены жёлтым. Найти все: поиск по проекту `ЗАПОЛНИТЬ` и `ZAPOLNIT`.

## Форма заявки

Поля: имя, контакт, описание ситуации, чекбокс согласия на обработку ПДн (не предустановлен; без него отправка блокируется и в браузере, и на сервере).

Защита от спама: скрытое поле-ловушка, проверка «форма заполнена быстрее 3 секунд», ограничение — не более 5 заявок с одного IP за 10 минут.

Логика — `server/lead-core.mjs`, обёртки:

- `server/lead-server.mjs` — Node-сервер (локально и на VPS);
- `netlify/functions/lead.mjs` — функция для Netlify.

### Переменные окружения

См. `.env.example`. Скопируйте его в `.env` и заполните.

| Переменная | Зачем |
|---|---|
| `SITE_URL` | Адрес сайта: canonical, sitemap, Open Graph, robots.txt |
| `SITE_NOINDEX` | `1` — закрыть сайт от поисковиков, пока заполняются данные |
| `PUBLIC_YM_ID` | ID Яндекс.Метрики. Цели: `form_submit`, `messenger_click`, `phone_click` — создайте их в Метрике как «JavaScript-событие» |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Уведомления в Telegram |
| `TELEGRAM_MINIMAL` | `1` — в Telegram уходит только «Новая заявка, смотрите почту», без персональных данных |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `LEAD_EMAIL_TO`, `LEAD_EMAIL_FROM` | Заявки на e-mail |
| `LEAD_PORT`, `NODE_ENV` | Для Node-сервера |

## Персональные данные и 152-ФЗ — принятое решение

Сайт собирает ПДн граждан РФ (имя, контакт, описание ситуации), поэтому первичная запись и хранение должны быть в базах на территории РФ (ч. 5 ст. 18 152-ФЗ).

**Рекомендуемая схема:**

1. **Хранилище заявок — почтовый ящик на российском сервисе** (Яндекс 360 или Mail.ru для бизнеса) через SMTP.
2. **Telegram — только уведомление** без ПДн (`TELEGRAM_MINIMAL=1`). Серверы Telegram находятся за рубежом, отправка туда полной заявки — это трансграничная передача, о которой нужно уведомлять Роскомнадзор и которая конфликтует с требованием локализации.
3. **Хостинг функции приёма заявок — VPS в РФ** (например, Timeweb Cloud, Selectel, Yandex Cloud). Netlify/Vercel/Cloudflare работают за рубежом, и данные будут проходить через их серверы. Netlify-вариант оставлен как быстрый старт.
4. Перед запуском: подать уведомление об обработке ПДн в Роскомнадзор (если требуется для вашего статуса), проверить тексты политики и согласия.

**Решение владельцу:** `[ВЫБРАТЬ: VPS в РФ (рекомендуется) или Netlify]`.

## Деплой

### Вариант A — VPS в РФ (рекомендуется)

1. `npm ci && npm run build` — статика в `dist/`.
2. nginx отдаёт `dist/` и проксирует `/api/` на `127.0.0.1:8787`:

```nginx
server {
  server_name example.ru;
  root /var/www/site/dist;
  location / { try_files $uri $uri/ $uri/index.html =404; }
  location /_astro/ { expires 1y; add_header Cache-Control "public, immutable"; }
  location /api/ { proxy_pass http://127.0.0.1:8787; proxy_set_header X-Forwarded-For $remote_addr; }
  error_page 404 /404.html;
}
```

3. Сервер заявок под pm2 или systemd, переменные — в `.env` рядом:

```bash
NODE_ENV=production pm2 start "node --env-file=.env server/lead-server.mjs" --name lead-api
```

4. HTTPS — certbot.

### Вариант B — Netlify (сейчас сайт опубликован здесь)

- Адрес: https://lawyer-online-761.netlify.app
- Панель: https://app.netlify.com/projects/lawyer-online-761
- Переменные окружения: Project configuration → Environment variables (уже заданы `SITE_URL` и `SITE_NOINDEX=1`).
- Публикация из этой папки: `npx netlify-cli deploy --build --prod`.
- Чтобы сайт обновлялся сам после каждого push в GitHub: Project configuration → Build & deploy → Link repository → KuzovlevnWeb/Lawyer-online.

Функция заявок доступна по `/api/lead/`.

### После выбора домена

Укажите домен в переменной `SITE_URL` и пересоберите сайт. `robots.txt` и sitemap обновятся автоматически.

## Проверка перед запуском

- [ ] Все `[ЗАПОЛНИТЬ]` и `ZAPOLNIT` заменены
- [ ] Тестовая заявка доходит в почту и Telegram
- [ ] Цели Метрики срабатывают (режим отладки: `?_ym_debug=1`)
- [ ] Политика и согласие проверены юристом (то есть вами)
- [ ] Домен прописан в `SITE_URL`, переменная `SITE_NOINDEX` удалена

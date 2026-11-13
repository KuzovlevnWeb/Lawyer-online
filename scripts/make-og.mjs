// Генерирует public/og.png (1200×630) для превью в соцсетях и мессенджерах.
// Запуск: npm run og
import sharp from 'sharp';

const stripes = Array.from({ length: 12 }, (_, i) => {
  const a = [0.25, 0.55, 0.35, 0.8, 0.3, 0.6, 0.95, 0.4, 0.7, 0.3, 0.5, 0.2][i];
  const y = -200 + ((i * 97) % 260);
  return `<rect x="${i * 100}" y="${y}" width="100" height="900" fill="url(#s)" opacity="${a}"/>`;
}).join('');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1e4fe6" stop-opacity="0"/>
      <stop offset=".45" stop-color="#2f6bff"/>
      <stop offset=".55" stop-color="#8fb4ff"/>
      <stop offset=".8" stop-color="#1e4fe6" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="v" cx=".3" cy=".35" r=".9">
      <stop offset="0" stop-color="#070b16" stop-opacity=".2"/>
      <stop offset=".7" stop-color="#070b16" stop-opacity=".92"/>
    </radialGradient>
    <linearGradient id="h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5d95ff"/>
      <stop offset=".06" stop-color="#bcd3ff"/>
      <stop offset=".2" stop-color="#eef4ff"/>
    </linearGradient>
    <filter id="g"><feGaussianBlur stdDeviation="30"/></filter>
  </defs>
  <rect width="1200" height="630" fill="#070b16"/>
  <g opacity=".55">${stripes}</g>
  <rect width="1200" height="630" fill="url(#v)"/>
  <ellipse cx="600" cy="1240" rx="1300" ry="700" fill="#2f6bff" opacity=".6" filter="url(#g)"/>
  <ellipse cx="600" cy="1250" rx="1300" ry="700" fill="url(#h)"/>
  <rect x="80" y="80" width="56" height="56" rx="14" fill="#1e4fe6"/>
  <g transform="translate(87 87) scale(1.75)"><path d="M15.5 5.5c-.8-1.3-2.1-2-3.6-2-2.2 0-3.9 1.4-3.9 3.3 0 4.2 8.2 3.4 8.2 7.7 0 1.2-.7 2.2-1.9 2.8M8.5 18.5c.8 1.3 2.1 2 3.6 2 2.2 0 3.9-1.4 3.9-3.3 0-4.2-8.2-3.4-8.2-7.7 0-1.2.7-2.2 1.9-2.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>
  <text x="156" y="118" font-family="Manrope, Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#fff">Юридическая практика</text>
  <text x="80" y="260" font-family="Manrope, Inter, Arial, sans-serif" font-size="72" font-weight="600" fill="#fff" letter-spacing="-2">Иски, жалобы, ходатайства</text>
  <text x="80" y="345" font-family="Manrope, Inter, Arial, sans-serif" font-size="72" font-weight="600" fill="#fff" letter-spacing="-2">— без визита в офис</text>
  <text x="80" y="420" font-family="Inter, Arial, sans-serif" font-size="28" fill="#b9c6e6">Юристы · более 10 лет практики · онлайн · от 5 000 ₽</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('public/og.png готов');

// Картинка для соцсетей: собирается из вектора командой `npm run generate:og`
// и коммитится в public/. Причина не рендерить на лету: краулеры Telegram,
// Slack и прочих забирают og:image обычным GET по абсолютному URL — файл должен
// просто лежать статикой, без участия рантайма.
//
// Шрифт — системная Helvetica, а не IBM Plex Sans из интерфейса: Plex грузится
// с Google Fonts только в браузер, локально его нет, и sharp подставил бы
// произвольный fallback. Helvetica ближе всего к гротеску макета.

import sharp from 'sharp'

// Пропорции подобраны под референс: строки набраны крупно и стоят «вразбежку» —
// «radio» прижата влево, «rams» вправо, поэтому блок читается как единый знак,
// а не как две отдельные строки. Межстрочный интервал плотнее кегля.
const FONT_SIZE = 360
const ASCENDER = 0.718 * FONT_SIZE
const LEADING = 300
const MARGIN_Y = (630 - (ASCENDER + LEADING)) / 2

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ff611a"/>
  <g fill="#1c1c1c" font-family="Helvetica" font-weight="bold" font-size="${FONT_SIZE}">
    <text x="48" y="${MARGIN_Y + ASCENDER}">radio</text>
    <text x="1152" y="${MARGIN_Y + ASCENDER + LEADING}" text-anchor="end">rams</text>
  </g>
</svg>`

await sharp(Buffer.from(svg)).flatten({ background: '#ff611a' }).png().toFile('public/og-image.png')
const m = await sharp('public/og-image.png').metadata()
console.log(JSON.stringify({ w: m.width, h: m.height, hasAlpha: m.hasAlpha }))

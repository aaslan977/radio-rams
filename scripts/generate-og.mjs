// Картинка для соцсетей: собирается из вектора командой `npm run generate:og`
// и коммитится в public/. Причина не рендерить на лету: краулеры Telegram,
// Slack и прочих забирают og:image обычным GET по абсолютному URL — файл должен
// просто лежать статикой, без участия рантайма.
//
// Шрифт — IBM Plex Sans (тот же, что в интерфейсе), но НЕ через font-family в
// SVG: у sharp/librsvg свой, отдельный от системы fontconfig, который на
// практике не видит ни системные шрифты (даже Helvetica из /System/Library),
// ни @font-face с embedded data:URI — в обоих случаях он молча подставлял
// произвольный generic-шрифт с другими пропорциями и межбуквенным интервалом.
// satori обходит это: сама шейпит текст и кладёт в SVG готовые контуры
// глифов (<path>), поэтому результат не зависит от того, какие шрифты видит
// система на машине, где скрипт запущен.
import satori from 'satori'
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'

const fontData = await readFile(
  'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff',
)

// Пропорции подобраны под референс: строки набраны крупно и стоят «вразбежку» —
// «radio» прижата влево, «rams» вправо, поэтому блок читается как единый знак,
// а не как две отдельные строки.
const markup = {
  type: 'div',
  props: {
    style: {
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      background: '#ff611a',
      fontFamily: 'IBM Plex Sans',
      fontWeight: 700,
      fontSize: 200,
      color: '#1c1c1c',
      lineHeight: 1,
    },
    children: [
      {
        type: 'div',
        props: {
          style: { display: 'flex', width: '100%', paddingLeft: 48 },
          children: 'radio',
        },
      },
      {
        type: 'div',
        props: {
          style: { display: 'flex', width: '100%', paddingRight: 48, justifyContent: 'flex-end' },
          children: 'rams',
        },
      },
    ],
  },
}

const svg = await satori(markup, {
  width: 1200,
  height: 630,
  fonts: [{ name: 'IBM Plex Sans', data: fontData, weight: 700, style: 'normal' }],
})

await sharp(Buffer.from(svg)).flatten({ background: '#ff611a' }).png().toFile('public/og-image.png')
const m = await sharp('public/og-image.png').metadata()
console.log(JSON.stringify({ w: m.width, h: m.height, hasAlpha: m.hasAlpha }))

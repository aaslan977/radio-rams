import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Фон непрозрачных иконок — акцентный цвет, то есть поле самой иконки. Пресет
// заливает им отступы вокруг мотива, поэтому apple-touch и maskable выходят
// сплошным оранжевым квадратом с точками по центру: границы круга не видно,
// а система скругляет углы сама.
const BACKGROUND = '#ff611a'

// Отступ вокруг мотива. У maskable ровно 0.1: Android режет иконку произвольной
// маской и гарантирует только центральные 80% — при таком отступе мотив в них
// укладывается целиком. У apple меньше: там обрезаются только углы, и лишний
// отступ просто уменьшил бы точки.
const MASKABLE_PADDING = 0.1
const APPLE_PADDING = 0.05

// Растровые иконки генерируются из одного SVG командой `npm run generate:icons`
// и коммитятся в public/icons. Причина не собирать их на лету: iOS при
// «Добавить на экран» вообще не читает манифест — ему нужен
// <link rel="apple-touch-icon"> на PNG, а SVG он там не поддерживает. Без этого
// файла иконкой приложения на iPhone становится скриншот страницы.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: MASKABLE_PADDING,
      resizeOptions: { background: BACKGROUND },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: APPLE_PADDING,
      resizeOptions: { background: BACKGROUND },
    },
  },
  images: ['public/icons/icon.svg'],
})

import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Фон непрозрачных иконок — токен --color-cream. По умолчанию пресет заливает
// их чистым белым, который на фоне интерфейса читается как посторонний цвет.
const BACKGROUND = '#f7f7f7'

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
      resizeOptions: { background: BACKGROUND },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: BACKGROUND },
    },
  },
  images: ['public/icons/icon.svg'],
})

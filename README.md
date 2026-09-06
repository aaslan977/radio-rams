# Radio

Веб-радиоприёмник (PWA) в эстетике Дитера Рамса / Braun: один плоский корпус,
круглая кнопка вкл/выкл, крупная решётка динамика, диск тюнинга, реальные
интернет-радиостанции. Контекст и требования — в [brief.md](./brief.md).

## Стек

Vite + React + TypeScript, Tailwind CSS v4, Zustand, Web Audio API, Framer Motion,
@use-gesture/react, vite-plugin-pwa, Vitest.

## Команды

```bash
npm install       # установка зависимостей
npm run dev       # dev-сервер (http://localhost:5173)
npm run build     # прод-сборка + генерация PWA (manifest/service worker)
npm run preview   # локальный просмотр прод-сборки
npm run test      # тесты (Vitest)
npm run lint      # линт (oxlint)

npm run generate:icons  # перегенерировать растровые иконки PWA из public/icons/icon.svg
```

Иконки лежат в репозитории готовыми — команда нужна только после правки
исходного `icon.svg`.

## Структура

```
src/
├── components/   # DeviceShell, PlayButton, Display, SpeakerGrille,
│                 # StationTicks, JogWheel, Equalizer
├── hooks/        # useAudioPlayer (live-стрим + retry), useAudioAnalyser
├── store/        # Zustand: текущая станция, статус
├── lib/          # stations.ts — список станций
└── styles/       # Tailwind + design tokens
```

Тактильные звуки — [@rexa-developer/tiks](https://www.npmjs.com/package/@rexa-developer/tiks) (процедурная синтезация, без аудиофайлов).

## Статус

Рабочий MVP: приём реальных интернет-радиостанций, play/pause, дискретное
переключение станций диском (drag), live-эквалайзер, retry при обрыве потока,
сохранение последней станции, PWA (устанавливается, офлайн-оболочка).

Открытые вопросы закрыты — см. раздел 7 в [brief.md](./brief.md).

## Атрибуция

Композиция интерфейса взята с [drams.framer.website](https://drams.framer.website)
(компонент "Digital Rotary Radio Player") — по условиям сайта эти Framer-компоненты
свободны для личного и коммерческого использования при указании авторства.

Стиль ручки тюнинга (компонент "Dail 1") и кнопки play (компонент "Button 4")
взяты из файла Figma Community ["Components inspired by Dieter Rams' design principles"](https://www.figma.com/design/Dgye0vkg7rg231FvWD9XLm/Components-inspired-by-Dieter-Rams--design-principles--Community-) —
свободное использование.

Список радиостанций и лицензии на использование их потоков — в [brief.md](./brief.md#4-технические-ограничения).

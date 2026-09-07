import type { ReactNode } from 'react'

interface DeviceShellProps {
  children: ReactNode
}

// На мобильном устройство занимает весь экран без полей — как нативное
// приложение, а не карточка на фоне. С брейкпоинта sm возвращается плавающая
// карточка с отступами и тенью.
//
// env(safe-area-inset-*) вместе с viewport-fit=cover в index.html — иначе
// standalone PWA на iPhone сама резервирует безопасную зону под вырезом и
// home-indicator, и в неё просвечивает фон body (--color-backdrop), а не
// --color-cream этого контейнера. На десктопе env() резолвится в 0, брейкпоинт
// sm: не задевает.
export function DeviceShell({ children }: DeviceShellProps) {
  return (
    <div className="flex h-dvh items-center justify-center bg-cream pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] sm:h-auto sm:min-h-screen sm:items-start sm:bg-backdrop sm:px-14 sm:py-[40px]">
      <div
        className="flex h-full w-full flex-col overflow-hidden bg-cream sm:h-auto sm:max-w-[360px] sm:rounded-[20px]"
        style={{
          // Мягкая многослойная тень вместо жёсткой "ступеньки" — имитирует
          // реальный физический объект, лежащий на поверхности: близкий
          // контактный слой + средний + дальний рассеянный. Ослаблена после
          // осветления фона: на светлом заднике прежняя плотность читалась как
          // тяжёлый ореол, а не как касание поверхности.
          //
          // Внутренние тени идут по всему периметру, а не только сверху и
          // снизу: источник света один и сверху, поэтому по верхней кромке —
          // блик, по остальным трём — затенение, плюс общая виньетка на всю
          // площадь. Вместе это читается как поверхность, утопленная в корпус,
          // а не как плоский прямоугольник. Значения альфы намеренно в районе
          // 0.04–0.06: на нейтрально-сером любое усиление сразу выглядит
          // грязным пятном, а не объёмом.
          boxShadow: [
            'inset 0 1px 1px rgba(255,255,255,0.9)',
            'inset 0 0 0 1px rgba(0,0,0,0.04)',
            'inset 0 -2px 4px rgba(0,0,0,0.06)',
            'inset 2px 0 5px rgba(0,0,0,0.04)',
            'inset -2px 0 5px rgba(0,0,0,0.04)',
            'inset 0 0 40px rgba(0,0,0,0.05)',
            '0 1px 2px rgba(0,0,0,0.05)',
            '0 6px 12px -4px rgba(0,0,0,0.08)',
            '0 16px 32px -12px rgba(0,0,0,0.12)',
            '0 32px 56px -24px rgba(0,0,0,0.16)',
          ].join(', '),
        }}
      >
        {children}
      </div>
    </div>
  )
}

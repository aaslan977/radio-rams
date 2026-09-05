import type { ReactNode } from 'react'

interface DeviceShellProps {
  children: ReactNode
}

// На мобильном устройство занимает весь экран без полей — как нативное
// приложение, а не карточка на фоне. С брейкпоинта sm возвращается плавающая
// карточка с отступами и тенью.
export function DeviceShell({ children }: DeviceShellProps) {
  return (
    <div className="flex h-dvh items-center justify-center bg-cream sm:h-auto sm:min-h-screen sm:items-start sm:bg-cream-shadow sm:px-14 sm:py-[40px]">
      <div
        className="flex h-full w-full flex-col overflow-hidden bg-cream sm:h-auto sm:max-w-[360px] sm:rounded-[20px]"
        style={{
          // Мягкая многослойная тень вместо жёсткой "ступеньки" — имитирует
          // реальный физический объект, лежащий на поверхности: близкий
          // контактный слой + средний + дальний рассеянный. Плюс лёгкие
          // внутренние тени по краю — поверхность слегка "утоплена" внутри
          // корпуса, как на референсе, а не идеально плоская.
          boxShadow: [
            'inset 0 1px 2px rgba(255,255,255,0.8)',
            'inset 0 -1px 3px rgba(0,0,0,0.06)',
            'inset 0 0 20px rgba(0,0,0,0.04)',
            '0 1px 2px rgba(0,0,0,0.08)',
            '0 8px 16px -4px rgba(0,0,0,0.14)',
            '0 24px 48px -12px rgba(0,0,0,0.22)',
            '0 48px 80px -24px rgba(0,0,0,0.28)',
          ].join(', '),
        }}
      >
        {children}
      </div>
    </div>
  )
}

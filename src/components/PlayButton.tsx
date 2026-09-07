import { useTiks } from '@rexa-developer/tiks/react'
import { UI_SOUND } from '../lib/sound'
import { vibrate } from '../lib/haptics'

interface PlayButtonProps {
  active: boolean
  onToggle: () => void
}

export function PlayButton({ active, onToggle }: PlayButtonProps) {
  const tiks = useTiks(UI_SOUND)

  const handleClick = () => {
    // active — состояние ДО переключения: включаем — success, выключаем — error.
    if (active) tiks.error()
    else tiks.success()
    vibrate(active ? 12 : [10, 40, 10])
    onToggle()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Выключить' : 'Включить'}
      aria-pressed={active}
      className="divider-r flex w-[88px] shrink-0 items-center justify-center"
    >
      {/* Плашка 64×64 — только посадочное место для круглой кнопки, своей
          заливки у неё быть не должно. Цвет у неё был тот же, что у корпуса,
          но непрозрачный: inset-тени корпуса рисуются под содержимым, поэтому
          плашка затирала затенение угла и читалась светлым квадратом. */}
      <span className="flex items-center justify-center" style={{ width: 64, height: 64 }}>
        <span
          className="flex items-center justify-center rounded-full transition-shadow"
          style={{
            width: 40,
            height: 40,
            background: 'var(--color-cream-dark)',
            boxShadow: active
              ? 'inset 2px 2px 4px rgba(46,46,46,0.47), inset -2px -3px 3px rgba(255,255,255,0.74)'
              : '2px 2px 3px rgba(0,0,0,0.28), inset -1px -1px 2px rgba(0,0,0,0.2), inset 1px 1px 3px rgba(255,255,255,0.89)',
          }}
        >
          <span
            className="rounded-full transition-colors"
            style={{ width: 9, height: 9, background: active ? 'var(--color-accent)' : 'var(--color-ink-soft)' }}
          />
        </span>
      </span>
    </button>
  )
}

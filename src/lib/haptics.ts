// Vibration API есть только в Chromium (Android): Safari/WebKit её никогда
// не реализовывал, ни в браузере, ни в PWA с домашнего экрана. Проверка
// поддержки — тихий no-op там, где вибрации нет, а не ошибка.
const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator

export function vibrate(pattern: number | number[]): void {
  if (!supported) return
  navigator.vibrate(pattern)
}

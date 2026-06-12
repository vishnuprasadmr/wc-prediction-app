export function vibrateLockUrgent(): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  try {
    navigator.vibrate([80, 40, 80])
  } catch {
    /* unsupported */
  }
}

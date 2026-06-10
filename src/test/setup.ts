import { afterEach, vi } from 'vitest'

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

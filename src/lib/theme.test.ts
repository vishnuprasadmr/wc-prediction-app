import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  getStoredThemePreference,
  prefersSystemDark,
  resolveTheme,
} from './theme'

function mockSystemDark(isDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? isDark : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.head.innerHTML = '<meta name="theme-color" content="#f8fffc" />'
    mockSystemDark(false)
  })

  describe('getStoredThemePreference', () => {
    it('defaults to system when nothing is stored', () => {
      expect(getStoredThemePreference()).toBe('system')
    })

    it('reads stored light and dark preferences', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      expect(getStoredThemePreference()).toBe('dark')
      localStorage.setItem(THEME_STORAGE_KEY, 'light')
      expect(getStoredThemePreference()).toBe('light')
    })

    it('ignores invalid stored values', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
      expect(getStoredThemePreference()).toBe('system')
    })
  })

  describe('resolveTheme', () => {
    it('forces light and dark modes', () => {
      mockSystemDark(true)
      expect(resolveTheme('light')).toBe('light')
      expect(resolveTheme('dark')).toBe('dark')
    })

    it('follows system preference when set to system', () => {
      mockSystemDark(true)
      expect(resolveTheme('system')).toBe('dark')
      mockSystemDark(false)
      expect(resolveTheme('system')).toBe('light')
    })
  })

  describe('prefersSystemDark', () => {
    it('reads matchMedia', () => {
      mockSystemDark(true)
      expect(prefersSystemDark()).toBe(true)
      mockSystemDark(false)
      expect(prefersSystemDark()).toBe(false)
    })
  })

  describe('applyResolvedTheme', () => {
    it('applies dark class and theme color', () => {
      applyResolvedTheme('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
        THEME_COLOR_DARK,
      )
    })

    it('removes dark class for light mode', () => {
      document.documentElement.classList.add('dark')
      applyResolvedTheme('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
        THEME_COLOR_LIGHT,
      )
    })
  })
})

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyResolvedTheme,
  getStoredThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme'

interface ThemeContextValue {
  preference: ThemePreference
  theme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredThemePreference)
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(getStoredThemePreference()))

  const syncTheme = useCallback((pref: ThemePreference) => {
    const resolved = resolveTheme(pref)
    setTheme(resolved)
    applyResolvedTheme(resolved)
    return resolved
  }, [])

  const setPreference = useCallback(
    (next: ThemePreference) => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        /* private browsing */
      }
      setPreferenceState(next)
      syncTheme(next)
    },
    [syncTheme],
  )

  const toggleTheme = useCallback(() => {
    const next: ThemePreference = theme === 'dark' ? 'light' : 'dark'
    setPreference(next)
  }, [setPreference, theme])

  useEffect(() => {
    syncTheme(preference)
  }, [preference, syncTheme])

  useEffect(() => {
    if (preference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => syncTheme('system')

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference, syncTheme])

  const value = useMemo(
    () => ({ preference, theme, setPreference, toggleTheme }),
    [preference, theme, setPreference, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { appAuthRedirect, getAppOrigin } from './appOrigin'

describe('appOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the browser origin in dev mode', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_APP_URL', 'https://live.example.netlify.app')

    expect(getAppOrigin()).toBe('http://localhost:3000')
    expect(appAuthRedirect('/login')).toBe('http://localhost:3000/login')
  })

  it('uses localhost even in a production build when opened locally', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_APP_URL', 'https://live.example.netlify.app')

    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:5173' },
    })

    expect(getAppOrigin()).toBe('http://localhost:5173')
    expect(appAuthRedirect('/register')).toBe('http://localhost:5173/register')
  })

  it('uses VITE_APP_URL in production builds', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_APP_URL', 'https://live.example.netlify.app')

    vi.stubGlobal('window', {
      location: { origin: 'https://live.example.netlify.app' },
    })

    expect(getAppOrigin()).toBe('https://live.example.netlify.app')
    expect(appAuthRedirect('/register')).toBe('https://live.example.netlify.app/register')
  })
})

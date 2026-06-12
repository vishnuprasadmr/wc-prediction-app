import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearOAuthUrl,
  consumeOAuthRedirectError,
  humanizeOAuthError,
  isOAuthCallback,
} from './authOAuth'

describe('authOAuth', () => {
  const replaceState = vi.fn()

  beforeEach(() => {
    replaceState.mockReset()
    vi.stubGlobal('window', {
      location: {
        pathname: '/login',
        search: '',
        hash: '',
      },
      history: { replaceState },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('isOAuthCallback', () => {
    it('returns true for access_token in hash', () => {
      window.location.hash = '#access_token=abc&refresh_token=xyz'
      expect(isOAuthCallback()).toBe(true)
    })

    it('returns false for OAuth error in hash (cancelled sign-in)', () => {
      window.location.hash = '#error=access_denied&sb='
      expect(isOAuthCallback()).toBe(false)
    })
  })

  describe('consumeOAuthRedirectError', () => {
    it('reads access_denied from hash and clears the URL', () => {
      window.location.hash = '#error=access_denied&sb='

      const message = consumeOAuthRedirectError()

      expect(message).toBe('Sign-in was cancelled. You can try again when you’re ready.')
      expect(replaceState).toHaveBeenCalledWith({}, '', '/login')
    })

    it('returns null when there is no OAuth error', () => {
      expect(consumeOAuthRedirectError()).toBeNull()
      expect(replaceState).not.toHaveBeenCalled()
    })
  })

  describe('humanizeOAuthError', () => {
    it('maps access_denied to a friendly message', () => {
      expect(humanizeOAuthError('access_denied')).toContain('cancelled')
    })

    it('maps server_error to a friendly message', () => {
      expect(humanizeOAuthError('server_error')).toContain('Google')
    })
  })

  describe('clearOAuthUrl', () => {
    it('removes hash and query from the URL', () => {
      window.location.hash = '#access_token=abc'
      clearOAuthUrl()
      expect(replaceState).toHaveBeenCalledWith({}, '', '/login')
    })
  })
})

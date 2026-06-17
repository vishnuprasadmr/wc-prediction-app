const FIFA_FETCH_TIMEOUT_MS = 20_000
const FIFA_MAX_ATTEMPTS = 3

const inflight = new Map<string, Promise<Response>>()

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fetchWithTimeout(url: string, init: RequestInit | undefined, ms: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('FIFA request timed out')), ms)
    fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    })
      .then((res) => {
        window.clearTimeout(timer)
        resolve(res)
      })
      .catch((err) => {
        window.clearTimeout(timer)
        reject(err)
      })
  })
}

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown

  for (let attempt = 0; attempt < FIFA_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetchWithTimeout(url, init, FIFA_FETCH_TIMEOUT_MS)
      if (res.ok) return res
      if (res.status < 500) return res
      lastError = new Error(`FIFA HTTP ${res.status}`)
    } catch (err) {
      lastError = err
    }

    if (attempt < FIFA_MAX_ATTEMPTS - 1) {
      await delay(600 * (attempt + 1))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('FIFA request failed')
}

/** FIFA API fetch with timeout, retries, and in-flight dedupe (same URL = one request). */
export async function fifaFetch(url: string, init?: RequestInit): Promise<Response> {
  const existing = inflight.get(url)
  if (existing) return existing

  const promise = fetchWithRetry(url, init).finally(() => {
    inflight.delete(url)
  })
  inflight.set(url, promise)
  return promise
}

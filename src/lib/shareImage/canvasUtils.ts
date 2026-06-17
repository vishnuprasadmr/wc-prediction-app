export function roundRect(  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export interface CoverDrawRect {
  x: number
  y: number
  w: number
  h: number
}

/** object-cover positioning for canvas (FIFA player shots need top anchor to keep faces visible). */
export function computeCoverDraw(
  imgW: number,
  imgH: number,
  rect: CoverDrawRect,
  position: 'top-right' | 'top-center' | 'center' = 'top-right',
): { dx: number; dy: number; dw: number; dh: number } {
  const scale = Math.max(rect.w / imgW, rect.h / imgH)
  const dw = imgW * scale
  const dh = imgH * scale

  let dx = rect.x
  let dy = rect.y

  if (position === 'top-right') {
    dx = rect.x + rect.w - dw
  } else if (position === 'top-center' || position === 'center') {
    dx = rect.x + (rect.w - dw) / 2
  }

  if (position === 'center') {
    dy = rect.y + (rect.h - dh) / 2
  }

  return { dx, dy, dw, dh }
}

export function loadImage(src: string, avatar = false): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    if (avatar) img.referrerPolicy = 'no-referrer'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Load Google/OAuth avatars for canvas export (avoids tainted canvas). */
export async function loadAvatarImage(url: string): Promise<HTMLImageElement | null> {
  const { loadCachedAvatarImage } = await import('../avatarCache')
  return loadCachedAvatarImage(url)
}

export function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let trimmed = text
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1)
  }
  return `${trimmed}…`
}

export async function ensureShareFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  await Promise.allSettled([
    document.fonts.load('700 52px "Plus Jakarta Sans"'),
    document.fonts.load('800 88px "Plus Jakarta Sans"'),
    document.fonts.load('700 40px "Plus Jakarta Sans"'),
    document.fonts.load('600 24px Inter'),
  ])
}

/** Canvas-safe image load — fetches same-origin assets as blob to avoid tainted canvas. */
export async function loadShareImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null

  const isLocal =
    src.startsWith('/') ||
    (typeof window !== 'undefined' && src.startsWith(window.location.origin))

  if (isLocal) {
    try {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 8_000)
      const res = await fetch(src, { signal: controller.signal })
      window.clearTimeout(timer)
      if (!res.ok) return null
      const blob = await res.blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })
      return loadImage(dataUrl)
    } catch {
      return null
    }
  }

  return loadAvatarImage(src)
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to export share image'))
      }, 'image/png')
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to export share image'))
    }
  })
}

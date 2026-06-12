export function roundRect(
  ctx: CanvasRenderingContext2D,
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
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (response.ok) {
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const img = await loadImage(objectUrl)
      URL.revokeObjectURL(objectUrl)
      if (img) return img
    }
  } catch {
    /* try direct load */
  }

  return loadImage(url, true)
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

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to export share image'))
    }, 'image/png')
  })
}

import { useCallback, useEffect, useId, useRef, useState } from 'react'

interface TruncatedTextProps {
  text: string
  className?: string
  /** Shown in tooltip / aria when text is clipped */
  title?: string
}

/**
 * Truncates with ellipsis when space is tight. If clipped, exposes the full
 * string via native title, a hover/focus/touch tooltip, and aria-label.
 */
export function TruncatedText({ text, className = '', title }: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const tooltipId = useId()
  const fullText = title ?? text
  const [overflows, setOverflows] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setOverflows(el.scrollWidth > el.clientWidth + 1)
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, text])

  const showTip = overflows && tipOpen

  return (
    <span
      className="relative block min-w-0 max-w-full"
      onMouseEnter={() => overflows && setTipOpen(true)}
      onMouseLeave={() => setTipOpen(false)}
      onFocusCapture={() => overflows && setTipOpen(true)}
      onBlurCapture={() => setTipOpen(false)}
      onTouchStart={() => overflows && setTipOpen(true)}
      onTouchEnd={() => window.setTimeout(() => setTipOpen(false), 2000)}
    >
      <span
        ref={ref}
        className={`block truncate ${className}`}
        title={overflows ? fullText : undefined}
        aria-label={overflows ? fullText : undefined}
        aria-describedby={showTip ? tooltipId : undefined}
      >
        {text}
      </span>
      {showTip && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[min(18rem,85vw)] -translate-x-1/2 rounded-lg border border-default bg-elevated px-2.5 py-1.5 text-xs font-medium leading-snug text-theme shadow-lg"
        >
          {fullText}
        </span>
      )}
    </span>
  )
}

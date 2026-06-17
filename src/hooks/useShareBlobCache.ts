import { useEffect, useRef, useState } from 'react'

/** Pre-render share PNGs in the background so Share clicks stay inside the user-gesture window. */
export function useShareBlobCache(
  factory: () => Promise<Blob>,
  enabled: boolean,
  deps: React.DependencyList,
) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [generating, setGenerating] = useState(false)
  const generationRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setBlob(null)
      setGenerating(false)
      return
    }

    const generation = ++generationRef.current
    setGenerating(true)

    void factory()
      .then((next) => {
        if (generation === generationRef.current) {
          setBlob(next)
          setGenerating(false)
        }
      })
      .catch(() => {
        if (generation === generationRef.current) {
          setBlob(null)
          setGenerating(false)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- factory captures latest inputs via deps
  }, [enabled, ...deps])

  return { blob, generating }
}

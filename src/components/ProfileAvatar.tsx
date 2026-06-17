import { useState } from 'react'
import { useCachedAvatarUrl } from '../hooks/useCachedAvatarUrl'

export type ProfileAvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<ProfileAvatarSize, string> = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-2xl',
  xl: 'h-20 w-20 text-3xl',
}

interface ProfileAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: ProfileAvatarSize
  className?: string
}

export function ProfileAvatar({
  name,
  avatarUrl,
  size = 'sm',
  className = '',
}: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const cachedUrl = useCachedAvatarUrl(avatarUrl)
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const showImage = Boolean(cachedUrl) && !imageFailed

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-simelabs/30 to-simelabs-dark/30 font-bold text-theme ${sizeClasses[size]} ${className}`}
      aria-hidden={showImage}
    >
      {showImage ? (
        <img
          src={cachedUrl!}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-simelabs-foreground">
          {initial}
        </span>
      )}
    </div>
  )
}

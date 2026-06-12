import type { ProfileAvatarSize } from './ProfileAvatar'
import { ProfileAvatar } from './ProfileAvatar'
import { SupportingTeamFlag } from './SupportingTeamFlag'

interface LeaderboardAvatarProps {
  name: string
  avatarUrl?: string | null
  heartTeam?: string | null
  size?: ProfileAvatarSize
  ringClassName?: string
}

export function LeaderboardAvatar({
  name,
  avatarUrl,
  heartTeam,
  size = 'sm',
  ringClassName = '',
}: LeaderboardAvatarProps) {
  return (
    <div className={`relative shrink-0 ${ringClassName}`}>
      <ProfileAvatar name={name} avatarUrl={avatarUrl} size={size} />
      <SupportingTeamFlag team={heartTeam} variant="avatar" />
    </div>
  )
}

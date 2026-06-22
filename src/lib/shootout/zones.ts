import type { ShootoutZone } from './types'

export const ZONE_LABELS: Record<ShootoutZone, string> = {
  far_left: 'Far left',
  left: 'Left',
  center: 'Center',
  right: 'Right',
  far_right: 'Far right',
}

export const ZONE_SHORT: Record<ShootoutZone, string> = {
  far_left: 'FL',
  left: 'L',
  center: 'C',
  right: 'R',
  far_right: 'FR',
}

/** Horizontal position 0–1 for keeper animation */
export const ZONE_POSITION: Record<ShootoutZone, number> = {
  far_left: 0.1,
  left: 0.28,
  center: 0.5,
  right: 0.72,
  far_right: 0.9,
}

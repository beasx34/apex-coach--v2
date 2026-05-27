// Snapshot of the most relevant weapons. The optimal range and notes are
// stable enough across patches that the coach can reference them; balance
// numbers (DPS, RPM) are deliberately conservative and exist mostly to feed
// the prompt with context.
import type { WeaponData } from './types'

export const WEAPONS: Record<string, WeaponData> = {
  R301: {
    name: 'R-301 Carbine',
    ammo: 'light',
    optimalRangeMeters: [10, 60],
    rpm: 810,
    notes: 'Best general-purpose AR. Tap-fire past 60m, full auto inside.'
  },
  Flatline: {
    name: 'VK-47 Flatline',
    ammo: 'heavy',
    optimalRangeMeters: [5, 45],
    rpm: 600,
    notes: 'High damage, heavy recoil — burst beyond 30m, control with mouse pull-down.'
  },
  R99: {
    name: 'R-99 SMG',
    ammo: 'light',
    optimalRangeMeters: [0, 20],
    rpm: 1080,
    notes: 'Highest TTK in close range. Strafe sideways while spraying.'
  },
  Volt: {
    name: 'Volt SMG',
    ammo: 'energy',
    optimalRangeMeters: [0, 30],
    rpm: 720,
    notes: 'Forgiving recoil — good for mid-range duels and 1v1 finishes.'
  },
  Devotion: {
    name: 'Devotion LMG',
    ammo: 'energy',
    optimalRangeMeters: [5, 50],
    rpm: 900,
    notes: 'Ramp-up — start firing on an adjacent wall before peeking.'
  },
  Spitfire: {
    name: 'M600 Spitfire',
    ammo: 'light',
    optimalRangeMeters: [10, 60],
    rpm: 540,
    notes: 'Big mag, easy recoil. Hold lanes and finish downed enemies through cover.'
  },
  Wingman: {
    name: 'Wingman',
    ammo: 'sniper',
    optimalRangeMeters: [10, 80],
    rpm: 156,
    notes: 'High skill ceiling. Pair with an SMG, never with another sniper.'
  },
  PeacekeeperSP: {
    name: 'Peacekeeper',
    ammo: 'shotgun',
    optimalRangeMeters: [0, 12],
    notes: 'One-shot potential with shatter caps. Always have a follow-up weapon ready.'
  },
  Mastiff: {
    name: 'Mastiff',
    ammo: 'shotgun',
    optimalRangeMeters: [0, 10],
    notes: 'Horizontal spread — strafe to keep enemy in front of all pellets.'
  },
  EVA8: {
    name: 'EVA-8 Auto',
    ammo: 'shotgun',
    optimalRangeMeters: [0, 10],
    notes: 'High RPM. Best for revives — finishes downed and applies pressure simultaneously.'
  },
  G7: {
    name: 'G7 Scout',
    ammo: 'light',
    optimalRangeMeters: [30, 120],
    notes: 'Mid-long range pressure. Hit one shot then re-position; never sit still.'
  },
  Triple_Take: {
    name: 'Triple Take',
    ammo: 'sniper',
    optimalRangeMeters: [40, 200],
    notes: 'Choke to tight pellets, hit the head at long range.'
  },
  Sentinel: {
    name: 'Sentinel',
    ammo: 'sniper',
    optimalRangeMeters: [60, 250],
    notes: 'Charge with shield cells for armor-cracking damage.'
  },
  Charge_Rifle: {
    name: 'Charge Rifle',
    ammo: 'sniper',
    optimalRangeMeters: [80, 300],
    notes: 'Hitscan beam — pre-aim the head height and lead is unnecessary.'
  },
  Kraber: {
    name: 'Kraber .50-Cal',
    ammo: 'special',
    optimalRangeMeters: [80, 400],
    notes: 'Care-package only. One-shot to the head — never miss the first one.'
  }
}

export function weaponByName(name: string | null | undefined): WeaponData | undefined {
  if (!name) return undefined
  const key = Object.keys(WEAPONS).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? WEAPONS[key] : undefined
}

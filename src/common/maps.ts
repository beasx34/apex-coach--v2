// Map intel. Hot drops and rotation notes are updated each season — the
// coach reads from this object so the prompt is always grounded in current
// season data. Add a new map here when the rotation changes.
import type { MapData } from './types'

export const MAPS: Record<string, MapData> = {
  'Worlds Edge': {
    name: "World's Edge",
    hotDrops: ['Fragment East', 'Fragment West', 'Skyhook', 'Lava Siphon'],
    rotationNotes: [
      'Fragment is the kill leader hot drop — third-party will roll up within 90s of any fight.',
      'Lava zones tick HP — never reposition through them under fire.',
      'Trains are moving cover. Use them to break sniper lines but never stay on top in late ring.'
    ]
  },
  "Kings Canyon": {
    name: "King's Canyon",
    hotDrops: ['Skull Town', 'Cage', 'Bunker', 'Salvage'],
    rotationNotes: [
      'Caustic Treatment and Bunker are the strongest ring-2/3 holds.',
      'Watch for cave rotates — third parties love to push through them.',
      'High-ground around Containment beats low-ground every time.'
    ]
  },
  Olympus: {
    name: 'Olympus',
    hotDrops: ['Hammond Labs', 'Bonsai Plaza', 'Energy Depot'],
    rotationNotes: [
      'Phase Runners give a fast rotate but enemies hear the activation — pre-fire the exit.',
      'Open sightlines reward snipers — always carry one mid-range weapon.',
      'Trident vehicles are loud; only push with one when you have ult charge.'
    ]
  },
  'Storm Point': {
    name: 'Storm Point',
    hotDrops: ['Barometer', 'The Mill', 'Antenna'],
    rotationNotes: [
      'Map is huge — Pathfinder/Octane mobility is meta. Without one, rotate early.',
      'IMC bases are death boxes if you fight inside; loot fast and leave within 60s.',
      'Wildlife is free crafting mats and EVO — but the noise gives away your push.'
    ]
  },
  'Broken Moon': {
    name: 'Broken Moon',
    hotDrops: ['Production Yard', 'Promenade', 'Cultivation'],
    rotationNotes: [
      'Ziprails are the fastest rotate in the game — but you cannot shoot on them.',
      'Cultivation has the most loot and the most third-parties — drop only with full team.',
      'Late ring loves Bangalore/Caustic — bring at least one zone hero.'
    ]
  },
  'E-District': {
    name: 'E-District',
    hotDrops: ['Pacha', 'Marketplace', 'Cinema'],
    rotationNotes: [
      'Dense urban layout — close-range weapons (R99, Mastiff) dominate.',
      'Verticality is high; always control the rooftop angle before pushing.',
      'Recon legends can scan billboards for ring info from far away.'
    ]
  }
}

export function mapByName(name: string | null | undefined): MapData | undefined {
  if (!name) return undefined
  const target = name.toLowerCase().replace(/[^a-z]/g, '')
  const key = Object.keys(MAPS).find((k) => k.toLowerCase().replace(/[^a-z]/g, '') === target)
  return key ? MAPS[key] : undefined
}

// Curated legend data. The list focuses on tips that stay relevant across
// patches — exact cooldowns may drift, so they are stored as one source of
// truth and consumed by the coach prompt. Update by editing this file rather
// than touching code that reads from it.
import type { LegendData } from './types'

export const LEGENDS: Record<string, LegendData> = {
  Wraith: {
    name: 'Wraith',
    role: 'Skirmisher',
    passive: 'Voices from the Void — warns when targeted.',
    tactical: { name: 'Into the Void', cooldownSec: 21, description: 'Brief invulnerable repositioning.' },
    ultimate: { name: 'Dimensional Rift', cooldownSec: 210, description: 'Two-way portal for the team.' },
    tips: [
      'Listen to the passive ping — never push when it triggers without info.',
      'Use Into the Void to reposition, not to chase. Cancel pushes with it.',
      'Drop ult before engaging a fight near choke — keep one end safe.'
    ]
  },
  Bloodhound: {
    name: 'Bloodhound',
    role: 'Recon',
    passive: 'Tracker — see recent enemy actions.',
    tactical: { name: 'Eye of the Allfather', cooldownSec: 25, description: 'Reveal enemies through walls briefly.' },
    ultimate: { name: 'Beast of the Hunt', cooldownSec: 180, description: 'Speed boost + highlight enemies.' },
    tips: [
      'Scan before entering a building — never blind-push corners.',
      'Pop ult only when committing to a kill or escape, never proactively.',
      'Trackers fade fast; call rotation direction within 2 seconds of seeing them.'
    ]
  },
  Gibraltar: {
    name: 'Gibraltar',
    role: 'Support',
    passive: 'Gun Shield — extra HP when ADS.',
    tactical: { name: 'Dome of Protection', cooldownSec: 30, description: '12s dome that blocks damage in and out.' },
    ultimate: { name: 'Defensive Bombardment', cooldownSec: 270, description: 'Mortar barrage in a marked area.' },
    tips: [
      'Throw dome on a downed teammate before reviving — never after.',
      'Use ult to push, not to camp; force enemies to move into your team.',
      'Hold the line in dome 1v1 — gun shield + 75 HP shield wins most trades.'
    ]
  },
  Lifeline: {
    name: 'Lifeline',
    role: 'Support',
    passive: 'Combat Revive — D.O.C. revives hands-free.',
    tactical: { name: 'D.O.C. Heal Drone', cooldownSec: 45, description: 'Healing drone for the team.' },
    ultimate: { name: 'Care Package', cooldownSec: 240, description: 'High-tier loot drop.' },
    tips: [
      'Always cover D.O.C. revives — passive does not block bullets.',
      'Drop care package in cover, not the open. Pre-place before fighting.',
      'Use heal drone while reloading or repositioning, never standing still.'
    ]
  },
  Pathfinder: {
    name: 'Pathfinder',
    role: 'Skirmisher',
    passive: 'Insider Knowledge — scan beacon for ring info.',
    tactical: { name: 'Grappling Hook', cooldownSec: 16, description: 'Pull yourself to a point.' },
    ultimate: { name: 'Zipline Gun', cooldownSec: 90, description: 'Place a zipline.' },
    tips: [
      'Grapple at angles — sideways and downward give the biggest speed.',
      'Use ziplines to rotate teams, not to dive into a fight head-on.',
      'Scan survey beacons every ring to predict the next zone.'
    ]
  },
  Octane: {
    name: 'Octane',
    role: 'Skirmisher',
    passive: 'Swift Mend — passive HP regen.',
    tactical: { name: 'Stim', cooldownSec: 1, description: 'Trade HP for speed.' },
    ultimate: { name: 'Launch Pad', cooldownSec: 60, description: 'Bounce pad with double jump.' },
    tips: [
      'Never stim with low HP unless you can break line of sight.',
      'Pad before pushing for height advantage, not after the fight starts.',
      'Use the passive regen — heal cells/syringes only when shields broken.'
    ]
  },
  Caustic: {
    name: 'Caustic',
    role: 'Controller',
    passive: 'Nox Vision — see enemies through your own gas.',
    tactical: { name: 'Nox Gas Trap', cooldownSec: 25, description: 'Deployable gas canister.' },
    ultimate: { name: 'Nox Gas Grenade', cooldownSec: 100, description: 'Throwable gas cloud.' },
    tips: [
      'Stack traps in doorways with overlapping arcs.',
      'Throw ult to break enemy push, then re-engage from a flank.',
      'Carry extra grenades — Caustic loves frag and arc combos with his gas.'
    ]
  },
  Bangalore: {
    name: 'Bangalore',
    role: 'Assault',
    passive: 'Double Time — sprint speed under fire.',
    tactical: { name: 'Smoke Launcher', cooldownSec: 33, description: '2-shot smoke launcher.' },
    ultimate: { name: 'Rolling Thunder', cooldownSec: 270, description: 'Cluster missile barrage.' },
    tips: [
      'Smoke + digital threat optic = free kills. Without a threat, smoke is for retreat.',
      'Use passive — sprint sideways when shot at to dodge spray.',
      'Drop ult on rotation choke points to force enemies off cover.'
    ]
  }
}

export function legendByName(name: string | null | undefined): LegendData | undefined {
  if (!name) return undefined
  const key = Object.keys(LEGENDS).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? LEGENDS[key] : undefined
}

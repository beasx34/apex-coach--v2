// In-memory game state. We keep this tiny and pure — every update produces a
// brand new object so the renderer can rely on referential equality.
import type { CoachTip, GameMode, HudReadout, LegendData, MapData } from '@common/types'

export interface GameState {
  hud: HudReadout
  legend?: LegendData
  map?: MapData
  mode: GameMode
  lastTips: CoachTip[]
}

export const EMPTY_HUD: HudReadout = {
  hp: null,
  hpMax: null,
  shields: null,
  shieldsMax: null,
  ammo: null,
  legend: null,
  squadAlive: null,
  squadTotal: null,
  ringPhase: null,
  inventory: [],
  capturedAt: 0
}

export const INITIAL_STATE: GameState = {
  hud: EMPTY_HUD,
  mode: 'Unknown',
  lastTips: []
}

/**
 * Diff-based reducer. Values that the OCR could not read (`null`) are NOT
 * overwritten — we carry forward the last known good reading so a flicker on
 * one frame does not destabilise the coach prompt.
 */
export function reduceFrame(prev: GameState, frame: HudReadout): GameState {
  const carry = (a: number | null, b: number | null): number | null => (b ?? a) ?? null
  const hud: HudReadout = {
    hp: carry(prev.hud.hp, frame.hp),
    hpMax: carry(prev.hud.hpMax, frame.hpMax),
    shields: carry(prev.hud.shields, frame.shields),
    shieldsMax: carry(prev.hud.shieldsMax, frame.shieldsMax),
    ammo: frame.ammo ?? prev.hud.ammo,
    legend: frame.legend ?? prev.hud.legend,
    squadAlive: carry(prev.hud.squadAlive, frame.squadAlive),
    squadTotal: carry(prev.hud.squadTotal, frame.squadTotal),
    ringPhase: carry(prev.hud.ringPhase, frame.ringPhase),
    inventory: frame.inventory.length ? frame.inventory : prev.hud.inventory,
    capturedAt: frame.capturedAt
  }
  return { ...prev, hud }
}

export function pushTips(state: GameState, tips: CoachTip[], cap = 8): GameState {
  const next = [...state.lastTips, ...tips]
  return { ...state, lastTips: next.slice(-cap) }
}

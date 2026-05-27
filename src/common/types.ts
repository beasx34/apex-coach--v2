// Shared TypeScript types used across main, preload, and renderer processes.

export type Platform = 'PC' | 'PS4' | 'X1' | 'SWITCH'

export type GameMode = 'BR' | 'Ranked' | 'Mixtape' | 'Control' | 'Unknown'

export type AmmoType = 'light' | 'heavy' | 'energy' | 'shotgun' | 'sniper' | 'arrows' | 'special'

export interface AmmoState {
  current: number
  reserve: number
  type?: AmmoType
}

/**
 * Raw values pulled from the HUD by the OCR pipeline. Any unrecognised value
 * is `null` rather than guessed — the coach must treat nulls as unknown.
 */
export interface HudReadout {
  hp: number | null
  hpMax: number | null
  shields: number | null
  shieldsMax: number | null
  ammo: AmmoState | null
  legend: string | null
  squadAlive: number | null
  squadTotal: number | null
  ringPhase: number | null
  inventory: string[]
  capturedAt: number
}

export interface LegendData {
  name: string
  role: 'Assault' | 'Skirmisher' | 'Recon' | 'Support' | 'Controller'
  passive: string
  tactical: { name: string; cooldownSec: number; description: string }
  ultimate: { name: string; cooldownSec: number; description: string }
  /** Short, current-season tips that the coach can quote verbatim. */
  tips: string[]
}

export interface WeaponData {
  name: string
  ammo: AmmoType
  optimalRangeMeters: [number, number]
  rpm?: number
  damagePerShot?: number
  notes: string
}

export interface MapData {
  name: string
  hotDrops: string[]
  rotationNotes: string[]
}

export interface CoachTip {
  /** Stable id used to dedupe and dismiss tips in the overlay. */
  id: string
  /** 1-line actionable advice in the user's language. */
  text: string
  /** Category drives icon and colour in the overlay. */
  category: 'combat' | 'rotation' | 'ability' | 'loot' | 'team' | 'general'
  /** 1 (highest) → 5 (lowest). */
  priority: number
  /** Source for transparency. */
  source: 'rule' | 'llm-text' | 'llm-vision'
  createdAt: number
}

export type CoachProvider = 'groq' | 'gemini'

export interface CoachConfig {
  provider: CoachProvider
  apiKey: string
  textModel: string
  visionModel: string
  /** Soft cap on requests per minute to respect free-tier limits. */
  rpmLimit: number
}

export interface OcrLayout {
  /** Display resolution this layout was calibrated for. */
  width: number
  height: number
  /** Region rectangles in pixels: [x, y, w, h]. */
  hp: [number, number, number, number]
  shields: [number, number, number, number]
  ammo: [number, number, number, number]
  legendIcon: [number, number, number, number]
  squad: [number, number, number, number]
  ring: [number, number, number, number]
}

export interface AppSettings {
  coach: CoachConfig
  mozambiqueApiKey: string
  /** Hotkey accelerators (Electron format, e.g. "Alt+A"). */
  hotkeys: {
    toggleOverlay: string
    deepAnalyze: string
    panicHide: string
    openSettings: string
  }
  capture: {
    intervalMs: number
    enabled: boolean
    layoutPreset: '1080p' | '1440p' | '4k' | 'custom'
    customLayout?: OcrLayout
  }
  overlay: {
    opacity: number
    anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    clickThrough: boolean
    maxTips: number
  }
  language: 'en' | 'ru'
}

export interface PlayerProfile {
  name: string
  platform: Platform
  level: number
  rank: { name: string; score: number } | null
  legend?: { name: string; banner?: Record<string, unknown> }
  recent?: Array<{ legend: string; kills?: number; damage?: number }>
}

export interface MapRotation {
  battle_royale?: { current: { map: string; remainingTimer: string }; next: { map: string } }
  ranked?: { current: { map: string }; next: { map: string } }
  mixtape?: { current: { map: string; mode?: string }; next: { map: string; mode?: string } }
}

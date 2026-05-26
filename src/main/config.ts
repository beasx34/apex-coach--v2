// Settings persistence wrapper around electron-store. Centralised so other
// modules can subscribe to changes without touching disk directly.
import Store from 'electron-store'
import type { AppSettings, OcrLayout } from '@common/types'

export const DEFAULT_LAYOUT_1080P: OcrLayout = {
  width: 1920,
  height: 1080,
  // Pixel rectangles calibrated against the default Apex 1080p HUD. Users
  // can override per-display by entering a custom layout in settings.
  hp: [180, 980, 60, 24],
  shields: [180, 950, 60, 24],
  ammo: [1680, 990, 110, 26],
  legendIcon: [60, 950, 90, 90],
  squad: [40, 40, 110, 28],
  ring: [1700, 60, 200, 24]
}

const DEFAULT_SETTINGS: AppSettings = {
  coach: {
    provider: 'groq',
    apiKey: '',
    textModel: 'llama-3.1-8b-instant',
    visionModel: 'gemini-1.5-flash',
    rpmLimit: 25
  },
  mozambiqueApiKey: '',
  hotkeys: {
    toggleOverlay: 'Alt+A',
    deepAnalyze: 'Alt+S',
    panicHide: 'Alt+H',
    openSettings: 'Alt+,'
  },
  capture: {
    intervalMs: 2000,
    enabled: true,
    layoutPreset: '1080p',
    customLayout: undefined
  },
  overlay: {
    opacity: 0.9,
    anchor: 'top-right',
    clickThrough: true,
    maxTips: 3
  },
  language: 'en'
}

const store = new Store<{ settings: AppSettings }>({
  name: 'apex-coach-settings',
  defaults: { settings: DEFAULT_SETTINGS }
})

export function getSettings(): AppSettings {
  // Merge with defaults so adding new fields in code is non-breaking.
  const stored = store.get('settings')
  return { ...DEFAULT_SETTINGS, ...stored, coach: { ...DEFAULT_SETTINGS.coach, ...stored?.coach }, hotkeys: { ...DEFAULT_SETTINGS.hotkeys, ...stored?.hotkeys }, capture: { ...DEFAULT_SETTINGS.capture, ...stored?.capture }, overlay: { ...DEFAULT_SETTINGS.overlay, ...stored?.overlay } }
}

export function saveSettings(next: AppSettings): void {
  store.set('settings', next)
}

export function patchSettings(patch: Partial<AppSettings>): AppSettings {
  const merged = { ...getSettings(), ...patch }
  saveSettings(merged)
  return merged
}

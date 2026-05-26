// Renderer-side declaration of the preload bridge. Mirrors the surface
// exposed in src/preload/index.ts. Keep in sync when changing IPC.
import type { AppSettings, MapRotation, PlayerProfile, Platform } from '@common/types'

declare global {
  interface ApexBridge {
    getSettings(): Promise<AppSettings>
    setSettings(patch: Partial<AppSettings>): Promise<AppSettings>
    toggleOverlay(): Promise<boolean>
    triggerDeepAnalyze(): Promise<void>
    searchPlayer(platform: Platform, name: string): Promise<PlayerProfile>
    getMapRotation(): Promise<MapRotation>
    setLegend(name: string | null): Promise<void>
    setMap(name: string | null): Promise<void>
    onStateUpdate(cb: (state: unknown) => void): () => void
    onNewTips(cb: (tips: unknown) => void): () => void
    onToastError(cb: (message: string) => void): () => void
  }

  interface Window {
    apex: ApexBridge
  }
}

export {}

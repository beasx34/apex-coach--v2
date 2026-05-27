// Preload: exposes a minimal, typed surface to the renderer via contextBridge.
import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../main/ipc'
import type { AppSettings, MapRotation, PlayerProfile, Platform } from '@common/types'

export interface ApexBridge {
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

const subscribe = (channel: string, cb: (payload: unknown) => void) => {
  const handler = (_e: Electron.IpcRendererEvent, payload: unknown) => cb(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const bridge: ApexBridge = {
  getSettings: () => ipcRenderer.invoke(IPC.getSettings),
  setSettings: (patch) => ipcRenderer.invoke(IPC.setSettings, patch),
  toggleOverlay: () => ipcRenderer.invoke(IPC.toggleOverlay),
  triggerDeepAnalyze: () => ipcRenderer.invoke(IPC.triggerDeepAnalyze),
  searchPlayer: (platform, name) => ipcRenderer.invoke(IPC.searchPlayer, { platform, name }),
  getMapRotation: () => ipcRenderer.invoke(IPC.getMapRotation),
  setLegend: (name) => ipcRenderer.invoke(IPC.setLegend, name),
  setMap: (name) => ipcRenderer.invoke(IPC.setMap, name),
  onStateUpdate: (cb) => subscribe(IPC.stateUpdate, cb),
  onNewTips: (cb) => subscribe(IPC.newTips, cb),
  onToastError: (cb) => subscribe(IPC.toastError, (p) => cb(String(p)))
}

contextBridge.exposeInMainWorld('apex', bridge)

declare global {
  interface Window {
    apex: ApexBridge
  }
}

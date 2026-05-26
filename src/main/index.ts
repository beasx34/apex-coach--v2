// Main process entrypoint. Wires together: overlay window + settings window,
// global hotkeys, the capture/OCR loop, the coach, and the stats client.
import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { getSettings, patchSettings, DEFAULT_LAYOUT_1080P } from './config'
import { captureFrame, startCaptureLoop } from './capture'
import { extractHud, shutdownOcr } from './ocr'
import { ApexCoach } from './coach'
import { MozambiqueClient } from './stats'
import { INITIAL_STATE, pushTips, reduceFrame } from './state'
import { IPC } from './ipc'
import { legendByName } from '@common/legends'
import { mapByName } from '@common/maps'
import { weaponByName } from '@common/weapons'
import type { AppSettings, Platform } from '@common/types'

// Vite/Electron-Vite injects these at build time; declared for TS.
declare const __dirname: string

const __filename = fileURLToPath(import.meta.url)
const __mainDir = dirname(__filename)

let overlayWin: BrowserWindow | null = null
let settingsWin: BrowserWindow | null = null
let stopCapture: (() => void) | null = null
let state = INITIAL_STATE
let coach: ApexCoach | null = null
let stats: MozambiqueClient | null = null

function rendererBase(): string {
  return process.env.ELECTRON_RENDERER_URL ?? `file://${join(__mainDir, '../renderer')}`
}

async function createOverlayWindow(settings: AppSettings): Promise<BrowserWindow> {
  const display = screen.getPrimaryDisplay()
  const { width, height } = display.workAreaSize
  const w = 360
  const h = 320
  const anchor = settings.overlay.anchor
  const x = anchor.endsWith('right') ? width - w - 16 : 16
  const y = anchor.startsWith('bottom') ? height - h - 16 : 16

  const win = new BrowserWindow({
    width: w,
    height: h,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__mainDir, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
    }
  })

  win.setAlwaysOnTop(true, 'screen-saver')
  win.setIgnoreMouseEvents(settings.overlay.clickThrough, { forward: true })
  win.setOpacity(settings.overlay.opacity)

  const base = rendererBase()
  await win.loadURL(`${base}/overlay.html`)
  return win
}

async function createSettingsWindow(): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    width: 720,
    height: 640,
    title: 'Apex Coach Overlay — Settings',
    webPreferences: {
      preload: join(__mainDir, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
    }
  })
  const base = rendererBase()
  await win.loadURL(`${base}/settings.html`)
  return win
}

function broadcast(channel: string, payload: unknown): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload)
  }
}

function buildContext(settings: AppSettings) {
  const legend = legendByName(state.hud.legend ?? undefined)
  // Heuristic: include a couple of relevant weapons by ammo type if known.
  const weaponHints = state.hud.ammo
    ? Object.values(
        Object.fromEntries(
          Object.entries({ R301: 'light', R99: 'light', Flatline: 'heavy', Volt: 'energy' })
            .filter(([, t]) => t === state.hud.ammo?.type)
        )
      ).map((k) => weaponByName(k as string)).filter(Boolean)
    : []

  return {
    language: settings.language,
    hud: state.hud,
    legend,
    map: state.map,
    mode: state.mode,
    weapons: weaponHints as ReturnType<typeof weaponByName>[] as never,
    recentTips: state.lastTips
  }
}

async function tickCoach(settings: AppSettings): Promise<void> {
  if (!coach || !settings.coach.apiKey) return
  try {
    const tips = await coach.advise(buildContext(settings) as never)
    if (tips.length) {
      state = pushTips(state, tips)
      broadcast(IPC.newTips, tips)
      broadcast(IPC.stateUpdate, state)
    }
  } catch (err) {
    broadcast(IPC.toastError, (err as Error).message)
  }
}

function registerHotkeys(settings: AppSettings): void {
  globalShortcut.unregisterAll()
  globalShortcut.register(settings.hotkeys.toggleOverlay, () => {
    if (!overlayWin) return
    if (overlayWin.isVisible()) overlayWin.hide()
    else overlayWin.showInactive()
  })
  globalShortcut.register(settings.hotkeys.deepAnalyze, async () => {
    if (!coach) return
    try {
      const frame = await captureFrame()
      const apiKey = settings.coach.provider === 'gemini' ? settings.coach.apiKey : settings.coach.apiKey
      const tips = await coach.deepAnalyze(buildContext(settings) as never, frame.buffer, apiKey)
      if (tips.length) {
        state = pushTips(state, tips)
        broadcast(IPC.newTips, tips)
        broadcast(IPC.stateUpdate, state)
      }
    } catch (err) {
      broadcast(IPC.toastError, (err as Error).message)
    }
  })
  globalShortcut.register(settings.hotkeys.panicHide, () => {
    overlayWin?.hide()
  })
  globalShortcut.register(settings.hotkeys.openSettings, async () => {
    if (settingsWin && !settingsWin.isDestroyed()) {
      settingsWin.show()
      return
    }
    settingsWin = await createSettingsWindow()
    settingsWin.on('closed', () => { settingsWin = null })
  })
}

function applyCaptureLoop(settings: AppSettings): void {
  stopCapture?.()
  stopCapture = null
  if (!settings.capture.enabled) return
  const layout = settings.capture.customLayout ?? DEFAULT_LAYOUT_1080P
  stopCapture = startCaptureLoop(settings.capture.intervalMs, async (frame) => {
    try {
      const readout = await extractHud(frame.buffer, layout)
      state = reduceFrame(state, readout)
      broadcast(IPC.stateUpdate, state)
      await tickCoach(settings)
    } catch (err) {
      console.warn('[main] capture-cycle error', err)
    }
  })
}

function registerIpc(): void {
  ipcMain.handle(IPC.getSettings, () => getSettings())
  ipcMain.handle(IPC.setSettings, (_evt, patch: Partial<AppSettings>) => {
    const next = patchSettings(patch)
    coach?.reconfigure(next.coach)
    stats?.reconfigure(next.mozambiqueApiKey)
    registerHotkeys(next)
    applyCaptureLoop(next)
    if (overlayWin && !overlayWin.isDestroyed()) {
      overlayWin.setOpacity(next.overlay.opacity)
      overlayWin.setIgnoreMouseEvents(next.overlay.clickThrough, { forward: true })
    }
    return next
  })
  ipcMain.handle(IPC.toggleOverlay, () => {
    if (!overlayWin) return false
    if (overlayWin.isVisible()) {
      overlayWin.hide()
      return false
    }
    overlayWin.showInactive()
    return true
  })
  ipcMain.handle(IPC.searchPlayer, async (_evt, args: { platform: Platform; name: string }) => {
    if (!stats) throw new Error('Stats client not initialised')
    return stats.getProfile(args.platform, args.name)
  })
  ipcMain.handle(IPC.getMapRotation, async () => {
    if (!stats) throw new Error('Stats client not initialised')
    return stats.getMapRotation()
  })
  ipcMain.handle(IPC.setLegend, (_evt, legendName: string | null) => {
    state = { ...state, hud: { ...state.hud, legend: legendName }, legend: legendByName(legendName ?? undefined) }
    broadcast(IPC.stateUpdate, state)
  })
  ipcMain.handle(IPC.setMap, (_evt, mapName: string | null) => {
    state = { ...state, map: mapByName(mapName ?? undefined) }
    broadcast(IPC.stateUpdate, state)
  })
  ipcMain.handle(IPC.triggerDeepAnalyze, async () => {
    const settings = getSettings()
    if (!coach) return
    try {
      const frame = await captureFrame()
      const tips = await coach.deepAnalyze(buildContext(settings) as never, frame.buffer, settings.coach.apiKey)
      if (tips.length) {
        state = pushTips(state, tips)
        broadcast(IPC.newTips, tips)
        broadcast(IPC.stateUpdate, state)
      }
    } catch (err) {
      broadcast(IPC.toastError, (err as Error).message)
    }
  })
}

process.on('uncaughtException', (err) => {
  // Never let a stray exception take down the main process and pop a modal.
  console.warn('[main] uncaughtException', err)
})
process.on('unhandledRejection', (reason) => {
  console.warn('[main] unhandledRejection', reason)
})

app.whenReady().then(async () => {
  const settings = getSettings()
  coach = new ApexCoach(settings.coach)
  stats = new MozambiqueClient(settings.mozambiqueApiKey)
  registerIpc()
  overlayWin = await createOverlayWindow(settings)
  registerHotkeys(settings)
  applyCaptureLoop(settings)

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      overlayWin = await createOverlayWindow(getSettings())
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', async () => {
  globalShortcut.unregisterAll()
  stopCapture?.()
  await shutdownOcr()
})

# Apex Coach Overlay

Real-time **Apex Legends** tracker with an **AI coach** that gives in-game tips based on what's on your screen — fully external, anti-cheat safe.

- Transparent always-on-top overlay (works with Apex in **borderless windowed** mode)
- 2 Hz screen capture → Tesseract OCR of HUD (HP / shields / ammo / squad / ring)
- Free LLM coach: **Groq** (text, `llama-3.1-8b-instant`) or **Google Gemini 1.5 Flash** (text + vision)
- Free player stats via **Mozambique API** (apexlegendsapi.com)
- Hotkeys: `Alt+A` toggle, `Alt+S` deep vision-analyse, `Alt+H` panic-hide, `Alt+,` settings
- Click-through by default — keyboard + mouse pass straight to the game

## Anti-cheat statement

This app does **not** read game memory, inject into the Apex process, or modify any game files. It only:

1. Captures your own desktop via the standard Electron `desktopCapturer` API (same mechanism as OBS, Discord, NVIDIA Overlay).
2. Renders a separate, transparent, click-through window on top of your desktop.
3. Calls third-party LLM and stats APIs over HTTPS.

This is the same surface as every other community overlay (Discord, NVIDIA, OBS). Respawn officially tolerates such tools, but no third-party software is *guaranteed* to be ignored by Easy Anti-Cheat. Use at your own discretion.

## Quick start

```bash
npm install
npm run dev          # launches the overlay in dev mode
npm run build:win    # produces release/<version>/Apex Coach Overlay-<version>-win-x64.exe
```

Required keys (all free, all optional — the app degrades gracefully):

| Key | Where to get it | What it unlocks |
| --- | --- | --- |
| Groq API key | <https://console.groq.com/keys> | Text-only coaching (default, fastest) |
| Gemini API key | <https://aistudio.google.com/apikey> | Vision deep-analyse on `Alt+S` |
| Mozambique API key | <https://apexlegendsapi.com> | Player stats + live map rotation |

Open the settings window with `Alt+,` and paste them in.

## Layout & calibration

The OCR layout ships calibrated for 1080p. If you play at 1440p / 4k or have a non-default HUD scale, switch the layout preset in settings or provide a custom rectangle. (Custom-layout UI lives in `src/renderer/settings/Settings.tsx`; the JSON schema is `OcrLayout` in `src/common/types.ts`.)

## Updating for a new season

All season-sensitive data is in plain TypeScript objects so you can edit them without touching engine code:

- `src/common/legends.ts` — abilities, cooldowns, tips
- `src/common/weapons.ts` — meta weapons, optimal ranges, notes
- `src/common/maps.ts` — hot drops and rotation tips per map

## Architecture

```
main process (Electron)
├── capture.ts        desktopCapturer → PNG buffer
├── ocr.ts            tesseract.js worker on ROI crops
├── state.ts          diff-based GameState reducer
├── coach.ts          LLM client (Groq + Gemini) with rate-limit window
├── stats.ts          Mozambique API client
├── config.ts         electron-store persistence
└── index.ts          wires everything, owns hotkeys + IPC

preload/index.ts      contextBridge → window.apex API

renderer
├── overlay/          transparent click-through HUD + TipCards
└── settings/         keys, hotkeys, capture, stats lookup
```

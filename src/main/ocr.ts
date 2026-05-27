// HUD OCR pipeline. Uses tesseract.js with a single shared worker per process
// to keep startup cost low. The recognition runs on tiny ROI crops, so the
// per-frame cost is bounded (typically <150ms on a modern CPU).
import { createWorker, type Worker } from 'tesseract.js'
import { nativeImage } from 'electron'
import type { HudReadout, OcrLayout, AmmoState } from '@common/types'

let worker: Worker | null = null
let workerInit: Promise<Worker> | null = null

async function getWorker(): Promise<Worker | null> {
  if (worker) return worker
  if (!workerInit) {
    workerInit = (async () => {
      const w = await createWorker('eng')
      // HUD digits are clean — restrict character set to drastically improve
      // accuracy and speed.
      await w.setParameters({ tessedit_char_whitelist: '0123456789/' })
      worker = w
      return w
    })().catch((err) => {
      console.warn('[ocr] failed to initialise tesseract worker', err)
      workerInit = null
      // Surface as a null worker; callers fall back to empty readings.
      throw err
    })
  }
  try {
    return await workerInit
  } catch {
    return null
  }
}

export async function shutdownOcr(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}

/**
 * Crop a region out of a PNG buffer. The output is also a PNG buffer so it
 * round-trips cleanly through tesseract.js. Returns `null` if the rectangle
 * falls outside the image (e.g. capture resolution does not match the layout).
 */
function cropRegion(
  source: Buffer,
  rect: [number, number, number, number]
): Buffer | null {
  const img = nativeImage.createFromBuffer(source)
  if (img.isEmpty()) return null
  const { width, height } = img.getSize()
  const [x, y, w, h] = rect
  if (x < 0 || y < 0 || w <= 0 || h <= 0) return null
  if (x + w > width || y + h > height) return null
  const cropped = img.crop({ x, y, width: w, height: h })
  if (cropped.isEmpty()) return null
  return cropped.toPNG()
}

function parseInt0(s: string | undefined): number | null {
  if (!s) return null
  const digits = s.replace(/[^0-9]/g, '')
  if (!digits) return null
  const n = Number.parseInt(digits, 10)
  return Number.isFinite(n) ? n : null
}

function parseFraction(s: string | undefined): { num: number | null; den: number | null } {
  if (!s) return { num: null, den: null }
  const match = s.match(/(\d+)\s*\/\s*(\d+)/)
  if (!match) return { num: parseInt0(s), den: null }
  return { num: parseInt0(match[1]), den: parseInt0(match[2]) }
}

async function recognize(buffer: Buffer | null): Promise<string> {
  if (!buffer) return ''
  try {
    const w = await getWorker()
    if (!w) return ''
    const { data } = await w.recognize(buffer)
    return data.text.trim()
  } catch (err) {
    // A bad single frame must never crash the main process — return empty
    // so the reducer carries forward the last good reading.
    console.warn('[ocr] recognize error', err)
    return ''
  }
}

/**
 * Read every supported HUD region from a single frame and return a structured
 * HudReadout. The function is best-effort — missing regions become `null`.
 */
export async function extractHud(
  source: Buffer,
  layout: OcrLayout
): Promise<HudReadout> {
  const [hpText, shieldsText, ammoText, squadText, ringText] = await Promise.all([
    recognize(cropRegion(source, layout.hp)),
    recognize(cropRegion(source, layout.shields)),
    recognize(cropRegion(source, layout.ammo)),
    recognize(cropRegion(source, layout.squad)),
    recognize(cropRegion(source, layout.ring))
  ])

  const hp = parseInt0(hpText)
  const shields = parseInt0(shieldsText)
  const ammoFrac = parseFraction(ammoText)
  const squadFrac = parseFraction(squadText)
  const ammo: AmmoState | null =
    ammoFrac.num !== null
      ? { current: ammoFrac.num, reserve: ammoFrac.den ?? 0 }
      : null

  return {
    hp,
    hpMax: hp !== null && hp <= 100 ? 100 : hp,
    shields,
    shieldsMax: shields !== null && shields <= 125 ? Math.max(50, Math.ceil(shields / 25) * 25) : shields,
    ammo,
    legend: null, // legend detection requires icon classification — left to the renderer/user input for now
    squadAlive: squadFrac.num,
    squadTotal: squadFrac.den,
    ringPhase: parseInt0(ringText),
    inventory: [],
    capturedAt: Date.now()
  }
}

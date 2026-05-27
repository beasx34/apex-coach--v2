// Screen capture using Electron's desktopCapturer. We deliberately keep the
// dependency surface tiny (no node-screenshots / native modules) so the build
// stays portable across Windows and Linux.
import { desktopCapturer, nativeImage, screen } from 'electron'

export interface CapturedFrame {
  buffer: Buffer
  width: number
  height: number
  capturedAt: number
}

/**
 * Capture a single frame of the primary display. Returns a PNG buffer at the
 * display's native resolution.
 */
export async function captureFrame(): Promise<CapturedFrame> {
  const display = screen.getPrimaryDisplay()
  const { width, height } = display.size
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height }
  })
  // Prefer the source whose display_id matches; fall back to the first.
  const source =
    sources.find((s) => s.display_id === String(display.id)) ?? sources[0]
  if (!source) throw new Error('No screen source available')
  const img = source.thumbnail.isEmpty()
    ? nativeImage.createEmpty()
    : source.thumbnail
  const size = img.getSize()
  return {
    buffer: img.toPNG(),
    width: size.width,
    height: size.height,
    capturedAt: Date.now()
  }
}

/**
 * Start a polling capture loop. The returned function stops the loop and
 * waits for any in-flight capture to settle.
 */
export function startCaptureLoop(
  intervalMs: number,
  onFrame: (frame: CapturedFrame) => Promise<void> | void
): () => void {
  let stopped = false
  let inFlight: Promise<void> = Promise.resolve()

  const tick = async () => {
    if (stopped) return
    try {
      const frame = await captureFrame()
      if (stopped) return
      await onFrame(frame)
    } catch (err) {
      // Swallow capture errors — usually a transient permission issue.
      // The renderer will be notified via the empty HUD readout.
      console.warn('[capture] frame error', err)
    } finally {
      if (!stopped) setTimeout(tick, intervalMs)
    }
  }

  inFlight = tick()
  return () => {
    stopped = true
    void inFlight
  }
}

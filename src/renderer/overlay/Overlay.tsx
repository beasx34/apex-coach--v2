import { useEffect, useState } from 'react'
import { TipCard } from './TipCard'
import { HudMini } from './HudMini'
import type { CoachTip } from '@common/types'

interface OverlayState {
  tips: CoachTip[]
  hud: {
    hp: number | null
    shields: number | null
    ammo: { current: number; reserve: number } | null
    squadAlive: number | null
    squadTotal: number | null
  }
  error?: string
}

const INITIAL: OverlayState = {
  tips: [],
  hud: { hp: null, shields: null, ammo: null, squadAlive: null, squadTotal: null }
}

export function Overlay(): JSX.Element {
  const [state, setState] = useState<OverlayState>(INITIAL)

  useEffect(() => {
    const offState = window.apex.onStateUpdate((payload) => {
      const s = payload as { hud: OverlayState['hud']; lastTips: CoachTip[] }
      setState((prev) => ({ ...prev, hud: s.hud, tips: s.lastTips.slice(-3) }))
    })
    const offTips = window.apex.onNewTips((payload) => {
      const incoming = payload as CoachTip[]
      setState((prev) => {
        const merged = [...prev.tips, ...incoming]
        return { ...prev, tips: merged.slice(-3) }
      })
    })
    const offErr = window.apex.onToastError((msg) => {
      setState((prev) => ({ ...prev, error: msg }))
      window.setTimeout(() => setState((p) => ({ ...p, error: undefined })), 4000)
    })
    return () => {
      offState()
      offTips()
      offErr()
    }
  }, [])

  return (
    <div className="w-[360px] h-[320px] p-2 flex flex-col gap-2">
      <HudMini hud={state.hud} />
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        {state.tips.length === 0 ? (
          <div className="text-apex-dim text-sm px-2 italic">
            Coach is idle. Hit Alt+S for a vision tip.
          </div>
        ) : (
          state.tips.map((t) => <TipCard key={t.id} tip={t} />)
        )}
      </div>
      {state.error ? (
        <div className="text-xs text-apex-accent bg-black/60 rounded px-2 py-1 truncate">
          {state.error}
        </div>
      ) : null}
    </div>
  )
}

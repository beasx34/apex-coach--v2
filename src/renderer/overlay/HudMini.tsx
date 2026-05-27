interface HudMiniProps {
  hud: {
    hp: number | null
    shields: number | null
    ammo: { current: number; reserve: number } | null
    squadAlive: number | null
    squadTotal: number | null
  }
}

function Cell(props: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center bg-black/60 rounded px-2 py-1 min-w-[56px]">
      <span className="text-[9px] uppercase text-neutral-400 tracking-wider">{props.label}</span>
      <span className="text-sm font-mono text-white">{props.value}</span>
    </div>
  )
}

export function HudMini(props: HudMiniProps): JSX.Element {
  const { hp, shields, ammo, squadAlive, squadTotal } = props.hud
  return (
    <div className="flex gap-2 justify-end">
      <Cell label="HP" value={hp != null ? String(hp) : '—'} />
      <Cell label="Shield" value={shields != null ? String(shields) : '—'} />
      <Cell
        label="Ammo"
        value={ammo ? `${ammo.current}/${ammo.reserve}` : '—'}
      />
      <Cell
        label="Squad"
        value={squadAlive != null ? `${squadAlive}/${squadTotal ?? '?'}` : '—'}
      />
    </div>
  )
}

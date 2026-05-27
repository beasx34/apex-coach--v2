import type { CoachTip } from '@common/types'

const CATEGORY_LABEL: Record<CoachTip['category'], string> = {
  combat: 'Combat',
  rotation: 'Rotate',
  ability: 'Ability',
  loot: 'Loot',
  team: 'Team',
  general: 'Tip'
}

const CATEGORY_COLOR: Record<CoachTip['category'], string> = {
  combat: 'border-red-500/60',
  rotation: 'border-amber-400/60',
  ability: 'border-violet-400/60',
  loot: 'border-emerald-400/60',
  team: 'border-sky-400/60',
  general: 'border-neutral-400/60'
}

export function TipCard(props: { tip: CoachTip }): JSX.Element {
  const { tip } = props
  return (
    <div
      className={`tip-card bg-black/70 text-white text-sm rounded-md px-3 py-2 border-l-4 ${CATEGORY_COLOR[tip.category]}`}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-neutral-400">
        <span>{CATEGORY_LABEL[tip.category]}</span>
        <span>P{tip.priority}</span>
      </div>
      <div className="mt-1 leading-snug">{tip.text}</div>
    </div>
  )
}

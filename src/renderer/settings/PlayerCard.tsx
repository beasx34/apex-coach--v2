import type { PlayerProfile } from '@common/types'

export function PlayerCard(props: { profile: PlayerProfile }): JSX.Element {
  const { profile } = props
  return (
    <div className="bg-neutral-900 rounded p-3 space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold">{profile.name}</span>
        <span className="text-xs text-neutral-400">{profile.platform}</span>
      </div>
      <div className="text-sm text-neutral-300">Level {profile.level}</div>
      {profile.rank ? (
        <div className="text-sm">
          Rank: <span className="font-mono">{profile.rank.name}</span> (RP {profile.rank.score})
        </div>
      ) : (
        <div className="text-sm text-neutral-500">No rank data</div>
      )}
      {profile.legend ? (
        <div className="text-sm">Last legend: <span className="font-mono">{profile.legend.name}</span></div>
      ) : null}
    </div>
  )
}

// Prompt construction for the LLM coach. Kept in one place so behaviour is
// easy to audit: the renderer only ever sees the resulting tips, never the
// raw prompt.
import type { CoachTip, GameMode, HudReadout, LegendData, MapData, WeaponData } from './types'

export interface PromptContext {
  language: 'en' | 'ru'
  hud: HudReadout
  legend?: LegendData
  map?: MapData
  mode?: GameMode
  weapons?: WeaponData[]
  recentTips: CoachTip[]
}

export const SYSTEM_PROMPT_EN = `You are an expert Apex Legends coach giving live, in-game advice.
Rules:
- Respond with at most 3 actionable tips.
- Each tip is a single sentence, present tense, second-person ("you").
- Prioritise survival, then trade efficiency, then positioning.
- Never guess values the player did not report; treat null fields as unknown.
- Never repeat advice that is already in "recent tips".
- Output JSON only: {"tips":[{"text":"...","category":"combat|rotation|ability|loot|team|general","priority":1-5}]}`

export const SYSTEM_PROMPT_RU = `Ты — эксперт-коуч по Apex Legends, даёшь живые советы во время матча.
Правила:
- Максимум 3 совета.
- Каждый совет — одно предложение, настоящее время, обращение на "ты".
- Приоритеты: выживание → размен → позиция.
- Не выдумывай данные, которых нет в HUD (null = неизвестно).
- Не повторяй советы из "recent tips".
- Только JSON: {"tips":[{"text":"...","category":"combat|rotation|ability|loot|team|general","priority":1-5}]}`

export function buildUserPrompt(ctx: PromptContext): string {
  const { hud, legend, map, mode, weapons, recentTips, language } = ctx
  const label = language === 'ru'
    ? {
        state: 'СОСТОЯНИЕ',
        legend: 'ЛЕГЕНДА',
        map: 'КАРТА',
        mode: 'РЕЖИМ',
        weapons: 'ОРУЖИЕ',
        recent: 'НЕДАВНИЕ СОВЕТЫ',
        ask: 'Что мне сделать прямо сейчас?'
      }
    : {
        state: 'STATE',
        legend: 'LEGEND',
        map: 'MAP',
        mode: 'MODE',
        weapons: 'WEAPONS',
        recent: 'RECENT TIPS',
        ask: 'What should I do right now?'
      }

  const lines: string[] = []
  lines.push(`${label.state}:`)
  lines.push(`  hp=${hud.hp ?? '?'}/${hud.hpMax ?? '?'}`)
  lines.push(`  shields=${hud.shields ?? '?'}/${hud.shieldsMax ?? '?'}`)
  lines.push(`  ammo=${hud.ammo ? `${hud.ammo.current}/${hud.ammo.reserve}(${hud.ammo.type ?? '?'})` : '?'}`)
  lines.push(`  squad=${hud.squadAlive ?? '?'}/${hud.squadTotal ?? '?'}`)
  lines.push(`  ring_phase=${hud.ringPhase ?? '?'}`)
  if (legend) {
    lines.push(`${label.legend}: ${legend.name} (${legend.role})`)
    lines.push(`  tactical=${legend.tactical.name} cd=${legend.tactical.cooldownSec}s`)
    lines.push(`  ultimate=${legend.ultimate.name} cd=${legend.ultimate.cooldownSec}s`)
  }
  if (map) {
    lines.push(`${label.map}: ${map.name}`)
    lines.push(`  notes=${map.rotationNotes.slice(0, 2).join(' | ')}`)
  }
  if (mode) lines.push(`${label.mode}: ${mode}`)
  if (weapons && weapons.length) {
    lines.push(`${label.weapons}:`)
    for (const w of weapons) {
      lines.push(`  - ${w.name} ammo=${w.ammo} optimal=${w.optimalRangeMeters[0]}-${w.optimalRangeMeters[1]}m`)
    }
  }
  if (recentTips.length) {
    lines.push(`${label.recent}:`)
    for (const t of recentTips.slice(-5)) lines.push(`  - ${t.text}`)
  }
  lines.push(label.ask)
  return lines.join('\n')
}

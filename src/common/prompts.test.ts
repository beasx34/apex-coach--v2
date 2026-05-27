import { describe, expect, it } from 'vitest'
import { buildUserPrompt, SYSTEM_PROMPT_EN, SYSTEM_PROMPT_RU } from './prompts'
import type { PromptContext } from './prompts'
import { LEGENDS } from './legends'
import { MAPS } from './maps'

const baseCtx: PromptContext = {
  language: 'en',
  hud: {
    hp: 88,
    hpMax: 100,
    shields: 50,
    shieldsMax: 75,
    ammo: { current: 12, reserve: 90, type: 'light' },
    legend: 'Wraith',
    squadAlive: 2,
    squadTotal: 3,
    ringPhase: 3,
    inventory: [],
    capturedAt: 0
  },
  legend: LEGENDS.Wraith,
  map: MAPS["Worlds Edge"],
  mode: 'BR',
  weapons: [],
  recentTips: []
}

describe('buildUserPrompt', () => {
  it('includes structured HUD state in English', () => {
    const out = buildUserPrompt(baseCtx)
    expect(out).toContain('hp=88/100')
    expect(out).toContain('shields=50/75')
    expect(out).toContain('squad=2/3')
    expect(out).toContain('ring_phase=3')
    expect(out).toContain('Wraith')
  })

  it('switches to Russian labels when language is ru', () => {
    const out = buildUserPrompt({ ...baseCtx, language: 'ru' })
    expect(out).toContain('СОСТОЯНИЕ')
    expect(out).toContain('ЛЕГЕНДА')
    expect(out).toContain('Что мне сделать прямо сейчас?')
  })

  it('renders nullable HUD values as ?', () => {
    const out = buildUserPrompt({
      ...baseCtx,
      hud: { ...baseCtx.hud, hp: null, shields: null, ammo: null, ringPhase: null }
    })
    expect(out).toContain('hp=?')
    expect(out).toContain('shields=?')
    expect(out).toContain('ammo=?')
    expect(out).toContain('ring_phase=?')
  })

  it('system prompts forbid hallucinated values', () => {
    expect(SYSTEM_PROMPT_EN).toMatch(/null/i)
    expect(SYSTEM_PROMPT_RU).toMatch(/null/i)
  })
})

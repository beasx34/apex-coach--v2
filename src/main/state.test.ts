import { describe, expect, it } from 'vitest'
import { EMPTY_HUD, INITIAL_STATE, pushTips, reduceFrame } from './state'
import type { CoachTip, HudReadout } from '@common/types'

const tip = (id: string): CoachTip => ({
  id,
  text: 't',
  category: 'general',
  priority: 3,
  source: 'rule',
  createdAt: 0
})

describe('reduceFrame', () => {
  it('carries forward last known values when OCR returns null', () => {
    const prev = reduceFrame(INITIAL_STATE, { ...EMPTY_HUD, hp: 90, shields: 50, capturedAt: 1 })
    const next = reduceFrame(prev, { ...EMPTY_HUD, hp: null, shields: 25, capturedAt: 2 })
    expect(next.hud.hp).toBe(90)
    expect(next.hud.shields).toBe(25)
    expect(next.hud.capturedAt).toBe(2)
  })

  it('preserves ammo when frame has no ammo reading', () => {
    const prev = reduceFrame(INITIAL_STATE, {
      ...EMPTY_HUD,
      ammo: { current: 30, reserve: 120 },
      capturedAt: 1
    })
    const next = reduceFrame(prev, { ...EMPTY_HUD, ammo: null, capturedAt: 2 })
    expect(next.hud.ammo).toEqual({ current: 30, reserve: 120 })
  })
})

describe('pushTips', () => {
  it('caps the rolling tips buffer', () => {
    let s = INITIAL_STATE
    for (let i = 0; i < 12; i += 1) s = pushTips(s, [tip(`t${i}`)], 5)
    expect(s.lastTips).toHaveLength(5)
    expect(s.lastTips[0].id).toBe('t7')
    expect(s.lastTips[4].id).toBe('t11')
  })
})

// Type-only assertion: ensure the HudReadout shape stays compatible.
const _hud: HudReadout = EMPTY_HUD
void _hud

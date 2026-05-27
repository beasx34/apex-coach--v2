import { describe, expect, it } from 'vitest'
import { legendByName, LEGENDS } from './legends'

describe('legendByName', () => {
  it('returns undefined for unknown names', () => {
    expect(legendByName(null)).toBeUndefined()
    expect(legendByName('NotALegend')).toBeUndefined()
  })

  it('is case-insensitive', () => {
    expect(legendByName('wraith')?.name).toBe('Wraith')
    expect(legendByName('WRAITH')?.name).toBe('Wraith')
  })

  it('every legend has 3 tips and named abilities', () => {
    for (const l of Object.values(LEGENDS)) {
      expect(l.tips.length).toBeGreaterThanOrEqual(3)
      expect(l.tactical.name.length).toBeGreaterThan(0)
      expect(l.ultimate.name.length).toBeGreaterThan(0)
    }
  })
})

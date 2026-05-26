// Wrapper around the free Mozambique API (apexlegendsapi.com). All calls
// require an API key; without one, the methods throw so the renderer can
// prompt the user to add a key in settings.
import type { MapRotation, PlayerProfile, Platform } from '@common/types'

const BASE = 'https://api.mozambiquehe.re'

export class MozambiqueClient {
  constructor(private apiKey: string) {}

  reconfigure(apiKey: string): void {
    this.apiKey = apiKey
  }

  private async get<T>(path: string, params: Record<string, string>): Promise<T> {
    if (!this.apiKey) throw new Error('Mozambique API key not configured')
    const url = new URL(`${BASE}${path}`)
    url.searchParams.set('auth', this.apiKey)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Mozambique HTTP ${res.status}: ${await res.text()}`)
    return (await res.json()) as T
  }

  async getProfile(platform: Platform, name: string): Promise<PlayerProfile> {
    const data = await this.get<Record<string, unknown>>(
      '/bridge',
      { platform, player: name }
    )
    const global = (data.global ?? {}) as Record<string, unknown>
    const rankRaw = (global.rank ?? {}) as Record<string, unknown>
    const legendRaw = (data.legends as Record<string, unknown> | undefined)?.selected as Record<string, unknown> | undefined

    return {
      name: String(global.name ?? name),
      platform,
      level: Number(global.level ?? 0),
      rank: rankRaw.rankName
        ? { name: String(rankRaw.rankName), score: Number(rankRaw.rankScore ?? 0) }
        : null,
      legend: legendRaw
        ? {
            name: String(legendRaw.LegendName ?? ''),
            banner: (legendRaw.data as Record<string, unknown>) ?? undefined
          }
        : undefined
    }
  }

  async getMapRotation(): Promise<MapRotation> {
    return this.get<MapRotation>('/maprotation', { version: '2' })
  }
}

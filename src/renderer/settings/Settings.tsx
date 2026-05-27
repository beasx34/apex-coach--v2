import { useEffect, useState } from 'react'
import type { AppSettings, CoachProvider, Platform, PlayerProfile, MapRotation } from '@common/types'
import { LEGENDS } from '@common/legends'
import { MAPS } from '@common/maps'
import { PlayerCard } from './PlayerCard'

const PROVIDERS: { value: CoachProvider; label: string; help: string }[] = [
  { value: 'groq', label: 'Groq (free, fastest)', help: 'console.groq.com → API Keys. Free tier ~30 RPM on llama-3.1-8b-instant.' },
  { value: 'gemini', label: 'Google Gemini (free, vision)', help: 'aistudio.google.com/apikey. Free tier ~15 RPM on 1.5 Flash.' }
]

const PLATFORMS: Platform[] = ['PC', 'PS4', 'X1', 'SWITCH']

export function Settings(): JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [rotation, setRotation] = useState<MapRotation | null>(null)
  const [statsErr, setStatsErr] = useState<string | null>(null)
  const [search, setSearch] = useState<{ platform: Platform; name: string }>({ platform: 'PC', name: '' })

  useEffect(() => {
    void window.apex.getSettings().then(setSettings)
  }, [])

  if (!settings) return <div className="p-6 text-neutral-400">Loading…</div>

  const save = async (patch: Partial<AppSettings>) => {
    setSaving(true)
    try {
      const next = await window.apex.setSettings(patch)
      setSettings(next)
    } finally {
      setSaving(false)
    }
  }

  const searchPlayer = async () => {
    setStatsErr(null)
    setProfile(null)
    try {
      const p = await window.apex.searchPlayer(search.platform, search.name)
      setProfile(p)
    } catch (e) {
      setStatsErr((e as Error).message)
    }
  }

  const loadRotation = async () => {
    setStatsErr(null)
    try {
      setRotation(await window.apex.getMapRotation())
    } catch (e) {
      setStatsErr((e as Error).message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Apex Coach Overlay</h1>
        <p className="text-neutral-400 text-sm">
          Real-time tracker + AI coach. All processing is external — no game memory is read.
        </p>
      </header>

      <Section title="AI coach">
        <Field label="Provider">
          <select
            className="bg-neutral-900 px-2 py-1 rounded w-full"
            value={settings.coach.provider}
            onChange={(e) => save({ coach: { ...settings.coach, provider: e.target.value as CoachProvider } })}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            {PROVIDERS.find((p) => p.value === settings.coach.provider)?.help}
          </p>
        </Field>
        <Field label="API key">
          <input
            type="password"
            className="bg-neutral-900 px-2 py-1 rounded w-full font-mono"
            value={settings.coach.apiKey}
            onChange={(e) => setSettings({ ...settings, coach: { ...settings.coach, apiKey: e.target.value } })}
            onBlur={() => save({ coach: settings.coach })}
            placeholder="paste key"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Text model">
            <input
              className="bg-neutral-900 px-2 py-1 rounded w-full font-mono"
              value={settings.coach.textModel}
              onChange={(e) => setSettings({ ...settings, coach: { ...settings.coach, textModel: e.target.value } })}
              onBlur={() => save({ coach: settings.coach })}
            />
          </Field>
          <Field label="Vision model (Gemini)">
            <input
              className="bg-neutral-900 px-2 py-1 rounded w-full font-mono"
              value={settings.coach.visionModel}
              onChange={(e) => setSettings({ ...settings, coach: { ...settings.coach, visionModel: e.target.value } })}
              onBlur={() => save({ coach: settings.coach })}
            />
          </Field>
        </div>
        <Field label="Rate limit (req/min)">
          <input
            type="number"
            min={1}
            max={120}
            className="bg-neutral-900 px-2 py-1 rounded w-32 font-mono"
            value={settings.coach.rpmLimit}
            onChange={(e) => save({ coach: { ...settings.coach, rpmLimit: Number(e.target.value) } })}
          />
        </Field>
      </Section>

      <Section title="Live capture">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.capture.enabled}
            onChange={(e) => save({ capture: { ...settings.capture, enabled: e.target.checked } })}
          />
          <span>Capture screen and analyse HUD</span>
        </label>
        <Field label="Interval (ms)">
          <input
            type="number"
            min={500}
            max={10000}
            step={250}
            className="bg-neutral-900 px-2 py-1 rounded w-32 font-mono"
            value={settings.capture.intervalMs}
            onChange={(e) => save({ capture: { ...settings.capture, intervalMs: Number(e.target.value) } })}
          />
        </Field>
        <Field label="HUD layout preset">
          <select
            className="bg-neutral-900 px-2 py-1 rounded"
            value={settings.capture.layoutPreset}
            onChange={(e) => save({ capture: { ...settings.capture, layoutPreset: e.target.value as AppSettings['capture']['layoutPreset'] } })}
          >
            <option value="1080p">1920×1080</option>
            <option value="1440p">2560×1440</option>
            <option value="4k">3840×2160</option>
            <option value="custom">Custom</option>
          </select>
        </Field>
      </Section>

      <Section title="Overlay">
        <Field label={`Opacity ${(settings.overlay.opacity * 100).toFixed(0)}%`}>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={settings.overlay.opacity}
            onChange={(e) => save({ overlay: { ...settings.overlay, opacity: Number(e.target.value) } })}
          />
        </Field>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.overlay.clickThrough}
            onChange={(e) => save({ overlay: { ...settings.overlay, clickThrough: e.target.checked } })}
          />
          <span>Click-through (mouse ignored on overlay)</span>
        </label>
        <Field label="Anchor">
          <select
            className="bg-neutral-900 px-2 py-1 rounded"
            value={settings.overlay.anchor}
            onChange={(e) => save({ overlay: { ...settings.overlay, anchor: e.target.value as AppSettings['overlay']['anchor'] } })}
          >
            <option value="top-right">Top right</option>
            <option value="top-left">Top left</option>
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
          </select>
        </Field>
      </Section>

      <Section title="Hotkeys">
        {(['toggleOverlay', 'deepAnalyze', 'panicHide', 'openSettings'] as const).map((k) => (
          <Field key={k} label={k}>
            <input
              className="bg-neutral-900 px-2 py-1 rounded w-full font-mono"
              value={settings.hotkeys[k]}
              onChange={(e) => setSettings({ ...settings, hotkeys: { ...settings.hotkeys, [k]: e.target.value } })}
              onBlur={() => save({ hotkeys: settings.hotkeys })}
            />
          </Field>
        ))}
      </Section>

      <Section title="Game context">
        <Field label="Current legend">
          <select
            className="bg-neutral-900 px-2 py-1 rounded"
            defaultValue=""
            onChange={(e) => void window.apex.setLegend(e.target.value || null)}
          >
            <option value="">— auto / unknown —</option>
            {Object.keys(LEGENDS).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Current map">
          <select
            className="bg-neutral-900 px-2 py-1 rounded"
            defaultValue=""
            onChange={(e) => void window.apex.setMap(e.target.value || null)}
          >
            <option value="">— auto / unknown —</option>
            {Object.keys(MAPS).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <button
          className="bg-apex-accent text-white text-sm px-3 py-1 rounded"
          onClick={() => void loadRotation()}
        >
          Fetch live map rotation
        </button>
        {rotation ? (
          <pre className="text-xs bg-neutral-900 p-2 rounded mt-2 overflow-auto max-h-48">{JSON.stringify(rotation, null, 2)}</pre>
        ) : null}
      </Section>

      <Section title="Player lookup (Mozambique API)">
        <Field label="Mozambique API key">
          <input
            type="password"
            className="bg-neutral-900 px-2 py-1 rounded w-full font-mono"
            value={settings.mozambiqueApiKey}
            onChange={(e) => setSettings({ ...settings, mozambiqueApiKey: e.target.value })}
            onBlur={() => save({ mozambiqueApiKey: settings.mozambiqueApiKey })}
            placeholder="apexlegendsapi.com → register"
          />
        </Field>
        <div className="flex gap-2">
          <select
            className="bg-neutral-900 px-2 py-1 rounded"
            value={search.platform}
            onChange={(e) => setSearch({ ...search, platform: e.target.value as Platform })}
          >
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input
            className="bg-neutral-900 px-2 py-1 rounded flex-1 font-mono"
            value={search.name}
            placeholder="player name"
            onChange={(e) => setSearch({ ...search, name: e.target.value })}
          />
          <button
            className="bg-apex-accent text-white text-sm px-3 py-1 rounded"
            onClick={() => void searchPlayer()}
          >
            Search
          </button>
        </div>
        {statsErr ? <div className="text-red-400 text-xs">{statsErr}</div> : null}
        {profile ? <PlayerCard profile={profile} /> : null}
      </Section>

      <footer className="text-xs text-neutral-500">
        {saving ? 'Saving…' : 'Saved.'} Click-through overlay is anti-cheat safe — no game memory is read or modified.
      </footer>
    </div>
  )
}

function Section(props: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold border-b border-neutral-800 pb-1">{props.title}</h2>
      {props.children}
    </section>
  )
}

function Field(props: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="block space-y-1">
      <div className="text-xs uppercase tracking-wider text-neutral-400">{props.label}</div>
      {props.children}
    </label>
  )
}

import { useState } from 'react'
import { createRepo, loadBackendConfig, saveBackendConfig, SupabaseRepo } from '../repo'
import { huskySnapshot } from '../lib/husky'
import { sampleSnapshot } from '../lib/sample'
import { loadSettings, saveSettings } from '../lib/settings'
import { getRepo, init, replaceAll, useStore } from '../store'
import { emptySnapshot } from '../types'

export function SettingsPage() {
  const { repoName, items, locations } = useStore()
  const [cfg, setCfg] = useState(loadBackendConfig())
  const [s, setS] = useState(loadSettings())
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const repo = getRepo()
  const supa = repo instanceof SupabaseRepo ? repo : null

  const applyBackend = async () => {
    saveBackendConfig(cfg)
    await init(createRepo(cfg))
    setMsg('Backend switched.')
  }

  return (
    <div>
      <h1>Settings</h1>

      <div className="card">
        <h2>QR labels & tablet</h2>
        <div className="form-grid">
          <div className="field wide">
            <label>Base URL encoded in QR codes (the address your wall tablet / phone opens)</label>
            <input value={s.qrBaseUrl} onChange={(e) => setS({ ...s, qrBaseUrl: e.target.value })} className="mono" />
          </div>
          <div className="field">
            <label>Default label width (mm)</label>
            <input type="number" value={s.labelWidthMm} onChange={(e) => setS({ ...s, labelWidthMm: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Default label height (mm)</label>
            <input type="number" value={s.labelHeightMm} onChange={(e) => setS({ ...s, labelHeightMm: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Voice language</label>
            <input value={s.speechLang} onChange={(e) => setS({ ...s, speechLang: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <button
            className="primary"
            onClick={() => {
              saveSettings(s)
              setMsg('Settings saved.')
            }}
          >
            Save
          </button>
          <a className="btn" href="#/?kiosk=1">
            Open kiosk mode (for the wall tablet)
          </a>
        </div>
      </div>

      <div className="card">
        <h2>Storage backend</h2>
        <p className="muted">
          Currently: <b>{repoName}</b>. Leave blank to keep data in this browser only. Paste a Supabase project URL and anon key to sync across devices (run <span className="code">supabase/migrations/0001_init.sql</span> first).
        </p>
        <div className="form-grid">
          <div className="field">
            <label>Supabase URL</label>
            <input value={cfg.supabaseUrl} onChange={(e) => setCfg({ ...cfg, supabaseUrl: e.target.value })} placeholder="https://xyz.supabase.co" className="mono" />
          </div>
          <div className="field">
            <label>Supabase anon key</label>
            <input value={cfg.supabaseAnonKey} onChange={(e) => setCfg({ ...cfg, supabaseAnonKey: e.target.value })} className="mono" />
          </div>
        </div>
        <div className="row">
          <button className="primary" onClick={applyBackend}>
            Connect
          </button>
          {supa && (
            <form
              className="row"
              onSubmit={async (e) => {
                e.preventDefault()
                const { error } = await supa.client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
                setMsg(error ? error.message : 'Magic link sent. Check your email.')
              }}
            >
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: 240 }} />
              <button type="submit">Send magic link</button>
              <button type="button" onClick={() => supa.client.auth.signOut().then(() => init())}>
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Data</h2>
        <p className="muted">
          {locations.length} locations, {items.length} items.
        </p>
        <div className="row">
          <button
            className="primary"
            onClick={async () => {
              if (items.length + locations.length > 0 && !confirm('Replace your current data with the Husky chest from the photos?')) return
              await replaceAll(huskySnapshot())
              setMsg('Husky chest loaded: 17 locations, 22 items.')
            }}
          >
            Load my Husky chest (from photos)
          </button>
          <button
            onClick={async () => {
              if (items.length + locations.length > 0 && !confirm('Replace your current data with the sample garage?')) return
              await replaceAll(sampleSnapshot())
              setMsg('Sample garage loaded.')
            }}
          >
            Load sample garage
          </button>
          <button
            className="danger"
            onClick={async () => {
              if (!confirm('Delete ALL locations, items and history?')) return
              await replaceAll(emptySnapshot())
              setMsg('Cleared.')
            }}
          >
            Clear everything
          </button>
        </div>
      </div>
      {msg && <p className="muted">{msg}</p>}
    </div>
  )
}

import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { exportInventoryXlsx, exportJson, exportLabelsCsv, exportLabelsXlsx, locationLabelRows } from '../lib/export'
import { loadSettings } from '../lib/settings'
import { replaceAll, snapshot, useStore } from '../store'
import type { Snapshot } from '../types'

export function ExportPage() {
  const { locations, items } = useStore()
  const settings = loadSettings()
  const rows = locationLabelRows(locations, items, settings)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as Snapshot
      if (!Array.isArray(data.locations) || !Array.isArray(data.items)) throw new Error('Not a backup file')
      if (!confirm(`Replace everything with ${data.locations.length} locations and ${data.items.length} items from the backup?`)) return
      await replaceAll({ locations: data.locations, items: data.items, events: data.events ?? [] })
      setMsg('Backup restored.')
    } catch (e) {
      setMsg(`Import failed: ${e instanceof Error ? e.message : e}`)
    }
  }

  return (
    <div>
      <h1>Export</h1>
      <div className="card">
        <h2>Labels for the label printer</h2>
        <p className="muted">
          One row per location. Bind <b>Line1</b> / <b>Line2</b> to text objects and <b>QR</b> to a QR object in Brother P-touch Editor, DYMO Connect, the NIIMBOT or Phomemo app, or ZebraDesigner. Every cell is stored as text so codes never get reformatted. QR codes contain <span className="code">{settings.qrBaseUrl}/l/CODE</span> (change the base URL in Settings).
        </p>
        <div className="row">
          <button className="primary" onClick={() => exportLabelsXlsx(locations, items, settings)}>
            ⬇ Labels .xlsx
          </button>
          <button onClick={() => exportLabelsCsv(locations, items, settings)}>⬇ Labels .csv</button>
          <Link className="btn" to="/labels">
            🖨 Print label sheet (PDF)
          </Link>
        </div>
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Line1</th>
                <th>Line2</th>
                <th>Contents</th>
                <th>QR</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r) => (
                <tr key={r.Code}>
                  <td className="mono">{r.Code}</td>
                  <td>{r.Line1}</td>
                  <td>{r.Line2}</td>
                  <td className="muted">{r.Contents}</td>
                  <td className="mono small">{r.QR}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 50 && <p className="muted small">…and {rows.length - 50} more.</p>}
        </div>
      </div>

      <div className="card">
        <h2>Full inventory</h2>
        <p className="muted">Items, locations and a “what's where” listing, for Excel or Google Sheets.</p>
        <button className="primary" onClick={() => exportInventoryXlsx(locations, items, settings)}>
          ⬇ Inventory .xlsx
        </button>
      </div>

      <div className="card">
        <h2>Backup / restore</h2>
        <p className="muted">Everything, including history, as JSON. Use this to move from browser storage to Supabase or between devices.</p>
        <div className="row">
          <button onClick={() => exportJson(snapshot())}>⬇ Backup .json</button>
          <button onClick={() => fileRef.current?.click()}>⬆ Restore from .json</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          {msg && <span className="muted">{msg}</span>}
        </div>
      </div>
    </div>
  )
}

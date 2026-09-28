import { useState } from 'react'
import { QrImage } from '../components/QrImage'
import { locationLabelRows } from '../lib/export'
import { loadSettings } from '../lib/settings'
import { useStore } from '../store'

/**
 * Browser-printable label sheet. With the page size set to the label size in the
 * print dialog (and scale 100%), this prints one label per page straight to a
 * Brother / DYMO / Zebra / NIIMBOT driver, or "Save as PDF" for later.
 */
export function LabelsPage() {
  const { locations, items } = useStore()
  const s = loadSettings()
  const [w, setW] = useState(s.labelWidthMm)
  const [h, setH] = useState(s.labelHeightMm)
  const [showContents, setShowContents] = useState(true)
  const [filter, setFilter] = useState('')
  const rows = locationLabelRows(locations, items, s).filter((r) => !filter || r.Code.startsWith(filter.toUpperCase()))
  const qrMm = Math.min(h - 3, w * 0.45)
  const fontPx = Math.max(7, Math.min(16, h * 0.42))

  return (
    <div>
      <div className="no-print card">
        <h1>Print labels</h1>
        <p className="muted">
          Set your printer's paper size to the label size and scale to 100% in the print dialog. Each label becomes its own page.
        </p>
        <div className="form-grid">
          <div className="field">
            <label>Label width (mm)</label>
            <input type="number" value={w} onChange={(e) => setW(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Label height (mm)</label>
            <input type="number" value={h} onChange={(e) => setH(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Only codes starting with</label>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="TC1" className="mono" />
          </div>
          <div className="field">
            <label>Contents line</label>
            <select value={showContents ? '1' : '0'} onChange={(e) => setShowContents(e.target.value === '1')}>
              <option value="1">Show first items</option>
              <option value="0">Hide</option>
            </select>
          </div>
        </div>
        <button className="primary" onClick={() => window.print()}>
          🖨 Print / Save as PDF ({rows.length} labels)
        </button>
        <style>{`@page { size: ${w}mm ${h}mm; margin: 0; }`}</style>
      </div>
      <div className="labels-sheet">
        {rows.map((r) => (
          <div className="label" key={r.Code} style={{ width: `${w}mm`, height: `${h}mm`, fontSize: fontPx }}>
            <QrImage payload={r.QR} size={Math.round(qrMm * 3.78)} className="qr" />
            <div className="txt">
              <div className="l1">{r.Line1}</div>
              <div className="l2 mono">{r.Line2}</div>
              {showContents && r.Contents && <div className="l3">{r.Contents}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

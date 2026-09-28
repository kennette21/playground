import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { History } from '../components/History'
import { ItemForm } from '../components/ItemForm'
import { LocationSelect } from '../components/LocationSelect'
import { QrImage } from '../components/QrImage'
import { childrenOf, locationPath } from '../lib/codes'
import { fileToDataUrl } from '../lib/image'
import { locationUrl } from '../lib/settings'
import { addItem, checkItem, deleteLocation, updateItem, updateLocation, useStore } from '../store'
import { LOCATION_KINDS, type LocationKind } from '../types'
import { NewLocationForm } from './LocationsPage'

export function LocationPage() {
  const { code = '' } = useParams()
  const nav = useNavigate()
  const { locations, items, events } = useStore()
  const loc = locations.find((l) => l.code.toUpperCase() === decodeURIComponent(code).toUpperCase())
  const [editing, setEditing] = useState(false)
  const [addingChild, setAddingChild] = useState(false)
  const [moving, setMoving] = useState<string | null>(null)
  const [err, setErr] = useState('')

  if (!loc) {
    return (
      <div className="card">
        <h1>Unknown label</h1>
        <p>
          No location has the code <span className="code">{decodeURIComponent(code)}</span>.
        </p>
        <Link to="/locations">Go to locations</Link>
      </div>
    )
  }

  const path = locationPath(loc, locations)
  const kids = childrenOf(loc.id, locations)
  const here = items.filter((i) => i.locationId === loc.id).sort((a, b) => a.name.localeCompare(b.name))
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort()
  const hereIds = new Set(here.map((i) => i.id))
  const locEvents = events.filter((e) => hereIds.has(e.itemId) || e.fromLocationId === loc.id || e.toLocationId === loc.id)
  const url = locationUrl(loc.code)

  return (
    <div>
      <p className="muted small">
        {path.slice(0, -1).map((p) => (
          <span key={p.id}>
            <Link to={`/l/${encodeURIComponent(p.code)}`}>{p.name}</Link> ›{' '}
          </span>
        ))}
        {path.length === 1 ? 'Top level' : ''}
      </p>
      <div className="card">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1>
              {loc.name} <span className="code" style={{ fontSize: '1rem' }}>{loc.code}</span>
            </h1>
            <p className="muted">
              {LOCATION_KINDS.find((k) => k.value === loc.kind)?.label} · {here.length} items{kids.length ? ` · ${kids.length} sub-locations` : ''}
            </p>
            {loc.description && <p>{loc.description}</p>}
            <div className="row">
              <Link className="btn" to={`/map?highlight=${encodeURIComponent(loc.code)}`}>
                🗺 Show on map
              </Link>
              <button onClick={() => setEditing((v) => !v)}>{editing ? 'Close' : '✎ Edit'}</button>
              <button onClick={() => setAddingChild((v) => !v)}>{addingChild ? 'Close' : '＋ Sub-location'}</button>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <QrImage payload={url} size={140} />
            <div className="small muted mono" style={{ marginTop: 4 }}>
              {loc.code}
            </div>
          </div>
        </div>
        {loc.photoUrl && (
          <p style={{ marginTop: '1rem' }}>
            <img src={loc.photoUrl} alt={`Photo of ${loc.name}`} className="photo" style={{ maxHeight: 320 }} />
          </p>
        )}
      </div>

      {editing && (
        <div className="card">
          <h2>Edit location</h2>
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input value={loc.name} onChange={(e) => updateLocation(loc.id, { name: e.target.value })} />
            </div>
            <div className="field">
              <label>Code</label>
              <input
                className="mono"
                defaultValue={loc.code}
                onBlur={async (e) => {
                  setErr('')
                  try {
                    await updateLocation(loc.id, { code: e.target.value })
                    nav(`/l/${encodeURIComponent(e.target.value.trim().toUpperCase())}`, { replace: true })
                  } catch (ex) {
                    setErr(ex instanceof Error ? ex.message : String(ex))
                  }
                }}
              />
            </div>
            <div className="field">
              <label>Type</label>
              <select value={loc.kind} onChange={(e) => updateLocation(loc.id, { kind: e.target.value as LocationKind })}>
                {LOCATION_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Inside</label>
              <LocationSelect
                locations={locations}
                value={loc.parentId}
                excludeId={loc.id}
                noneLabel="— Top level —"
                onChange={async (id) => {
                  setErr('')
                  try {
                    await updateLocation(loc.id, { parentId: id })
                  } catch (ex) {
                    setErr(ex instanceof Error ? ex.message : String(ex))
                  }
                }}
              />
            </div>
            <div className="field">
              <label>Sort order (drawer 1 = 0 at top)</label>
              <input type="number" value={loc.sortOrder} onChange={(e) => updateLocation(loc.id, { sortOrder: Number(e.target.value) })} />
            </div>
            <div className="field wide">
              <label>Description</label>
              <textarea value={loc.description} onChange={(e) => updateLocation(loc.id, { description: e.target.value })} />
            </div>
            <div className="field wide">
              <label>Photo of this drawer / bin</label>
              <div className="row">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ width: 'auto' }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (f) await updateLocation(loc.id, { photoUrl: await fileToDataUrl(f) })
                  }}
                />
                {loc.photoUrl && (
                  <button className="ghost" onClick={() => updateLocation(loc.id, { photoUrl: null })}>
                    Remove photo
                  </button>
                )}
              </div>
            </div>
            {err && <p className="wide" style={{ color: 'var(--danger)' }}>{err}</p>}
            <div className="row wide">
              <button
                className="danger"
                onClick={async () => {
                  if (!confirm(`Delete "${loc.name}" and everything nested in it? Items will become unassigned.`)) return
                  const parent = path.length > 1 ? path[path.length - 2] : null
                  await deleteLocation(loc.id)
                  nav(parent ? `/l/${encodeURIComponent(parent.code)}` : '/locations')
                }}
              >
                Delete location
              </button>
            </div>
          </div>
        </div>
      )}

      {addingChild && (
        <div className="card">
          <h2>New sub-location inside {loc.name}</h2>
          <NewLocationForm parent={loc} onDone={() => setAddingChild(false)} />
        </div>
      )}

      {kids.length > 0 && (
        <div className="card">
          <h2>Inside</h2>
          <ul className="list">
            {kids.map((k) => (
              <li key={k.id}>
                <Link to={`/l/${encodeURIComponent(k.code)}`} className="grow">
                  {k.name}
                </Link>
                <span className="code small">{k.code}</span>
                <span className="muted small">{items.filter((i) => i.locationId === k.id).length} items</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>Items here ({here.length})</h2>
        {here.length === 0 && <p className="muted">Empty. Add the first item below.</p>}
        <ul className="list">
          {here.map((i) => (
            <li key={i.id}>
              <div className="grow">
                <Link to={`/i/${i.id}`}>{i.name}</Link>
                {i.quantity !== 1 && (
                  <span className="muted">
                    {' '}
                    × {i.quantity} {i.unit}
                  </span>
                )}
                {i.category && <span className="chip" style={{ marginLeft: 6 }}>{i.category}</span>}
                {moving === i.id && (
                  <div className="row" style={{ marginTop: 6 }}>
                    <LocationSelect
                      locations={locations}
                      value={i.locationId}
                      onChange={async (id) => {
                        await updateItem(i.id, { locationId: id })
                        setMoving(null)
                      }}
                    />
                    <button className="ghost" onClick={() => setMoving(null)}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <button className="ghost" title="Confirm it is still here" onClick={() => checkItem(i.id)}>
                ✓
              </button>
              <button className="ghost" onClick={() => setMoving(moving === i.id ? null : i.id)}>
                Move
              </button>
            </li>
          ))}
        </ul>
        <h3 style={{ marginTop: '1rem' }}>Quick add</h3>
        <ItemForm compact locations={locations} categories={categories} initial={{ locationId: loc.id }} submitLabel="Add item" onSubmit={(d) => addItem(d).then(() => undefined)} />
      </div>

      <div className="card">
        <h2>History</h2>
        <History events={locEvents} locations={locations} showItem={(id) => items.find((i) => i.id === id)?.name ?? 'Deleted item'} />
      </div>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LocationSelect } from '../components/LocationSelect'
import { childrenOf, suggestCode } from '../lib/codes'
import { addLocation, useStore } from '../store'
import { LOCATION_KINDS, type Location, type LocationKind } from '../types'

export function NewLocationForm({ parent, onDone }: { parent: Location | null; onDone?: (loc: Location) => void }) {
  const { locations } = useStore()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<LocationKind>(parent ? (parent.kind === 'container' ? 'drawer' : 'bin') : 'container')
  const [parentId, setParentId] = useState<string | null>(parent?.id ?? null)
  const [code, setCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [err, setErr] = useState('')
  const parentLoc = locations.find((l) => l.id === parentId) ?? null
  const suggested = suggestCode(name || 'New', kind, parentLoc, locations)
  const effectiveCode = codeTouched && code ? code : suggested

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    try {
      const loc = await addLocation({ name: name.trim(), kind, parentId, code: effectiveCode })
      setName('')
      setCode('')
      setCodeTouched(false)
      onDone?.(loc)
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex))
    }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Drawer 3 / Fasteners bin / Pegboard" required autoFocus />
      </div>
      <div className="field">
        <label>Type</label>
        <select value={kind} onChange={(e) => setKind(e.target.value as LocationKind)}>
          {LOCATION_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Inside</label>
        <LocationSelect locations={locations} value={parentId} onChange={setParentId} noneLabel="— Top level (a room area or standalone chest) —" />
      </div>
      <div className="field">
        <label>Label code (printed on the QR label)</label>
        <input
          value={effectiveCode}
          onChange={(e) => {
            setCode(e.target.value)
            setCodeTouched(true)
          }}
          className="mono"
        />
      </div>
      {err && <p className="wide" style={{ color: 'var(--danger)' }}>{err}</p>}
      <div className="row wide">
        <button className="primary" type="submit" disabled={!name.trim()}>
          Add location
        </button>
      </div>
    </form>
  )
}

function Node({ loc }: { loc: Location }) {
  const { locations, items } = useStore()
  const kids = childrenOf(loc.id, locations)
  const count = items.filter((i) => i.locationId === loc.id).length
  return (
    <li>
      <div className="node">
        <Link to={`/l/${encodeURIComponent(loc.code)}`}>{loc.name}</Link>
        <span className="code small">{loc.code}</span>
        <span className="kind">{loc.kind}</span>
        {count > 0 && <span className="muted small">{count} items</span>}
      </div>
      {kids.length > 0 && (
        <ul>
          {kids.map((k) => (
            <Node key={k.id} loc={k} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function LocationsPage() {
  const { locations, items } = useStore()
  const roots = childrenOf(null, locations)
  const unassigned = items.filter((i) => !i.locationId)
  return (
    <div>
      <h1>Locations</h1>
      <p className="muted">Areas hold containers, containers hold drawers and bins. Every location gets a code and a QR label.</p>
      <div className="card">
        <h2>Add a location</h2>
        <NewLocationForm parent={null} />
      </div>
      <div className="card tree">
        {roots.length === 0 ? (
          <p className="muted">No locations yet.</p>
        ) : (
          <ul style={{ paddingLeft: 0 }}>
            {roots.map((r) => (
              <Node key={r.id} loc={r} />
            ))}
          </ul>
        )}
      </div>
      {unassigned.length > 0 && (
        <div className="card">
          <h2>Unassigned items ({unassigned.length})</h2>
          <ul className="list">
            {unassigned.map((i) => (
              <li key={i.id}>
                <Link to={`/i/${i.id}`} className="grow">
                  {i.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

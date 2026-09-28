import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { History } from '../components/History'
import { ItemForm } from '../components/ItemForm'
import { QrImage } from '../components/QrImage'
import { locationPath } from '../lib/codes'
import { itemUrl } from '../lib/settings'
import { checkItem, deleteItem, updateItem, useStore } from '../store'

export function ItemPage() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const { items, locations, events } = useStore()
  const item = items.find((i) => i.id === id)
  const [editing, setEditing] = useState(false)
  if (!item) {
    return (
      <div className="card">
        <h1>Item not found</h1>
        <Link to="/">Back to search</Link>
      </div>
    )
  }
  const loc = locations.find((l) => l.id === item.locationId)
  const path = locationPath(loc, locations)
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort()

  return (
    <div>
      <div className="card">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1>{item.name}</h1>
            <p>
              <b>Quantity:</b> {item.quantity} {item.unit}
              {item.category && (
                <>
                  {' '}
                  · <b>Category:</b> {item.category}
                </>
              )}
            </p>
            <p>
              <b>Location:</b>{' '}
              {path.length ? (
                path.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && ' › '}
                    <Link to={`/l/${encodeURIComponent(p.code)}`}>{p.name}</Link>
                  </span>
                ))
              ) : (
                <span className="muted">Unassigned</span>
              )}
              {loc && (
                <>
                  {' '}
                  <span className="code">{loc.code}</span>
                </>
              )}
            </p>
            {item.tags.length > 0 && (
              <p>
                {item.tags.map((t) => (
                  <span className="chip" key={t}>
                    {t}
                  </span>
                ))}
              </p>
            )}
            {item.notes && <p style={{ whiteSpace: 'pre-wrap' }}>{item.notes}</p>}
            <div className="row">
              {loc && (
                <Link className="btn primary" to={`/map?highlight=${encodeURIComponent(loc.code)}`}>
                  🗺 Show me
                </Link>
              )}
              <button onClick={() => checkItem(item.id)}>✓ Still here</button>
              <button onClick={() => setEditing((v) => !v)}>{editing ? 'Close' : '✎ Edit / move'}</button>
              <button
                className="danger ghost"
                onClick={async () => {
                  if (!confirm(`Delete "${item.name}"?`)) return
                  await deleteItem(item.id)
                  nav(loc ? `/l/${encodeURIComponent(loc.code)}` : '/')
                }}
              >
                Delete
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            {item.photoUrl ? <img src={item.photoUrl} alt="" className="photo" style={{ maxHeight: 160 }} /> : <QrImage payload={itemUrl(item.id)} size={120} />}
          </div>
        </div>
      </div>
      {editing && (
        <div className="card">
          <h2>Edit item</h2>
          <ItemForm
            locations={locations}
            categories={categories}
            initial={item}
            onCancel={() => setEditing(false)}
            onSubmit={async (d) => {
              await updateItem(item.id, d)
              setEditing(false)
            }}
          />
        </div>
      )}
      <div className="card">
        <h2>History</h2>
        <History events={events.filter((e) => e.itemId === item.id)} locations={locations} />
      </div>
    </div>
  )
}

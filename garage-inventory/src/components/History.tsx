import { Link } from 'react-router-dom'
import type { ItemEvent, Location } from '../types'

const VERB: Record<ItemEvent['type'], string> = {
  created: 'Added',
  moved: 'Moved',
  updated: 'Edited',
  quantity: 'Quantity changed',
  removed: 'Removed',
  checked: 'Seen',
}

export function History({ events, locations, showItem }: { events: ItemEvent[]; locations: Location[]; showItem?: (id: string) => string }) {
  if (events.length === 0) return <p className="muted">No history yet.</p>
  const name = (id: string | null) => {
    if (!id) return 'Unassigned'
    const l = locations.find((x) => x.id === id)
    return l ? <Link to={`/l/${encodeURIComponent(l.code)}`}>{l.name}</Link> : 'Deleted location'
  }
  const sorted = [...events].sort((a, b) => b.at.localeCompare(a.at))
  return (
    <ul className="timeline">
      {sorted.map((e) => (
        <li key={e.id}>
          <span className="muted">{new Date(e.at).toLocaleString()}</span>
          <span>
            {showItem && <b>{showItem(e.itemId)} · </b>}
            {VERB[e.type]}
            {e.type === 'moved' && (
              <>
                {' '}
                {name(e.fromLocationId)} → {name(e.toLocationId)}
              </>
            )}
            {e.type === 'created' && e.toLocationId && <> to {name(e.toLocationId)}</>}
            {e.note && <span className="muted"> — {e.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

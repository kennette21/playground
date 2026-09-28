import { useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { childrenOf, locationPath } from '../lib/codes'
import { useStore } from '../store'
import type { Location } from '../types'

/**
 * A schematic of the garage: each top-level location is a panel; containers show
 * their drawers as a stack, areas show bins/shelves as tiles. ?highlight=CODE lights
 * up a slot and scrolls to it, which is what "Show me" from search does.
 */
export function MapPage() {
  const { locations, items } = useStore()
  const [params] = useSearchParams()
  const highlight = (params.get('highlight') ?? '').toUpperCase()
  const target = locations.find((l) => l.code.toUpperCase() === highlight)
  const litIds = useMemo(() => new Set(locationPath(target, locations).map((l) => l.id)), [target, locations])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current?.querySelector('[data-target="1"]')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlight, locations.length])

  const count = (l: Location) => items.filter((i) => i.locationId === l.id).length

  const Slot = ({ loc, nested = false }: { loc: Location; nested?: boolean }) => {
    const kids = childrenOf(loc.id, locations)
    const lit = litIds.has(loc.id)
    return (
      <>
        <Link
          to={`/l/${encodeURIComponent(loc.code)}`}
          className={`slot ${loc.kind} ${nested ? 'nested' : ''} ${lit ? 'highlight' : ''}`}
          data-target={loc.id === target?.id ? '1' : undefined}
        >
          <span className="code">{loc.code}</span>
          <span>{loc.name}</span>
          <span className="count">{count(loc)} items</span>
        </Link>
        {kids.map((k) => (
          <Slot key={k.id} loc={k} nested />
        ))}
      </>
    )
  }

  const roots = childrenOf(null, locations)
  const targetItems = target ? items.filter((i) => i.locationId === target.id) : []

  return (
    <div ref={ref}>
      <div className="row between">
        <h1>Garage map</h1>
        {target && (
          <div className="banner" style={{ margin: 0 }}>
            <span>
              📍 <b>{target.name}</b> · {locationPath(target, locations).map((l) => l.name).join(' › ')}
              {targetItems.length > 0 && <span className="muted"> · {targetItems.map((i) => i.name).slice(0, 5).join(', ')}{targetItems.length > 5 ? '…' : ''}</span>}
            </span>
            <Link to={`/l/${encodeURIComponent(target.code)}`}>Open</Link>
          </div>
        )}
      </div>
      {roots.length === 0 && (
        <p className="muted">
          No locations yet. <Link to="/locations">Add your first tool chest</Link>.
        </p>
      )}
      <div className="map">
        {roots.map((root) => (
          <div key={root.id} className={`area ${litIds.has(root.id) ? 'highlight' : ''}`} data-target={root.id === target?.id ? '1' : undefined}>
            <h3>
              <Link to={`/l/${encodeURIComponent(root.code)}`}>{root.name}</Link>
              <span className="code small">{root.code}</span>
            </h3>
            {root.photoUrl && <img src={root.photoUrl} alt="" className="photo" style={{ marginBottom: 8, maxHeight: 140, width: '100%', objectFit: 'cover' }} />}
            <div className="slots">
              {childrenOf(root.id, locations).map((c) => (
                <Slot key={c.id} loc={c} />
              ))}
              {childrenOf(root.id, locations).length === 0 && <span className="muted small">{count(root)} items directly here</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

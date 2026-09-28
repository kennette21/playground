import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { pathLabel } from '../lib/codes'
import { buildIndex, cleanVoiceQuery, type SearchDoc } from '../lib/search'
import { loadSettings } from '../lib/settings'
import { listen, speak, speechSupported, type Listener } from '../lib/speech'
import { useStore } from '../store'

export function SearchPage() {
  const { items, locations } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState('')
  const listener = useRef<Listener | null>(null)
  const index = useMemo(() => buildIndex(items, locations), [items, locations])
  const kiosk = params.get('kiosk') === '1'

  const results: SearchDoc[] = useMemo(() => {
    const query = q.trim()
    if (!query) return []
    return index.search(query, { limit: 30 }).map((r) => r.item)
  }, [q, index])

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params)
      if (q) next.set('q', q)
      else next.delete('q')
      setParams(next, { replace: true })
    }, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const startVoice = () => {
    if (listening) {
      listener.current?.stop()
      return
    }
    setHeard('')
    const l = listen(
      loadSettings().speechLang,
      (t) => setHeard(t),
      (t) => {
        setListening(false)
        if (!t) return
        const cleaned = cleanVoiceQuery(t)
        setQ(cleaned)
        const hits = index.search(cleaned, { limit: 1 })
        if (hits.length && kiosk) {
          const d = hits[0].item
          speak(d.kind === 'item' ? `${d.title} is in ${d.subtitle.replace(/›/g, ',')}` : `${d.title} is ${d.subtitle}`)
        } else if (kiosk) speak(`Nothing found for ${cleaned}`)
      },
      (err) => {
        setListening(false)
        setHeard(`Voice error: ${err}`)
      },
    )
    if (l) {
      listener.current = l
      setListening(true)
    } else setHeard('Voice search is not supported in this browser (try Chrome or Safari).')
  }

  const empty = items.length === 0 && locations.length === 0

  return (
    <div>
      <div className="searchbox">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Where is… hammer, M6 bolts, tape measure"
          autoFocus
          inputMode="search"
          aria-label="Search inventory"
        />
        {q && (
          <button onClick={() => setQ('')} aria-label="Clear">
            ✕
          </button>
        )}
        {speechSupported() && (
          <button className={`mic ${listening ? 'listening' : ''}`} onClick={startVoice} aria-label="Voice search" title="Voice search">
            🎤
          </button>
        )}
      </div>
      {(listening || heard) && (
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          {listening ? '🎙 Listening… ' : ''}
          {heard}
        </p>
      )}

      {empty && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>Welcome to your garage inventory</h2>
          <p>Nothing here yet. Start by adding your tool chests and drawers under <Link to="/locations">Locations</Link>, or load a demo garage to see how it works.</p>
          <p>
            <Link to="/settings" className="btn primary">
              Load sample garage
            </Link>
          </p>
        </div>
      )}

      {!empty && !q && (
        <div style={{ marginTop: '1rem' }}>
          <p className="muted">
            {items.length} items in {locations.length} locations. Type or tap the mic and say “where are my pliers”.
          </p>
          <div className="row">
            <Link to="/scan" className="btn">📷 Scan a label</Link>
            <Link to="/map" className="btn">🗺 Map</Link>
            <Link to="/locations" className="btn">＋ Add items</Link>
          </div>
        </div>
      )}

      {q && results.length === 0 && <p className="muted" style={{ marginTop: '1rem' }}>No matches for “{q}”.</p>}

      <div style={{ marginTop: '1rem' }}>
        {results.map((r) =>
          r.kind === 'item' ? (
            <div className="result" key={r.id}>
              <div>
                <div className="title">
                  {r.title}
                  {r.item!.quantity !== 1 && (
                    <span className="muted small">
                      {' '}
                      × {r.item!.quantity} {r.item!.unit}
                    </span>
                  )}
                </div>
                <div className="where">{r.subtitle}</div>
                <div className="small muted">
                  {r.item!.category && <span className="chip">{r.item!.category}</span>}
                  {r.item!.tags.map((t) => (
                    <span className="chip" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="row">
                {r.item!.locationId && (
                  <Link className="btn primary" to={`/map?highlight=${encodeURIComponent(locations.find((l) => l.id === r.item!.locationId)?.code ?? '')}`}>
                    Show me
                  </Link>
                )}
                <Link className="btn" to={`/i/${r.id}`}>
                  Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="result location" key={r.id}>
              <div>
                <div className="title">{r.title}</div>
                <div className="where">
                  <span className="code">{r.location!.code}</span> {pathLabel(r.location, locations)}
                </div>
              </div>
              <div className="row">
                <Link className="btn primary" to={`/map?highlight=${encodeURIComponent(r.location!.code)}`}>
                  Show me
                </Link>
                <Link className="btn" to={`/l/${encodeURIComponent(r.location!.code)}`}>
                  Open
                </Link>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

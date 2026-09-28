import { childrenOf } from '../lib/codes'
import type { Location } from '../types'

interface Props {
  locations: Location[]
  value: string | null
  onChange: (id: string | null) => void
  /** Hide this id and its descendants (so a location can't be moved into itself). */
  excludeId?: string
  allowNone?: boolean
  noneLabel?: string
}

/** Indented tree as a <select>, which works fine on tablets. */
export function LocationSelect({ locations, value, onChange, excludeId, allowNone = true, noneLabel = '— Unassigned —' }: Props) {
  const options: { id: string; label: string }[] = []
  const walk = (parentId: string | null, depth: number) => {
    for (const l of childrenOf(parentId, locations)) {
      if (l.id === excludeId) continue
      options.push({ id: l.id, label: `${'   '.repeat(depth)}${l.name} (${l.code})` })
      walk(l.id, depth + 1)
    }
  }
  walk(null, 0)
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      {allowNone && <option value="">{noneLabel}</option>}
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

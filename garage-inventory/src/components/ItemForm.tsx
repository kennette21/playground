import { useState, type FormEvent } from 'react'
import { fileToDataUrl } from '../lib/image'
import type { Item, Location } from '../types'
import { LocationSelect } from './LocationSelect'

export type ItemDraft = Pick<Item, 'name' | 'category' | 'quantity' | 'unit' | 'tags' | 'notes' | 'locationId' | 'photoUrl'>

interface Props {
  locations: Location[]
  initial?: Partial<ItemDraft>
  categories: string[]
  submitLabel?: string
  onSubmit: (draft: ItemDraft) => Promise<void> | void
  onCancel?: () => void
  compact?: boolean
}

export function ItemForm({ locations, initial = {}, categories, submitLabel = 'Save', onSubmit, onCancel, compact }: Props) {
  const [name, setName] = useState(initial.name ?? '')
  const [category, setCategory] = useState(initial.category ?? '')
  const [quantity, setQuantity] = useState(String(initial.quantity ?? 1))
  const [unit, setUnit] = useState(initial.unit ?? '')
  const [tags, setTags] = useState((initial.tags ?? []).join(', '))
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [locationId, setLocationId] = useState<string | null>(initial.locationId ?? null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial.photoUrl ?? null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await onSubmit({
        name: name.trim(),
        category: category.trim(),
        quantity: Number(quantity) || 0,
        unit: unit.trim(),
        tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        notes: notes.trim(),
        locationId,
        photoUrl,
      })
      if (compact) {
        setName('')
        setQuantity('1')
        setNotes('')
        setTags('')
        setPhotoUrl(null)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div className={compact ? 'wide' : 'field wide'}>
        <label>Item name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Needle-nose pliers" autoFocus required />
      </div>
      <div className="field">
        <label>Quantity</label>
        <input type="number" min={0} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div className="field">
        <label>Unit (optional)</label>
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, box, roll…" list="unit-list" />
        <datalist id="unit-list">
          {['pcs', 'box', 'bag', 'roll', 'can', 'jar', 'set', 'pair'].map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
      </div>
      <div className="field">
        <label>Category</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} list="cat-list" placeholder="Hand tools, Fasteners…" />
        <datalist id="cat-list">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="field">
        <label>Location</label>
        <LocationSelect locations={locations} value={locationId} onChange={setLocationId} />
      </div>
      {!compact && (
        <>
          <div className="field wide">
            <label>Tags (comma separated, used for search)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="screwdriver, phillips" />
          </div>
          <div className="field wide">
            <label>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="field wide">
            <label>Photo</label>
            <div className="row">
              {photoUrl && <img src={photoUrl} alt="" className="photo" style={{ maxHeight: 120 }} />}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ width: 'auto' }}
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (f) setPhotoUrl(await fileToDataUrl(f))
                }}
              />
              {photoUrl && (
                <button type="button" className="ghost" onClick={() => setPhotoUrl(null)}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </>
      )}
      <div className="row wide">
        <button type="submit" className="primary" disabled={busy || !name.trim()}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

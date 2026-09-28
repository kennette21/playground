export type LocationKind = 'area' | 'container' | 'drawer' | 'shelf' | 'bin' | 'other'

export const LOCATION_KINDS: { value: LocationKind; label: string; prefix: string }[] = [
  { value: 'area', label: 'Area (wall, bench, corner)', prefix: 'A' },
  { value: 'container', label: 'Container (tool chest, cabinet)', prefix: 'C' },
  { value: 'drawer', label: 'Drawer', prefix: 'D' },
  { value: 'shelf', label: 'Shelf', prefix: 'S' },
  { value: 'bin', label: 'Bin / box / tote', prefix: 'B' },
  { value: 'other', label: 'Other', prefix: 'X' },
]

export interface Location {
  id: string
  /** Short, unique, human-typeable code. Encoded in the QR label, e.g. "TC1-D03". */
  code: string
  name: string
  kind: LocationKind
  parentId: string | null
  description: string
  /** Order among siblings (drawer 1 at top, etc.). */
  sortOrder: number
  /** Optional photo (data URL in local mode, storage URL in Supabase mode). */
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Item {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  tags: string[]
  notes: string
  locationId: string | null
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

export type ItemEventType = 'created' | 'moved' | 'updated' | 'quantity' | 'removed' | 'checked'

export interface ItemEvent {
  id: string
  itemId: string
  type: ItemEventType
  fromLocationId: string | null
  toLocationId: string | null
  note: string
  at: string
}

export interface Snapshot {
  locations: Location[]
  items: Item[]
  events: ItemEvent[]
}

export const emptySnapshot = (): Snapshot => ({ locations: [], items: [], events: [] })

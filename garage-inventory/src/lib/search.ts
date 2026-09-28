import Fuse from 'fuse.js'
import type { Item, Location } from '../types'
import { pathLabel } from './codes'

export interface SearchDoc {
  kind: 'item' | 'location'
  id: string
  title: string
  subtitle: string
  text: string
  item?: Item
  location?: Location
}

export function buildIndex(items: Item[], locations: Location[]) {
  const docs: SearchDoc[] = [
    ...items.map<SearchDoc>((it) => {
      const loc = locations.find((l) => l.id === it.locationId)
      return {
        kind: 'item',
        id: it.id,
        title: it.name,
        subtitle: loc ? pathLabel(loc, locations) : 'Unassigned',
        text: [it.category, it.tags.join(' '), it.notes].join(' '),
        item: it,
      }
    }),
    ...locations.map<SearchDoc>((l) => ({
      kind: 'location',
      id: l.id,
      title: l.name,
      subtitle: `${l.code} · ${pathLabel(l, locations)}`,
      text: [l.code, l.description].join(' '),
      location: l,
    })),
  ]
  return new Fuse(docs, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'text', weight: 0.3 },
      { name: 'subtitle', weight: 0.1 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })
}

/** Strip filler from voice queries: "where are my hammers" -> "hammers". */
export function cleanVoiceQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/^(hey |ok |okay )?(garage|inventory)[,.]?\s*/i, '')
    .replace(/^(where (are|is|do i keep|did i put|can i find)|find|show me|look for|search for|locate)\s+/i, '')
    .replace(/^(the|my|a|an|some)\s+/i, '')
    .replace(/[?.!]+$/g, '')
    .trim()
}

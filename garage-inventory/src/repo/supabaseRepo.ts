import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Item, ItemEvent, Location, Snapshot } from '../types'
import type { Repo } from './types'

/** Column mapping between the camelCase app model and snake_case Postgres. */
const locToRow = (l: Location) => ({
  id: l.id,
  code: l.code,
  name: l.name,
  kind: l.kind,
  parent_id: l.parentId,
  description: l.description,
  sort_order: l.sortOrder,
  photo_url: l.photoUrl,
  created_at: l.createdAt,
  updated_at: l.updatedAt,
})
const rowToLoc = (r: Record<string, unknown>): Location => ({
  id: r.id as string,
  code: r.code as string,
  name: r.name as string,
  kind: r.kind as Location['kind'],
  parentId: (r.parent_id as string | null) ?? null,
  description: (r.description as string) ?? '',
  sortOrder: (r.sort_order as number) ?? 0,
  photoUrl: (r.photo_url as string | null) ?? null,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
})
const itemToRow = (i: Item) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  quantity: i.quantity,
  unit: i.unit,
  tags: i.tags,
  notes: i.notes,
  location_id: i.locationId,
  photo_url: i.photoUrl,
  created_at: i.createdAt,
  updated_at: i.updatedAt,
})
const rowToItem = (r: Record<string, unknown>): Item => ({
  id: r.id as string,
  name: r.name as string,
  category: (r.category as string) ?? '',
  quantity: Number(r.quantity ?? 1),
  unit: (r.unit as string) ?? '',
  tags: (r.tags as string[]) ?? [],
  notes: (r.notes as string) ?? '',
  locationId: (r.location_id as string | null) ?? null,
  photoUrl: (r.photo_url as string | null) ?? null,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
})
const evToRow = (e: ItemEvent) => ({
  id: e.id,
  item_id: e.itemId,
  type: e.type,
  from_location_id: e.fromLocationId,
  to_location_id: e.toLocationId,
  note: e.note,
  at: e.at,
})
const rowToEv = (r: Record<string, unknown>): ItemEvent => ({
  id: r.id as string,
  itemId: r.item_id as string,
  type: r.type as ItemEvent['type'],
  fromLocationId: (r.from_location_id as string | null) ?? null,
  toLocationId: (r.to_location_id as string | null) ?? null,
  note: (r.note as string) ?? '',
  at: r.at as string,
})

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

/** Supabase-backed persistence. See supabase/migrations for the schema. */
export class SupabaseRepo implements Repo {
  readonly name: string
  readonly client: SupabaseClient

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey)
    this.name = `Supabase (${new URL(url).host})`
  }

  async load(): Promise<Snapshot> {
    const [locs, items, evs] = await Promise.all([
      this.client.from('locations').select('*').order('sort_order'),
      this.client.from('items').select('*').order('name'),
      this.client.from('item_events').select('*').order('at'),
    ])
    return {
      locations: must<Record<string, unknown>[]>(locs).map(rowToLoc),
      items: must<Record<string, unknown>[]>(items).map(rowToItem),
      events: must<Record<string, unknown>[]>(evs).map(rowToEv),
    }
  }
  async upsertLocation(loc: Location) {
    must(await this.client.from('locations').upsert(locToRow(loc)))
  }
  async deleteLocation(id: string) {
    must(await this.client.from('locations').delete().eq('id', id))
  }
  async upsertItem(item: Item) {
    must(await this.client.from('items').upsert(itemToRow(item)))
  }
  async deleteItem(id: string) {
    must(await this.client.from('items').delete().eq('id', id))
  }
  async addEvent(ev: ItemEvent) {
    must(await this.client.from('item_events').insert(evToRow(ev)))
  }
  async replaceAll(s: Snapshot) {
    must(await this.client.from('item_events').delete().neq('id', ''))
    must(await this.client.from('items').delete().neq('id', ''))
    must(await this.client.from('locations').delete().neq('id', ''))
    // Parents must exist before children: insert in tree order.
    const byDepth = [...s.locations].sort((a, b) => depth(a, s) - depth(b, s))
    if (byDepth.length) must(await this.client.from('locations').insert(byDepth.map(locToRow)))
    if (s.items.length) must(await this.client.from('items').insert(s.items.map(itemToRow)))
    if (s.events.length) must(await this.client.from('item_events').insert(s.events.map(evToRow)))
  }
}

function depth(l: Location, s: Snapshot): number {
  let d = 0
  let cur: Location | undefined = l
  while (cur?.parentId) {
    d++
    cur = s.locations.find((x) => x.id === cur!.parentId)
  }
  return d
}

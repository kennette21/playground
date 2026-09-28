import { useSyncExternalStore } from 'react'
import { newId, normalizeCode, now, descendantIds } from './lib/codes'
import { createRepo, type Repo } from './repo'
import { emptySnapshot, type Item, type ItemEvent, type Location, type Snapshot } from './types'

export type Status = 'loading' | 'ready' | 'error'

interface State extends Snapshot {
  status: Status
  error: string | null
  repoName: string
}

let repo: Repo = createRepo()
let state: State = { ...emptySnapshot(), status: 'loading', error: null, repoName: repo.name }
const listeners = new Set<() => void>()

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, () => state)
}

export function getRepo() {
  return repo
}

/** Load (or reload) everything from the configured backend. */
export async function init(newRepo?: Repo) {
  if (newRepo) repo = newRepo
  set({ status: 'loading', error: null, repoName: repo.name })
  try {
    const snap = await repo.load()
    set({ ...snap, status: 'ready' })
  } catch (e) {
    set({ status: 'error', error: e instanceof Error ? e.message : String(e) })
  }
}

/** Write-through helper: update memory first so the UI is instant, then persist. */
async function persist(fn: () => Promise<void>) {
  try {
    await fn()
  } catch (e) {
    set({ error: `Save failed: ${e instanceof Error ? e.message : String(e)}` })
  }
}

export const clearError = () => set({ error: null })

// ---------- Locations ----------

export async function addLocation(input: Pick<Location, 'code' | 'name' | 'kind' | 'parentId'> & Partial<Location>): Promise<Location> {
  const code = normalizeCode(input.code)
  if (state.locations.some((l) => l.code === code)) throw new Error(`Code ${code} is already used`)
  const siblings = state.locations.filter((l) => l.parentId === (input.parentId ?? null))
  const t = now()
  const loc: Location = {
    id: newId(),
    description: '',
    sortOrder: siblings.length,
    photoUrl: null,
    createdAt: t,
    updatedAt: t,
    ...input,
    code,
  }
  set({ locations: [...state.locations, loc] })
  await persist(() => repo.upsertLocation(loc))
  return loc
}

export async function updateLocation(id: string, patch: Partial<Location>) {
  const cur = state.locations.find((l) => l.id === id)
  if (!cur) return
  if (patch.code !== undefined) {
    patch.code = normalizeCode(patch.code)
    if (state.locations.some((l) => l.id !== id && l.code === patch.code)) throw new Error(`Code ${patch.code} is already used`)
  }
  if (patch.parentId && descendantIds(id, state.locations).has(patch.parentId)) throw new Error('Cannot move a location inside itself')
  const next = { ...cur, ...patch, updatedAt: now() }
  set({ locations: state.locations.map((l) => (l.id === id ? next : l)) })
  await persist(() => repo.upsertLocation(next))
}

/** Deletes the location and everything nested in it; items inside become unassigned. */
export async function deleteLocation(id: string) {
  const gone = descendantIds(id, state.locations)
  const t = now()
  const movedItems = state.items.filter((i) => i.locationId && gone.has(i.locationId)).map((i) => ({ ...i, locationId: null, updatedAt: t }))
  const evs: ItemEvent[] = movedItems.map((i) => ({ id: newId(), itemId: i.id, type: 'moved', fromLocationId: state.items.find((x) => x.id === i.id)!.locationId, toLocationId: null, note: 'Location deleted', at: t }))
  set({
    locations: state.locations.filter((l) => !gone.has(l.id)),
    items: state.items.map((i) => movedItems.find((m) => m.id === i.id) ?? i),
    events: [...state.events, ...evs],
  })
  await persist(async () => {
    for (const i of movedItems) await repo.upsertItem(i)
    for (const e of evs) await repo.addEvent(e)
    // Children cascade in Postgres; local repo needs explicit deletes.
    for (const gid of [...gone].reverse()) await repo.deleteLocation(gid)
  })
}

// ---------- Items ----------

export async function addItem(input: Pick<Item, 'name'> & Partial<Item>): Promise<Item> {
  const t = now()
  const item: Item = {
    id: newId(),
    category: '',
    quantity: 1,
    unit: '',
    tags: [],
    notes: '',
    locationId: null,
    photoUrl: null,
    createdAt: t,
    updatedAt: t,
    ...input,
    name: input.name.trim(),
  }
  const ev: ItemEvent = { id: newId(), itemId: item.id, type: 'created', fromLocationId: null, toLocationId: item.locationId, note: '', at: t }
  set({ items: [...state.items, item], events: [...state.events, ev] })
  await persist(async () => {
    await repo.upsertItem(item)
    await repo.addEvent(ev)
  })
  return item
}

export async function updateItem(id: string, patch: Partial<Item>, note = '') {
  const cur = state.items.find((i) => i.id === id)
  if (!cur) return
  const t = now()
  const next: Item = { ...cur, ...patch, updatedAt: t }
  const evs: ItemEvent[] = []
  if (patch.locationId !== undefined && patch.locationId !== cur.locationId) {
    evs.push({ id: newId(), itemId: id, type: 'moved', fromLocationId: cur.locationId, toLocationId: patch.locationId, note, at: t })
  }
  if (patch.quantity !== undefined && patch.quantity !== cur.quantity) {
    evs.push({ id: newId(), itemId: id, type: 'quantity', fromLocationId: null, toLocationId: null, note: note || `${cur.quantity} → ${patch.quantity}`, at: t })
  }
  const otherChanged = (['name', 'category', 'unit', 'tags', 'notes', 'photoUrl'] as const).some(
    (k) => patch[k] !== undefined && JSON.stringify(patch[k]) !== JSON.stringify(cur[k]),
  )
  if (otherChanged) evs.push({ id: newId(), itemId: id, type: 'updated', fromLocationId: null, toLocationId: null, note, at: t })
  set({ items: state.items.map((i) => (i.id === id ? next : i)), events: [...state.events, ...evs] })
  await persist(async () => {
    await repo.upsertItem(next)
    for (const e of evs) await repo.addEvent(e)
  })
}

/** "I just saw it there" — a lightweight confirmation that refreshes the history. */
export async function checkItem(id: string) {
  const ev: ItemEvent = { id: newId(), itemId: id, type: 'checked', fromLocationId: null, toLocationId: null, note: 'Confirmed present', at: now() }
  set({ events: [...state.events, ev] })
  await persist(() => repo.addEvent(ev))
}

export async function deleteItem(id: string) {
  set({ items: state.items.filter((i) => i.id !== id), events: state.events.filter((e) => e.itemId !== id) })
  await persist(() => repo.deleteItem(id))
}

// ---------- Bulk ----------

export async function replaceAll(snapshot: Snapshot) {
  set({ ...snapshot })
  await persist(() => repo.replaceAll(snapshot))
}

export const snapshot = (): Snapshot => ({ locations: state.locations, items: state.items, events: state.events })

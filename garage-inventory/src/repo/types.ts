import type { Item, ItemEvent, Location, Snapshot } from '../types'

/**
 * Persistence boundary. The in-memory store is the source of truth for the UI;
 * a Repo just has to load everything once and then mirror each write.
 */
export interface Repo {
  readonly name: string
  load(): Promise<Snapshot>
  upsertLocation(loc: Location): Promise<void>
  deleteLocation(id: string): Promise<void>
  upsertItem(item: Item): Promise<void>
  deleteItem(id: string): Promise<void>
  addEvent(ev: ItemEvent): Promise<void>
  /** Replace everything (used by import / sample data). */
  replaceAll(snapshot: Snapshot): Promise<void>
}

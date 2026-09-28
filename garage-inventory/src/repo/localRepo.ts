import type { Item, ItemEvent, Location, Snapshot } from '../types'
import { emptySnapshot } from '../types'
import type { Repo } from './types'

const KEY = 'garage-inventory:v1'

/** Browser-local storage. Zero setup; data lives in this browser only. */
export class LocalRepo implements Repo {
  readonly name = 'Local (this browser)'
  private snap: Snapshot = emptySnapshot()

  async load(): Promise<Snapshot> {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) this.snap = { ...emptySnapshot(), ...(JSON.parse(raw) as Snapshot) }
    } catch {
      this.snap = emptySnapshot()
    }
    return structuredClone(this.snap)
  }

  private save() {
    localStorage.setItem(KEY, JSON.stringify(this.snap))
  }

  async upsertLocation(loc: Location) {
    const i = this.snap.locations.findIndex((l) => l.id === loc.id)
    if (i >= 0) this.snap.locations[i] = loc
    else this.snap.locations.push(loc)
    this.save()
  }
  async deleteLocation(id: string) {
    this.snap.locations = this.snap.locations.filter((l) => l.id !== id)
    this.save()
  }
  async upsertItem(item: Item) {
    const i = this.snap.items.findIndex((x) => x.id === item.id)
    if (i >= 0) this.snap.items[i] = item
    else this.snap.items.push(item)
    this.save()
  }
  async deleteItem(id: string) {
    this.snap.items = this.snap.items.filter((x) => x.id !== id)
    this.snap.events = this.snap.events.filter((e) => e.itemId !== id)
    this.save()
  }
  async addEvent(ev: ItemEvent) {
    this.snap.events.push(ev)
    this.save()
  }
  async replaceAll(snapshot: Snapshot) {
    this.snap = structuredClone(snapshot)
    this.save()
  }
}

import type { Item, ItemEvent, Location, LocationKind, Snapshot } from '../types'
import { newId, now } from './codes'

/** A small demo garage so the app is not empty on first run. */
export function sampleSnapshot(): Snapshot {
  const t = now()
  const locations: Location[] = []
  const items: Item[] = []
  const events: ItemEvent[] = []

  const loc = (code: string, name: string, kind: LocationKind, parent: Location | null, sortOrder = 0, description = ''): Location => {
    const l: Location = { id: newId(), code, name, kind, parentId: parent?.id ?? null, description, sortOrder, photoUrl: null, createdAt: t, updatedAt: t }
    locations.push(l)
    return l
  }
  const item = (name: string, where: Location, opts: Partial<Item> = {}) => {
    const i: Item = { id: newId(), name, category: '', quantity: 1, unit: '', tags: [], notes: '', locationId: where.id, photoUrl: null, createdAt: t, updatedAt: t, ...opts }
    items.push(i)
    events.push({ id: newId(), itemId: i.id, type: 'created', fromLocationId: null, toLocationId: where.id, note: 'Sample data', at: t })
    return i
  }

  const tc1 = loc('TC1', 'Red tool chest', 'container', null, 0, 'Big rolling chest, left wall')
  const drawers = ['Screwdrivers & bits', 'Pliers & cutters', 'Wrenches', 'Sockets', 'Measuring & marking', 'Power tool accessories'].map((n, i) =>
    loc(`TC1-D${String(i + 1).padStart(2, '0')}`, n, 'drawer', tc1, i),
  )
  const wb = loc('WB', 'Workbench', 'area', null, 1, 'Bench under the window')
  const wbShelf = loc('WB-S01', 'Shelf above bench', 'shelf', wb, 0)
  const wbBin1 = loc('WB-B01', 'Fasteners bin', 'bin', wb, 1)
  const wbBin2 = loc('WB-B02', 'Electrical bin', 'bin', wb, 2)
  const pb = loc('PB', 'Pegboard', 'area', null, 2)

  item('Phillips screwdriver set', drawers[0], { category: 'Hand tools', quantity: 6, tags: ['screwdriver', 'phillips'] })
  item('Flathead screwdriver set', drawers[0], { category: 'Hand tools', quantity: 5, tags: ['screwdriver', 'flat'] })
  item('Impact driver bit set', drawers[0], { category: 'Bits', quantity: 1, notes: 'DeWalt 40pc' })
  item('Needle-nose pliers', drawers[1], { category: 'Hand tools', tags: ['pliers'] })
  item('Lineman pliers', drawers[1], { category: 'Hand tools', tags: ['pliers'] })
  item('Wire cutters', drawers[1], { category: 'Hand tools', tags: ['cutters', 'electrical'] })
  item('Combination wrench set (metric)', drawers[2], { category: 'Hand tools', quantity: 12, tags: ['wrench', 'metric'] })
  item('Combination wrench set (SAE)', drawers[2], { category: 'Hand tools', quantity: 10, tags: ['wrench', 'sae'] })
  item('Adjustable wrench 10"', drawers[2], { category: 'Hand tools', tags: ['wrench'] })
  item('3/8" socket set', drawers[3], { category: 'Hand tools', tags: ['sockets', 'ratchet'] })
  item('1/2" ratchet', drawers[3], { category: 'Hand tools', tags: ['ratchet'] })
  item('Tape measure 25ft', drawers[4], { category: 'Measuring', quantity: 2 })
  item('Speed square', drawers[4], { category: 'Measuring' })
  item('Torpedo level', drawers[4], { category: 'Measuring' })
  item('Hole saw kit', drawers[5], { category: 'Power tool accessories' })
  item('Drill bit set (twist)', drawers[5], { category: 'Power tool accessories', tags: ['drill', 'bits'] })
  item('Wood screws #8 x 1-1/4"', wbBin1, { category: 'Fasteners', quantity: 200, unit: 'pcs', tags: ['screws', 'wood'] })
  item('Drywall screws 1-5/8"', wbBin1, { category: 'Fasteners', quantity: 1, unit: 'box', tags: ['screws', 'drywall'] })
  item('M6 hex bolts', wbBin1, { category: 'Fasteners', quantity: 40, unit: 'pcs', tags: ['bolts', 'metric'] })
  item('Washers, assorted', wbBin1, { category: 'Fasteners', quantity: 1, unit: 'jar' })
  item('Wire nuts', wbBin2, { category: 'Electrical', quantity: 50, unit: 'pcs' })
  item('Electrical tape', wbBin2, { category: 'Electrical', quantity: 3, unit: 'rolls' })
  item('Multimeter', wbBin2, { category: 'Electrical', notes: 'Klein MM400' })
  item('WD-40', wbShelf, { category: 'Chemicals', quantity: 2, unit: 'cans' })
  item('Wood glue', wbShelf, { category: 'Adhesives' })
  item('Claw hammer', pb, { category: 'Hand tools', tags: ['hammer'] })
  item('Rubber mallet', pb, { category: 'Hand tools', tags: ['hammer', 'mallet'] })
  item('Hand saw', pb, { category: 'Hand tools', tags: ['saw'] })
  item('Cordless drill', wbShelf, { category: 'Power tools', tags: ['drill'], notes: 'Battery on charger' })

  return { locations, items, events }
}

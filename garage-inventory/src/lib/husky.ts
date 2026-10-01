import type { Item, ItemEvent, Location, LocationKind, Snapshot } from '../types'
import { newId, now } from './codes'

/**
 * The user's real Husky rolling chest, transcribed from photos (Oct 2026):
 * drawer names from the handwritten tape labels, contents of the wrench
 * drawer and the batteries drawer from close-up photos.
 */
export function huskySnapshot(): Snapshot {
  const t = now()
  const locations: Location[] = []
  const items: Item[] = []
  const events: ItemEvent[] = []

  const loc = (code: string, name: string, kind: LocationKind, parent: Location | null, sortOrder: number, description = ''): Location => {
    const l: Location = { id: newId(), code, name, kind, parentId: parent?.id ?? null, description, sortOrder, photoUrl: null, createdAt: t, updatedAt: t }
    locations.push(l)
    return l
  }
  const item = (name: string, where: Location, opts: Partial<Item> = {}) => {
    const i: Item = { id: newId(), name, category: '', quantity: 1, unit: '', tags: [], notes: '', locationId: where.id, photoUrl: null, createdAt: t, updatedAt: t, ...opts }
    items.push(i)
    events.push({ id: newId(), itemId: i.id, type: 'created', fromLocationId: null, toLocationId: where.id, note: 'From drawer photo', at: t })
    return i
  }

  const chest = loc('HSK', 'Husky rolling chest', 'container', null, 0, 'Black Husky top chest + rolling cabinet with lid. Labels are handwritten tape.')

  // Top chest, left column (narrow drawers) and right column (wide drawers), top to bottom.
  const d = (code: string, name: string, order: number, desc = '') => loc(code, name, 'drawer', chest, order, desc)
  d('HSK-D01', 'Levels, rulers, stud finders', 0, 'Top chest, left column, drawer 1')
  const batt = d('HSK-D02', 'Batteries & misc', 1, 'Top chest, left column, drawer 2')
  d('HSK-D03', 'Wood glues', 2, 'Top chest, left column, drawer 3')
  d('HSK-D04', 'Tape', 3, 'Top chest, left column, drawer 4')
  d('HSK-D05', 'Cutting tools', 4, 'Top chest, right column, drawer 1')
  const wrench = d('HSK-D06', 'Wrench set', 5, 'Top chest, right column, drawer 2. Husky foam wrench tray.')
  d('HSK-D07', 'Hex keys & wrenches', 6, 'Top chest, right column, drawer 3')
  // Full-width drawer between the two sections.
  d('HSK-D08', 'Ratchets & wrenches', 7, 'Full-width drawer, middle')
  // Rolling cabinet, left column.
  d('HSK-D09', 'Screw set', 8, 'Cabinet, left column, drawer 1')
  d('HSK-D10', 'Screws (1)', 9, 'Cabinet, left column, drawer 2')
  d('HSK-D11', 'Screws (2)', 10, 'Cabinet, left column, drawer 3')
  loc('HSK-B01', 'Electrical bin', 'bin', chest, 11, 'Pull-out bin, cabinet bottom left')
  // Rolling cabinet, right column.
  d('HSK-D12', 'Drill bits', 12, 'Cabinet, right column, drawer 1')
  d('HSK-D13', 'Painter, epoxy & glue', 13, 'Cabinet, right column, drawer 2')
  d('HSK-D14', 'Supplies', 14, 'Cabinet, right column, drawer 3')
  d('HSK-D15', 'Electronics', 15, 'Cabinet, right column, drawer 4 (deep)')
  loc('HSK-S01', 'Top of chest (under lid)', 'shelf', chest, 16, 'Work surface under the lid: acoustic camera box, tool organizer, misc.')

  // Wrench drawer (photo 1).
  item('Husky SAE combination wrench set', wrench, { category: 'Hand tools', quantity: 10, unit: 'pcs', tags: ['wrench', 'sae', 'combination'], notes: '1/4, 5/16, 3/8, 7/16, 1/2, 9/16, 5/8, 11/16, 3/4, 13/16 in foam tray' })
  item('Husky metric combination wrench set', wrench, { category: 'Hand tools', quantity: 10, unit: 'pcs', tags: ['wrench', 'metric', 'combination'], notes: '8, 9, 10, 11, 12, 13, 14, 15, 17, 18 mm in foam tray' })
  item('SAE stubby wrenches', wrench, { category: 'Hand tools', quantity: 4, unit: 'pcs', tags: ['wrench', 'sae', 'stubby'], notes: '3/8, 7/16, 1/2, 9/16' })
  item('Metric stubby wrenches', wrench, { category: 'Hand tools', quantity: 4, unit: 'pcs', tags: ['wrench', 'metric', 'stubby'], notes: '10, 11, 13, 14 mm' })
  item('Ratcheting combination wrench 3/4"', wrench, { category: 'Hand tools', tags: ['wrench', 'ratcheting', 'sae'] })
  item('Ratcheting combination wrench 15 mm', wrench, { category: 'Hand tools', tags: ['wrench', 'ratcheting', 'metric'] })
  item('Knipex insulated combination pliers', wrench, { category: 'Hand tools', tags: ['pliers', 'knipex', 'insulated', 'electrical'], notes: 'Red/yellow VDE handles' })
  item('Carpenter marking pencil (yellow)', wrench, { category: 'Marking', tags: ['pencil', 'marking'] })

  // Batteries & misc drawer (photo 2).
  item('Energizer MAX AAA batteries', batt, { category: 'Batteries', quantity: 3, unit: 'packs', tags: ['battery', 'aaa', 'energizer'], notes: '8-packs, some opened' })
  item('Rayovac Fusion 9V battery', batt, { category: 'Batteries', quantity: 1, unit: 'pack', tags: ['battery', '9v'] })
  item('Energizer 357/303 button cells', batt, { category: 'Batteries', quantity: 1, unit: 'pack', tags: ['battery', 'button cell', 'lr44'], notes: '3-pack' })
  item('Camera battery (Li-ion, black)', batt, { category: 'Batteries', tags: ['battery', 'camera', 'rechargeable'] })
  item('Speed Out Pro damaged screw extractor set', batt, { category: 'Bits', tags: ['extractor', 'screw', 'bits'] })
  item('Hillman #8 x 3/4" Phillips metal screws', batt, { category: 'Fasteners', quantity: 1, unit: 'pack', tags: ['screws', 'sheet metal'] })
  item('Utilitech 8" outdoor cable ties', batt, { category: 'Electrical', quantity: 1, unit: 'pack', tags: ['zip ties', 'cable ties'], notes: '20 ct, black, plus a few loose' })
  item('Cat5e ethernet patch cable (blue)', batt, { category: 'Electrical', tags: ['ethernet', 'network', 'cable'] })
  item('Scratch awl', batt, { category: 'Hand tools', tags: ['awl', 'marking'], notes: 'Yellow/black handle' })
  item('Super glue (small bottle)', batt, { category: 'Adhesives', tags: ['glue', 'cyanoacrylate'] })
  item('Blank adhesive labels (sheet)', batt, { category: 'Supplies', tags: ['labels'] })
  item('White plastic sensor / button', batt, { category: 'Electronics', tags: ['smart home', 'sensor'], notes: 'Identify: small white box with round button' })
  item('Small white box (unknown contents)', batt, { category: 'Unsorted', notes: 'Check and rename' })
  item('Loose hex bolts', batt, { category: 'Fasteners', quantity: 2, unit: 'pcs', tags: ['bolts'] })

  return { locations, items, events }
}

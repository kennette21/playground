import type ExcelJS from 'exceljs'

const excel = () => import('exceljs').then((m) => m.default ?? m)
import type { Item, Location } from '../types'
import { locationPath, pathLabel } from './codes'
import { itemUrl, locationUrl, type AppSettings } from './settings'

function download(blob: Blob, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

const stamp = () => new Date().toISOString().slice(0, 10)

function styleHeader(ws: ExcelJS.Worksheet) {
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

/** Items in a location, short enough to fit a label line. */
export function contentsSummary(loc: Location, items: Item[], maxLen = 60): string {
  const names = items.filter((i) => i.locationId === loc.id).map((i) => i.name)
  let out = ''
  for (const n of names) {
    const next = out ? `${out}, ${n}` : n
    if (next.length > maxLen) return `${out}…`
    out = next
  }
  return out
}

export interface LabelRow {
  Code: string
  Name: string
  Line1: string
  Line2: string
  Path: string
  Contents: string
  QR: string
  Kind: string
}

export function locationLabelRows(locations: Location[], items: Item[], s: AppSettings): LabelRow[] {
  return [...locations]
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    .map((l) => {
      const path = locationPath(l, locations)
      const parent = path.length > 1 ? path[path.length - 2].name : ''
      return {
        Code: l.code,
        Name: l.name,
        Line1: l.name,
        Line2: parent ? `${parent} · ${l.code}` : l.code,
        Path: pathLabel(l, locations),
        Contents: contentsSummary(l, items),
        QR: locationUrl(l.code, s),
        Kind: l.kind,
      }
    })
}

export interface ItemLabelRow {
  Item: string
  Qty: string
  Location: string
  LocationCode: string
  QR: string
}

export function itemLabelRows(items: Item[], locations: Location[], s: AppSettings): ItemLabelRow[] {
  return [...items]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((i) => {
      const loc = locations.find((l) => l.id === i.locationId)
      return {
        Item: i.name,
        Qty: `${i.quantity}${i.unit ? ' ' + i.unit : ''}`,
        Location: loc ? loc.name : 'Unassigned',
        LocationCode: loc?.code ?? '',
        QR: itemUrl(i.id, s),
      }
    })
}

function addSheet<T extends object>(wb: ExcelJS.Workbook, name: string, rows: T[], widths: Record<string, number> = {}) {
  const ws = wb.addWorksheet(name)
  const keys = rows.length ? Object.keys(rows[0]) : []
  ws.columns = keys.map((k) => ({ header: k, key: k, width: widths[k] ?? 18 }))
  for (const r of rows) ws.addRow(r as Record<string, unknown>)
  // Everything as text so label apps never reformat codes like "001" or long URLs.
  ws.eachRow((row) => row.eachCell((c) => (c.numFmt = '@')))
  styleHeader(ws)
  return ws
}

/** Workbook for the label printer: one row per location label, plus item labels on a second sheet. */
export async function exportLabelsXlsx(locations: Location[], items: Item[], s: AppSettings) {
  const wb = new (await excel()).Workbook()
  addSheet(wb, 'Location labels', locationLabelRows(locations, items, s), { Path: 36, Contents: 48, QR: 44 })
  addSheet(wb, 'Item labels', itemLabelRows(items, locations, s), { Item: 28, QR: 44 })
  download(new Blob([await wb.xlsx.writeBuffer()]), `garage-labels-${stamp()}.xlsx`)
}

/** Full inventory workbook: items, locations, and a "what's where" sheet. */
export async function exportInventoryXlsx(locations: Location[], items: Item[], s: AppSettings) {
  const wb = new (await excel()).Workbook()
  addSheet(
    wb,
    'Items',
    [...items]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((i) => {
        const loc = locations.find((l) => l.id === i.locationId)
        return {
          Name: i.name,
          Quantity: i.quantity,
          Unit: i.unit,
          Category: i.category,
          Tags: i.tags.join(', '),
          LocationCode: loc?.code ?? '',
          Location: loc ? pathLabel(loc, locations) : 'Unassigned',
          Notes: i.notes,
          Updated: i.updatedAt.slice(0, 10),
          ItemId: i.id,
        }
      }),
    { Name: 30, Location: 40, Notes: 40, ItemId: 38 },
  )
  addSheet(
    wb,
    'Locations',
    [...locations]
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      .map((l) => ({
        Code: l.code,
        Name: l.name,
        Kind: l.kind,
        ParentCode: locations.find((p) => p.id === l.parentId)?.code ?? '',
        Path: pathLabel(l, locations),
        ItemCount: items.filter((i) => i.locationId === l.id).length,
        Description: l.description,
        QR: locationUrl(l.code, s),
        LocationId: l.id,
      })),
    { Path: 40, Description: 30, QR: 44, LocationId: 38 },
  )
  download(new Blob([await wb.xlsx.writeBuffer()]), `garage-inventory-${stamp()}.xlsx`)
}

/** CSV of location labels (for apps that only take CSV). UTF-8 with BOM so Excel opens it cleanly. */
export function exportLabelsCsv(locations: Location[], items: Item[], s: AppSettings) {
  const rows = locationLabelRows(locations, items, s)
  const keys = Object.keys(rows[0] ?? { Code: '', Name: '', QR: '' }) as (keyof LabelRow)[]
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
  const lines = [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))]
  download(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `garage-labels-${stamp()}.csv`)
}

export function exportJson(snapshot: unknown) {
  download(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }), `garage-inventory-backup-${stamp()}.json`)
}

import { LOCATION_KINDS, type Location, type LocationKind } from '../types'

export const newId = () => crypto.randomUUID()
export const now = () => new Date().toISOString()

/** Turn "Big Red Tool Chest" into "BRTC"; "Workbench" into "WB". */
export function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'LOC'
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map((w) => w[0]).join('').toUpperCase().slice(0, 4)
}

/**
 * Suggest a code for a new location. Top-level: initials of the name (WB, TC1...).
 * Children: parent code + kind prefix + zero-padded sibling number (TC1-D03).
 */
export function suggestCode(
  name: string,
  kind: LocationKind,
  parent: Location | null,
  all: Location[],
): string {
  const taken = new Set(all.map((l) => l.code.toUpperCase()))
  if (!parent) {
    const base = initials(name)
    if (!taken.has(base)) return base
    for (let i = 2; i < 100; i++) if (!taken.has(`${base}${i}`)) return `${base}${i}`
    return `${base}-${Date.now() % 1000}`
  }
  const prefix = LOCATION_KINDS.find((k) => k.value === kind)?.prefix ?? 'X'
  const siblings = all.filter((l) => l.parentId === parent.id && l.kind === kind).length
  for (let n = siblings + 1; n < 1000; n++) {
    const code = `${parent.code}-${prefix}${String(n).padStart(2, '0')}`
    if (!taken.has(code.toUpperCase())) return code
  }
  return `${parent.code}-${prefix}${Date.now() % 1000}`
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '-')
}

/** Ancestors from root to the location itself. */
export function locationPath(loc: Location | null | undefined, all: Location[]): Location[] {
  const path: Location[] = []
  const seen = new Set<string>()
  let cur = loc
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    path.unshift(cur)
    cur = all.find((l) => l.id === cur!.parentId)
  }
  return path
}

export const pathLabel = (loc: Location | null | undefined, all: Location[], sep = ' › ') =>
  locationPath(loc, all).map((l) => l.name).join(sep)

export function descendantIds(rootId: string, all: Location[]): Set<string> {
  const out = new Set<string>([rootId])
  let grew = true
  while (grew) {
    grew = false
    for (const l of all) {
      if (l.parentId && out.has(l.parentId) && !out.has(l.id)) {
        out.add(l.id)
        grew = true
      }
    }
  }
  return out
}

export const childrenOf = (parentId: string | null, all: Location[]) =>
  all.filter((l) => l.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

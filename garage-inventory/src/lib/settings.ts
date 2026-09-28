export interface AppSettings {
  /** Base URL baked into QR codes, e.g. http://garage-tablet.local:4173 */
  qrBaseUrl: string
  /** Label size for the printable sheet, in millimetres. */
  labelWidthMm: number
  labelHeightMm: number
  /** Speech recognition language. */
  speechLang: string
}

const KEY = 'garage-inventory:settings'

export const defaultSettings = (): AppSettings => ({
  qrBaseUrl: typeof window !== 'undefined' ? window.location.origin + window.location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') : '',
  labelWidthMm: 50,
  labelHeightMm: 25,
  speechLang: 'en-US',
})

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaultSettings(), ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch {
    /* ignore */
  }
  return defaultSettings()
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

/** The URL a location label's QR code resolves to. */
export const locationUrl = (code: string, s: AppSettings = loadSettings()) =>
  `${s.qrBaseUrl.replace(/\/$/, '')}/#/l/${encodeURIComponent(code)}`

export const itemUrl = (id: string, s: AppSettings = loadSettings()) =>
  `${s.qrBaseUrl.replace(/\/$/, '')}/#/i/${id}`

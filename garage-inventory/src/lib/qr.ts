import QRCode from 'qrcode'

const cache = new Map<string, Promise<string>>()

/** PNG data URL for a QR code; cached per payload. */
export function qrDataUrl(payload: string, size = 256): Promise<string> {
  const key = `${size}:${payload}`
  let p = cache.get(key)
  if (!p) {
    p = QRCode.toDataURL(payload, { width: size, margin: 1, errorCorrectionLevel: 'M' })
    cache.set(key, p)
  }
  return p
}

/** Parse a scanned QR payload into an app route, if it is one of ours. */
export function routeFromScan(text: string): string | null {
  const t = text.trim()
  const m = t.match(/(?:^|\/)(l|i)\/([^/?#]+)\/?(?:[?#].*)?$/)
  if (m) return `/${m[1]}/${decodeURIComponent(m[2])}`
  // Bare location code typed or printed as plain text.
  if (/^[A-Z0-9][A-Z0-9-]{0,30}$/i.test(t)) return `/l/${encodeURIComponent(t.toUpperCase())}`
  return null
}

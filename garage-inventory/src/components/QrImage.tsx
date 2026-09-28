import { useEffect, useState } from 'react'
import { qrDataUrl } from '../lib/qr'

export function QrImage({ payload, size = 160, className = 'qr' }: { payload: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string>('')
  useEffect(() => {
    let alive = true
    qrDataUrl(payload, size * 2).then((s) => alive && setSrc(s))
    return () => {
      alive = false
    }
  }, [payload, size])
  return (
    <span className={className} title={payload}>
      {src ? <img src={src} width={size} height={size} alt={`QR code for ${payload}`} /> : <span style={{ display: 'inline-block', width: size, height: size }} />}
    </span>
  )
}

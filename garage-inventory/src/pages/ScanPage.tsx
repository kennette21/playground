import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routeFromScan } from '../lib/qr'

interface DetectorLike {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>
}

export function ScanPage() {
  const nav = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState('Starting camera…')
  const [manual, setManual] = useState('')
  const [last, setLast] = useState('')

  useEffect(() => {
    let stopped = false
    let stream: MediaStream | null = null
    let zxingStop: (() => void) | null = null
    const video = videoRef.current!

    const handle = (text: string) => {
      if (stopped) return
      const route = routeFromScan(text)
      if (route) {
        stopped = true
        nav(route)
      } else setLast(`Not a garage label: ${text}`)
    }

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        video.srcObject = stream
        await video.play()
      } catch (e) {
        setStatus(`Camera unavailable: ${e instanceof Error ? e.message : e}. Type the code below instead.`)
        return
      }
      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => DetectorLike }).BarcodeDetector
      if (BD) {
        setStatus('Point the camera at a label')
        const det = new BD({ formats: ['qr_code'] })
        const tick = async () => {
          if (stopped) return
          try {
            const codes = await det.detect(video)
            if (codes.length) handle(codes[0].rawValue)
          } catch {
            /* frame not ready */
          }
          setTimeout(tick, 150)
        }
        tick()
      } else {
        // Fallback decoder for browsers without BarcodeDetector (Firefox, older Safari).
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        const reader = new BrowserQRCodeReader()
        setStatus('Point the camera at a label')
        const controls = await reader.decodeFromVideoElement(video, (result) => {
          if (result) handle(result.getText())
        })
        zxingStop = () => controls.stop()
      }
    }
    run()
    return () => {
      stopped = true
      zxingStop?.()
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [nav])

  return (
    <div>
      <h1>Scan a label</h1>
      <p className="muted">{status}</p>
      <div className="scanner">
        <video ref={videoRef} muted playsInline />
      </div>
      {last && <p className="muted small">{last}</p>}
      <form
        className="row"
        style={{ marginTop: '1rem' }}
        onSubmit={(e) => {
          e.preventDefault()
          const r = routeFromScan(manual)
          if (r) nav(r)
        }}
      >
        <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Or type a label code, e.g. TC1-D03" className="mono" style={{ flex: 1 }} />
        <button className="primary" type="submit">
          Go
        </button>
      </form>
    </div>
  )
}

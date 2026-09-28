/* Minimal typing for the Web Speech API (Chrome / Edge / Safari). */
interface SpeechRecognitionResultLike {
  0: { transcript: string }
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start(): void
  stop(): void
  abort(): void
}

type Ctor = new () => SpeechRecognitionLike

function ctor(): Ctor | null {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const speechSupported = () => ctor() !== null

export interface Listener {
  stop(): void
}

/** Listen once; calls onInterim as words arrive and onFinal with the best transcript. */
export function listen(
  lang: string,
  onInterim: (t: string) => void,
  onFinal: (t: string) => void,
  onError: (msg: string) => void,
): Listener | null {
  const C = ctor()
  if (!C) return null
  const rec = new C()
  rec.lang = lang
  rec.interimResults = true
  rec.continuous = false
  let final = ''
  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) final += r[0].transcript
      else interim += r[0].transcript
    }
    onInterim(final || interim)
  }
  rec.onerror = (e) => onError(e.error)
  rec.onend = () => onFinal(final.trim())
  rec.start()
  return { stop: () => rec.stop() }
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}

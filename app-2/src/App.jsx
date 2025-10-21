import { useMemo, useState } from 'react'
import './App.css'

const palette = [
  '#f97316',
  '#0ea5e9',
  '#22c55e',
  '#a855f7',
  '#ec4899',
  '#facc15',
]

const pickColor = (index) => palette[index % palette.length]

function App() {
  const [tick, setTick] = useState(0)
  const hue = useMemo(() => pickColor(tick), [tick])

  return (
    <main className="app" style={{ background: hue }}>
      <section className="panel">
        <h1>App 2 · Color Moodboard</h1>
        <p>
          Each click rotates through a playful palette. Snap a vibe, copy the
          hex, drop it into your next mockup.
        </p>
        <div className="swatch" aria-label="current color" />
        <code>{hue}</code>
        <div className="actions">
          <button onClick={() => setTick((value) => value + 1)}>
            Next hue
          </button>
          <button onClick={() => setTick((value) => value - 1)}>
            Previous hue
          </button>
        </div>
      </section>
    </main>
  )
}

export default App

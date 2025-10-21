import { useState } from 'react'
import './App.css'

const adjectives = ['swift', 'brave', 'clever', 'happy', 'curious', 'calm']

function App() {
  const [count, setCount] = useState(0)
  const [labelIndex, setLabelIndex] = useState(0)

  const rotateLabel = () => {
    setLabelIndex((idx) => (idx + 1) % adjectives.length)
  }

  return (
    <main className="app">
      <h1>App 1 · React Counter</h1>
      <p>
        Tap the button to track your score and cycle the vibe describing your
        day.
      </p>
      <button
        className="primary"
        onClick={() => {
          setCount((current) => current + 1)
          rotateLabel()
        }}
      >
        {adjectives[labelIndex]} clicks: {count}
      </button>
      <button className="secondary" onClick={() => setCount(0)}>
        Reset
      </button>
    </main>
  )
}

export default App

import { useCallback, useEffect, useMemo, useState } from 'react'
import KeyboardDisplay from './components/KeyboardDisplay'
import ChordSuggestions from './components/ChordSuggestions'
import EmotionLegend from './components/EmotionLegend'
import {
  ROOT_NOTES,
  SCALES,
  KEYBOARD_LAYOUT,
  KEY_TO_NOTE,
  getScaleNotes,
  getPitchClass,
  findScale,
  findMode,
  resolveProgressionChords
} from './data/scales'
import { EMOTIONS } from './data/emotions'
import { playNote, stopNote, playChord, stopAll } from './audio/engine'
import './App.css'

const defaultScale = SCALES[0]
const defaultMode = defaultScale.modes[0]
const defaultProgression = defaultMode.progressions[0]

const formatModeLabel = (mode) => {
  if (!mode) return ''
  return `${mode.name}${mode.aka ? ` · ${mode.aka}` : ''}`
}

function App() {
  const [selectedRoot, setSelectedRoot] = useState('C')
  const [selectedScaleId, setSelectedScaleId] = useState(defaultScale.id)
  const [selectedModeId, setSelectedModeId] = useState(defaultMode.id)
  const [selectedProgressionId, setSelectedProgressionId] = useState(
    defaultProgression.id
  )
  const [pressedNotes, setPressedNotes] = useState([])
  const [highlightedNotes, setHighlightedNotes] = useState([])
  const [hoveredChordId, setHoveredChordId] = useState(null)
  const [activeEmotionId, setActiveEmotionId] = useState(defaultProgression.emotion)
  const [isEmotionManual, setIsEmotionManual] = useState(false)

  const selectedScale = useMemo(
    () => findScale(selectedScaleId) ?? defaultScale,
    [selectedScaleId]
  )

  const selectedMode = useMemo(
    () => findMode(selectedScale, selectedModeId) ?? selectedScale.modes[0],
    [selectedScale, selectedModeId]
  )

  const progressionOptions = selectedMode?.progressions ?? []

  const selectedProgression = useMemo(
    () =>
      progressionOptions.find((progression) => progression.id === selectedProgressionId) ??
      progressionOptions[0],
    [progressionOptions, selectedProgressionId]
  )

  const scaleNotes = useMemo(
    () => getScaleNotes(selectedRoot, selectedMode?.intervals ?? []),
    [selectedRoot, selectedMode]
  )

  const scalePitchClasses = useMemo(
    () => scaleNotes.map((note) => getPitchClass(note)),
    [scaleNotes]
  )

  const progressionChords = useMemo(
    () => resolveProgressionChords(selectedRoot, selectedMode, selectedProgression),
    [selectedRoot, selectedMode, selectedProgression]
  )

  useEffect(() => {
    if (!selectedScale.modes.some((mode) => mode.id === selectedModeId)) {
      setSelectedModeId(selectedScale.modes[0].id)
    }
  }, [selectedScale, selectedModeId])

  useEffect(() => {
    if (!selectedMode) return
    if (!selectedMode.progressions.some((progression) => progression.id === selectedProgressionId)) {
      const fallback = selectedMode.progressions[0]
      if (fallback) {
        setSelectedProgressionId(fallback.id)
        setActiveEmotionId(fallback.emotion)
        setIsEmotionManual(false)
      }
    }
  }, [selectedMode, selectedProgressionId])

  useEffect(() => {
    if (selectedProgression && !isEmotionManual) {
      setActiveEmotionId(selectedProgression.emotion)
    }
  }, [selectedProgression, isEmotionManual])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()
      const note = KEY_TO_NOTE[key]
      if (!note) return
      event.preventDefault()
      setPressedNotes((prev) => {
        if (prev.includes(note)) {
          return prev
        }
        playNote(note)
        return [...prev, note]
      })
    }

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase()
      const note = KEY_TO_NOTE[key]
      if (!note) return
      event.preventDefault()
      setPressedNotes((prev) => {
        if (!prev.includes(note)) {
          return prev
        }
        stopNote(note)
        return prev.filter((value) => value !== note)
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      stopAll()
    }
  }, [])

  const handlePressNote = useCallback((note) => {
    setPressedNotes((prev) => {
      if (prev.includes(note)) {
        return prev
      }
      playNote(note)
      return [...prev, note]
    })
  }, [])

  const handleReleaseNote = useCallback((note) => {
    setPressedNotes((prev) => {
      if (!prev.includes(note)) {
        return prev
      }
      stopNote(note)
      return prev.filter((value) => value !== note)
    })
  }, [])

  const handleSelectProgression = useCallback(
    (progressionId) => {
      setSelectedProgressionId(progressionId)
      setIsEmotionManual(false)
    },
    []
  )

  const handlePlayChord = useCallback((chord) => {
    if (!chord) return
    setHighlightedNotes(chord.notes)
    playChord(chord.notes)
    setTimeout(() => setHighlightedNotes([]), 700)
  }, [])

  const handleHoverChord = useCallback((chord) => {
    if (!chord) return
    setHoveredChordId(chord.id)
    setHighlightedNotes(chord.notes)
  }, [])

  const handleLeaveChord = useCallback(() => {
    setHoveredChordId(null)
    setHighlightedNotes([])
  }, [])

  const handleSelectEmotion = useCallback(
    (emotionId) => {
      const matchingProgression = progressionOptions.find(
        (progression) => progression.emotion === emotionId
      )
      if (matchingProgression) {
        setSelectedProgressionId(matchingProgression.id)
        setActiveEmotionId(matchingProgression.emotion)
        setIsEmotionManual(false)
      } else {
        setActiveEmotionId(emotionId)
        setIsEmotionManual(true)
      }
    },
    [progressionOptions]
  )

  const activeProgression = selectedProgression
    ? { ...selectedProgression, available: progressionOptions }
    : null

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <h1>Chord Playground</h1>
          <p className="app-shell__tagline">
            Explore harmony by mixing scales, chord moods, and emotional cues.
          </p>
        </div>
        <div className="selectors">
          <div className="selector">
            <label htmlFor="root-picker">Root</label>
            <select
              id="root-picker"
              value={selectedRoot}
              onChange={(event) => setSelectedRoot(event.target.value)}
            >
              {ROOT_NOTES.map((note) => (
                <option key={note} value={note}>
                  {note}
                </option>
              ))}
            </select>
          </div>
          <div className="selector">
            <label htmlFor="scale-picker">Scale</label>
            <select
              id="scale-picker"
              value={selectedScaleId}
              onChange={(event) => setSelectedScaleId(event.target.value)}
            >
              {SCALES.map((scale) => (
                <option key={scale.id} value={scale.id}>
                  {scale.name}
                </option>
              ))}
            </select>
          </div>
          <div className="selector">
            <label htmlFor="mode-picker">Mode</label>
            <select
              id="mode-picker"
              value={selectedModeId}
              onChange={(event) => setSelectedModeId(event.target.value)}
            >
              {selectedScale.modes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {formatModeLabel(mode)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="app-layout">
        <section className="panel panel--wide">
          <header className="panel__header">
            <div>
              <h2>Interactive Keyboard</h2>
              <p className="panel__subtitle">
                Press your computer keys or tap the piano to hear how the scale paints color.
              </p>
            </div>
            <div className="panel__meta">
              <span className="panel__badge">Scale Notes: {scaleNotes.join(', ')}</span>
            </div>
          </header>
          <KeyboardDisplay
            layout={KEYBOARD_LAYOUT}
            pressedNotes={pressedNotes}
            scalePitchClasses={scalePitchClasses}
            highlightedNotes={highlightedNotes}
            onPress={handlePressNote}
            onRelease={handleReleaseNote}
          />
        </section>

        <ChordSuggestions
          progression={activeProgression}
          chords={progressionChords}
          onSelectProgression={handleSelectProgression}
          onPlayChord={handlePlayChord}
          onHoverChord={handleHoverChord}
          onLeaveChord={handleLeaveChord}
          activeProgressionId={selectedProgression?.id}
          activeEmotionId={activeEmotionId}
          hoveredChordId={hoveredChordId}
        />

        <EmotionLegend
          emotions={EMOTIONS}
          activeEmotionId={activeEmotionId}
          onSelectEmotion={handleSelectEmotion}
        />
      </main>
    </div>
  )
}

export default App

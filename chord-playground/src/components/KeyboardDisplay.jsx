import React from 'react'
import { getPitchClass } from '../data/scales'

const KeyboardDisplay = ({
  layout,
  pressedNotes,
  scalePitchClasses,
  highlightedNotes,
  onPress,
  onRelease
}) => {
  const activeNotes = new Set(pressedNotes)
  const highlightSet = new Set(highlightedNotes)
  const scaleSet = new Set(scalePitchClasses)

  const handlePointerDown = (event, note) => {
    event.preventDefault()
    onPress?.(note)
  }

  const handlePointerUp = (event, note) => {
    event.preventDefault()
    onRelease?.(note)
  }

  return (
    <div className="keyboard" role="group" aria-label="Interactive piano keyboard">
      {layout.map((key) => {
        const pitchClass = getPitchClass(key.note)
        const isPressed = activeNotes.has(key.note)
        const isInScale = scaleSet.has(pitchClass)
        const isHighlighted = highlightSet.has(key.note) || highlightSet.has(pitchClass)

        const keyClassNames = [
          'keyboard__key',
          `keyboard__key--${key.type}`,
          isPressed ? 'keyboard__key--active' : '',
          isInScale ? 'keyboard__key--scale' : '',
          isHighlighted ? 'keyboard__key--highlighted' : ''
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={key.note}
            type="button"
            className={keyClassNames}
            aria-pressed={isPressed}
            onMouseDown={(event) => handlePointerDown(event, key.note)}
            onMouseUp={(event) => handlePointerUp(event, key.note)}
            onMouseLeave={(event) => isPressed && handlePointerUp(event, key.note)}
            onTouchStart={(event) => handlePointerDown(event, key.note)}
            onTouchEnd={(event) => handlePointerUp(event, key.note)}
          >
            <span className="keyboard__note-label">{key.note}</span>
            <span className="keyboard__hint">{key.computerKey.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}

export default KeyboardDisplay

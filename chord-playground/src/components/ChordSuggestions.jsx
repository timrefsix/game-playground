import React from 'react'

const ChordSuggestions = ({
  progression,
  chords,
  onSelectProgression,
  onPlayChord,
  onHoverChord,
  onLeaveChord,
  activeProgressionId,
  activeEmotionId,
  hoveredChordId
}) => {
  if (!progression) {
    return (
      <section className="panel">
        <h2>Chord Suggestions</h2>
        <p>Select a scale and mode to unlock chord ideas.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Chord Suggestions</h2>
          <p className="panel__subtitle">{progression.description}</p>
        </div>
        <div className="panel__meta">
          <span className="panel__badge">{progression.name}</span>
          <label className="panel__label" htmlFor="progression-picker">
            Progression
          </label>
          <select
            id="progression-picker"
            className="panel__select"
            value={activeProgressionId}
            onChange={(event) => onSelectProgression?.(event.target.value)}
          >
            {progression.available.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="chord-grid">
        {chords.map((chord) => {
          const isHovered = chord.id === hoveredChordId
          const isEmotionMatch = chord.emotion && chord.emotion === activeEmotionId

          return (
            <article
              key={chord.id}
              className={`chord-card${isHovered ? ' chord-card--hovered' : ''}${
                isEmotionMatch ? ' chord-card--emotion' : ''
              }`}
              style={{ borderColor: chord.color || undefined }}
              onMouseEnter={() => onHoverChord?.(chord)}
              onMouseLeave={() => onLeaveChord?.()}
            >
              <header className="chord-card__header">
                <h3>{chord.symbol}</h3>
                <span className="chord-card__degree">{chord.degree}</span>
              </header>
              <p className="chord-card__label">{chord.label}</p>
              <p className="chord-card__description">{chord.description}</p>
              <div className="chord-card__notes">
                {chord.notes.map((note) => (
                  <span key={note} className="chord-card__note">
                    {note}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="chord-card__play"
                onClick={() => onPlayChord?.(chord)}
              >
                Play chord
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ChordSuggestions

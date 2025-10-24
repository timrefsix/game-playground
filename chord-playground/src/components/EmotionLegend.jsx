import React from 'react'

const EmotionLegend = ({ emotions, activeEmotionId, onSelectEmotion }) => {
  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Mood Legend</h2>
          <p className="panel__subtitle">
            Each tag links harmony to feeling. Tap a mood to find matching progressions.
          </p>
        </div>
      </header>
      <div className="emotion-legend">
        {emotions.map((emotion) => {
          const isActive = emotion.id === activeEmotionId
          return (
            <button
              key={emotion.id}
              type="button"
              className={`emotion-chip${isActive ? ' emotion-chip--active' : ''}`}
              style={{ borderColor: emotion.color, color: emotion.color }}
              onClick={() => onSelectEmotion?.(emotion.id)}
            >
              <span className="emotion-chip__name">{emotion.name}</span>
              <span className="emotion-chip__description">{emotion.description}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default EmotionLegend

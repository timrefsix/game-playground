import { Level } from '../types'
import './LevelSelector.css'

interface LevelSelectorProps {
  levels: Level[]
  currentLevel: number
  onSelectLevel: (index: number) => void
}

export function LevelSelector({ levels, currentLevel, onSelectLevel }: LevelSelectorProps) {
  return (
    <div className="level-selector">
      {levels.map((level, idx) => (
        <button
          key={level.id}
          onClick={() => onSelectLevel(idx)}
          className={idx === currentLevel ? 'active' : ''}
        >
          Level {level.id}
        </button>
      ))}
    </div>
  )
}

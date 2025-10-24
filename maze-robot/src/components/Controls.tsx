import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react'
import './Controls.css'

interface ControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onStep: () => void
  onReset: () => void
}

export function Controls({ isPlaying, onPlay, onStep, onReset }: ControlsProps) {
  return (
    <div className="controls">
      <button onClick={onPlay} title={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <button onClick={onStep} disabled={isPlaying} title="Step">
        <SkipForward size={20} />
      </button>
      <button onClick={onReset} title="Reset">
        <RotateCcw size={20} />
      </button>
    </div>
  )
}

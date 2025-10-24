import { ChevronRight } from 'lucide-react'
import './Message.css'

interface MessageProps {
  text: string
  isSuccess: boolean
  showNextLevel?: boolean
  onNextLevel?: () => void
}

export function Message({ text, isSuccess, showNextLevel, onNextLevel }: MessageProps) {
  return (
    <div className={`message ${isSuccess ? 'success' : 'error'}`}>
      {text}
      {showNextLevel && onNextLevel && (
        <button onClick={onNextLevel} className="next-level-btn" aria-label="Next Level">
          Next Level <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}

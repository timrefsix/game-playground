import './LevelInfo.css'

interface LevelInfoProps {
  name: string
  description: string
}

export function LevelInfo({ name, description }: LevelInfoProps) {
  return (
    <div className="level-info">
      <h2>{name}</h2>
      <p>{description}</p>
    </div>
  )
}

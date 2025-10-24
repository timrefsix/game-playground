import { Maze, Position, Direction, CellType } from '../types'
import './MazeDisplay.css'

interface MazeDisplayProps {
  maze: Maze
  robotPos: Position
  robotDir: Direction
}

export function MazeDisplay({ maze, robotPos, robotDir }: MazeDisplayProps) {
  const getCellClass = (cell: CellType): string => {
    switch (cell) {
      case CellType.WALL:
        return 'wall'
      case CellType.START:
        return 'start'
      case CellType.END:
        return 'end'
      default:
        return 'empty'
    }
  }

  const getRobotRotation = (): number => {
    return robotDir * 90
  }

  return (
    <div className="maze-container">
      <div className="maze">
        {maze.map((row, y) => (
          <div key={y} className="maze-row">
            {row.map((cell, x) => (
              <div key={`${x}-${y}`} className={`cell ${getCellClass(cell)}`}>
                {robotPos.x === x && robotPos.y === y && (
                  <div
                    className="robot"
                    style={{ '--robot-rotation': `rotate(${getRobotRotation()}deg)` } as React.CSSProperties}
                  >
                    ▲
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

import { Maze, Position, Direction, CellType } from '../types'
import './MazeDisplay.css'

interface MazeDisplayProps {
  maze: Maze
  robotPos: Position
  robotDir: Direction
  visited?: Position[]
  fogOfWar?: boolean
}

export function MazeDisplay({ maze, robotPos, robotDir, visited = [], fogOfWar = false }: MazeDisplayProps) {
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

  const visitedSet = new Set(visited.map(pos => `${pos.x},${pos.y}`))

  return (
    <div className="maze-container">
      <div className="maze">
        {maze.map((row, y) => (
          <div key={y} className="maze-row">
            {row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`cell ${
                  fogOfWar &&
                  !visitedSet.has(`${x},${y}`) &&
                  cell !== CellType.START &&
                  cell !== CellType.END
                    ? 'fog'
                    : getCellClass(cell)
                }`}
              >
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

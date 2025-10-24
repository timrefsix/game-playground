// Cell types
export enum CellType {
  EMPTY = 0,
  WALL = 1,
  START = 2,
  END = 3,
}

// Robot directions (0=North, 1=East, 2=South, 3=West)
export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

export interface Position {
  x: number
  y: number
}

export type Maze = CellType[][]

export interface Level {
  id: number
  name: string
  description: string
  maze: Maze
  startPos: Position
  startDir: Direction
  fogOfWar?: boolean
}

export interface RobotState {
  pos: Position
  dir: Direction
  path: Position[]
  completed: boolean
  error: string | null
}

import { Maze, Position, Direction, CellType } from './types'
import { Parser } from './Parser'
import { ASTNode, BlockNode, CommandNode } from './AST'

export class RobotInterpreter {
  private maze: Maze
  public pos: Position
  public dir: Direction
  public path: Position[]
  public completed: boolean
  public error: string | null
  private sensorResults: Map<string, boolean>

  constructor(maze: Maze, startPos: Position, startDir: Direction) {
    this.maze = maze
    this.pos = { ...startPos }
    this.dir = startDir
    this.path = [{ ...startPos }]
    this.completed = false
    this.error = null
    this.sensorResults = new Map()
  }

  private canMove(x: number, y: number): boolean {
    if (y < 0 || y >= this.maze.length || x < 0 || x >= this.maze[0].length) {
      return false
    }
    return this.maze[y][x] !== CellType.WALL
  }

  private moveForward(): boolean {
    const dx = [0, 1, 0, -1][this.dir]
    const dy = [-1, 0, 1, 0][this.dir]
    const newX = this.pos.x + dx
    const newY = this.pos.y + dy

    if (!this.canMove(newX, newY)) {
      this.error = "Can't move forward - hit a wall!"
      return false
    }

    this.pos.x = newX
    this.pos.y = newY
    this.path.push({ ...this.pos })

    // Check if reached goal
    if (this.maze[newY][newX] === CellType.END) {
      this.completed = true
    }

    return true
  }

  private turnLeft(): boolean {
    this.dir = ((this.dir + 3) % 4) as Direction
    return true
  }

  private turnRight(): boolean {
    this.dir = ((this.dir + 1) % 4) as Direction
    return true
  }

  private getRelativeDirection(relative: string): Direction {
    const relativeMap: { [key: string]: number } = {
      'front': 0,
      'right': 1,
      'back': 2,
      'left': 3
    }
    const offset = relativeMap[relative] || 0
    return ((this.dir + offset) % 4) as Direction
  }

  private isWall(x: number, y: number): boolean {
    if (y < 0 || y >= this.maze.length || x < 0 || x >= this.maze[0].length) {
      return true
    }
    return this.maze[y][x] === CellType.WALL
  }

  public sensor(direction: string): boolean {
    const dir = direction.toLowerCase().trim()
    const absoluteDir = this.getRelativeDirection(dir)

    const dx = [0, 1, 0, -1][absoluteDir]
    const dy = [-1, 0, 1, 0][absoluteDir]
    const checkX = this.pos.x + dx
    const checkY = this.pos.y + dy

    const result = this.isWall(checkX, checkY)
    this.sensorResults.set(dir, result)
    return result
  }

  public getLastSensorResult(direction: string): boolean | undefined {
    return this.sensorResults.get(direction.toLowerCase().trim())
  }

  public execute(command: string): boolean {
    if (this.error || this.completed) return false

    const cmd = command.toLowerCase().trim()

    switch (cmd) {
      case 'forward':
      case 'move forward':
      case 'move':
        return this.moveForward()
      case 'turn left':
      case 'left':
        return this.turnLeft()
      case 'turn right':
      case 'right':
        return this.turnRight()
      default:
        this.error = `Unknown command: ${command}`
        return false
    }
  }
}

// Parse code into commands, expanding repeat blocks and conditionals
export function parseCode(code: string, interpreter?: RobotInterpreter): string[] {
  if (!code.trim()) {
    return []
  }

  const parser = new Parser(code)
  const ast = parser.parse()
  return flattenAST(ast, interpreter)
}

function flattenAST(ast: BlockNode, interpreter?: RobotInterpreter): string[] {
  const commands: string[] = []

  const walk = (node: ASTNode) => {
    switch (node.type) {
      case 'command':
        commands.push(mapCommand(node))
        break
      case 'repeat':
        for (let i = 0; i < node.count; i++) {
          node.body.forEach(walk)
        }
        break
      case 'if':
        if (!interpreter) {
          node.body.forEach(walk)
          break
        }
        const sensorResult = interpreter.sensor(node.condition.direction)
        const condition = node.condition.negated ? !sensorResult : sensorResult
        if (condition) {
          node.body.forEach(walk)
        }
        break
      case 'block':
        node.statements.forEach(walk)
        break
    }
  }

  ast.statements.forEach(walk)
  return commands
}

function mapCommand(node: CommandNode): string {
  switch (node.command) {
    case 'forward':
      return 'forward'
    case 'turn_left':
      return 'turn left'
    case 'turn_right':
      return 'turn right'
    default:
      return node.command
  }
}

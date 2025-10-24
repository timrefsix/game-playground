import { Maze, Position, Direction, CellType } from './types'

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
  const lines = code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))

  const commands: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Check for repeat command: "repeat N {" or "repeat N"
    const repeatMatch = line.match(/^repeat\s+(\d+)\s*\{?$/)

    // Check for if command: "if sensor direction {" or "if not sensor direction {"
    const ifMatch = line.match(/^if\s+(not\s+)?sensor\s+(front|back|left|right)\s*\{?$/)

    if (repeatMatch) {
      const count = parseInt(repeatMatch[1], 10)
      const repeatCommands: string[] = []
      i++

      // Find all commands until closing brace or end
      let braceCount = line.includes('{') ? 1 : 0

      while (i < lines.length) {
        const currentLine = lines[i]

        // Check for closing brace
        if (currentLine === '}' && braceCount > 0) {
          braceCount--
          i++
          break
        }

        // Check for opening brace
        if (currentLine.includes('{')) {
          braceCount++
        }

        // If no braces mode and we hit another repeat or unindented line, break
        if (braceCount === 0 && (currentLine.startsWith('repeat') || !currentLine.startsWith(' '))) {
          break
        }

        // Add command if it's not empty
        if (currentLine && currentLine !== '{' && currentLine !== '}') {
          repeatCommands.push(currentLine)
        }

        i++
      }

      // Expand the repeat block
      // Check if the repeat contains conditionals
      const hasConditionals = repeatCommands.some(cmd =>
        /^if\s+(not\s+)?sensor\s+(front|back|left|right)\s*\{?$/.test(cmd)
      )

      if (hasConditionals) {
        // If there are conditionals, we need special handling
        // Return special repeat markers that will be expanded during execution
        for (let j = 0; j < count; j++) {
          commands.push(`__REPEAT_ITERATION_START__`)
          commands.push(...repeatCommands)
          commands.push(`__REPEAT_ITERATION_END__`)
        }
      } else {
        // No conditionals, safe to expand normally
        for (let j = 0; j < count; j++) {
          // Recursively parse the repeat body to handle nested structures
          const repeatBodyCode = repeatCommands.join('\n')
          const parsedRepeatBody = parseCode(repeatBodyCode, interpreter)
          commands.push(...parsedRepeatBody)
        }
      }
    } else if (ifMatch) {
      const isNot = !!ifMatch[1]
      const direction = ifMatch[2]
      const conditionalCommands: string[] = []
      i++

      // Find all commands until closing brace
      let braceCount = line.includes('{') ? 1 : 0

      while (i < lines.length) {
        const currentLine = lines[i]

        // Check for closing brace
        if (currentLine === '}' && braceCount > 0) {
          braceCount--
          i++
          break
        }

        // Check for opening brace
        if (currentLine.includes('{')) {
          braceCount++
        }

        // Add command if it's not empty
        if (currentLine && currentLine !== '{' && currentLine !== '}') {
          conditionalCommands.push(currentLine)
        }

        i++
      }

      // Evaluate condition using interpreter if provided
      if (interpreter) {
        const sensorResult = interpreter.sensor(direction)
        const condition = isNot ? !sensorResult : sensorResult

        // Only add commands if condition is true
        if (condition) {
          commands.push(...conditionalCommands)
        }
      } else {
        // If no interpreter, add commands anyway (for static analysis)
        commands.push(...conditionalCommands)
      }
    } else {
      commands.push(line)
      i++
    }
  }

  return commands
}

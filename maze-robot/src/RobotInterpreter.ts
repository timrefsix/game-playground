import { Maze, Position, Direction, CellType } from './types'
import { Parser } from './Parser'
import { ASTNode, BlockNode, CommandNode, FunctionNode, ExpressionNode } from './AST'

export class RobotInterpreter {
  private maze: Maze
  public pos: Position
  public dir: Direction
  public path: Position[]
  public completed: boolean
  public error: string | null
  private sensorResults: Map<string, boolean>
  private endPos: Position
  private visited: Set<string>

  constructor(maze: Maze, startPos: Position, startDir: Direction) {
    this.maze = maze
    this.pos = { ...startPos }
    this.dir = startDir
    this.path = [{ ...startPos }]
    this.completed = false
    this.error = null
    this.sensorResults = new Map()
    this.endPos = this.findEndPosition()
    this.visited = new Set([this.posToKey(this.pos)])
  }

  private posToKey(position: Position): string {
    return `${position.x},${position.y}`
  }

  private findEndPosition(): Position {
    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[y].length; x++) {
        if (this.maze[y][x] === CellType.END) {
          return { x, y }
        }
      }
    }
    throw new Error('Maze is missing an end position')
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
    this.visited.add(this.posToKey(this.pos))

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

  private computeDistance(start: Position): number {
    const queue: Array<{ x: number; y: number; distance: number }> = [{
      x: start.x,
      y: start.y,
      distance: 0
    }]
    const visited = new Set<string>([this.posToKey(start)])

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) {
        break
      }

      if (current.x === this.endPos.x && current.y === this.endPos.y) {
        return current.distance
      }

      const deltas = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }
      ]

      for (const { dx, dy } of deltas) {
        const nextX = current.x + dx
        const nextY = current.y + dy
        const key = `${nextX},${nextY}`

        if (visited.has(key)) {
          continue
        }

        if (!this.canMove(nextX, nextY)) {
          continue
        }

        visited.add(key)
        queue.push({ x: nextX, y: nextY, distance: current.distance + 1 })
      }
    }

    return Number.POSITIVE_INFINITY
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

  public isCloser(direction: string): boolean {
    const dir = direction.toLowerCase().trim()
    const absoluteDir = this.getRelativeDirection(dir)

    const dx = [0, 1, 0, -1][absoluteDir]
    const dy = [-1, 0, 1, 0][absoluteDir]
    const checkX = this.pos.x + dx
    const checkY = this.pos.y + dy

    if (!this.canMove(checkX, checkY)) {
      return false
    }

    const currentDistance = this.computeDistance(this.pos)
    const nextDistance = this.computeDistance({ x: checkX, y: checkY })

    if (!Number.isFinite(currentDistance) || !Number.isFinite(nextDistance)) {
      return false
    }

    return nextDistance < currentDistance
  }

  public getDistanceToGoal(): number {
    const distance = this.computeDistance(this.pos)
    if (!Number.isFinite(distance)) {
      return -1
    }
    return distance
  }

  public getVisitedPositions(): Position[] {
    return Array.from(this.visited.values()).map(key => {
      const [x, y] = key.split(',').map(Number)
      return { x, y }
    })
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
  const functions = new Map<string, FunctionNode>()
  const envStack: Map<string, number>[] = [new Map()]

  const evaluateExpression = (expr: ExpressionNode): number => {
    if (expr.type === 'number_literal') {
      return expr.value
    }

    if (expr.type === 'variable') {
      for (let i = envStack.length - 1; i >= 0; i--) {
        const env = envStack[i]
        if (env.has(expr.name)) {
          const value = env.get(expr.name)
          return value ?? 0
        }
      }
      throw new Error(`Undefined variable '${expr.name}'`)
    }

    throw new Error('Unsupported expression')
  }

  const assignVariable = (name: string, value: number) => {
    envStack[envStack.length - 1].set(name, value)
  }

  const withScope = <T>(callback: () => T, initialValues?: Map<string, number>): T => {
    const scope = initialValues ? new Map(initialValues) : new Map<string, number>()
    envStack.push(scope)
    try {
      return callback()
    } finally {
      envStack.pop()
    }
  }

  const walkNode = (node: ASTNode) => {
    switch (node.type) {
      case 'command':
        commands.push(mapCommand(node))
        break
      case 'repeat': {
        const count = Math.floor(evaluateExpression(node.count))
        if (count < 0) {
          throw new Error('repeat count must be non-negative')
        }
        for (let i = 0; i < count; i++) {
          node.body.forEach(walkNode)
        }
        break
      }
      case 'if': {
        if (!interpreter) {
          node.body.forEach(walkNode)
          break
        }
        let conditionResult = false
        if (node.condition.type === 'sensor') {
          const sensorResult = interpreter.sensor(node.condition.direction)
          conditionResult = node.condition.negated ? !sensorResult : sensorResult
        } else if (node.condition.type === 'closer') {
          const closerResult = interpreter.isCloser(node.condition.direction)
          conditionResult = node.condition.negated ? !closerResult : closerResult
        }
        if (conditionResult) {
          node.body.forEach(walkNode)
        }
        break
      }
      case 'block':
        node.statements.forEach(walkNode)
        break
      case 'set': {
        const value = evaluateExpression(node.value)
        assignVariable(node.name, value)
        break
      }
      case 'function':
        functions.set(node.name, node)
        break
      case 'call': {
        const func = functions.get(node.name)
        if (!func) {
          throw new Error(`Unknown function '${node.name}'`)
        }
        if (func.params.length !== node.args.length) {
          throw new Error(`Function '${func.name}' expected ${func.params.length} argument(s) but received ${node.args.length}`)
        }
        const initialValues = new Map<string, number>()
        func.params.forEach((param, index) => {
          initialValues.set(param, evaluateExpression(node.args[index]))
        })
        withScope(() => {
          func.body.forEach(walkNode)
        }, initialValues)
        break
      }
    }
  }

  ast.statements.forEach(statement => {
    if (statement.type === 'function') {
      functions.set(statement.name, statement as FunctionNode)
    }
  })

  ast.statements.forEach(walkNode)
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

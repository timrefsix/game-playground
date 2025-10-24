import { describe, it, expect } from 'vitest'
import { Parser } from './Parser'
import { ASTExecutor } from './ASTExecutor'
import { RobotInterpreter } from './RobotInterpreter'
import { CellType, Direction } from './types'

describe('Level 2 Debug', () => {
  it('should complete Level 2 with correct solution', () => {
    // Level 2 maze
    const maze = [
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.START, CellType.EMPTY, CellType.EMPTY, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.EMPTY, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.EMPTY, CellType.EMPTY, CellType.END, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
    ]
    const interpreter = new RobotInterpreter(maze, { x: 1, y: 1 }, Direction.EAST)

    const code = `
      (forward)
      (forward)
      (turn right)
      (forward)
      (forward)
      (turn left)
      (forward)
      (forward)
    `

    const parser = new Parser(code)
    const ast = parser.parse()
    const executor = new ASTExecutor(interpreter, ast)

    console.log('Starting position:', interpreter.pos, 'direction:', interpreter.dir)

    let step = 1
    while (executor.hasMore() && step <= 20) {
      executor.executeStep()
      console.log(`Step ${step}: pos (${interpreter.pos.x}, ${interpreter.pos.y}), dir ${interpreter.dir}`)
      if (interpreter.error) {
        console.log(`Error at step ${step}: ${interpreter.error}`)
        break
      }
      if (interpreter.completed) {
        console.log(`Completed at step ${step}`)
        break
      }
      step++
    }

    expect(interpreter.error).toBe(null)
    expect(interpreter.completed).toBe(true)
  })
})

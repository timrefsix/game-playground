import { describe, it, expect } from 'vitest'
import { Parser } from './Parser'
import { ASTExecutor } from './ASTExecutor'
import { RobotInterpreter } from './RobotInterpreter'
import { CellType, Direction } from './types'

describe('ASTExecutor', () => {
  it('should execute simple forward commands', () => {
    const maze = [
      [CellType.START, CellType.PATH, CellType.PATH, CellType.END, CellType.WALL]
    ]
    const interpreter = new RobotInterpreter(maze, { x: 0, y: 0 }, Direction.EAST)

    const parser = new Parser('forward\nforward\nforward')
    const ast = parser.parse()
    const executor = new ASTExecutor(interpreter, ast)

    // Execute all steps
    let step = 1
    while (executor.hasMore() && step <= 10) {
      executor.executeStep()
      step++
    }

    expect(interpreter.completed).toBe(true)
    expect(interpreter.error).toBe(null)
  })

  it('should execute Level 2 solution', () => {
    // Level 2 maze (actual maze from levels.ts)
    const maze = [
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.START, CellType.PATH, CellType.PATH, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.PATH, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.PATH, CellType.PATH, CellType.END, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
    ]
    const interpreter = new RobotInterpreter(maze, { x: 1, y: 1 }, Direction.EAST)

    const code = `forward
forward
forward
turn right
forward
forward
forward`

    const parser = new Parser(code)
    const ast = parser.parse()
    const executor = new ASTExecutor(interpreter, ast)

    // Execute all steps
    let step = 1
    while (executor.hasMore() && step <= 20) {
      const result = executor.executeStep()
      if (interpreter.error) {
        console.log(`Error at step ${step}: ${interpreter.error}`)
        console.log(`Robot position: (${interpreter.pos.x}, ${interpreter.pos.y}), direction: ${interpreter.dir}`)
        break
      }
      step++
    }

    expect(interpreter.error).toBe(null)
    expect(interpreter.completed).toBe(true)
  })

  it('should handle repeat blocks', () => {
    const maze = [
      [CellType.START, CellType.PATH, CellType.PATH, CellType.END, CellType.WALL]
    ]
    const interpreter = new RobotInterpreter(maze, { x: 0, y: 0 }, Direction.EAST)

    const parser = new Parser('repeat 3 {\n  forward\n}')
    const ast = parser.parse()
    const executor = new ASTExecutor(interpreter, ast)

    let step = 1
    while (executor.hasMore() && step <= 10) {
      executor.executeStep()
      step++
    }

    expect(interpreter.completed).toBe(true)
    expect(interpreter.error).toBe(null)
  })
})

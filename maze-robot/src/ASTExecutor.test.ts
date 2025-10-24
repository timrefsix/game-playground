import { describe, it, expect } from 'vitest'
import { ASTExecutor } from './ASTExecutor'
import { RobotInterpreter } from './RobotInterpreter'
import { Parser } from './Parser'
import { CellType, Direction } from './types'

describe('ASTExecutor', () => {
  it('should execute simple forward commands', () => {
    const maze = [
      [CellType.START, CellType.EMPTY, CellType.EMPTY, CellType.END, CellType.WALL]
    ]
    const interpreter = new RobotInterpreter(maze, { x: 0, y: 0 }, Direction.EAST)

    const parser = new Parser('(forward)\n(forward)\n(forward)')
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

    // Execute all steps
    let step = 1
    while (executor.hasMore() && step <= 20) {
      executor.executeStep()
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
      [CellType.START, CellType.EMPTY, CellType.EMPTY, CellType.END, CellType.WALL]
    ]
    const interpreter = new RobotInterpreter(maze, { x: 0, y: 0 }, Direction.EAST)

    const parser = new Parser('(repeat 3 (forward))')
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

  it('should execute repeat counts from variables', () => {
    const maze = [
      [CellType.START, CellType.EMPTY, CellType.EMPTY, CellType.EMPTY, CellType.END]
    ]
    const interpreter = new RobotInterpreter(maze, { x: 0, y: 0 }, Direction.EAST)

    const code = `
      (set steps 4)
      (repeat steps (forward))
    `
    const parser = new Parser(code)
    const ast = parser.parse()
    const executor = new ASTExecutor(interpreter, ast)

    let step = 1
    while (executor.hasMore() && step <= 10) {
      executor.executeStep()
      step++
    }

    expect(interpreter.pos.x).toBe(4)
    expect(interpreter.completed).toBe(true)
    expect(interpreter.error).toBeNull()
  })

  it('should execute function calls with parameters', () => {
    const maze = [
      [CellType.START, CellType.EMPTY, CellType.EMPTY, CellType.EMPTY, CellType.END]
    ]
    const interpreter = new RobotInterpreter(maze, { x: 0, y: 0 }, Direction.EAST)

    const code = `
      (function walk (n)
        (repeat n (forward))
      )
      (set steps 4)
      (walk steps)
    `
    const parser = new Parser(code)
    const ast = parser.parse()
    const executor = new ASTExecutor(interpreter, ast)

    let step = 1
    while (executor.hasMore() && step <= 15) {
      executor.executeStep()
      step++
    }

    expect(interpreter.pos.x).toBe(4)
    expect(interpreter.completed).toBe(true)
    expect(interpreter.error).toBeNull()
  })

  it('should evaluate distance-to-end expressions', () => {
    const maze = [
      [CellType.START, CellType.EMPTY, CellType.EMPTY, CellType.EMPTY, CellType.END]
    ]
    const interpreter = new RobotInterpreter(maze, { x: 0, y: 0 }, Direction.EAST)

    const code = `
      (set steps (distance-to-end))
      (repeat steps (forward))
    `

    const parser = new Parser(code)
    const ast = parser.parse()
    const executor = new ASTExecutor(interpreter, ast)

    // distance-to-end should return the number of steps remaining on the shortest path
    expect(interpreter.getDistanceToGoal()).toBe(4)
    let step = 1
    while (executor.hasMore() && step <= 15) {
      executor.executeStep()
      step++
    }

    expect(interpreter.completed).toBe(true)
    expect(interpreter.error).toBeNull()
  })

  it('should use closer conditions to choose a path', () => {
    const maze = [
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.START, CellType.EMPTY, CellType.WALL],
      [CellType.WALL, CellType.EMPTY, CellType.EMPTY, CellType.WALL],
      [CellType.WALL, CellType.EMPTY, CellType.END, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
    ]
    const interpreter = new RobotInterpreter(maze, { x: 1, y: 1 }, Direction.EAST)

    const code = `
      (forward)
      (if (closer right)
        (turn right)
        (forward)
      )
      (repeat 2 (forward))
    `

    const parser = new Parser(code)
    const ast = parser.parse()
    const executor = new ASTExecutor(interpreter, ast)

    let step = 1
    while (executor.hasMore() && step <= 20) {
      executor.executeStep()
      step++
    }

    expect(interpreter.completed).toBe(true)
    expect(interpreter.error).toBeNull()
    expect(interpreter.pos).toEqual({ x: 2, y: 3 })
  })
})

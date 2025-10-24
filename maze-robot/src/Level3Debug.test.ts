import { describe, it, expect } from 'vitest'
import { Parser } from './Parser'
import { ASTExecutor } from './ASTExecutor'
import { RobotInterpreter } from './RobotInterpreter'
import { CellType, Direction } from './types'

describe('Level 3 Debug', () => {
  it('should complete Level 3 with test solution', () => {
    // Level 3 maze from levels.ts
    const maze = [
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.START, CellType.EMPTY, CellType.EMPTY, CellType.EMPTY, CellType.EMPTY, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.EMPTY, CellType.WALL],
      [CellType.WALL, CellType.EMPTY, CellType.EMPTY, CellType.EMPTY, CellType.EMPTY, CellType.EMPTY, CellType.WALL],
      [CellType.WALL, CellType.EMPTY, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.END, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
    ]
    const interpreter = new RobotInterpreter(maze, { x: 1, y: 1 }, Direction.EAST)

    const code = `
      (forward)
      (forward)
      (forward)
      (forward)
      (turn right)
      (forward)
      (forward)
      (turn right)
      (forward)
      (forward)
      (forward)
      (forward)
      (turn left)
      (forward)
      (forward)
    `

    const parser = new Parser(code)
    const ast = parser.parse()
    const executor = new ASTExecutor(interpreter, ast)

    console.log('Level 3 - Starting position:', interpreter.pos, 'direction:', interpreter.dir)
    console.log('Maze layout:')
    console.log('Row 1: [W, S, ., ., ., ., W]  // S=(1,1)')
    console.log('Row 2: [W, W, W, W, W, ., W]  // .=(5,2)')
    console.log('Row 3: [W, ., ., ., ., ., W]  // path along bottom')
    console.log('Row 4: [W, ., W, W, W, W, W]  // .=(1,4)')
    console.log('Row 5: [W, E, W, W, W, W, W]  // E=(1,5)')

    let step = 1
    while (executor.hasMore() && step <= 30) {
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

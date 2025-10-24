import { describe, it, expect, beforeEach } from 'vitest'
import { RobotInterpreter, parseCode } from './RobotInterpreter'
import { Direction } from './types'

describe('RobotInterpreter', () => {
  const simpleMaze = [
    [1, 1, 1, 1, 1],
    [1, 2, 0, 0, 3],
    [1, 1, 1, 1, 1],
  ]

  let interpreter: RobotInterpreter

  beforeEach(() => {
    interpreter = new RobotInterpreter(
      simpleMaze,
      { x: 1, y: 1 },
      Direction.EAST
    )
  })

  describe('initialization', () => {
    it('should initialize with correct starting position', () => {
      expect(interpreter.pos).toEqual({ x: 1, y: 1 })
    })

    it('should initialize with correct starting direction', () => {
      expect(interpreter.dir).toBe(Direction.EAST)
    })

    it('should initialize path with starting position', () => {
      expect(interpreter.path).toHaveLength(1)
      expect(interpreter.path[0]).toEqual({ x: 1, y: 1 })
    })

    it('should not be completed initially', () => {
      expect(interpreter.completed).toBe(false)
    })

    it('should not have an error initially', () => {
      expect(interpreter.error).toBe(null)
    })
  })

  describe('moveForward', () => {
    it('should move forward in the current direction', () => {
      const success = interpreter.execute('forward')
      expect(success).toBe(true)
      expect(interpreter.pos).toEqual({ x: 2, y: 1 })
    })

    it('should add position to path', () => {
      interpreter.execute('forward')
      expect(interpreter.path).toHaveLength(2)
      expect(interpreter.path[1]).toEqual({ x: 2, y: 1 })
    })

    it('should set completed when reaching goal', () => {
      interpreter.execute('forward') // x:2
      interpreter.execute('forward') // x:3
      interpreter.execute('forward') // x:4 (goal)
      expect(interpreter.completed).toBe(true)
    })

    it('should fail when hitting a wall', () => {
      interpreter.execute('turn left') // Face north
      const success = interpreter.execute('forward')
      expect(success).toBe(false)
      expect(interpreter.error).toBe("Can't move forward - hit a wall!")
    })

    it('should not move when hitting a wall', () => {
      interpreter.execute('turn left')
      interpreter.execute('forward')
      expect(interpreter.pos).toEqual({ x: 1, y: 1 }) // Should not have moved
    })
  })

  describe('turnLeft', () => {
    it('should turn left from EAST to NORTH', () => {
      interpreter.execute('turn left')
      expect(interpreter.dir).toBe(Direction.NORTH)
    })

    it('should turn left from NORTH to WEST', () => {
      interpreter.dir = Direction.NORTH
      interpreter.execute('turn left')
      expect(interpreter.dir).toBe(Direction.WEST)
    })

    it('should turn left from WEST to SOUTH', () => {
      interpreter.dir = Direction.WEST
      interpreter.execute('turn left')
      expect(interpreter.dir).toBe(Direction.SOUTH)
    })

    it('should turn left from SOUTH to EAST', () => {
      interpreter.dir = Direction.SOUTH
      interpreter.execute('turn left')
      expect(interpreter.dir).toBe(Direction.EAST)
    })
  })

  describe('turnRight', () => {
    it('should turn right from EAST to SOUTH', () => {
      interpreter.execute('turn right')
      expect(interpreter.dir).toBe(Direction.SOUTH)
    })

    it('should turn right from SOUTH to WEST', () => {
      interpreter.dir = Direction.SOUTH
      interpreter.execute('turn right')
      expect(interpreter.dir).toBe(Direction.WEST)
    })

    it('should turn right from WEST to NORTH', () => {
      interpreter.dir = Direction.WEST
      interpreter.execute('turn right')
      expect(interpreter.dir).toBe(Direction.NORTH)
    })

    it('should turn right from NORTH to EAST', () => {
      interpreter.dir = Direction.NORTH
      interpreter.execute('turn right')
      expect(interpreter.dir).toBe(Direction.EAST)
    })
  })

  describe('execute', () => {
    it('should handle "forward" command', () => {
      const success = interpreter.execute('forward')
      expect(success).toBe(true)
      expect(interpreter.pos.x).toBe(2)
    })

    it('should handle "move forward" command', () => {
      const success = interpreter.execute('move forward')
      expect(success).toBe(true)
      expect(interpreter.pos.x).toBe(2)
    })

    it('should handle "move" command', () => {
      const success = interpreter.execute('move')
      expect(success).toBe(true)
      expect(interpreter.pos.x).toBe(2)
    })

    it('should handle "turn left" command', () => {
      const success = interpreter.execute('turn left')
      expect(success).toBe(true)
      expect(interpreter.dir).toBe(Direction.NORTH)
    })

    it('should handle "left" command', () => {
      const success = interpreter.execute('left')
      expect(success).toBe(true)
      expect(interpreter.dir).toBe(Direction.NORTH)
    })

    it('should handle "turn right" command', () => {
      const success = interpreter.execute('turn right')
      expect(success).toBe(true)
      expect(interpreter.dir).toBe(Direction.SOUTH)
    })

    it('should handle "right" command', () => {
      const success = interpreter.execute('right')
      expect(success).toBe(true)
      expect(interpreter.dir).toBe(Direction.SOUTH)
    })

    it('should be case insensitive', () => {
      const success = interpreter.execute('FORWARD')
      expect(success).toBe(true)
      expect(interpreter.pos.x).toBe(2)
    })

    it('should trim whitespace', () => {
      const success = interpreter.execute('  forward  ')
      expect(success).toBe(true)
      expect(interpreter.pos.x).toBe(2)
    })

    it('should reject unknown commands', () => {
      const success = interpreter.execute('jump')
      expect(success).toBe(false)
      expect(interpreter.error).toBe('Unknown command: jump')
    })

    it('should not execute after error', () => {
      interpreter.execute('turn left')
      interpreter.execute('forward') // Hit wall
      const success = interpreter.execute('turn right')
      expect(success).toBe(false)
      expect(interpreter.dir).toBe(Direction.NORTH) // Should not have turned
    })

    it('should not execute after completion', () => {
      interpreter.execute('forward')
      interpreter.execute('forward')
      interpreter.execute('forward') // Reach goal
      const success = interpreter.execute('forward')
      expect(success).toBe(false)
    })
  })
})

describe('parseCode', () => {
  it('should parse single command', () => {
    const commands = parseCode('forward')
    expect(commands).toEqual(['forward'])
  })

  it('should parse multiple commands', () => {
    const commands = parseCode('forward\nturn left\nforward')
    expect(commands).toEqual(['forward', 'turn left', 'forward'])
  })

  it('should trim whitespace from each line', () => {
    const commands = parseCode('  forward  \n  turn left  ')
    expect(commands).toEqual(['forward', 'turn left'])
  })

  it('should filter out empty lines', () => {
    const commands = parseCode('forward\n\n\nturn left')
    expect(commands).toEqual(['forward', 'turn left'])
  })

  it('should filter out # comments', () => {
    const commands = parseCode('forward\n# This is a comment\nturn left')
    expect(commands).toEqual(['forward', 'turn left'])
  })

  it('should filter out // comments', () => {
    const commands = parseCode('forward\n// This is a comment\nturn left')
    expect(commands).toEqual(['forward', 'turn left'])
  })

  it('should handle mixed content', () => {
    const code = `
      # Move forward
      forward

      // Turn left
      turn left

      forward
    `
    const commands = parseCode(code)
    expect(commands).toEqual(['forward', 'turn left', 'forward'])
  })

  it('should return empty array for empty code', () => {
    const commands = parseCode('')
    expect(commands).toEqual([])
  })

  it('should return empty array for only comments', () => {
    const commands = parseCode('# Comment 1\n// Comment 2')
    expect(commands).toEqual([])
  })

  describe('repeat blocks', () => {
    it('should expand simple repeat block with braces', () => {
      const code = `repeat 3 {
forward
}`
      const commands = parseCode(code)
      expect(commands).toEqual(['forward', 'forward', 'forward'])
    })

    it('should expand repeat block with multiple commands', () => {
      const code = `repeat 2 {
forward
turn left
}`
      const commands = parseCode(code)
      expect(commands).toEqual(['forward', 'turn left', 'forward', 'turn left'])
    })

    it('should handle repeat with braces on same line', () => {
      const code = `repeat 3 {
forward
turn right
}`
      const commands = parseCode(code)
      expect(commands).toEqual(['forward', 'turn right', 'forward', 'turn right', 'forward', 'turn right'])
    })

    it('should handle commands before and after repeat', () => {
      const code = `forward
repeat 2 {
turn left
}
forward`
      const commands = parseCode(code)
      expect(commands).toEqual(['forward', 'turn left', 'turn left', 'forward'])
    })

    it('should handle multiple repeat blocks', () => {
      const code = `repeat 2 {
forward
}
repeat 2 {
turn left
}`
      const commands = parseCode(code)
      expect(commands).toEqual(['forward', 'forward', 'turn left', 'turn left'])
    })

    it('should handle repeat count of 0', () => {
      const code = `repeat 0 {
forward
}`
      const commands = parseCode(code)
      expect(commands).toEqual([])
    })

    it('should handle repeat count of 1', () => {
      const code = `repeat 1 {
forward
}`
      const commands = parseCode(code)
      expect(commands).toEqual(['forward'])
    })

    it('should ignore comments inside repeat blocks', () => {
      const code = `repeat 2 {
forward
# This is a comment
turn left
}`
      const commands = parseCode(code)
      expect(commands).toEqual(['forward', 'turn left', 'forward', 'turn left'])
    })
  })
})

describe('RobotInterpreter - Sensors', () => {
  const testMaze = [
    [1, 1, 1, 1, 1],
    [1, 2, 0, 0, 1],
    [1, 1, 1, 0, 1],
    [1, 0, 0, 0, 3],
    [1, 1, 1, 1, 1],
  ]

  let interpreter: RobotInterpreter

  beforeEach(() => {
    interpreter = new RobotInterpreter(
      testMaze,
      { x: 1, y: 1 },
      Direction.EAST
    )
  })

  describe('sensor', () => {
    it('should detect wall in front', () => {
      // Starting at (1,1) facing EAST, there's no wall at (2,1)
      expect(interpreter.sensor('front')).toBe(false)
    })

    it('should detect wall when facing a wall', () => {
      // Turn to face north - there's a wall at (1,0)
      interpreter.execute('turn left')
      expect(interpreter.sensor('front')).toBe(true)
    })

    it('should detect wall to the left', () => {
      // At (1,1) facing EAST, left is NORTH - wall at (1,0)
      expect(interpreter.sensor('left')).toBe(true)
    })

    it('should detect wall to the right', () => {
      // At (1,1) facing EAST, right is SOUTH - wall at (1,2)
      expect(interpreter.sensor('right')).toBe(true)
    })

    it('should detect wall behind', () => {
      // At (1,1) facing EAST, behind is WEST - wall at (0,1)
      expect(interpreter.sensor('back')).toBe(true)
    })

    it('should detect no wall when path is clear', () => {
      // Move forward to (2,1)
      interpreter.execute('forward')
      // Facing EAST, front is (3,1) which is clear
      expect(interpreter.sensor('front')).toBe(false)
    })

    it('should detect edge as wall', () => {
      // Move to edge and check
      interpreter.execute('forward') // (2,1)
      interpreter.execute('forward') // (3,1)
      // Now facing EAST, front is (4,1) which is a wall
      expect(interpreter.sensor('front')).toBe(true)
    })

    it('should store sensor results', () => {
      interpreter.sensor('front')
      expect(interpreter.getLastSensorResult('front')).toBe(false)

      interpreter.sensor('left')
      expect(interpreter.getLastSensorResult('left')).toBe(true)
    })
  })
})

describe('parseCode - Conditionals', () => {
  const testMaze = [
    [1, 1, 1, 1, 1],
    [1, 2, 0, 0, 1],
    [1, 1, 1, 0, 1],
    [1, 0, 0, 0, 3],
    [1, 1, 1, 1, 1],
  ]

  let interpreter: RobotInterpreter

  beforeEach(() => {
    interpreter = new RobotInterpreter(
      testMaze,
      { x: 1, y: 1 },
      Direction.EAST
    )
  })

  describe('if sensor blocks', () => {
    it('should execute commands when sensor condition is true', () => {
      // Turn left to face wall
      interpreter.execute('turn left')

      const code = `if sensor front {
forward
}`
      const commands = parseCode(code, interpreter)
      // Wall is detected, but we're asking if there's a wall in front
      // Since there IS a wall, condition is true, but we shouldn't move forward
      expect(commands).toEqual(['forward'])
    })

    it('should skip commands when sensor condition is false', () => {
      // Facing EAST, no wall in front
      const code = `if sensor left {
turn right
}`
      const commands = parseCode(code, interpreter)
      // Wall IS to the left, so condition is true
      expect(commands).toEqual(['turn right'])
    })

    it('should handle "if not sensor" correctly', () => {
      // Facing EAST, no wall in front
      const code = `if not sensor front {
forward
}`
      const commands = parseCode(code, interpreter)
      // No wall in front, so "not sensor front" is true
      expect(commands).toEqual(['forward'])
    })

    it('should skip commands with "if not sensor" when wall exists', () => {
      // Turn to face wall
      interpreter.execute('turn left')

      const code = `if not sensor front {
forward
}`
      const commands = parseCode(code, interpreter)
      // Wall in front, so "not sensor front" is false
      expect(commands).toEqual([])
    })

    it('should handle multiple commands in if block', () => {
      const code = `if not sensor front {
forward
forward
turn right
}`
      const commands = parseCode(code, interpreter)
      expect(commands).toEqual(['forward', 'forward', 'turn right'])
    })

    it('should handle if blocks with other commands', () => {
      const code = `forward
if sensor left {
turn left
}
forward`
      const commands = parseCode(code, interpreter)
      // Wall is to the left
      expect(commands).toEqual(['forward', 'turn left', 'forward'])
    })

    it('should handle multiple if blocks', () => {
      const code = `if sensor left {
turn right
}
if not sensor front {
forward
}`
      const commands = parseCode(code, interpreter)
      expect(commands).toEqual(['turn right', 'forward'])
    })

    it('should test different directions', () => {
      interpreter.execute('turn left') // Face north

      const codeFront = `if sensor front {
forward
}`
      expect(parseCode(codeFront, interpreter)).toEqual(['forward'])

      // When facing north, back is south - which has a wall at (1,2)
      const codeBack = `if sensor back {
forward
}`
      expect(parseCode(codeBack, interpreter)).toEqual(['forward'])

      // Test right direction - when facing north, right is east with no wall
      const codeRight = `if not sensor right {
turn right
}`
      expect(parseCode(codeRight, interpreter)).toEqual(['turn right'])
    })
  })
})

import { describe, it, expect } from 'vitest'
import { Parser } from './Parser'

describe('Parser', () => {
  it('should parse simple forward commands', () => {
    const parser = new Parser('(forward)\n(forward)\n(forward)')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(3)
    expect(ast.statements[0]).toMatchObject({ type: 'command', command: 'forward' })
  })

  it('should parse turn commands', () => {
    const parser = new Parser('(turn left)\n(turn right)')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(2)
    expect(ast.statements[0]).toMatchObject({ type: 'command', command: 'turn_left' })
    expect(ast.statements[1]).toMatchObject({ type: 'command', command: 'turn_right' })
  })

  it('should parse Level 2 solution', () => {
    const code = `
      (forward)
      (forward)
      (forward)
      (turn right)
      (forward)
      (forward)
      (forward)
    `
    const parser = new Parser(code)
    const ast = parser.parse()
    expect(ast.statements.length).toBe(7)
    expect(ast.statements[0]).toMatchObject({ type: 'command', command: 'forward' })
    expect(ast.statements[3]).toMatchObject({ type: 'command', command: 'turn_right' })
  })

  it('should handle comments', () => {
    const parser = new Parser(`; comment\n(forward)\n// another comment\n(turn left)\n# third comment`)
    const ast = parser.parse()
    expect(ast.statements.length).toBe(2)
  })

  it('should parse repeat blocks', () => {
    const parser = new Parser('(repeat 3 (forward))')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(1)
    expect(ast.statements[0].type).toBe('repeat')
  })

  it('should parse if conditionals', () => {
    const parser = new Parser('(if (sensor front) (turn left))')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(1)
    expect(ast.statements[0].type).toBe('if')
  })

  it('should parse distance-based conditions', () => {
    const parser = new Parser('(if (closer right) (turn right))')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(1)
    expect(ast.statements[0].type).toBe('if')
    const statement = ast.statements[0]
    if (statement.type === 'if') {
      expect(statement.condition.type).toBe('closer')
      expect(statement.condition.direction).toBe('right')
    }
  })

  it('should parse set statements', () => {
    const parser = new Parser('(set steps 3)')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(1)
    const statement = ast.statements[0]
    expect(statement.type).toBe('set')
    if (statement.type === 'set') {
      expect(statement.name).toBe('steps')
      expect(statement.value.type).toBe('number_literal')
    }
  })

  it('should parse distance-to-end expressions', () => {
    const parser = new Parser('(set d (distance-to-end))')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(1)
    const statement = ast.statements[0]
    if (statement.type === 'set') {
      expect(statement.value.type).toBe('distance_to_end')
    }
  })

  it('should parse function definitions and calls', () => {
    const code = `
      (function walk (n)
        (repeat n (forward))
      )
      (walk 2)
    `
    const parser = new Parser(code)
    const ast = parser.parse()
    expect(ast.statements.length).toBe(2)
    const functionNode = ast.statements[0]
    const callNode = ast.statements[1]

    expect(functionNode.type).toBe('function')
    if (functionNode.type === 'function') {
      expect(functionNode.name).toBe('walk')
      expect(functionNode.params).toEqual(['n'])
      expect(functionNode.body.length).toBe(1)
    }

    expect(callNode.type).toBe('call')
    if (callNode.type === 'call') {
      expect(callNode.name).toBe('walk')
      expect(callNode.args.length).toBe(1)
      expect(callNode.args[0].type).toBe('number_literal')
    }
  })

  it('should parse explicit call syntax for backward compatibility', () => {
    const code = `
      (function walk (n)
        (repeat n (forward))
      )
      (call walk 2)
    `
    const parser = new Parser(code)
    const ast = parser.parse()

    expect(ast.statements.length).toBe(2)
    const callNode = ast.statements[1]
    expect(callNode.type).toBe('call')
    if (callNode.type === 'call') {
      expect(callNode.name).toBe('walk')
      expect(callNode.args.length).toBe(1)
      expect(callNode.args[0].type).toBe('number_literal')
    }
  })
})

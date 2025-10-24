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
})

import { describe, it, expect } from 'vitest'
import { Parser } from './Parser'

describe('Parser', () => {
  it('should parse simple forward commands', () => {
    const parser = new Parser('forward\nforward\nforward')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(3)
    expect(ast.statements[0]).toEqual({ type: 'command', command: 'forward' })
  })

  it('should parse turn commands', () => {
    const parser = new Parser('turn left\nturn right')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(2)
    expect(ast.statements[0]).toEqual({ type: 'command', command: 'turn_left' })
    expect(ast.statements[1]).toEqual({ type: 'command', command: 'turn_right' })
  })

  it('should parse Level 2 solution', () => {
    const code = `forward
forward
forward
turn right
forward
forward
forward`
    const parser = new Parser(code)
    const ast = parser.parse()
    expect(ast.statements.length).toBe(7)
    expect(ast.statements[0]).toEqual({ type: 'command', command: 'forward' })
    expect(ast.statements[3]).toEqual({ type: 'command', command: 'turn_right' })
  })

  it('should handle comments', () => {
    const parser = new Parser('# comment\nforward\n// another comment\nturn left')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(2)
  })

  it('should parse repeat blocks', () => {
    const parser = new Parser('repeat 3 {\n  forward\n}')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(1)
    expect(ast.statements[0].type).toBe('repeat')
  })

  it('should parse if conditionals', () => {
    const parser = new Parser('if sensor front {\n  turn left\n}')
    const ast = parser.parse()
    expect(ast.statements.length).toBe(1)
    expect(ast.statements[0].type).toBe('if')
  })
})

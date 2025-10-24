import { ASTNode, CommandNode, RepeatNode, IfNode, BlockNode } from './AST'

export class Parser {
  private lines: string[]
  private currentIndex: number

  constructor(code: string) {
    // Preprocess code: split into lines, trim, remove comments and empty lines
    this.lines = code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
    this.currentIndex = 0
  }

  parse(): BlockNode {
    const statements: ASTNode[] = []
    while (this.currentIndex < this.lines.length) {
      const statement = this.parseStatement()
      if (statement) {
        statements.push(statement)
      }
    }
    return { type: 'block', statements }
  }

  private parseStatement(): ASTNode | null {
    if (this.currentIndex >= this.lines.length) {
      return null
    }

    const line = this.lines[this.currentIndex]

    // Check for repeat
    const repeatMatch = line.match(/^repeat\s+(\d+)\s*\{?$/)
    if (repeatMatch) {
      return this.parseRepeat(parseInt(repeatMatch[1], 10), line.includes('{'))
    }

    // Check for if sensor
    const ifMatch = line.match(/^if\s+(not\s+)?sensor\s+(front|back|left|right)\s*\{?$/)
    if (ifMatch) {
      const negated = !!ifMatch[1]
      const direction = ifMatch[2] as 'front' | 'back' | 'left' | 'right'
      return this.parseIf(negated, direction, line.includes('{'))
    }

    // Check for closing brace
    if (line === '}') {
      this.currentIndex++
      return null
    }

    // Check for opening brace
    if (line === '{') {
      this.currentIndex++
      return null
    }

    // Otherwise it's a command
    return this.parseCommand(line)
  }

  private parseCommand(line: string): CommandNode | null {
    this.currentIndex++

    const cmd = line.toLowerCase().trim()

    if (cmd === 'forward' || cmd === 'move forward' || cmd === 'move') {
      return { type: 'command', command: 'forward' }
    } else if (cmd === 'turn left' || cmd === 'left') {
      return { type: 'command', command: 'turn_left' }
    } else if (cmd === 'turn right' || cmd === 'right') {
      return { type: 'command', command: 'turn_right' }
    }

    // Unknown command - throw error
    throw new Error(`Unknown command: ${line.trim()}`)
  }

  private parseRepeat(count: number, hasBrace: boolean): RepeatNode {
    this.currentIndex++

    const body: ASTNode[] = []
    let braceCount = hasBrace ? 1 : 0

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex]

      // Check for closing brace
      if (line === '}' && braceCount > 0) {
        braceCount--
        this.currentIndex++
        if (braceCount === 0) {
          break
        }
        continue
      }

      // Check for opening brace
      if (line === '{') {
        braceCount++
        this.currentIndex++
        continue
      }

      // If no braces mode, check for end of repeat body
      if (braceCount === 0 && (line.startsWith('repeat') || line.match(/^if\s+(not\s+)?sensor/))) {
        break
      }

      const statement = this.parseStatement()
      if (statement) {
        body.push(statement)
      }

      // Break if we've consumed a statement in no-brace mode
      if (braceCount === 0) {
        break
      }
    }

    return { type: 'repeat', count, body }
  }

  private parseIf(negated: boolean, direction: 'front' | 'back' | 'left' | 'right', hasBrace: boolean): IfNode {
    this.currentIndex++

    const body: ASTNode[] = []
    let braceCount = hasBrace ? 1 : 0

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex]

      // Check for closing brace
      if (line === '}' && braceCount > 0) {
        braceCount--
        this.currentIndex++
        if (braceCount === 0) {
          break
        }
        continue
      }

      // Check for opening brace
      if (line === '{') {
        braceCount++
        this.currentIndex++
        continue
      }

      const statement = this.parseStatement()
      if (statement) {
        body.push(statement)
      }

      // Break if we've consumed a statement in no-brace mode
      if (braceCount === 0) {
        break
      }
    }

    return {
      type: 'if',
      condition: { negated, direction },
      body
    }
  }
}

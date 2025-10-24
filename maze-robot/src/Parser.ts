import { ASTNode, CommandNode, RepeatNode, IfNode, BlockNode } from './AST'

export class Parser {
  private lines: string[]
  private lineNumbers: number[]  // Maps filtered line index to original line number
  private currentIndex: number

  constructor(code: string) {
    // Preprocess code: split into lines, track original line numbers
    const allLines = code.split('\n')
    this.lines = []
    this.lineNumbers = []

    allLines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
        this.lines.push(trimmed)
        this.lineNumbers.push(index + 1)  // 1-based line numbers
      }
    })

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
    const lineNumber = this.lineNumbers[this.currentIndex]
    this.currentIndex++

    const cmd = line.toLowerCase().trim()

    if (cmd === 'forward' || cmd === 'move forward' || cmd === 'move') {
      return { type: 'command', command: 'forward', line: lineNumber }
    } else if (cmd === 'turn left' || cmd === 'left') {
      return { type: 'command', command: 'turn_left', line: lineNumber }
    } else if (cmd === 'turn right' || cmd === 'right') {
      return { type: 'command', command: 'turn_right', line: lineNumber }
    }

    // Unknown command - throw error
    throw new Error(`Unknown command: ${line.trim()}`)
  }

  private parseRepeat(count: number, hasBrace: boolean): RepeatNode {
    const lineNumber = this.lineNumbers[this.currentIndex]
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

    return { type: 'repeat', count, body, line: lineNumber }
  }

  private parseIf(negated: boolean, direction: 'front' | 'back' | 'left' | 'right', hasBrace: boolean): IfNode {
    const lineNumber = this.lineNumbers[this.currentIndex]
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
      body,
      line: lineNumber
    }
  }
}

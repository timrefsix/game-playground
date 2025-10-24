import {
  ASTNode,
  BlockNode,
  CommandNode,
  RepeatNode,
  IfNode,
  SetNode,
  FunctionNode,
  CallNode,
  ExpressionNode,
  NumberLiteralNode,
  VariableReferenceNode,
  DistanceToEndNode,
  IfCondition
} from './AST'

type TokenType = 'paren' | 'number' | 'symbol'

interface Token {
  type: TokenType
  value: string
  line: number
}

interface ListExpression {
  type: 'list'
  items: Expression[]
  line: number
}

interface SymbolExpression {
  type: 'symbol'
  value: string
  line: number
}

interface NumberExpression {
  type: 'number'
  value: number
  line: number
}

type Expression = ListExpression | SymbolExpression | NumberExpression

type DirectionLiteral = 'front' | 'back' | 'left' | 'right'

export class Parser {
  private tokens: Token[]
  private currentIndex: number

  constructor(code: string) {
    this.tokens = this.tokenize(code)
    this.currentIndex = 0
  }

  parse(): BlockNode {
    const statements: ASTNode[] = []

    while (!this.isAtEnd()) {
      const expr = this.parseExpression()
      statements.push(this.transformExpression(expr))
    }

    return { type: 'block', statements }
  }

  private tokenize(code: string): Token[] {
    const tokens: Token[] = []
    let current = 0
    let line = 1

    const isIdentifierChar = (char: string) => /[A-Za-z_\-]/.test(char)

    while (current < code.length) {
      const char = code[current]

      if (char === '\n') {
        line++
        current++
        continue
      }

      if (char === '(' || char === ')') {
        tokens.push({ type: 'paren', value: char, line })
        current++
        continue
      }

      // Skip whitespace
      if (/\s/.test(char)) {
        current++
        continue
      }

      // Comments starting with ;, #, or //
      if (char === ';' || char === '#') {
        while (current < code.length && code[current] !== '\n') {
          current++
        }
        continue
      }

      if (char === '/' && code[current + 1] === '/') {
        current += 2
        while (current < code.length && code[current] !== '\n') {
          current++
        }
        continue
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        let number = char
        current++
        while (current < code.length && /[0-9]/.test(code[current])) {
          number += code[current]
          current++
        }
        tokens.push({ type: 'number', value: number, line })
        continue
      }

      // Symbols (identifiers)
      if (isIdentifierChar(char)) {
        let symbol = char
        current++
        while (
          current < code.length &&
          (isIdentifierChar(code[current]) || /[0-9]/.test(code[current]))
        ) {
          symbol += code[current]
          current++
        }
        tokens.push({ type: 'symbol', value: symbol.toLowerCase(), line })
        continue
      }

      throw new Error(`Unexpected character '${char}' at line ${line}`)
    }

    return tokens
  }

  private parseExpression(): Expression {
    const token = this.peek()

    if (!token) {
      throw new Error('Unexpected end of input')
    }

    if (token.type === 'paren' && token.value === '(') {
      return this.parseList()
    }

    this.advance()

    if (token.type === 'symbol') {
      return { type: 'symbol', value: token.value, line: token.line }
    }

    if (token.type === 'number') {
      return { type: 'number', value: parseInt(token.value, 10), line: token.line }
    }

    throw new Error(`Unexpected token '${token.value}' at line ${token.line}`)
  }

  private parseList(): ListExpression {
    const start = this.advance()
    if (!start || start.type !== 'paren' || start.value !== '(') {
      throw new Error('Expected ( to start list')
    }

    const items: Expression[] = []
    let closed = false

    while (!this.isAtEnd()) {
      const next = this.peek()
      if (next?.type === 'paren' && next.value === ')') {
        this.advance()
        closed = true
        break
      }
      items.push(this.parseExpression())
    }

    if (!closed) {
      throw new Error(`Unclosed list starting at line ${start.line}`)
    }

    return { type: 'list', items, line: start.line }
  }

  private transformExpression(expr: Expression): ASTNode {
    if (expr.type !== 'list') {
      throw new Error('Top level expressions must be lists')
    }

    if (expr.items.length === 0) {
      throw new Error(`Empty expression at line ${expr.line}`)
    }

    const head = expr.items[0]
    if (head.type !== 'symbol') {
      throw new Error(`Expression must start with a symbol at line ${expr.line}`)
    }

    const rest = expr.items.slice(1)

    switch (head.value) {
      case 'forward':
      case 'move':
      case 'move-forward':
        return this.createCommandNode('forward', head.line)
      case 'turn-left':
        return this.createCommandNode('turn_left', head.line)
      case 'left':
        return this.createTurnCommand(rest, head.line, 'left')
      case 'turn-right':
        return this.createCommandNode('turn_right', head.line)
      case 'right':
        return this.createTurnCommand(rest, head.line, 'right')
      case 'turn':
        return this.createTurnCommand(rest, head.line)
      case 'repeat':
        return this.createRepeatNode(rest, head.line)
      case 'if':
        return this.createIfNode(rest, head.line)
      case 'set':
      case 'let':
        return this.createSetNode(rest, head.line)
      case 'function':
      case 'def':
      case 'define':
      case 'func':
        return this.createFunctionNode(rest, head.line)
      case 'call':
        return this.createCallNode(rest, head.line)
      default:
        return this.createImplicitCallNode(head, rest)
    }
  }

  private createCommandNode(command: CommandNode['command'], line: number): CommandNode {
    return { type: 'command', command, line }
  }

  private createTurnCommand(rest: Expression[], line: number, fallback?: 'left' | 'right'): CommandNode {
    if (rest.length === 0) {
      if (fallback) {
        return this.createCommandNode(fallback === 'left' ? 'turn_left' : 'turn_right', line)
      }
      throw new Error(`turn requires a direction at line ${line}`)
    }

    const directionExpr = rest[0]
    if (directionExpr.type !== 'symbol') {
      throw new Error(`Invalid turn direction at line ${directionExpr.line}`)
    }

    if (directionExpr.value === 'left') {
      return this.createCommandNode('turn_left', directionExpr.line)
    }
    if (directionExpr.value === 'right') {
      return this.createCommandNode('turn_right', directionExpr.line)
    }

    throw new Error(`Unknown turn direction '${directionExpr.value}' at line ${directionExpr.line}`)
  }

  private createRepeatNode(rest: Expression[], line: number): RepeatNode {
    if (rest.length === 0) {
      throw new Error(`repeat requires a count at line ${line}`)
    }

    const countExpr = rest[0]
    const count = this.createExpressionNode(countExpr, 'repeat count must be a number or variable')

    const bodyExpressions = rest.slice(1)
    const body: ASTNode[] = bodyExpressions.map(expr => this.transformExpression(expr))

    return {
      type: 'repeat',
      count,
      body,
      line
    }
  }

  private createIfNode(rest: Expression[], line: number): IfNode {
    if (rest.length === 0) {
      throw new Error(`if requires a condition at line ${line}`)
    }

    const conditionExpr = rest[0]
    const condition = this.parseCondition(conditionExpr)
    const bodyExpressions = rest.slice(1)
    const body = bodyExpressions.map(expr => this.transformExpression(expr))

    return {
      type: 'if',
      condition,
      body,
      line
    }
  }

  private parseCondition(expr: Expression): IfCondition {
    if (expr.type !== 'list') {
      throw new Error(`Invalid condition at line ${expr.line}`)
    }

    if (expr.items.length === 0) {
      throw new Error(`Empty condition at line ${expr.line}`)
    }

    const head = expr.items[0]
    if (head.type !== 'symbol') {
      throw new Error(`Condition must start with a symbol at line ${expr.line}`)
    }

    if (head.value === 'sensor') {
      const direction = this.parseDirection(expr.items.slice(1), head.line)
      return { type: 'sensor', negated: false, direction }
    }

    if (head.value === 'closer') {
      const direction = this.parseDirection(expr.items.slice(1), head.line)
      return { type: 'closer', negated: false, direction }
    }

    if (head.value === 'not') {
      if (expr.items.length !== 2) {
        throw new Error(`not expects a single condition at line ${head.line}`)
      }
      const inner = this.parseCondition(expr.items[1])
      return { ...inner, negated: !inner.negated }
    }

    throw new Error(`Unknown condition '${head.value}' at line ${head.line}`)
  }

  private parseDirection(items: Expression[], line: number): DirectionLiteral {
    if (items.length === 0) {
      throw new Error(`sensor requires a direction at line ${line}`)
    }

    const directionExpr = items[0]
    if (directionExpr.type !== 'symbol') {
      throw new Error(`Invalid sensor direction at line ${directionExpr.line}`)
    }

    const direction = directionExpr.value as DirectionLiteral
    if (!['front', 'back', 'left', 'right'].includes(direction)) {
      throw new Error(`Unknown sensor direction '${direction}' at line ${directionExpr.line}`)
    }

    return direction
  }

  private createSetNode(rest: Expression[], line: number): SetNode {
    if (rest.length < 2) {
      throw new Error(`set requires a variable name and value at line ${line}`)
    }

    const nameExpr = rest[0]
    if (nameExpr.type !== 'symbol') {
      throw new Error(`set requires a variable name at line ${nameExpr.line}`)
    }

    const valueExpr = rest[1]
    const value = this.createExpressionNode(valueExpr, 'set value must be a number or variable')

    return {
      type: 'set',
      name: nameExpr.value,
      value,
      line
    }
  }

  private createFunctionNode(rest: Expression[], line: number): FunctionNode {
    if (rest.length < 2) {
      throw new Error(`function requires a name and parameter list at line ${line}`)
    }

    const nameExpr = rest[0]
    if (nameExpr.type !== 'symbol') {
      throw new Error(`function name must be a symbol at line ${nameExpr.line}`)
    }

    const paramsExpr = rest[1]
    if (paramsExpr.type !== 'list') {
      throw new Error(`function parameters must be a list at line ${paramsExpr.line}`)
    }

    const params: string[] = paramsExpr.items.map(param => {
      if (param.type !== 'symbol') {
        throw new Error(`function parameter must be a symbol at line ${param.line}`)
      }
      return param.value
    })

    const bodyExpressions = rest.slice(2)
    const body = bodyExpressions.map(expr => this.transformExpression(expr))

    return {
      type: 'function',
      name: nameExpr.value,
      params,
      body,
      line
    }
  }

  private createCallNode(rest: Expression[], line: number): CallNode {
    if (rest.length === 0) {
      throw new Error(`call requires a function name at line ${line}`)
    }

    const nameExpr = rest[0]
    if (nameExpr.type !== 'symbol') {
      throw new Error(`call requires a function name at line ${nameExpr.line}`)
    }

    return this.buildCallNode(nameExpr, rest.slice(1), line, 'call arguments must be numbers or variables')
  }

  private createImplicitCallNode(head: SymbolExpression, args: Expression[]): CallNode {
    return this.buildCallNode(head, args, head.line, 'function arguments must be numbers or variables')
  }

  private buildCallNode(
    nameExpr: SymbolExpression,
    argExprs: Expression[],
    line: number,
    message: string
  ): CallNode {
    const args = argExprs.map(expr => this.createExpressionNode(expr, message))

    return {
      type: 'call',
      name: nameExpr.value,
      args,
      line
    }
  }

  private createExpressionNode(expr: Expression, message: string): ExpressionNode {
    if (expr.type === 'number') {
      return this.createNumberLiteral(expr)
    }

    if (expr.type === 'symbol') {
      return this.createVariableReference(expr)
    }

    if (expr.type === 'list') {
      return this.createListExpression(expr)
    }

    throw new Error(`${message} at line ${expr.line}`)
  }

  private createListExpression(expr: ListExpression): ExpressionNode {
    if (expr.items.length === 0) {
      throw new Error(`Empty expression at line ${expr.line}`)
    }

    const head = expr.items[0]
    if (head.type !== 'symbol') {
      throw new Error(`Expression must start with a symbol at line ${expr.line}`)
    }

    if (head.value === 'distance-to-end' || head.value === 'distance') {
      if (expr.items.length !== 1) {
        throw new Error(`distance-to-end does not take arguments at line ${head.line}`)
      }
      return this.createDistanceToEndNode(expr.line)
    }

    throw new Error(`Unknown expression '${head.value}' at line ${head.line}`)
  }

  private createDistanceToEndNode(line: number): DistanceToEndNode {
    return {
      type: 'distance_to_end',
      line
    }
  }

  private createNumberLiteral(expr: NumberExpression): NumberLiteralNode {
    if (expr.value < 0) {
      throw new Error(`Numbers must be non-negative at line ${expr.line}`)
    }

    return {
      type: 'number_literal',
      value: expr.value,
      line: expr.line
    }
  }

  private createVariableReference(expr: SymbolExpression): VariableReferenceNode {
    return {
      type: 'variable',
      name: expr.value,
      line: expr.line
    }
  }

  private advance(): Token | undefined {
    if (!this.isAtEnd()) {
      return this.tokens[this.currentIndex++]
    }
    return undefined
  }

  private peek(): Token | undefined {
    return this.tokens[this.currentIndex]
  }

  private isAtEnd(): boolean {
    return this.currentIndex >= this.tokens.length
  }
}

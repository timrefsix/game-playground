import {
  ASTNode,
  BlockNode,
  CommandNode,
  RepeatNode,
  IfNode,
  SetNode,
  FunctionNode,
  CallNode,
  ExpressionNode
} from './AST'
import { RobotInterpreter } from './RobotInterpreter'

interface ExecutionFrame {
  node: ASTNode
  index: number
  countValue?: number
  envDepth?: number
}

interface ExecutionContext {
  nodeStack: ExecutionFrame[]
  functions: Map<string, FunctionNode>
  envStack: Map<string, number>[]
}

export class ASTExecutor {
  private interpreter: RobotInterpreter
  private context: ExecutionContext

  constructor(interpreter: RobotInterpreter, ast: BlockNode) {
    this.interpreter = interpreter
    this.context = {
      nodeStack: [{ node: ast, index: 0 }],
      functions: new Map(),
      envStack: [new Map()]
    }

    this.collectFunctions(ast)
  }

  // Execute one command step
  // Returns true if there are more steps, false if done
  executeStep(): { hasMore: boolean; command?: string; line?: number } {
    if (this.interpreter.error || this.interpreter.completed) {
      return { hasMore: false }
    }

    // Get the next executable command
    const result = this.getNextCommand()
    if (!result || !result.command) {
      return { hasMore: false }
    }

    // Execute the command
    this.interpreter.execute(result.command)

    return {
      hasMore: !this.interpreter.error && !this.interpreter.completed,
      command: result.command,
      line: result.line
    }
  }

  private getNextCommand(): { command: string; line?: number } | null {
    while (this.context.nodeStack.length > 0) {
      const current = this.context.nodeStack[this.context.nodeStack.length - 1]

      if (current.node.type === 'block') {
        const block = current.node as BlockNode
        if (current.index >= block.statements.length) {
          // Block finished, pop it
          this.context.nodeStack.pop()
          if (typeof current.envDepth === 'number') {
            while (this.context.envStack.length > current.envDepth) {
              this.context.envStack.pop()
            }
          }
          continue
        }

        // Push the next statement
        const nextStatement = block.statements[current.index]
        current.index++
        this.context.nodeStack.push({ node: nextStatement, index: 0 })
        continue
      }

      if (current.node.type === 'command') {
        const cmd = current.node as CommandNode
        // Pop the command node
        this.context.nodeStack.pop()

        // Map command to string
        let command: string
        switch (cmd.command) {
          case 'forward':
            command = 'forward'
            break
          case 'turn_left':
            command = 'turn left'
            break
          case 'turn_right':
            command = 'turn right'
            break
          default:
            command = ''
        }
        return { command, line: cmd.line }
      }

      if (current.node.type === 'repeat') {
        const repeat = current.node as RepeatNode

        if (typeof current.countValue === 'undefined') {
          try {
            const evaluatedCount = this.evaluateExpression(repeat.count)
            if (evaluatedCount < 0) {
              this.interpreter.error = `repeat count must be non-negative at line ${repeat.line ?? 'unknown'}`
              return null
            }
            current.countValue = Math.floor(evaluatedCount)
          } catch (error) {
            this.interpreter.error = this.formatError(error)
            return null
          }
        }

        const limit = current.countValue ?? 0

        if (current.index < limit) {
          current.index++
          this.context.nodeStack.push({
            node: { type: 'block', statements: repeat.body },
            index: 0
          })
          continue
        } else {
          this.context.nodeStack.pop()
          continue
        }
      }

      if (current.node.type === 'if') {
        const ifNode = current.node as IfNode

        // Pop the if node immediately
        this.context.nodeStack.pop()

        let condition = false
        if (ifNode.condition.type === 'sensor') {
          const sensorResult = this.interpreter.sensor(ifNode.condition.direction)
          condition = ifNode.condition.negated ? !sensorResult : sensorResult
        } else if (ifNode.condition.type === 'closer') {
          const closerResult = this.interpreter.isCloser(ifNode.condition.direction)
          condition = ifNode.condition.negated ? !closerResult : closerResult
        }

        if (condition) {
          // Push the body as a new block
          this.context.nodeStack.push({
            node: { type: 'block', statements: ifNode.body },
            index: 0
          })
        }
        continue
      }

      if (current.node.type === 'set') {
        const setNode = current.node as SetNode
        this.context.nodeStack.pop()
        try {
          const value = this.evaluateExpression(setNode.value)
          this.assignVariable(setNode.name, value)
        } catch (error) {
          this.interpreter.error = this.formatError(error)
          return null
        }
        continue
      }

      if (current.node.type === 'function') {
        const funcNode = current.node as FunctionNode
        this.context.functions.set(funcNode.name, funcNode)
        this.context.nodeStack.pop()
        continue
      }

      if (current.node.type === 'call') {
        const callNode = current.node as CallNode
        this.context.nodeStack.pop()

        const functionDefinition = this.context.functions.get(callNode.name)
        if (!functionDefinition) {
          this.interpreter.error = `Unknown function '${callNode.name}' at line ${callNode.line ?? 'unknown'}`
          return null
        }

        let argValues: number[]
        try {
          argValues = callNode.args.map(arg => this.evaluateExpression(arg))
        } catch (error) {
          this.interpreter.error = this.formatError(error)
          return null
        }

        if (argValues.length !== functionDefinition.params.length) {
          this.interpreter.error = `Function '${functionDefinition.name}' expected ${functionDefinition.params.length} argument(s) but received ${argValues.length}`
          return null
        }

        const envDepthBeforeCall = this.context.envStack.length
        const newEnv = new Map<string, number>()
        this.context.envStack.push(newEnv)

        functionDefinition.params.forEach((param, index) => {
          newEnv.set(param, argValues[index])
        })

        this.context.nodeStack.push({
          node: { type: 'block', statements: functionDefinition.body },
          index: 0,
          envDepth: envDepthBeforeCall
        })
        continue
      }

      // Unknown node type, skip it
      this.context.nodeStack.pop()
    }

    return null
  }

  // Check if there are more commands to execute
  hasMore(): boolean {
    return this.context.nodeStack.length > 0 && !this.interpreter.error && !this.interpreter.completed
  }

  private evaluateExpression(expr: ExpressionNode): number {
    if (expr.type === 'number_literal') {
      return expr.value
    }

    if (expr.type === 'variable') {
      const value = this.lookupVariable(expr.name)
      if (typeof value === 'undefined') {
        throw new Error(`Undefined variable '${expr.name}' at line ${expr.line ?? 'unknown'}`)
      }
      return value
    }

    if (expr.type === 'distance_to_end') {
      return this.interpreter.getDistanceToGoal()
    }

    throw new Error('Unsupported expression')
  }

  private assignVariable(name: string, value: number): void {
    const currentEnv = this.context.envStack[this.context.envStack.length - 1]
    currentEnv.set(name, value)
  }

  private lookupVariable(name: string): number | undefined {
    for (let i = this.context.envStack.length - 1; i >= 0; i--) {
      const env = this.context.envStack[i]
      if (env.has(name)) {
        return env.get(name)
      }
    }
    return undefined
  }

  private collectFunctions(ast: BlockNode): void {
    for (const statement of ast.statements) {
      if (statement.type === 'function') {
        const functionNode = statement as FunctionNode
        this.context.functions.set(functionNode.name, functionNode)
      }
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }
}

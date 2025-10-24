import { ASTNode, BlockNode, CommandNode, RepeatNode, IfNode } from './AST'
import { RobotInterpreter } from './RobotInterpreter'

interface ExecutionContext {
  nodeStack: { node: ASTNode; index: number }[]
  repeatStack: { count: number; iteration: number; body: ASTNode[] }[]
}

export class ASTExecutor {
  private interpreter: RobotInterpreter
  private context: ExecutionContext

  constructor(interpreter: RobotInterpreter, ast: BlockNode) {
    this.interpreter = interpreter
    this.context = {
      nodeStack: [{ node: ast, index: 0 }],
      repeatStack: []
    }
  }

  // Execute one command step
  // Returns true if there are more steps, false if done
  executeStep(): { hasMore: boolean; command?: string } {
    if (this.interpreter.error || this.interpreter.completed) {
      return { hasMore: false }
    }

    // Get the next executable command
    const command = this.getNextCommand()
    if (!command) {
      return { hasMore: false }
    }

    // Execute the command
    this.interpreter.execute(command)

    return {
      hasMore: !this.interpreter.error && !this.interpreter.completed,
      command
    }
  }

  private getNextCommand(): string | null {
    while (this.context.nodeStack.length > 0) {
      const current = this.context.nodeStack[this.context.nodeStack.length - 1]

      if (current.node.type === 'block') {
        const block = current.node as BlockNode
        if (current.index >= block.statements.length) {
          // Block finished, pop it
          this.context.nodeStack.pop()
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
        switch (cmd.command) {
          case 'forward':
            return 'forward'
          case 'turn_left':
            return 'turn left'
          case 'turn_right':
            return 'turn right'
        }
      }

      if (current.node.type === 'repeat') {
        const repeat = current.node as RepeatNode

        // Check if we need to start a new iteration
        if (current.index < repeat.count) {
          // Start this iteration
          current.index++

          // Push the body as a new block
          this.context.nodeStack.push({
            node: { type: 'block', statements: repeat.body },
            index: 0
          })
          continue
        } else {
          // Repeat finished, pop it
          this.context.nodeStack.pop()
          continue
        }
      }

      if (current.node.type === 'if') {
        const ifNode = current.node as IfNode

        // Pop the if node immediately
        this.context.nodeStack.pop()

        // Evaluate the condition NOW (with current robot state)
        const sensorResult = this.interpreter.sensor(ifNode.condition.direction)
        const condition = ifNode.condition.negated ? !sensorResult : sensorResult

        if (condition) {
          // Push the body as a new block
          this.context.nodeStack.push({
            node: { type: 'block', statements: ifNode.body },
            index: 0
          })
        }
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
}

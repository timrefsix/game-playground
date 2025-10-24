// Abstract Syntax Tree types for the robot language

export type ASTNode =
  | CommandNode
  | RepeatNode
  | IfNode
  | BlockNode

export interface CommandNode {
  type: 'command'
  command: 'forward' | 'turn_left' | 'turn_right'
  line?: number  // Source line number for debugging
}

export interface RepeatNode {
  type: 'repeat'
  count: number
  body: ASTNode[]
  line?: number  // Source line number for debugging
}

export interface IfNode {
  type: 'if'
  condition: {
    negated: boolean
    direction: 'front' | 'back' | 'left' | 'right'
  }
  body: ASTNode[]
  line?: number  // Source line number for debugging
}

export interface BlockNode {
  type: 'block'
  statements: ASTNode[]
}

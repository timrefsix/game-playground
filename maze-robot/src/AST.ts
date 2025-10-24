// Abstract Syntax Tree types for the robot language

export type ASTNode =
  | CommandNode
  | RepeatNode
  | IfNode
  | BlockNode
  | SetNode
  | FunctionNode
  | CallNode

export type ExpressionNode = NumberLiteralNode | VariableReferenceNode | DistanceToEndNode

export type IfCondition =
  | SensorCondition
  | CloserCondition

export interface SensorCondition {
  type: 'sensor'
  direction: 'front' | 'back' | 'left' | 'right'
  negated: boolean
}

export interface CloserCondition {
  type: 'closer'
  direction: 'front' | 'back' | 'left' | 'right'
  negated: boolean
}

export interface CommandNode {
  type: 'command'
  command: 'forward' | 'turn_left' | 'turn_right'
  line?: number  // Source line number for debugging
}

export interface RepeatNode {
  type: 'repeat'
  count: ExpressionNode
  body: ASTNode[]
  line?: number  // Source line number for debugging
}

export interface IfNode {
  type: 'if'
  condition: IfCondition
  body: ASTNode[]
  line?: number  // Source line number for debugging
}

export interface BlockNode {
  type: 'block'
  statements: ASTNode[]
}

export interface SetNode {
  type: 'set'
  name: string
  value: ExpressionNode
  line?: number  // Source line number for debugging
}

export interface FunctionNode {
  type: 'function'
  name: string
  params: string[]
  body: ASTNode[]
  line?: number  // Source line number for debugging
}

export interface CallNode {
  type: 'call'
  name: string
  args: ExpressionNode[]
  line?: number  // Source line number for debugging
}

export interface NumberLiteralNode {
  type: 'number_literal'
  value: number
  line?: number  // Source line number for debugging
}

export interface VariableReferenceNode {
  type: 'variable'
  name: string
  line?: number  // Source line number for debugging
}

export interface DistanceToEndNode {
  type: 'distance_to_end'
  line?: number  // Source line number for debugging
}

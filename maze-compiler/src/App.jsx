import React, { useState } from 'react';
import { Play, Code, Cpu, FileCode, Settings } from 'lucide-react';

const MazeCompiler = () => {
  const [activeTab, setActiveTab] = useState('masm');
  const [masmCode, setMasmCode] = useState(`; Example MASM code with named data labels
.data
  forward_cmd "FORWARD"
  turn_left_cmd "TURN_LEFT"
  motor_port port_1
  loop_counter loop_counter

; Main program
LOAD_CONST @motor_port
LOAD_CONST @forward_cmd
CALL_METHOD

LOAD_CONST 5
STORE_VAR @loop_counter

:loop_start
LOAD_VAR @loop_counter
LOAD_CONST 0
GT
JUMPF :loop_end

LOAD_CONST @motor_port
LOAD_CONST @turn_left_cmd
CALL_METHOD

LOAD_VAR @loop_counter
LOAD_CONST 1
SUB
STORE_VAR @loop_counter
JUMP :loop_start

:loop_end
HALT`);
  
  const [mazeScript, setMazeScript] = useState(`-- Example MazeScript code
function movePattern(port, times)
  for i = 1, times do
    port.FORWARD()
    port.TURN_RIGHT()
  end
end

function main()
  movePattern(port_1, 5)
  
  if port_2.SENSOR() > 10 then
    port_1.BACKWARD()
  else
    port_1.FORWARD()
  end
end

main()`);

  const [modules, setModules] = useState([
    { port: 'port_1', type: 'Motor', commands: ['FORWARD', 'BACKWARD', 'TURN_LEFT', 'TURN_RIGHT', 'STOP'] },
    { port: 'port_2', type: 'Sensor', commands: ['SENSOR', 'READ', 'CALIBRATE'] },
  ]);

  const [bytecode, setBytecode] = useState([]);
  const [dataTable, setDataTable] = useState([]);
  const [dataLabels, setDataLabels] = useState({});
  const [compiledMasm, setCompiledMasm] = useState('');
  const [errors, setErrors] = useState([]);

  // Bytecode opcodes
  const OPCODES = {
    HALT: 0x00,
    LOAD_CONST: 0x01,
    LOAD_VAR: 0x02,
    STORE_VAR: 0x03,
    ADD: 0x10,
    SUB: 0x11,
    MUL: 0x12,
    DIV: 0x13,
    MOD: 0x14,
    EQ: 0x20,
    NEQ: 0x21,
    LT: 0x22,
    LTE: 0x23,
    GT: 0x24,
    GTE: 0x25,
    AND: 0x30,
    OR: 0x31,
    NOT: 0x32,
    JUMP: 0x40,
    JUMPT: 0x41,
    JUMPF: 0x42,
    CALL: 0x50,
    CALL_METHOD: 0x51,
    RETURN: 0x52,
    POP: 0x60,
    DUP: 0x61,
    SWAP: 0x62,
    LOAD_INDEX: 0x70,
    STORE_INDEX: 0x71,
    NEW_LIST: 0x72,
    NEW_OBJECT: 0x73,
    GET_FIELD: 0x74,
    SET_FIELD: 0x75,
  };

  // Compile MASM to bytecode
  const compileMASM = (code) => {
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith(';'));
    const bytecode = [];
    const dataTable = [];
    const dataLabels = {}; // Map label names to indices
    const labels = {};
    const errors = [];
    let address = 0;
    let inDataSection = false;

    // First pass: collect data section and labels
    lines.forEach((line) => {
      if (line === '.data') {
        inDataSection = true;
        return;
      }
      
      if (line.startsWith('.')) {
        inDataSection = false;
        return;
      }

      if (inDataSection) {
        // Parse data directive: label value OR @index value
        // Support formats:
        // forward_cmd "FORWARD"
        // @0 "FORWARD"
        // port_motor port_1
        const match = line.match(/^(@?\w+)\s+(.+)$/);
        if (match) {
          const label = match[1];
          let value = match[2].trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Parse numbers
          if (!isNaN(value)) {
            value = parseFloat(value);
          }
          
          // Check if label is @index format
          if (label.startsWith('@')) {
            const index = parseInt(label.slice(1));
            dataTable[index] = value;
            dataLabels[label] = index;
          } else {
            // Named label - add to next available index
            const index = dataTable.length;
            dataTable.push(value);
            dataLabels[label] = index;
          }
        }
        return;
      }

      if (line.startsWith(':')) {
        labels[line] = address;
      } else {
        const parts = line.split(/\s+/);
        const opcode = parts[0];
        
        if (OPCODES[opcode] !== undefined) {
          address += 1;
          if (parts.length > 1) {
            address += 1; // For operand
          }
        }
      }
    });

    // Second pass: generate bytecode
    address = 0;
    inDataSection = false;
    
    lines.forEach((line, lineNum) => {
      if (line === '.data') {
        inDataSection = true;
        return;
      }
      
      if (line.startsWith('.')) {
        inDataSection = false;
        return;
      }

      if (inDataSection || line.startsWith(':')) return;

      const parts = line.split(/\s+/);
      const opcode = parts[0];
      const operand = parts.slice(1).join(' ');

      if (OPCODES[opcode] === undefined) {
        errors.push(`Line ${lineNum + 1}: Unknown opcode '${opcode}'`);
        return;
      }

      bytecode.push({ type: 'opcode', value: OPCODES[opcode], mnemonic: opcode, address });
      address++;

      if (operand) {
        let operandValue;
        
        if (operand.startsWith(':')) {
          // Label reference
          if (labels[operand] === undefined) {
            errors.push(`Line ${lineNum + 1}: Undefined label '${operand}'`);
            operandValue = 0;
          } else {
            operandValue = labels[operand];
          }
        } else if (operand.startsWith('@')) {
          // Data table reference - could be @index or @label
          const dataRef = operand.slice(1);
          let dataIndex;
          
          // Check if it's a numeric index
          if (!isNaN(dataRef)) {
            dataIndex = parseInt(dataRef);
          } else {
            // It's a named label
            dataIndex = dataLabels[dataRef];
          }
          
          if (dataIndex === undefined || dataTable[dataIndex] === undefined) {
            errors.push(`Line ${lineNum + 1}: Undefined data reference '${operand}'`);
            operandValue = 0;
          } else {
            operandValue = dataIndex; // Store the numeric index
          }
        } else if (!isNaN(operand)) {
          // Numeric literal
          operandValue = parseFloat(operand);
        } else {
          // Variable name or identifier - auto-add to data table
          let dataIndex = dataTable.indexOf(operand);
          if (dataIndex === -1) {
            dataIndex = dataTable.length;
            dataTable.push(operand);
          }
          operandValue = dataIndex; // Store the numeric index
        }

        bytecode.push({ type: 'operand', value: operandValue, address });
        address++;
      }
    });

    return { bytecode, dataTable, dataLabels, errors };
  };

  // Compile MazeScript to MASM
  const compileMazeScriptToMASM = (code) => {
    const errors = [];
    const masm = [];
    const dataTable = [];
    let tempCounter = 0;
    let labelCounter = 0;
    const symbolTable = { vars: new Map(), functions: new Map() };

    const newTemp = () => `_temp${tempCounter++}`;
    const newLabel = (prefix) => `:_${prefix}_${labelCounter++}`;
    
    // Get or create data table entry - returns numeric index
    const getDataIndex = (value) => {
      let index = dataTable.indexOf(value);
      if (index === -1) {
        index = dataTable.length;
        dataTable.push(value);
      }
      return index;
    };

    // Tokenizer
    const tokenize = (code) => {
      const tokens = [];
      let i = 0;
      
      while (i < code.length) {
        // Skip whitespace
        if (/\s/.test(code[i])) {
          i++;
          continue;
        }

        // Skip comments
        if (code.substring(i, i + 2) === '--') {
          while (i < code.length && code[i] !== '\n') i++;
          continue;
        }

        // String literals
        if (code[i] === '"' || code[i] === "'") {
          const quote = code[i];
          let str = '';
          i++;
          while (i < code.length && code[i] !== quote) {
            if (code[i] === '\\') {
              i++;
              str += code[i];
            } else {
              str += code[i];
            }
            i++;
          }
          i++;
          tokens.push({ type: 'string', value: str });
          continue;
        }

        // Numbers
        if (/[0-9]/.test(code[i])) {
          let num = '';
          while (i < code.length && /[0-9.]/.test(code[i])) {
            num += code[i++];
          }
          tokens.push({ type: 'number', value: parseFloat(num) });
          continue;
        }

        // Identifiers and keywords
        if (/[a-zA-Z_]/.test(code[i])) {
          let id = '';
          while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
            id += code[i++];
          }
          const keywords = ['function', 'end', 'if', 'then', 'else', 'elseif', 'for', 'do', 'while', 'return', 'local', 'and', 'or', 'not'];
          tokens.push({ type: keywords.includes(id) ? 'keyword' : 'identifier', value: id });
          continue;
        }

        // Operators and punctuation
        const twoCharOps = ['==', '~=', '<=', '>=', '..'];
        const twoChar = code.substring(i, i + 2);
        if (twoCharOps.includes(twoChar)) {
          tokens.push({ type: 'operator', value: twoChar });
          i += 2;
          continue;
        }

        tokens.push({ type: 'operator', value: code[i] });
        i++;
      }

      return tokens;
    };

    // Parser
    class Parser {
      constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
      }

      current() {
        return this.tokens[this.pos];
      }

      peek(offset = 1) {
        return this.tokens[this.pos + offset];
      }

      advance() {
        return this.tokens[this.pos++];
      }

      expect(type, value = null) {
        const token = this.current();
        if (!token || token.type !== type || (value !== null && token.value !== value)) {
          throw new Error(`Expected ${type}${value ? ` '${value}'` : ''}, got ${token ? token.value : 'EOF'}`);
        }
        return this.advance();
      }

      parse() {
        const statements = [];
        while (this.current()) {
          statements.push(this.parseStatement());
        }
        return statements;
      }

      parseStatement() {
        const token = this.current();
        
        if (!token) return null;

        if (token.type === 'keyword') {
          switch (token.value) {
            case 'function': return this.parseFunction();
            case 'if': return this.parseIf();
            case 'for': return this.parseFor();
            case 'while': return this.parseWhile();
            case 'return': return this.parseReturn();
            case 'local': return this.parseLocal();
          }
        }

        // Assignment or expression statement
        if (token.type === 'identifier') {
          const next = this.peek();
          if (next && next.type === 'operator' && next.value === '=') {
            return this.parseAssignment();
          }
        }

        return this.parseExpressionStatement();
      }

      parseFunction() {
        this.expect('keyword', 'function');
        const name = this.expect('identifier').value;
        this.expect('operator', '(');
        
        const params = [];
        if (this.current() && this.current().value !== ')') {
          params.push(this.expect('identifier').value);
          while (this.current() && this.current().value === ',') {
            this.advance();
            params.push(this.expect('identifier').value);
          }
        }
        
        this.expect('operator', ')');
        
        const body = [];
        while (this.current() && !(this.current().type === 'keyword' && this.current().value === 'end')) {
          body.push(this.parseStatement());
        }
        
        this.expect('keyword', 'end');
        
        return { type: 'function', name, params, body };
      }

      parseIf() {
        this.expect('keyword', 'if');
        const condition = this.parseExpression();
        this.expect('keyword', 'then');
        
        const thenBody = [];
        while (this.current() && !(this.current().type === 'keyword' && ['else', 'elseif', 'end'].includes(this.current().value))) {
          thenBody.push(this.parseStatement());
        }
        
        let elseBody = [];
        if (this.current() && this.current().value === 'else') {
          this.advance();
          while (this.current() && !(this.current().type === 'keyword' && this.current().value === 'end')) {
            elseBody.push(this.parseStatement());
          }
        }
        
        this.expect('keyword', 'end');
        
        return { type: 'if', condition, thenBody, elseBody };
      }

      parseFor() {
        this.expect('keyword', 'for');
        const variable = this.expect('identifier').value;
        this.expect('operator', '=');
        const start = this.parseExpression();
        this.expect('operator', ',');
        const end = this.parseExpression();
        
        let step = { type: 'literal', value: 1 };
        if (this.current() && this.current().value === ',') {
          this.advance();
          step = this.parseExpression();
        }
        
        this.expect('keyword', 'do');
        
        const body = [];
        while (this.current() && !(this.current().type === 'keyword' && this.current().value === 'end')) {
          body.push(this.parseStatement());
        }
        
        this.expect('keyword', 'end');
        
        return { type: 'for', variable, start, end, step, body };
      }

      parseWhile() {
        this.expect('keyword', 'while');
        const condition = this.parseExpression();
        this.expect('keyword', 'do');
        
        const body = [];
        while (this.current() && !(this.current().type === 'keyword' && this.current().value === 'end')) {
          body.push(this.parseStatement());
        }
        
        this.expect('keyword', 'end');
        
        return { type: 'while', condition, body };
      }

      parseReturn() {
        this.expect('keyword', 'return');
        const value = this.current() && this.current().type !== 'keyword' ? this.parseExpression() : null;
        return { type: 'return', value };
      }

      parseLocal() {
        this.expect('keyword', 'local');
        const name = this.expect('identifier').value;
        let value = null;
        if (this.current() && this.current().value === '=') {
          this.advance();
          value = this.parseExpression();
        }
        return { type: 'local', name, value };
      }

      parseAssignment() {
        const target = this.parseExpression();
        this.expect('operator', '=');
        const value = this.parseExpression();
        return { type: 'assignment', target, value };
      }

      parseExpressionStatement() {
        const expr = this.parseExpression();
        return { type: 'expressionStatement', expression: expr };
      }

      parseExpression() {
        return this.parseOr();
      }

      parseOr() {
        let left = this.parseAnd();
        
        while (this.current() && this.current().type === 'keyword' && this.current().value === 'or') {
          this.advance();
          const right = this.parseAnd();
          left = { type: 'binary', operator: 'or', left, right };
        }
        
        return left;
      }

      parseAnd() {
        let left = this.parseComparison();
        
        while (this.current() && this.current().type === 'keyword' && this.current().value === 'and') {
          this.advance();
          const right = this.parseComparison();
          left = { type: 'binary', operator: 'and', left, right };
        }
        
        return left;
      }

      parseComparison() {
        let left = this.parseAdditive();
        
        while (this.current() && this.current().type === 'operator' && ['==', '~=', '<', '<=', '>', '>='].includes(this.current().value)) {
          const op = this.advance().value;
          const right = this.parseAdditive();
          left = { type: 'binary', operator: op, left, right };
        }
        
        return left;
      }

      parseAdditive() {
        let left = this.parseMultiplicative();
        
        while (this.current() && this.current().type === 'operator' && ['+', '-'].includes(this.current().value)) {
          const op = this.advance().value;
          const right = this.parseMultiplicative();
          left = { type: 'binary', operator: op, left, right };
        }
        
        return left;
      }

      parseMultiplicative() {
        let left = this.parseUnary();
        
        while (this.current() && this.current().type === 'operator' && ['*', '/', '%'].includes(this.current().value)) {
          const op = this.advance().value;
          const right = this.parseUnary();
          left = { type: 'binary', operator: op, left, right };
        }
        
        return left;
      }

      parseUnary() {
        if (this.current() && this.current().type === 'keyword' && this.current().value === 'not') {
          this.advance();
          return { type: 'unary', operator: 'not', operand: this.parseUnary() };
        }
        
        if (this.current() && this.current().type === 'operator' && this.current().value === '-') {
          this.advance();
          return { type: 'unary', operator: '-', operand: this.parseUnary() };
        }
        
        return this.parsePostfix();
      }

      parsePostfix() {
        let expr = this.parsePrimary();
        
        while (this.current()) {
          if (this.current().type === 'operator' && this.current().value === '(') {
            // Function call
            this.advance();
            const args = [];
            if (this.current() && this.current().value !== ')') {
              args.push(this.parseExpression());
              while (this.current() && this.current().value === ',') {
                this.advance();
                args.push(this.parseExpression());
              }
            }
            this.expect('operator', ')');
            expr = { type: 'call', callee: expr, args };
          } else if (this.current().type === 'operator' && this.current().value === '.') {
            // Field access or method call
            this.advance();
            const field = this.expect('identifier').value;
            
            if (this.current() && this.current().value === '(') {
              // Method call
              this.advance();
              const args = [];
              if (this.current() && this.current().value !== ')') {
                args.push(this.parseExpression());
                while (this.current() && this.current().value === ',') {
                  this.advance();
                  args.push(this.parseExpression());
                }
              }
              this.expect('operator', ')');
              expr = { type: 'methodCall', object: expr, method: field, args };
            } else {
              // Field access
              expr = { type: 'fieldAccess', object: expr, field };
            }
          } else if (this.current().type === 'operator' && this.current().value === '[') {
            // Index access
            this.advance();
            const index = this.parseExpression();
            this.expect('operator', ']');
            expr = { type: 'indexAccess', object: expr, index };
          } else {
            break;
          }
        }
        
        return expr;
      }

      parsePrimary() {
        const token = this.current();
        
        if (!token) {
          throw new Error('Unexpected end of input');
        }
        
        if (token.type === 'number') {
          this.advance();
          return { type: 'literal', value: token.value };
        }
        
        if (token.type === 'string') {
          this.advance();
          return { type: 'literal', value: token.value };
        }
        
        if (token.type === 'identifier') {
          this.advance();
          return { type: 'identifier', name: token.value };
        }
        
        if (token.type === 'operator' && token.value === '(') {
          this.advance();
          const expr = this.parseExpression();
          this.expect('operator', ')');
          return expr;
        }
        
        if (token.type === 'operator' && token.value === '{') {
          // Table/Object literal
          this.advance();
          const entries = [];
          
          while (this.current() && this.current().value !== '}') {
            if (this.current().type === 'identifier' && this.peek() && this.peek().value === '=') {
              const key = this.advance().value;
              this.expect('operator', '=');
              const value = this.parseExpression();
              entries.push({ key, value });
            } else {
              const value = this.parseExpression();
              entries.push({ key: null, value });
            }
            
            if (this.current() && this.current().value === ',') {
              this.advance();
            }
          }
          
          this.expect('operator', '}');
          return { type: 'object', entries };
        }
        
        throw new Error(`Unexpected token: ${token.value}`);
      }
    }

    // Code generator
    const generate = (ast) => {
      const varCounter = { count: 0 };

      // Generate .data section at the beginning
      const generateDataSection = () => {
        if (dataTable.length > 0) {
          masm.push('; Data section');
          masm.push('.data');
          dataTable.forEach((value, index) => {
            if (typeof value === 'string') {
              masm.push(`  @${index} "${value}"`);
            } else {
              masm.push(`  @${index} ${value}`);
            }
          });
          masm.push('');
        }
      };

      const generateStatement = (stmt) => {
        if (!stmt) return;

        switch (stmt.type) {
          case 'function':
            const funcLabel = `:func_${stmt.name}`;
            symbolTable.functions.set(stmt.name, { label: funcLabel, params: stmt.params });
            masm.push(`; Function: ${stmt.name}`);
            masm.push(funcLabel);
            
            // Setup parameters
            stmt.params.reverse().forEach(param => {
              const paramIndex = getDataIndex(param);
              symbolTable.vars.set(param, paramIndex);
              masm.push(`STORE_VAR @${paramIndex}`);
            });
            
            // Generate body
            stmt.body.forEach(s => generateStatement(s));
            
            // Implicit return
            if (!stmt.body.length || stmt.body[stmt.body.length - 1].type !== 'return') {
              masm.push(`LOAD_CONST 0`);
              masm.push(`RETURN`);
            }
            break;

          case 'if':
            const elseLabel = newLabel('else');
            const endLabel = newLabel('endif');
            
            generateExpression(stmt.condition);
            masm.push(`JUMPF ${stmt.elseBody.length ? elseLabel : endLabel}`);
            
            stmt.thenBody.forEach(s => generateStatement(s));
            if (stmt.elseBody.length) {
              masm.push(`JUMP ${endLabel}`);
              masm.push(elseLabel);
              stmt.elseBody.forEach(s => generateStatement(s));
            }
            
            masm.push(endLabel);
            break;

          case 'for':
            const loopStart = newLabel('for_start');
            const loopEnd = newLabel('for_end');
            
            // Initialize loop variable
            const varIndex = getDataIndex(stmt.variable);
            generateExpression(stmt.start);
            symbolTable.vars.set(stmt.variable, varIndex);
            masm.push(`STORE_VAR @${varIndex}`);
            
            masm.push(loopStart);
            
            // Check condition
            masm.push(`LOAD_VAR @${varIndex}`);
            generateExpression(stmt.end);
            masm.push(`LTE`);
            masm.push(`JUMPF ${loopEnd}`);
            
            // Body
            stmt.body.forEach(s => generateStatement(s));
            
            // Increment
            masm.push(`LOAD_VAR @${varIndex}`);
            generateExpression(stmt.step);
            masm.push(`ADD`);
            masm.push(`STORE_VAR @${varIndex}`);
            
            masm.push(`JUMP ${loopStart}`);
            masm.push(loopEnd);
            break;

          case 'while':
            const whileStart = newLabel('while_start');
            const whileEnd = newLabel('while_end');
            
            masm.push(whileStart);
            generateExpression(stmt.condition);
            masm.push(`JUMPF ${whileEnd}`);
            
            stmt.body.forEach(s => generateStatement(s));
            
            masm.push(`JUMP ${whileStart}`);
            masm.push(whileEnd);
            break;

          case 'return':
            if (stmt.value) {
              generateExpression(stmt.value);
            } else {
              masm.push(`LOAD_CONST 0`);
            }
            masm.push(`RETURN`);
            break;

          case 'local':
            const localIndex = getDataIndex(stmt.name);
            if (stmt.value) {
              generateExpression(stmt.value);
            } else {
              masm.push(`LOAD_CONST 0`);
            }
            symbolTable.vars.set(stmt.name, localIndex);
            masm.push(`STORE_VAR @${localIndex}`);
            break;

          case 'assignment':
            generateExpression(stmt.value);
            if (stmt.target.type === 'identifier') {
              let targetIndex = symbolTable.vars.get(stmt.target.name);
              if (targetIndex === undefined) {
                targetIndex = getDataIndex(stmt.target.name);
                symbolTable.vars.set(stmt.target.name, targetIndex);
              }
              masm.push(`STORE_VAR @${targetIndex}`);
            } else if (stmt.target.type === 'indexAccess') {
              generateExpression(stmt.target.object);
              generateExpression(stmt.target.index);
              masm.push(`STORE_INDEX`);
            } else if (stmt.target.type === 'fieldAccess') {
              generateExpression(stmt.target.object);
              masm.push(`LOAD_CONST @${getDataIndex(stmt.target.field)}`);
              masm.push(`SET_FIELD`);
            }
            break;

          case 'expressionStatement':
            generateExpression(stmt.expression);
            masm.push(`POP`); // Discard result
            break;
        }
      };

      const generateExpression = (expr) => {
        switch (expr.type) {
          case 'literal':
            if (typeof expr.value === 'string') {
              masm.push(`LOAD_CONST @${getDataIndex(expr.value)}`);
            } else {
              masm.push(`LOAD_CONST ${expr.value}`);
            }
            break;

          case 'identifier':
            let varIndex = symbolTable.vars.get(expr.name);
            if (varIndex === undefined) {
              varIndex = getDataIndex(expr.name);
              symbolTable.vars.set(expr.name, varIndex);
            }
            masm.push(`LOAD_VAR @${varIndex}`);
            break;

          case 'binary':
            generateExpression(expr.left);
            generateExpression(expr.right);
            
            const opMap = {
              '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD',
              '==': 'EQ', '~=': 'NEQ', '<': 'LT', '<=': 'LTE', '>': 'GT', '>=': 'GTE',
              'and': 'AND', 'or': 'OR'
            };
            
            masm.push(opMap[expr.operator] || 'ADD');
            break;

          case 'unary':
            generateExpression(expr.operand);
            if (expr.operator === 'not') {
              masm.push('NOT');
            } else if (expr.operator === '-') {
              masm.push('LOAD_CONST -1');
              masm.push('MUL');
            }
            break;

          case 'call':
            // Push arguments
            expr.args.forEach(arg => generateExpression(arg));
            
            if (expr.callee.type === 'identifier') {
              const funcInfo = symbolTable.functions.get(expr.callee.name);
              if (funcInfo) {
                masm.push(`CALL ${funcInfo.label}`);
              } else {
                let funcIndex = symbolTable.vars.get(expr.callee.name);
                if (funcIndex === undefined) {
                  funcIndex = getDataIndex(expr.callee.name);
                }
                masm.push(`LOAD_VAR @${funcIndex}`);
                masm.push(`CALL`);
              }
            } else {
              generateExpression(expr.callee);
              masm.push(`CALL`);
            }
            break;

          case 'methodCall':
            // Load object (port)
            generateExpression(expr.object);
            // Load method name
            masm.push(`LOAD_CONST @${getDataIndex(expr.method)}`);
            // Push arguments if any
            expr.args.forEach(arg => generateExpression(arg));
            // Call method
            masm.push(`CALL_METHOD`);
            break;

          case 'fieldAccess':
            generateExpression(expr.object);
            masm.push(`LOAD_CONST @${getDataIndex(expr.field)}`);
            masm.push(`GET_FIELD`);
            break;

          case 'indexAccess':
            generateExpression(expr.object);
            generateExpression(expr.index);
            masm.push(`LOAD_INDEX`);
            break;

          case 'object':
            masm.push(`NEW_OBJECT`);
            expr.entries.forEach((entry, idx) => {
              masm.push(`DUP`); // Duplicate object reference
              if (entry.key) {
                masm.push(`LOAD_CONST @${getDataIndex(entry.key)}`);
              } else {
                masm.push(`LOAD_CONST ${idx + 1}`); // Lua arrays are 1-indexed
              }
              generateExpression(entry.value);
              masm.push(`SET_FIELD`);
            });
            break;
        }
      };

      try {
        ast.forEach(stmt => generateStatement(stmt));
        masm.unshift(''); // Add blank line before data section
        generateDataSection();
        masm.push('HALT');
      } catch (e) {
        errors.push(`Code generation error: ${e.message}`);
      }
    };

    try {
      const tokens = tokenize(code);
      const parser = new Parser(tokens);
      const ast = parser.parse();
      generate(ast);
    } catch (e) {
      errors.push(`Parse error: ${e.message}`);
    }

    return { masm: masm.join('\n'), errors };
  };

  const handleCompileMASM = () => {
    const result = compileMASM(masmCode);
    setBytecode(result.bytecode);
    setDataTable(result.dataTable);
    setDataLabels(result.dataLabels || {});
    setErrors(result.errors);
  };

  const handleCompileMazeScript = () => {
    const result = compileMazeScriptToMASM(mazeScript);
    setCompiledMasm(result.masm);
    setErrors(result.errors);
    
    if (result.errors.length === 0) {
      const bytecodeResult = compileMASM(result.masm);
      setBytecode(bytecodeResult.bytecode);
      setDataTable(bytecodeResult.dataTable);
      setDataLabels(bytecodeResult.dataLabels || {});
      setErrors([...result.errors, ...bytecodeResult.errors]);
    }
  };

  const formatBytecode = () => {
    const output = [];
    
    // Data section header
    if (dataTable.length > 0) {
      output.push('; ==================== DATA SECTION ====================');
      output.push('; Magic: MAZE');
      output.push('; Version: 1.0');
      output.push(`; Data entries: ${dataTable.length}`);
      output.push('');
      
      dataTable.forEach((entry, idx) => {
        // Find label name for this index
        const labelName = Object.keys(dataLabels).find(
          label => dataLabels[label] === idx && !label.startsWith('@')
        );
        
        const typeMarker = typeof entry === 'string' ? '0x01' : '0x02';
        const labelStr = labelName ? ` (${labelName})` : '';
        
        if (typeof entry === 'string') {
          const hexBytes = Array.from(entry).map(c => 
            '0x' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()
          ).join(' ');
          output.push(`DATA ${idx.toString().padStart(4, '0')}${labelStr}: ${typeMarker} [string, len=${entry.length}]`);
          output.push(`           "${entry}"`);
          output.push(`           ${hexBytes}`);
        } else {
          const view = new DataView(new ArrayBuffer(8));
          view.setFloat64(0, entry, true);
          const hexBytes = Array.from(new Uint8Array(view.buffer))
            .map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');
          output.push(`DATA ${idx.toString().padStart(4, '0')}${labelStr}: ${typeMarker} [number]`);
          output.push(`           ${entry}`);
          output.push(`           ${hexBytes}`);
        }
        output.push('');
      });
    }
    
    // Code section header
    output.push('; ==================== CODE SECTION ====================');
    output.push(`; Instructions: ${bytecode.length}`);
    output.push('');
    
    // Bytecode instructions
    bytecode.forEach((instr, idx) => {
      if (instr.type === 'opcode') {
        const hex = instr.value.toString(16).padStart(2, '0').toUpperCase();
        output.push(`${instr.address.toString().padStart(4, '0')}: 0x${hex}  ${instr.mnemonic}`);
      } else {
        let value = instr.value;
        output.push(`${instr.address.toString().padStart(4, '0')}:        ${value}`);
      }
    });
    
    return output.join('\n');
  };

  const exportBinary = () => {
    const buffer = [];
    
    // Magic number "MAZE"
    buffer.push(0x4D, 0x41, 0x5A, 0x45);
    
    // Version
    buffer.push(0x01, 0x00);
    
    // Data table size (2 bytes)
    const dataSize = dataTable.length;
    buffer.push((dataSize >> 8) & 0xFF, dataSize & 0xFF);
    
    // Data table
    dataTable.forEach(entry => {
      if (typeof entry === 'string') {
        // String type marker
        buffer.push(0x01);
        // String length (2 bytes)
        const len = entry.length;
        buffer.push((len >> 8) & 0xFF, len & 0xFF);
        // String bytes (UTF-8)
        for (let i = 0; i < entry.length; i++) {
          buffer.push(entry.charCodeAt(i) & 0xFF);
        }
      } else if (typeof entry === 'number') {
        // Number type marker
        buffer.push(0x02);
        // 8-byte double (simplified: using 4-byte float representation)
        const view = new DataView(new ArrayBuffer(8));
        view.setFloat64(0, entry, true);
        for (let i = 0; i < 8; i++) {
          buffer.push(view.getUint8(i));
        }
      }
    });
    
    // Code size (4 bytes)
    const codeSize = bytecode.length;
    buffer.push(
      (codeSize >> 24) & 0xFF,
      (codeSize >> 16) & 0xFF,
      (codeSize >> 8) & 0xFF,
      codeSize & 0xFF
    );
    
    // Bytecode
    bytecode.forEach(instr => {
      if (instr.type === 'opcode') {
        buffer.push(instr.value);
      } else {
        const value = instr.value;
        if (typeof value === 'number') {
          // For data references or inline numbers, use 8 bytes
          const view = new DataView(new ArrayBuffer(8));
          view.setFloat64(0, value, true);
          for (let i = 0; i < 8; i++) {
            buffer.push(view.getUint8(i));
          }
        } else {
          // Fallback: 0
          buffer.push(0, 0, 0, 0, 0, 0, 0, 0);
        }
      }
    });
    
    // Create blob and download
    const blob = new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.mzb';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">MASM Compiler</h1>
            </div>
            <p className="text-purple-100">Maze Assembly & MazeScript Compiler</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 border-b border-white/10">
            <button
              onClick={() => setActiveTab('masm')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'masm'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Code className="w-4 h-4" />
              MASM
            </button>
            <button
              onClick={() => setActiveTab('mazescript')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'mazescript'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <FileCode className="w-4 h-4" />
              MazeScript
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'modules'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              Modules
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'masm' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    MASM Code
                  </label>
                  <textarea
                    value={masmCode}
                    onChange={(e) => setMasmCode(e.target.value)}
                    className="w-full h-96 px-4 py-3 bg-slate-800 text-green-400 font-mono text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none"
                    placeholder="Enter MASM code..."
                  />
                </div>
                <button
                  onClick={handleCompileMASM}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Play className="w-4 h-4" />
                  Compile to Bytecode
                </button>
              </div>
            )}

            {activeTab === 'mazescript' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    MazeScript Code
                  </label>
                  <textarea
                    value={mazeScript}
                    onChange={(e) => setMazeScript(e.target.value)}
                    className="w-full h-96 px-4 py-3 bg-slate-800 text-blue-400 font-mono text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none"
                    placeholder="Enter MazeScript code..."
                  />
                </div>
                <button
                  onClick={handleCompileMazeScript}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Play className="w-4 h-4" />
                  Compile to MASM & Bytecode
                </button>

                {compiledMasm && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Generated MASM
                    </label>
                    <pre className="w-full h-64 px-4 py-3 bg-slate-800 text-green-400 font-mono text-sm rounded-lg border border-white/10 overflow-auto">
                      {compiledMasm}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'modules' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">Robot Modules</h3>
                <div className="space-y-3">
                  {modules.map((module, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-white">{module.port}</h4>
                        <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
                          {module.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {module.commands.map((cmd, cmdIdx) => (
                          <span
                            key={cmdIdx}
                            className="px-3 py-1 bg-slate-700 text-gray-300 text-sm rounded-md font-mono"
                          >
                            {cmd}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Usage:</strong> In MazeScript, call module commands like{' '}
                    <code className="bg-slate-800 px-2 py-1 rounded">port_1.FORWARD()</code>. 
                    In MASM, strings and identifiers are stored in the data table and referenced by index:{' '}
                    <code className="bg-slate-800 px-2 py-1 rounded">LOAD_CONST @0</code> where @0 refers to 
                    a data table entry.
                  </p>
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2">Compilation Errors:</h4>
                <ul className="space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx} className="text-red-300 text-sm font-mono">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bytecode Output */}
            {bytecode.length > 0 && errors.length === 0 && (
              <div className="mt-6 space-y-4">
                {/* Data Table */}
                {dataTable.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Data Table ({dataTable.length} entries)
                    </label>
                    <div className="bg-slate-800 rounded-lg border border-white/10 overflow-hidden">
                      <table className="w-full text-sm font-mono">
                        <thead className="bg-slate-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-purple-300">Index</th>
                            <th className="px-4 py-2 text-left text-purple-300">Label</th>
                            <th className="px-4 py-2 text-left text-purple-300">Type</th>
                            <th className="px-4 py-2 text-left text-purple-300">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataTable.map((entry, idx) => {
                            // Find label name for this index
                            const labelName = Object.keys(dataLabels).find(
                              label => dataLabels[label] === idx && !label.startsWith('@')
                            );
                            
                            return (
                              <tr key={idx} className="border-t border-white/10">
                                <td className="px-4 py-2 text-yellow-400">{idx}</td>
                                <td className="px-4 py-2 text-cyan-400">
                                  {labelName || '-'}
                                </td>
                                <td className="px-4 py-2 text-blue-400">
                                  {typeof entry === 'string' ? 'string' : 'number'}
                                </td>
                                <td className="px-4 py-2 text-green-400">
                                  {typeof entry === 'string' ? `"${entry}"` : entry}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Bytecode */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Generated Bytecode ({bytecode.length} instructions)
                    </label>
                    <button
                      onClick={exportBinary}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FileCode className="w-4 h-4" />
                      Export Binary (.mzb)
                    </button>
                  </div>
                  <pre className="w-full h-96 px-4 py-3 bg-slate-800 text-yellow-400 font-mono text-sm rounded-lg border border-white/10 overflow-auto">
                    {formatBytecode()}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Reference</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-purple-300 mb-2">MASM Opcodes</h4>
              <div className="space-y-1 text-sm text-gray-300 font-mono">
                <div>LOAD_CONST, LOAD_VAR, STORE_VAR</div>
                <div>ADD, SUB, MUL, DIV, MOD</div>
                <div>EQ, NEQ, LT, LTE, GT, GTE</div>
                <div>AND, OR, NOT</div>
                <div>JUMP, JUMPT, JUMPF</div>
                <div>CALL, CALL_METHOD, RETURN</div>
                <div>NEW_LIST, NEW_OBJECT, GET_FIELD, SET_FIELD</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-purple-300 mb-2">MazeScript Features</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <div>✓ Variables and local scope</div>
                <div>✓ Functions with parameters</div>
                <div>✓ If/else conditionals</div>
                <div>✓ For and while loops</div>
                <div>✓ Tables/objects and lists</div>
                <div>✓ Method calls (port.COMMAND)</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/20">
            <h4 className="text-lg font-medium text-purple-300 mb-3">Data Table System</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong className="text-white">What:</strong> Strings and identifiers are stored in a separate data table, 
                referenced by label or index instead of being embedded in bytecode.
              </p>
              <p>
                <strong className="text-white">Why:</strong> Enables compact binary file generation and efficient memory usage.
              </p>
              <p>
                <strong className="text-white">Named Labels:</strong> Use descriptive names in the <code className="bg-slate-800 px-2 py-1 rounded">.data</code> section, 
                then reference them with <code className="bg-slate-800 px-2 py-1 rounded">@label_name</code>. Internally they're just numeric indices.
              </p>
              <p className="font-mono bg-slate-800 p-2 rounded mt-2">
                .data<br/>
                {'  '}forward_cmd "FORWARD"<br/>
                {'  '}motor_port port_1<br/>
                <br/>
                LOAD_CONST @motor_port<br/>
                LOAD_CONST @forward_cmd
              </p>
              <p className="mt-2">
                <strong className="text-white">Numeric References:</strong> You can also use numeric indices directly: 
                {' '}<code className="bg-slate-800 px-2 py-1 rounded">@0</code>, <code className="bg-slate-800 px-2 py-1 rounded">@1</code>, etc.
              </p>
              <p className="mt-2">
                <strong className="text-white">Bytecode Output:</strong> The compiled bytecode shows the actual numeric data table 
                addresses (0, 1, 2...), not the labels. This is what gets stored in the binary file.
              </p>
              <p className="mt-2">
                <strong className="text-white">Binary Export:</strong> Click "Export Binary" to download a .mzb file containing 
                the compiled bytecode and data table in a compact binary format.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MazeCompiler;
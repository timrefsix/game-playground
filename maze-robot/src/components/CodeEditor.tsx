import { useState } from 'react'
import './CodeEditor.css'

interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
  currentExecutingLine?: number
  currentLevel?: number
}

export function CodeEditor({ code, onChange, currentExecutingLine = -1, currentLevel = 1 }: CodeEditorProps) {
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set())

  // Determine which commands to show based on level
  const showBasicMovement = currentLevel >= 1
  const showTurning = currentLevel >= 2
  const showRepeat = currentLevel >= 4
  const showSensors = currentLevel >= 5

  const handleCommandClick = (command: string) => {
    const newCode = code ? `${code}\n${command}` : command
    onChange(newCode)
  }

  const dismissTip = (tipId: string) => {
    setDismissedTips(prev => new Set([...prev, tipId]))
  }

  // Generate placeholder based on available commands
  const getPlaceholder = () => {
    const commands = ['(forward)']
    if (showTurning) {
      commands.push('(turn left)', '(turn right)')
    }
    if (showRepeat) {
      commands.push('(repeat N (...))')
    }
    if (showSensors) {
      commands.push('(if (sensor direction) (...))', '(if (not (sensor direction)) (...))')
    }

    const commandsList = commands.map(cmd => `;   ${cmd}`).join('\n')
    const example = showTurning
      ? ['(forward)', '(turn right)', '(forward)']
      : ['(forward)', '(forward)']

    return `; Write your commands here\n; Available commands:\n${commandsList}\n;\n; Example:\n${example.join('\n')}`
  }

  const lines = code ? code.split('\n') : ['']
  const lineNumbers = lines.map((_, index) => {
    const isExecuting = index === currentExecutingLine
    return (
      <div key={index} className={`line-number ${isExecuting ? 'executing' : ''}`}>
        {isExecuting && <span className="execution-pointer">▶</span>}
        {index + 1}
      </div>
    )
  })

  return (
    <div className="code-editor-wrapper">
      <div className="code-editor-container">
        {code && (
          <div className="line-numbers">
            {lineNumbers}
          </div>
        )}
        <textarea
          className="code-editor"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholder()}
          spellCheck={false}
        />
      </div>
      <div className="help">
        <h4>Available Commands:</h4>
        <ul>
          {showBasicMovement && (
            <li>
              <code onClick={() => handleCommandClick('(forward)')} className="clickable">
                (forward)
              </code>{' '}
              - Move one step forward
            </li>
          )}
          {showTurning && (
            <>
              <li>
                <code onClick={() => handleCommandClick('(turn left)')} className="clickable">
                  (turn left)
                </code>{' '}
                - Turn 90° left
              </li>
              <li>
                <code onClick={() => handleCommandClick('(turn right)')} className="clickable">
                  (turn right)
                </code>{' '}
                - Turn 90° right
              </li>
            </>
          )}
          {showRepeat && (
            <li>
              <code
                onClick={() => handleCommandClick('(repeat 3\n  (forward)\n)')}
                className="clickable"
              >
                (repeat N ...)
              </code>{' '}
              - Repeat commands N times
            </li>
          )}
          {showSensors && (
            <>
              <li>
                <code
                  onClick={() => handleCommandClick('(if (sensor front)\n  (turn left)\n)')}
                  className="clickable"
                >
                  (if (sensor direction) ...)
                </code>{' '}
                - Execute if wall detected (front/back/left/right)
              </li>
              <li>
                <code
                  onClick={() => handleCommandClick('(if (not (sensor front))\n  (forward)\n)')}
                  className="clickable"
                >
                  (if (not (sensor direction)) ...)
                </code>{' '}
                - Execute if no wall detected
              </li>
            </>
          )}
        </ul>
        {!dismissedTips.has('comments') && (
          <p className="tip" onClick={() => dismissTip('comments')}>
            💡 Tip: Lines starting with ;, #, or // are comments
            <span className="dismiss-icon">✕</span>
          </p>
        )}
        {showSensors && !dismissedTips.has('sensors') && (
          <p className="tip" onClick={() => dismissTip('sensors')}>
            🔍 Tip: Use sensors to detect walls and make decisions
            <span className="dismiss-icon">✕</span>
          </p>
        )}
        {!dismissedTips.has('click-commands') && (
          <p className="tip" onClick={() => dismissTip('click-commands')}>
            ✨ Tip: Click commands above to add them to your code
            <span className="dismiss-icon">✕</span>
          </p>
        )}
      </div>
    </div>
  )
}

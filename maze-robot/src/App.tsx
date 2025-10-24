import { useState, useEffect, useRef } from 'react'
import { LevelSelector } from './components/LevelSelector'
import { LevelInfo } from './components/LevelInfo'
import { MazeDisplay } from './components/MazeDisplay'
import { CodeEditor } from './components/CodeEditor'
import { Controls } from './components/Controls'
import { Message } from './components/Message'
import { RobotInterpreter } from './RobotInterpreter'
import { Parser } from './Parser'
import { ASTExecutor } from './ASTExecutor'
import { LEVELS } from './levels'
import './App.css'

const EXECUTION_INTERVAL = import.meta.env.VITE_TEST_FAST === 'true' ? 50 : 500

function App() {
  const [currentLevel, setCurrentLevel] = useState(0)
  const [code, setCode] = useState('')
  const [interpreter, setInterpreter] = useState<RobotInterpreter | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [_executionStep, setExecutionStep] = useState(0)
  const [currentExecutingLine, setCurrentExecutingLine] = useState<number>(-1)
  const [message, setMessage] = useState('')
  const [hasCompleted, setHasCompleted] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const executorRef = useRef<ASTExecutor | null>(null)

  const level = LEVELS[currentLevel]

  useEffect(() => {
    resetExecution()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const resetExecution = () => {
    setIsPlaying(false)
    setExecutionStep(0)
    setCurrentExecutingLine(-1)
    setMessage('')
    setHasCompleted(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    const newInterpreter = new RobotInterpreter(
      level.maze,
      level.startPos,
      level.startDir
    )
    setInterpreter(newInterpreter)
    executorRef.current = null
  }

  const executeStep = () => {
    if (!interpreter) return

    // Create executor if it doesn't exist
    if (!executorRef.current) {
      try {
        const parser = new Parser(code)
        const ast = parser.parse()
        executorRef.current = new ASTExecutor(interpreter, ast)
      } catch (error) {
        setMessage(`❌ Error parsing code: ${error}`)
        setHasCompleted(false)
        setIsPlaying(false)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        return
      }
    }

    // Execute one step
    const result = executorRef.current.executeStep()

    // Update the current executing line for visual feedback
    setCurrentExecutingLine(result.line ?? -1)

    if (interpreter.error) {
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setMessage(`❌ Error: ${interpreter.error}`)
      setHasCompleted(false)
      return
    }

    if (interpreter.completed) {
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setMessage('🎉 Level completed! Great job!')
      setHasCompleted(true)
      return
    }

    if (!result.hasMore) {
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (!interpreter.completed && !interpreter.error) {
        setMessage("⚠️ Didn't reach the goal. Try again!")
        setHasCompleted(false)
      }
      return
    }

    // Force re-render by creating new reference
    setInterpreter(Object.assign(Object.create(Object.getPrototypeOf(interpreter)), interpreter))
  }

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      // Reset the robot state before playing
      resetExecution()
      setMessage('')

      setIsPlaying(true)
      intervalRef.current = window.setInterval(executeStep, EXECUTION_INTERVAL)
    }
  }

  const handleStep = () => {
    if (!isPlaying) {
      setMessage('')
      executeStep()
    }
  }

  const handleReset = () => {
    resetExecution()
    // Don't clear the code - user feedback requested this
  }

  const handleSelectLevel = (index: number) => {
    setCurrentLevel(index)
    setCode('')
  }

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(currentLevel + 1)
      setCode('')
    }
  }

  if (!interpreter) {
    return <div>Loading...</div>
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 Maze Robot</h1>
        <LevelSelector
          levels={LEVELS}
          currentLevel={currentLevel}
          onSelectLevel={handleSelectLevel}
        />
      </header>

      <div className="content">
        <div className="left-panel">
          <LevelInfo name={level.name} description={level.description} />

          <MazeDisplay
            maze={level.maze}
            robotPos={interpreter.pos}
            robotDir={interpreter.dir}
            visited={interpreter.getVisitedPositions()}
            fogOfWar={level.fogOfWar}
          />

          {message && (
            <Message
              text={message}
              isSuccess={hasCompleted}
              showNextLevel={hasCompleted && currentLevel < LEVELS.length - 1}
              onNextLevel={nextLevel}
            />
          )}
        </div>

        <div className="right-panel">
          <div className="editor-header">
            <h3>Code</h3>
            <Controls
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onStep={handleStep}
              onReset={handleReset}
            />
          </div>

          <CodeEditor
            code={code}
            onChange={setCode}
            currentExecutingLine={currentExecutingLine}
            currentLevel={level.id}
          />
        </div>
      </div>
    </div>
  )
}

export default App

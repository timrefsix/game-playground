import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Controls } from './Controls'

describe('Controls', () => {
  it('should render all control buttons', () => {
    render(
      <Controls
        isPlaying={false}
        onPlay={() => {}}
        onStep={() => {}}
        onReset={() => {}}
      />
    )

    expect(screen.getByTitle('Play')).toBeInTheDocument()
    expect(screen.getByTitle('Step')).toBeInTheDocument()
    expect(screen.getByTitle('Reset')).toBeInTheDocument()
  })

  it('should show Play button when not playing', () => {
    render(
      <Controls
        isPlaying={false}
        onPlay={() => {}}
        onStep={() => {}}
        onReset={() => {}}
      />
    )

    expect(screen.getByTitle('Play')).toBeInTheDocument()
  })

  it('should show Pause button when playing', () => {
    render(
      <Controls
        isPlaying={true}
        onPlay={() => {}}
        onStep={() => {}}
        onReset={() => {}}
      />
    )

    expect(screen.getByTitle('Pause')).toBeInTheDocument()
  })

  it('should call onPlay when play button is clicked', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()

    render(
      <Controls
        isPlaying={false}
        onPlay={onPlay}
        onStep={() => {}}
        onReset={() => {}}
      />
    )

    await user.click(screen.getByTitle('Play'))
    expect(onPlay).toHaveBeenCalledOnce()
  })

  it('should call onStep when step button is clicked', async () => {
    const user = userEvent.setup()
    const onStep = vi.fn()

    render(
      <Controls
        isPlaying={false}
        onPlay={() => {}}
        onStep={onStep}
        onReset={() => {}}
      />
    )

    await user.click(screen.getByTitle('Step'))
    expect(onStep).toHaveBeenCalledOnce()
  })

  it('should call onReset when reset button is clicked', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()

    render(
      <Controls
        isPlaying={false}
        onPlay={() => {}}
        onStep={() => {}}
        onReset={onReset}
      />
    )

    await user.click(screen.getByTitle('Reset'))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('should disable step button when playing', () => {
    render(
      <Controls
        isPlaying={true}
        onPlay={() => {}}
        onStep={() => {}}
        onReset={() => {}}
      />
    )

    expect(screen.getByTitle('Step')).toBeDisabled()
  })

  it('should enable step button when not playing', () => {
    render(
      <Controls
        isPlaying={false}
        onPlay={() => {}}
        onStep={() => {}}
        onReset={() => {}}
      />
    )

    expect(screen.getByTitle('Step')).not.toBeDisabled()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeEditor } from './CodeEditor'

describe('CodeEditor', () => {
  it('should render textarea', () => {
    render(<CodeEditor code="" onChange={() => {}} />)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('should display current code value', () => {
    const code = '(forward)\n(turn left)'
    render(<CodeEditor code={code} onChange={() => {}} />)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue(code)
  })

  it('should call onChange when text is typed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<CodeEditor code="" onChange={onChange} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '(forward)')

    expect(onChange).toHaveBeenCalled()
  })

  it('should display placeholder text', () => {
    render(<CodeEditor code="" onChange={() => {}} />)

    const textarea = screen.getByPlaceholderText(/Write your commands here/)
    expect(textarea).toBeInTheDocument()
  })

  it('should display tip about comments', () => {
    render(<CodeEditor code="" onChange={() => {}} />)

    expect(screen.getByText(/Lines starting with ;, #, or \/\//)).toBeInTheDocument()
  })

  describe('Level-specific commands', () => {
    it('should show only forward on level 1', () => {
      render(<CodeEditor code="" onChange={() => {}} currentLevel={1} />)

      expect(screen.getByText('(forward)')).toBeInTheDocument()
      expect(screen.queryByText('(turn left)')).not.toBeInTheDocument()
      expect(screen.queryByText('(turn right)')).not.toBeInTheDocument()
    })

    it('should show forward and turning commands on level 2', () => {
      render(<CodeEditor code="" onChange={() => {}} currentLevel={2} />)

      expect(screen.getByText('(forward)')).toBeInTheDocument()
      expect(screen.getByText('(turn left)')).toBeInTheDocument()
      expect(screen.getByText('(turn right)')).toBeInTheDocument()
      expect(screen.queryByText(/\(repeat N/)).not.toBeInTheDocument()
    })

    it('should show forward and turning commands on level 3', () => {
      render(<CodeEditor code="" onChange={() => {}} currentLevel={3} />)

      expect(screen.getByText('(forward)')).toBeInTheDocument()
      expect(screen.getByText('(turn left)')).toBeInTheDocument()
      expect(screen.getByText('(turn right)')).toBeInTheDocument()
      expect(screen.queryByText(/\(repeat N/)).not.toBeInTheDocument()
    })

    it('should show repeat command starting from level 4', () => {
      render(<CodeEditor code="" onChange={() => {}} currentLevel={4} />)

      expect(screen.getByText('(forward)')).toBeInTheDocument()
      expect(screen.getByText('(turn left)')).toBeInTheDocument()
      expect(screen.getByText('(turn right)')).toBeInTheDocument()
      expect(screen.getByText(/\(repeat N/)).toBeInTheDocument()
      expect(screen.queryByText(/\(if \(sensor/)).not.toBeInTheDocument()
    })

    it('should show sensor commands starting from level 5', () => {
      render(<CodeEditor code="" onChange={() => {}} currentLevel={5} />)

      expect(screen.getByText('(forward)')).toBeInTheDocument()
      expect(screen.getByText('(turn left)')).toBeInTheDocument()
      expect(screen.getByText('(turn right)')).toBeInTheDocument()
      expect(screen.getByText(/\(repeat N/)).toBeInTheDocument()
      expect(screen.getAllByText(/\(if \(sensor/).length).toBeGreaterThan(0)
      expect(screen.getByText(/\(if \(not \(sensor/)).toBeInTheDocument()
    })

    it('should only show sensor tip on level 5+', () => {
      const { rerender } = render(<CodeEditor code="" onChange={() => {}} currentLevel={4} />)

      expect(screen.queryByText(/Use sensors to detect walls/)).not.toBeInTheDocument()

      rerender(<CodeEditor code="" onChange={() => {}} currentLevel={5} />)
      expect(screen.getByText(/Use sensors to detect walls/)).toBeInTheDocument()
    })
  })

  it('should dismiss tip when clicked', async () => {
    const user = userEvent.setup()
    render(<CodeEditor code="" onChange={() => {}} />)

    // Verify tip is initially visible
    const tip = screen.getByText(/Lines starting with ;, #, or \/\//)
    expect(tip).toBeInTheDocument()

    // Click to dismiss
    await user.click(tip)

    // Verify tip is no longer visible
    expect(screen.queryByText(/Lines starting with # are comments/)).not.toBeInTheDocument()
  })

  it('should dismiss multiple tips independently', async () => {
    const user = userEvent.setup()
    // Use level 5 to have all tips visible
    render(<CodeEditor code="" onChange={() => {}} currentLevel={5} />)

    // Verify all tips are initially visible
    const commentsTip = screen.getByText(/Lines starting with ;, #, or \/\//)
    const sensorsTip = screen.getByText(/Use sensors to detect walls/)
    const clickCommandsTip = screen.getByText(/Click commands above/)

    expect(commentsTip).toBeInTheDocument()
    expect(sensorsTip).toBeInTheDocument()
    expect(clickCommandsTip).toBeInTheDocument()

    // Dismiss first tip
    await user.click(commentsTip)
    expect(screen.queryByText(/Lines starting with # are comments/)).not.toBeInTheDocument()

    // Other tips should still be visible
    expect(screen.getByText(/Use sensors to detect walls/)).toBeInTheDocument()
    expect(screen.getByText(/Click commands above/)).toBeInTheDocument()

    // Dismiss second tip
    await user.click(sensorsTip)
    expect(screen.queryByText(/Use sensors to detect walls/)).not.toBeInTheDocument()

    // Third tip should still be visible
    expect(screen.getByText(/Click commands above/)).toBeInTheDocument()
  })

  it('should show dismiss icon on hover', () => {
    const { container } = render(<CodeEditor code="" onChange={() => {}} />)

    // Find tip elements
    const tips = container.querySelectorAll('.tip')
    expect(tips.length).toBeGreaterThan(0)

    // Each tip should have a dismiss icon
    tips.forEach(tip => {
      const dismissIcon = tip.querySelector('.dismiss-icon')
      expect(dismissIcon).toBeInTheDocument()
      expect(dismissIcon).toHaveTextContent('✕')
    })
  })
})

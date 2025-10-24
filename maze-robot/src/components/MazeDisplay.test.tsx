import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MazeDisplay } from './MazeDisplay'
import { Direction, CellType } from '../types'

describe('MazeDisplay', () => {
  const simpleMaze = [
    [CellType.WALL, CellType.WALL, CellType.WALL],
    [CellType.WALL, CellType.START, CellType.END],
    [CellType.WALL, CellType.WALL, CellType.WALL],
  ]

  it('should render the maze', () => {
    const { container } = render(
      <MazeDisplay
        maze={simpleMaze}
        robotPos={{ x: 1, y: 1 }}
        robotDir={Direction.EAST}
      />
    )

    const maze = container.querySelector('.maze')
    expect(maze).toBeInTheDocument()
  })

  it('should render robot at correct position', () => {
    render(
      <MazeDisplay
        maze={simpleMaze}
        robotPos={{ x: 1, y: 1 }}
        robotDir={Direction.EAST}
      />
    )

    const robot = screen.getByText('▲')
    expect(robot).toBeInTheDocument()
  })

  it('should rotate robot based on direction - EAST (90deg)', () => {
    const { container } = render(
      <MazeDisplay
        maze={simpleMaze}
        robotPos={{ x: 1, y: 1 }}
        robotDir={Direction.EAST}
      />
    )

    const robot = container.querySelector('.robot')
    expect(robot).toHaveStyle({ '--robot-rotation': 'rotate(90deg)' })
  })

  it('should rotate robot based on direction - SOUTH (180deg)', () => {
    const { container } = render(
      <MazeDisplay
        maze={simpleMaze}
        robotPos={{ x: 1, y: 1 }}
        robotDir={Direction.SOUTH}
      />
    )

    const robot = container.querySelector('.robot')
    expect(robot).toHaveStyle({ '--robot-rotation': 'rotate(180deg)' })
  })

  it('should rotate robot based on direction - WEST (270deg)', () => {
    const { container } = render(
      <MazeDisplay
        maze={simpleMaze}
        robotPos={{ x: 1, y: 1 }}
        robotDir={Direction.WEST}
      />
    )

    const robot = container.querySelector('.robot')
    expect(robot).toHaveStyle({ '--robot-rotation': 'rotate(270deg)' })
  })

  it('should rotate robot based on direction - NORTH (0deg)', () => {
    const { container } = render(
      <MazeDisplay
        maze={simpleMaze}
        robotPos={{ x: 1, y: 1 }}
        robotDir={Direction.NORTH}
      />
    )

    const robot = container.querySelector('.robot')
    expect(robot).toHaveStyle({ '--robot-rotation': 'rotate(0deg)' })
  })

  it('should render correct cell types', () => {
    const { container } = render(
      <MazeDisplay
        maze={simpleMaze}
        robotPos={{ x: 1, y: 1 }}
        robotDir={Direction.EAST}
      />
    )

    const walls = container.querySelectorAll('.wall')
    const start = container.querySelector('.start')
    const end = container.querySelector('.end')

    expect(walls).toHaveLength(7) // 7 wall cells
    expect(start).toBeInTheDocument()
    expect(end).toBeInTheDocument()
  })

  describe('Visual Direction Tests - Verifying robot icon points in correct direction', () => {
    it('should point UP when Direction.NORTH (0)', () => {
      const { container } = render(
        <MazeDisplay
          maze={simpleMaze}
          robotPos={{ x: 1, y: 1 }}
          robotDir={Direction.NORTH}
        />
      )

      const robot = container.querySelector('.robot') as HTMLElement
      expect(robot).toBeInTheDocument()

      // NORTH = 0, so rotation should be 0deg (pointing up, which is the default ▲ direction)
      const style = robot.getAttribute('style')
      expect(style).toContain('rotate(0deg)')

      // Verify Direction.NORTH is actually 0
      expect(Direction.NORTH).toBe(0)
    })

    it('should point RIGHT when Direction.EAST (1)', () => {
      const { container } = render(
        <MazeDisplay
          maze={simpleMaze}
          robotPos={{ x: 1, y: 1 }}
          robotDir={Direction.EAST}
        />
      )

      const robot = container.querySelector('.robot') as HTMLElement

      // EAST = 1, so rotation should be 90deg (pointing right)
      const style = robot.getAttribute('style')
      expect(style).toContain('rotate(90deg)')

      // Verify Direction.EAST is actually 1
      expect(Direction.EAST).toBe(1)
    })

    it('should point DOWN when Direction.SOUTH (2)', () => {
      const { container } = render(
        <MazeDisplay
          maze={simpleMaze}
          robotPos={{ x: 1, y: 1 }}
          robotDir={Direction.SOUTH}
        />
      )

      const robot = container.querySelector('.robot') as HTMLElement

      // SOUTH = 2, so rotation should be 180deg (pointing down)
      const style = robot.getAttribute('style')
      expect(style).toContain('rotate(180deg)')

      // Verify Direction.SOUTH is actually 2
      expect(Direction.SOUTH).toBe(2)
    })

    it('should point LEFT when Direction.WEST (3)', () => {
      const { container } = render(
        <MazeDisplay
          maze={simpleMaze}
          robotPos={{ x: 1, y: 1 }}
          robotDir={Direction.WEST}
        />
      )

      const robot = container.querySelector('.robot') as HTMLElement

      // WEST = 3, so rotation should be 270deg (pointing left)
      const style = robot.getAttribute('style')
      expect(style).toContain('rotate(270deg)')

      // Verify Direction.WEST is actually 3
      expect(Direction.WEST).toBe(3)
    })

    it('should have consistent mapping: direction * 90 = rotation', () => {
      // This test verifies that the visual rotation formula is correct
      const directions = [
        { dir: Direction.NORTH, expectedRotation: 0 },
        { dir: Direction.EAST, expectedRotation: 90 },
        { dir: Direction.SOUTH, expectedRotation: 180 },
        { dir: Direction.WEST, expectedRotation: 270 },
      ]

      directions.forEach(({ dir, expectedRotation }) => {
        const { container } = render(
          <MazeDisplay
            maze={simpleMaze}
            robotPos={{ x: 1, y: 1 }}
            robotDir={dir}
          />
        )

        const robot = container.querySelector('.robot') as HTMLElement
        const style = robot.getAttribute('style')

        expect(style).toContain(`rotate(${expectedRotation}deg)`)
        expect(dir * 90).toBe(expectedRotation) // Verify formula
      })
    })
  })
})

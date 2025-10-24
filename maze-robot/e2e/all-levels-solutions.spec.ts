import { test, expect } from '@playwright/test'

test.describe('All Levels - Complete Solutions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Level 1: Straight Line - Solution', async ({ page }) => {
    // Level 1 should be selected by default
    await expect(page.getByRole('heading', { name: 'Straight Line' })).toBeVisible()

    const editor = page.getByRole('textbox')
    await editor.fill('forward\nforward\nforward\nforward')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })
  })

  test('Level 2: Simple Turn - Solution', async ({ page }) => {
    // Navigate to Level 2
    await page.getByRole('button', { name: 'Level 2' }).click()
    await expect(page.getByRole('heading', { name: 'Simple Turn' })).toBeVisible()

    const editor = page.getByRole('textbox')
    const solution = `forward
forward
turn right
forward
forward
turn left
forward
forward`

    await editor.fill(solution)
    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })
  })

  test('Level 3: Multiple Turns - Solution', async ({ page }) => {
    // Navigate to Level 3
    await page.getByRole('button', { name: 'Level 3' }).click()
    await expect(page.getByRole('heading', { name: 'Multiple Turns' })).toBeVisible()

    const editor = page.getByRole('textbox')
    const solution = `forward
forward
forward
forward
turn right
forward
turn right
forward
forward
forward
forward
turn left
forward
turn left
forward`

    await editor.fill(solution)
    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 15000 })
  })

  test('Level 4: Zigzag Challenge - Solution with repeat', async ({ page }) => {
    // Navigate to Level 4
    await page.getByRole('button', { name: 'Level 4' }).click()
    await expect(page.getByRole('heading', { name: 'Zigzag Challenge' })).toBeVisible()

    const editor = page.getByRole('textbox')
    const solution = `repeat 6 {
  forward
  forward
  forward
  forward
  forward
  forward
  forward
  forward
  forward
  forward
  forward
  turn right
  forward
  turn right
}`

    await editor.fill(solution)
    await page.getByRole('button', { name: 'Play' }).click()

    // This level is longer, so increase timeout
    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 30000 })
  })

  test('Level 4: Alternative compact solution', async ({ page }) => {
    await page.getByRole('button', { name: 'Level 4' }).click()

    const editor = page.getByRole('textbox')
    // More compact version
    const solution = `repeat 6 {
  repeat 11 {
    forward
  }
  turn right
  forward
  turn right
}`

    await editor.fill(solution)
    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 30000 })
  })

  test('Level 5: Sensor Navigation - Right-hand wall following', async ({ page }) => {
    // Navigate to Level 5
    await page.getByRole('button', { name: 'Level 5' }).click()
    await expect(page.getByRole('heading', { name: 'Sensor Navigation' })).toBeVisible()

    const editor = page.getByRole('textbox')
    const solution = `repeat 100 {
  if not sensor right {
    turn right
    forward
  }
  if not sensor front {
    forward
  }
  if sensor front {
    turn left
  }
}`

    await editor.fill(solution)
    await page.getByRole('button', { name: 'Play' }).click()

    // Sensor-based navigation might take longer
    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 30000 })
  })

  test('Level 5: Alternative simpler sensor solution', async ({ page }) => {
    await page.getByRole('button', { name: 'Level 5' }).click()

    const editor = page.getByRole('textbox')
    const solution = `repeat 100 {
  if not sensor front {
    forward
  }
  if sensor front {
    if not sensor right {
      turn right
    }
    if sensor right {
      turn left
    }
  }
}`

    await editor.fill(solution)
    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 30000 })
  })

  test('All levels: Sequential completion', async ({ page }) => {
    // Complete all levels in sequence
    const levels = [
      {
        level: 1,
        name: 'Straight Line',
        solution: 'forward\nforward\nforward\nforward'
      },
      {
        level: 2,
        name: 'Simple Turn',
        solution: 'forward\nforward\nturn right\nforward\nforward\nturn left\nforward\nforward'
      },
      {
        level: 3,
        name: 'Multiple Turns',
        solution: 'forward\nforward\nforward\nforward\nturn right\nforward\nturn right\nforward\nforward\nforward\nforward\nturn left\nforward\nturn left\nforward'
      },
      {
        level: 4,
        name: 'Zigzag Challenge',
        solution: `repeat 6 {
  repeat 11 {
    forward
  }
  turn right
  forward
  turn right
}`
      },
      {
        level: 5,
        name: 'Sensor Navigation',
        solution: `repeat 100 {
  if not sensor right {
    turn right
    forward
  }
  if not sensor front {
    forward
  }
  if sensor front {
    turn left
  }
}`
      }
    ]

    for (const level of levels) {
      if (level.level > 1) {
        await page.getByRole('button', { name: `Level ${level.level}` }).click()
      }

      await expect(page.getByRole('heading', { name: level.name })).toBeVisible()

      const editor = page.getByRole('textbox')
      await editor.fill(level.solution)
      await page.getByRole('button', { name: 'Play' }).click()

      await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 30000 })

      // Reset for next level
      await page.getByRole('button', { name: 'Reset' }).click()
    }
  })

  test('Level switching preserves functionality', async ({ page }) => {
    // Test that switching levels works correctly

    // Complete Level 1
    const editor = page.getByRole('textbox')
    await editor.fill('forward\nforward\nforward\nforward')
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })

    // Switch to Level 2
    await page.getByRole('button', { name: 'Level 2' }).click()
    await expect(page.getByRole('heading', { name: 'Simple Turn' })).toBeVisible()

    // Code should be cleared
    const editorValue = await editor.inputValue()
    expect(editorValue).toBe('')

    // Should be able to complete Level 2
    await editor.fill('forward\nforward\nturn right\nforward\nforward\nturn left\nforward\nforward')
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })

    // Go back to Level 1
    await page.getByRole('button', { name: 'Level 1' }).click()
    await expect(page.getByRole('heading', { name: 'Straight Line' })).toBeVisible()
  })

  test('Verify level-specific commands are available', async ({ page }) => {
    // Level 1: Only forward
    await expect(page.getByText('Available Commands:')).toBeVisible()
    await expect(page.getByRole('code', { name: 'forward' })).toBeVisible()
    await expect(page.getByText('turn left')).not.toBeVisible()

    // Level 2: Forward + turns
    await page.getByRole('button', { name: 'Level 2' }).click()
    await expect(page.getByText('forward')).toBeVisible()
    await expect(page.getByText('turn left')).toBeVisible()
    await expect(page.getByText('turn right')).toBeVisible()
    await expect(page.getByText(/repeat N/)).not.toBeVisible()

    // Level 4: Forward + turns + repeat
    await page.getByRole('button', { name: 'Level 4' }).click()
    await expect(page.getByText('forward')).toBeVisible()
    await expect(page.getByText('turn left')).toBeVisible()
    await expect(page.getByText(/repeat N/)).toBeVisible()
    await expect(page.getByText(/if sensor/)).not.toBeVisible()

    // Level 5: All commands including sensors
    await page.getByRole('button', { name: 'Level 5' }).click()
    await expect(page.getByText('forward')).toBeVisible()
    await expect(page.getByText('turn left')).toBeVisible()
    await expect(page.getByText(/repeat N/)).toBeVisible()
    await expect(page.getByText(/if sensor direction/)).toBeVisible()
    await expect(page.getByText(/if not sensor direction/)).toBeVisible()
  })
})

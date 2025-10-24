import { test, expect } from '@playwright/test'

test.describe('Level 2 - Simple Turn', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Level 2' }).click()
  })

  test('should display Level 2', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Simple Turn' })).toBeVisible()
    await expect(page.getByText('Learn to turn and navigate a corner')).toBeVisible()
  })

  test('should complete level with correct solution', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill(`(forward)
(forward)
(turn right)
(forward)
(forward)
(turn left)
(forward)
(forward)`)

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })
  })

  test('should fail with only forward commands', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('(forward)\n(forward)\n(forward)')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText(/Can't move forward - hit a wall!/)).toBeVisible({ timeout: 5000 })
  })

  test('should handle turns correctly', async ({ page }) => {
    const editor = page.getByRole('textbox')
    // Move forward twice, turn right - these are all valid moves
    await editor.fill('(forward)\n(forward)\n(turn right)')

    await page.getByRole('button', { name: 'Play' }).click()

    // Should not show error (valid moves)
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Can't move forward - hit a wall!/)).not.toBeVisible()
  })

  test('should navigate to Level 3 after completion', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill(`(forward)
(forward)
(turn right)
(forward)
(forward)
(turn left)
(forward)
(forward)`)

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: 'Next Level' }).click()

    await expect(page.getByRole('heading', { name: 'Multiple Turns' })).toBeVisible()
  })

  test('should reset code when switching levels', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('(forward)\n(forward)')

    await page.getByRole('button', { name: 'Level 1' }).click()

    await expect(editor).toHaveValue('')
  })
})

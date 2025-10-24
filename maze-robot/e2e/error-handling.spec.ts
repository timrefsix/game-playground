import { test, expect } from '@playwright/test'

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show error for unknown command', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('(jump)')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText(/Unknown expression 'jump'/)).toBeVisible({ timeout: 5000 })
  })

  test('should show error for hitting wall', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('(turn left)\n(forward)')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText(/Can't move forward - hit a wall!/)).toBeVisible({ timeout: 5000 })
  })

  test('should stop execution after error', async ({ page }) => {
    const editor = page.getByRole('textbox')
    // Turn left, hit wall, then try to turn right (should not execute)
    await editor.fill('(turn left)\n(forward)\n(turn right)')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText(/Can't move forward - hit a wall!/)).toBeVisible({ timeout: 5000 })

    // Wait a bit to ensure no further commands execute
    await page.waitForTimeout(1000)

    // Error message should still be visible (not replaced by success)
    await expect(page.getByText(/Can't move forward - hit a wall!/)).toBeVisible()
  })

  test('should not execute commands after reaching goal', async ({ page }) => {
    const editor = page.getByRole('textbox')
    // Complete level but add extra commands
    await editor.fill('(forward)\n(forward)\n(forward)\n(forward)\n(forward)\n(forward)')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })

    // Should not show error even though there are extra commands
    await expect(page.getByText(/Can't move forward - hit a wall!/)).not.toBeVisible()
  })

  test('should handle case-insensitive commands', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('(FORWARD)\n(Forward)\n(FoRwArD)\n(forward)')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })
  })

  test('should handle whitespace in commands', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('  (forward)\n\t(forward)\t\n   (forward)   \n (forward) ')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })
  })

  test('should show warning when not reaching goal', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('(forward)\n(forward)')

    await page.getByRole('button', { name: 'Play' }).click()

    // Wait for execution to complete
    await page.waitForTimeout(2000)

    await expect(page.getByText("⚠️ Didn't reach the goal. Try again!")).toBeVisible()
  })
})

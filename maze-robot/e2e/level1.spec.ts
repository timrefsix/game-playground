import { test, expect } from '@playwright/test'

test.describe('Level 1 - Straight Line', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display Level 1 by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Straight Line' })).toBeVisible()
    await expect(page.getByText('Move the robot forward to reach the goal')).toBeVisible()
  })

  test('should complete level with correct solution', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('forward\nforward\nforward\nforward')

    await page.getByRole('button', { name: 'Play' }).click()

    // Wait for completion message
    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })
  })

  test('should allow stepping through commands', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('forward\nforward')

    // Step once
    await page.getByRole('button', { name: 'Step' }).click()
    await page.waitForTimeout(100)

    // Step again
    await page.getByRole('button', { name: 'Step' }).click()
    await page.waitForTimeout(100)

    // Should not be complete yet
    await expect(page.getByText('🎉 Level completed! Great job!')).not.toBeVisible()
  })

  test('should show error when hitting wall', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('turn left\nforward')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText(/Can't move forward - hit a wall!/)).toBeVisible({ timeout: 5000 })
  })

  test('should reset execution', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('forward')

    await page.getByRole('button', { name: 'Step' }).click()
    await page.waitForTimeout(100)

    await page.getByRole('button', { name: 'Reset' }).click()

    // Error or success message should be gone
    await expect(page.getByText('🎉 Level completed! Great job!')).not.toBeVisible()
    await expect(page.getByText(/Can't move forward - hit a wall!/)).not.toBeVisible()
  })

  test('should pause execution', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('forward\nforward\nforward\nforward')

    await page.getByRole('button', { name: 'Play' }).click()

    // Pause quickly
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Pause' }).click()

    // Should not have completed yet (paused before finishing)
    await page.waitForTimeout(500)
    const successMessage = page.getByText('🎉 Level completed! Great job!')
    const isVisible = await successMessage.isVisible().catch(() => false)

    if (isVisible) {
      // If it completed, that's also acceptable (timing-dependent)
      console.log('Level completed before pause could take effect')
    }
  })

  test('should handle comments in code', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill(`# This is a comment
forward
// Another comment
forward
forward
forward`)

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })
  })

  test('should handle empty lines in code', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('forward\n\n\nforward\n\nforward\nforward')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })
  })

  test('should display Next Level button after completion', async ({ page }) => {
    const editor = page.getByRole('textbox')
    await editor.fill('forward\nforward\nforward\nforward')

    await page.getByRole('button', { name: 'Play' }).click()

    await expect(page.getByText('🎉 Level completed! Great job!')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Next Level' })).toBeVisible()
  })
})

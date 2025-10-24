import { test, expect } from '@playwright/test';

test.describe('Maze Compiler UI', () => {
  test('compiles MASM and surfaces bytecode', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Maze Compiler Studio' })).toBeVisible();

    await page.getByRole('button', { name: 'Compile to Bytecode' }).click();

    await expect(page.getByTestId('bytecode-section')).toBeVisible();
    await expect(page.getByTestId('data-table-card')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Binary (.mzb)' })).toBeEnabled();
    await expect(page.getByTestId('compile-status')).toHaveText(/Build ready/i);
  });

  test('transpiles MazeScript and reveals generated MASM preview', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /MazeScript/ }).click();

    const editor = page.getByLabel('MazeScript Code');
    await expect(editor).toBeVisible();

    await page.getByRole('button', { name: 'Compile to MASM & Bytecode' }).click();
    await expect(page.getByText('Generated MASM')).toBeVisible();
    const bytecodeSection = page.getByTestId('bytecode-section');
    await expect(bytecodeSection).toBeVisible();
    await expect(bytecodeSection.getByText('HALT', { exact: false })).toBeVisible();
  });

  test('lists robot modules with their commands', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /Robot Modules/ }).click();

    const moduleCard = page.getByTestId('module-port_1');
    await expect(moduleCard).toBeVisible();
    await expect(moduleCard.getByText('FORWARD', { exact: true })).toBeVisible();
    await expect(moduleCard.getByText('TURN_LEFT', { exact: true })).toBeVisible();
  });
});

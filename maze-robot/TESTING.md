# Testing Documentation

This project includes comprehensive testing using Vitest for unit tests and Playwright for end-to-end tests.

## Test Coverage

### Unit Tests (60 tests)

#### RobotInterpreter (39 tests)
- **Initialization**: Tests for correct starting position, direction, path, completion status, and error state
- **moveForward**: Tests for moving in current direction, path tracking, goal completion, wall collision detection
- **turnLeft/turnRight**: Tests for all four directions and rotation logic
- **execute**: Tests for command parsing, case insensitivity, whitespace handling, unknown commands, error states

#### parseCode Utility (10 tests)
- Single and multiple command parsing
- Whitespace trimming
- Empty line filtering
- Comment filtering (both `#` and `//`)
- Edge cases (empty code, only comments)

#### Component Tests (11 tests)
- **MazeDisplay**: Rendering, robot positioning, rotation based on direction, cell types
- **CodeEditor**: Textarea rendering, value display, onChange handling, placeholder, help text
- **Controls**: Button rendering, play/pause toggle, click handlers, disabled states

### End-to-End Tests (Playwright)

#### Level 1 Tests
- Level display and description
- Successful completion with correct solution
- Step-by-step execution
- Wall collision error handling
- Reset functionality
- Pause functionality
- Comment and empty line handling
- Next Level button display

#### Level 2 Tests
- Level switching
- Complex navigation with turns
- Turn command handling
- Level progression
- Code reset on level change

#### Error Handling Tests
- Unknown command errors
- Wall collision errors
- Execution stopping after errors
- Commands after goal reached
- Case-insensitive command parsing
- Whitespace handling
- Incomplete solution warnings

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm test -- --coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/level1.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Test Structure

```
maze-robot/
├── src/
│   ├── RobotInterpreter.test.ts       # Unit tests for interpreter
│   ├── components/
│   │   ├── MazeDisplay.test.tsx       # MazeDisplay component tests
│   │   ├── CodeEditor.test.tsx        # CodeEditor component tests
│   │   └── Controls.test.tsx          # Controls component tests
│   └── test/
│       └── setup.ts                    # Test setup and configuration
├── e2e/
│   ├── level1.spec.ts                  # Level 1 E2E tests
│   ├── level2.spec.ts                  # Level 2 E2E tests
│   └── error-handling.spec.ts          # Error handling E2E tests
├── vitest.config.ts                    # Vitest configuration
└── playwright.config.ts                # Playwright configuration
```

## CI/CD Integration

The test suite is designed to run in CI environments:

- **Vitest**: Runs in headless mode by default
- **Playwright**:
  - Automatically starts dev server
  - Retries failed tests in CI
  - Generates HTML report
  - Uses single worker in CI for stability

## Writing New Tests

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'

describe('MyComponent', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = myFunction(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('should complete level', async ({ page }) => {
  await page.goto('/')

  const editor = page.getByRole('textbox')
  await editor.fill('forward')

  await page.getByRole('button', { name: 'Play' }).click()

  await expect(page.getByText('Level completed!')).toBeVisible()
})
```

## Test Best Practices

1. **Isolation**: Each test should be independent
2. **Clear Names**: Test names should describe what is being tested
3. **AAA Pattern**: Arrange, Act, Assert structure
4. **Wait for Effects**: Use proper async/await and waitFor utilities
5. **Accessibility**: Use semantic queries (getByRole, getByLabel, etc.)
6. **Clean Up**: Tests automatically clean up after each run

## Debugging Tests

### Vitest
- Use `it.only()` to run a single test
- Use `console.log()` for debugging
- Check test output in terminal

### Playwright
- Use `--debug` flag to debug tests
- Use `page.pause()` to pause execution
- Check browser console in headed mode
- Review trace files for failed tests
- Use VS Code Playwright extension for debugging

## Known Issues

None currently. All tests passing ✅

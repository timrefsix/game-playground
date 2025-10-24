# Maze Robot

A web-based educational game inspired by Logo turtle programming. Players write simple code to navigate a robot through progressively challenging mazes.

## Features

- **Simple Programming Language**: Use intuitive commands like `forward`, `turn left`, and `turn right`
- **Progressive Difficulty**: Start with straight paths and advance to complex maze navigation
- **Interactive Controls**: Play, pause, step through, and reset execution
- **Visual Feedback**: Watch the robot move in real-time as your code executes
- **Multiple Levels**: Three built-in levels with increasing complexity

## Commands

- `forward` or `move forward` - Move one step forward
- `turn left` or `left` - Turn 90° counterclockwise
- `turn right` or `right` - Turn 90° clockwise
- Lines starting with `#` are comments

## Example Solution (Level 1)

```
# Move forward to reach the goal
forward
forward
forward
forward
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Future Enhancements

- Loop syntax (`repeat N { ... }`)
- Conditional execution (`if`, `while`)
- Advanced maze elements (one-way doors, keys, etc.)
- Community-created levels
- Visual programming blocks

See [DESIGN.md](./DESIGN.md) for the full design document.

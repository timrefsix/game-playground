import React, { useState, useEffect } from 'react';
import { RefreshCw, Download } from 'lucide-react';

export default function MazeGenerator() {
  const [rows, setRows] = useState(15);
  const [cols, setCols] = useState(15);
  const [maze, setMaze] = useState([]);
  const [cellSize, setCellSize] = useState(25);
  const [isGenerating, setIsGenerating] = useState(false);
  const [algorithm, setAlgorithm] = useState('recursive-backtracking');
  const [loopFactor, setLoopFactor] = useState(0);

  const algorithms = [
    { value: 'recursive-backtracking', label: 'Recursive Backtracking', description: 'Creates perfect mazes with long corridors' },
    { value: 'prims', label: "Prim's Algorithm", description: 'Creates mazes with many short dead ends' },
    { value: 'kruskals', label: "Kruskal's Algorithm", description: 'Random spanning tree approach' },
    { value: 'binary-tree', label: 'Binary Tree', description: 'Fast, biased toward NW-SE diagonal' },
    { value: 'hunt-and-kill', label: 'Hunt and Kill', description: 'Mix of long passages and random connections' }
  ];

  // Initialize grid with all walls
  const initializeGrid = (numRows, numCols) => {
    return Array(numRows).fill(null).map(() => 
      Array(numCols).fill(null).map(() => ({
        top: true,
        right: true,
        bottom: true,
        left: true,
        visited: false,
        set: null
      }))
    );
  };

  // Add loops by removing random walls
  const addLoops = (grid, factor) => {
    if (factor === 0) return grid;
    
    const numRows = grid.length;
    const numCols = grid[0].length;
    const totalWalls = numRows * numCols * 2; // Approximate internal walls
    const wallsToRemove = Math.floor(totalWalls * factor / 100);
    
    for (let i = 0; i < wallsToRemove; i++) {
      const row = Math.floor(Math.random() * numRows);
      const col = Math.floor(Math.random() * numCols);
      const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      
      if (direction === 'horizontal' && col < numCols - 1) {
        grid[row][col].right = false;
        grid[row][col + 1].left = false;
      } else if (direction === 'vertical' && row < numRows - 1) {
        grid[row][col].bottom = false;
        grid[row + 1][col].top = false;
      }
    }
    
    return grid;
  };

  // Recursive Backtracking Algorithm
  const generateRecursiveBacktracking = (numRows, numCols) => {
    const grid = initializeGrid(numRows, numCols);
    const stack = [];
    let currentRow = 0;
    let currentCol = 0;
    grid[currentRow][currentCol].visited = true;
    let visitedCount = 1;
    const totalCells = numRows * numCols;

    // Recursive backtracking
    while (visitedCount < totalCells) {
      const neighbors = [];

      // Check all four directions
      if (currentRow > 0 && !grid[currentRow - 1][currentCol].visited) {
        neighbors.push({ row: currentRow - 1, col: currentCol, dir: 'top' });
      }
      if (currentCol < numCols - 1 && !grid[currentRow][currentCol + 1].visited) {
        neighbors.push({ row: currentRow, col: currentCol + 1, dir: 'right' });
      }
      if (currentRow < numRows - 1 && !grid[currentRow + 1][currentCol].visited) {
        neighbors.push({ row: currentRow + 1, col: currentCol, dir: 'bottom' });
      }
      if (currentCol > 0 && !grid[currentRow][currentCol - 1].visited) {
        neighbors.push({ row: currentRow, col: currentCol - 1, dir: 'left' });
      }

      if (neighbors.length > 0) {
        // Choose random neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Remove walls between current cell and chosen neighbor
        if (next.dir === 'top') {
          grid[currentRow][currentCol].top = false;
          grid[next.row][next.col].bottom = false;
        } else if (next.dir === 'right') {
          grid[currentRow][currentCol].right = false;
          grid[next.row][next.col].left = false;
        } else if (next.dir === 'bottom') {
          grid[currentRow][currentCol].bottom = false;
          grid[next.row][next.col].top = false;
        } else if (next.dir === 'left') {
          grid[currentRow][currentCol].left = false;
          grid[next.row][next.col].right = false;
        }

        // Mark as visited and move to next cell
        grid[next.row][next.col].visited = true;
        stack.push({ row: currentRow, col: currentCol });
        currentRow = next.row;
        currentCol = next.col;
        visitedCount++;
      } else if (stack.length > 0) {
        // Backtrack
        const prev = stack.pop();
        currentRow = prev.row;
        currentCol = prev.col;
      }
    }

    return grid;
  };

  // Prim's Algorithm
  const generatePrims = (numRows, numCols) => {
    const grid = initializeGrid(numRows, numCols);
    const walls = [];
    
    // Start with random cell
    const startRow = Math.floor(Math.random() * numRows);
    const startCol = Math.floor(Math.random() * numCols);
    grid[startRow][startCol].visited = true;
    
    // Add walls of starting cell
    const addWalls = (row, col) => {
      if (row > 0) walls.push({ row, col, direction: 'top' });
      if (col < numCols - 1) walls.push({ row, col, direction: 'right' });
      if (row < numRows - 1) walls.push({ row, col, direction: 'bottom' });
      if (col > 0) walls.push({ row, col, direction: 'left' });
    };
    
    addWalls(startRow, startCol);
    
    while (walls.length > 0) {
      const wallIndex = Math.floor(Math.random() * walls.length);
      const wall = walls.splice(wallIndex, 1)[0];
      const { row, col, direction } = wall;
      
      let nextRow = row;
      let nextCol = col;
      
      if (direction === 'top') nextRow--;
      else if (direction === 'right') nextCol++;
      else if (direction === 'bottom') nextRow++;
      else if (direction === 'left') nextCol--;
      
      if (nextRow >= 0 && nextRow < numRows && nextCol >= 0 && nextCol < numCols) {
        if (!grid[nextRow][nextCol].visited) {
          // Remove wall
          if (direction === 'top') {
            grid[row][col].top = false;
            grid[nextRow][nextCol].bottom = false;
          } else if (direction === 'right') {
            grid[row][col].right = false;
            grid[nextRow][nextCol].left = false;
          } else if (direction === 'bottom') {
            grid[row][col].bottom = false;
            grid[nextRow][nextCol].top = false;
          } else if (direction === 'left') {
            grid[row][col].left = false;
            grid[nextRow][nextCol].right = false;
          }
          
          grid[nextRow][nextCol].visited = true;
          addWalls(nextRow, nextCol);
        }
      }
    }
    
    return grid;
  };

  // Kruskal's Algorithm
  const generateKruskals = (numRows, numCols) => {
    const grid = initializeGrid(numRows, numCols);
    const walls = [];
    
    // Initialize each cell as its own set
    let setId = 0;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        grid[row][col].set = setId++;
        if (col < numCols - 1) walls.push({ row, col, direction: 'right' });
        if (row < numRows - 1) walls.push({ row, col, direction: 'bottom' });
      }
    }
    
    // Shuffle walls
    for (let i = walls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [walls[i], walls[j]] = [walls[j], walls[i]];
    }
    
    // Union-find helper functions
    const findSet = (row, col) => {
      return grid[row][col].set;
    };
    
    const unionSets = (set1, set2) => {
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          if (grid[row][col].set === set2) {
            grid[row][col].set = set1;
          }
        }
      }
    };
    
    // Process walls
    for (const wall of walls) {
      const { row, col, direction } = wall;
      let nextRow = row;
      let nextCol = col;
      
      if (direction === 'right') nextCol++;
      else if (direction === 'bottom') nextRow++;
      
      const set1 = findSet(row, col);
      const set2 = findSet(nextRow, nextCol);
      
      if (set1 !== set2) {
        // Remove wall
        if (direction === 'right') {
          grid[row][col].right = false;
          grid[nextRow][nextCol].left = false;
        } else if (direction === 'bottom') {
          grid[row][col].bottom = false;
          grid[nextRow][nextCol].top = false;
        }
        unionSets(set1, set2);
      }
    }
    
    return grid;
  };

  // Binary Tree Algorithm
  const generateBinaryTree = (numRows, numCols) => {
    const grid = initializeGrid(numRows, numCols);
    
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const directions = [];
        if (row > 0) directions.push('top');
        if (col > 0) directions.push('left');
        
        if (directions.length > 0) {
          const direction = directions[Math.floor(Math.random() * directions.length)];
          
          if (direction === 'top') {
            grid[row][col].top = false;
            grid[row - 1][col].bottom = false;
          } else if (direction === 'left') {
            grid[row][col].left = false;
            grid[row][col - 1].right = false;
          }
        }
      }
    }
    
    return grid;
  };

  // Hunt and Kill Algorithm
  const generateHuntAndKill = (numRows, numCols) => {
    const grid = initializeGrid(numRows, numCols);
    let currentRow = 0;
    let currentCol = 0;
    grid[currentRow][currentCol].visited = true;
    
    const getUnvisitedNeighbors = (row, col) => {
      const neighbors = [];
      if (row > 0 && !grid[row - 1][col].visited) {
        neighbors.push({ row: row - 1, col, dir: 'top' });
      }
      if (col < numCols - 1 && !grid[row][col + 1].visited) {
        neighbors.push({ row, col: col + 1, dir: 'right' });
      }
      if (row < numRows - 1 && !grid[row + 1][col].visited) {
        neighbors.push({ row: row + 1, col, dir: 'bottom' });
      }
      if (col > 0 && !grid[row][col - 1].visited) {
        neighbors.push({ row, col: col - 1, dir: 'left' });
      }
      return neighbors;
    };
    
    const getVisitedNeighbors = (row, col) => {
      const neighbors = [];
      if (row > 0 && grid[row - 1][col].visited) {
        neighbors.push({ row: row - 1, col, dir: 'top' });
      }
      if (col < numCols - 1 && grid[row][col + 1].visited) {
        neighbors.push({ row, col: col + 1, dir: 'right' });
      }
      if (row < numRows - 1 && grid[row + 1][col].visited) {
        neighbors.push({ row: row + 1, col, dir: 'bottom' });
      }
      if (col > 0 && grid[row][col - 1].visited) {
        neighbors.push({ row, col: col - 1, dir: 'left' });
      }
      return neighbors;
    };
    
    while (true) {
      // Kill: walk randomly until no unvisited neighbors
      let neighbors = getUnvisitedNeighbors(currentRow, currentCol);
      while (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Remove wall
        if (next.dir === 'top') {
          grid[currentRow][currentCol].top = false;
          grid[next.row][next.col].bottom = false;
        } else if (next.dir === 'right') {
          grid[currentRow][currentCol].right = false;
          grid[next.row][next.col].left = false;
        } else if (next.dir === 'bottom') {
          grid[currentRow][currentCol].bottom = false;
          grid[next.row][next.col].top = false;
        } else if (next.dir === 'left') {
          grid[currentRow][currentCol].left = false;
          grid[next.row][next.col].right = false;
        }
        
        currentRow = next.row;
        currentCol = next.col;
        grid[currentRow][currentCol].visited = true;
        neighbors = getUnvisitedNeighbors(currentRow, currentCol);
      }
      
      // Hunt: find unvisited cell with visited neighbor
      let found = false;
      for (let row = 0; row < numRows && !found; row++) {
        for (let col = 0; col < numCols && !found; col++) {
          if (!grid[row][col].visited) {
            const visitedNeighbors = getVisitedNeighbors(row, col);
            if (visitedNeighbors.length > 0) {
              const next = visitedNeighbors[Math.floor(Math.random() * visitedNeighbors.length)];
              
              // Remove wall
              if (next.dir === 'top') {
                grid[row][col].top = false;
                grid[next.row][next.col].bottom = false;
              } else if (next.dir === 'right') {
                grid[row][col].right = false;
                grid[next.row][next.col].left = false;
              } else if (next.dir === 'bottom') {
                grid[row][col].bottom = false;
                grid[next.row][next.col].top = false;
              } else if (next.dir === 'left') {
                grid[row][col].left = false;
                grid[next.row][next.col].right = false;
              }
              
              currentRow = row;
              currentCol = col;
              grid[currentRow][currentCol].visited = true;
              found = true;
            }
          }
        }
      }
      
      if (!found) break;
    }
    
    return grid;
  };

  // Main maze generation function
  const generateMaze = (numRows, numCols, algo) => {
    setIsGenerating(true);
    
    let grid;
    switch (algo) {
      case 'prims':
        grid = generatePrims(numRows, numCols);
        break;
      case 'kruskals':
        grid = generateKruskals(numRows, numCols);
        break;
      case 'binary-tree':
        grid = generateBinaryTree(numRows, numCols);
        break;
      case 'hunt-and-kill':
        grid = generateHuntAndKill(numRows, numCols);
        break;
      case 'recursive-backtracking':
      default:
        grid = generateRecursiveBacktracking(numRows, numCols);
        break;
    }
    
    // Add loops if specified
    grid = addLoops(grid, loopFactor);
    
    setMaze(grid);
    setIsGenerating(false);
  };

  useEffect(() => {
    generateMaze(rows, cols, algorithm);
  }, []);

  const handleGenerate = () => {
    generateMaze(rows, cols, algorithm);
  };

  const downloadMaze = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const wallThickness = 2;
    
    canvas.width = cols * cellSize + wallThickness;
    canvas.height = rows * cellSize + wallThickness;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = wallThickness;
    
    // Draw maze
    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        const cell = maze[row][col];
        const x = col * cellSize;
        const y = row * cellSize;
        
        if (cell.top) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
          ctx.stroke();
        }
        if (cell.right) {
          ctx.beginPath();
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        if (cell.bottom) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        if (cell.left) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
          ctx.stroke();
        }
      }
    }
    
    // Add entrance and exit markers
    ctx.fillStyle = '#10b981';
    ctx.fillRect(2, 2, 8, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(canvas.width - 10, canvas.height - 10, 8, 8);
    
    // Download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maze-${rows}x${cols}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">Maze Generator</h1>
          <p className="text-gray-300 text-lg">Create perfect mazes or mazes with loops using different algorithms</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">
              Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-purple-500 focus:outline-none"
            >
              {algorithms.map(algo => (
                <option key={algo.value} value={algo.value}>
                  {algo.label}
                </option>
              ))}
            </select>
            <p className="text-gray-400 text-sm mt-2">
              {algorithms.find(a => a.value === algorithm)?.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                Rows: {rows}
              </label>
              <input
                type="range"
                min="5"
                max="40"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5</span>
                <span>40</span>
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Columns: {cols}
              </label>
              <input
                type="range"
                min="5"
                max="40"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5</span>
                <span>40</span>
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Cell Size: {cellSize}px
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={cellSize}
                onChange={(e) => setCellSize(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10</span>
                <span>50</span>
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Loop Factor: {loopFactor}%
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={loopFactor}
                onChange={(e) => setLoopFactor(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>None</span>
                <span>Many</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {loopFactor === 0 ? 'Perfect maze' : 'Multiple paths'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <RefreshCw size={20} className={isGenerating ? 'animate-spin' : ''} />
              Generate New Maze
            </button>

            <button
              onClick={downloadMaze}
              disabled={maze.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Download size={20} />
              Download PNG
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="flex justify-center overflow-auto">
            <div className="inline-block bg-white p-4 rounded-xl shadow-2xl">
              <svg
                width={cols * cellSize + 2}
                height={rows * cellSize + 2}
                className="block"
              >
                {/* Draw maze */}
                {maze.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const x = colIndex * cellSize;
                    const y = rowIndex * cellSize;

                    return (
                      <g key={`${rowIndex}-${colIndex}`}>
                        {cell.top && (
                          <line
                            x1={x}
                            y1={y}
                            x2={x + cellSize}
                            y2={y}
                            stroke="#1f2937"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        )}
                        {cell.right && (
                          <line
                            x1={x + cellSize}
                            y1={y}
                            x2={x + cellSize}
                            y2={y + cellSize}
                            stroke="#1f2937"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        )}
                        {cell.bottom && (
                          <line
                            x1={x}
                            y1={y + cellSize}
                            x2={x + cellSize}
                            y2={y + cellSize}
                            stroke="#1f2937"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        )}
                        {cell.left && (
                          <line
                            x1={x}
                            y1={y}
                            x2={x}
                            y2={y + cellSize}
                            stroke="#1f2937"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        )}
                      </g>
                    );
                  })
                )}
                
                {/* Start marker (green) */}
                <circle cx="6" cy="6" r="4" fill="#10b981" />
                
                {/* End marker (red) */}
                <circle 
                  cx={cols * cellSize - 6} 
                  cy={rows * cellSize - 6} 
                  r="4" 
                  fill="#ef4444" 
                />
              </svg>
              
              <div className="flex justify-between items-center mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-700">Start</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-700">End</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-gray-300 text-sm">
            <p>
              Maze size: {rows} × {cols} cells | Algorithm: {algorithms.find(a => a.value === algorithm)?.label} | 
              {loopFactor === 0 ? ' Perfect maze (one solution)' : ` Imperfect maze (${loopFactor}% loops)`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
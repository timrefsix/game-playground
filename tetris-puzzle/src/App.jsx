import React, { useState, useRef } from 'react';

const TetrisPuzzle = () => {
  const [grid, setGrid] = useState(Array(5).fill().map(() => Array(5).fill(false)));
  const [pieces, setPieces] = useState([
    { id: 1, shape: [[1, 1, 1, 1]], color: '#00f0f0', placed: false }, // I-piece
    { id: 2, shape: [[1, 1], [1, 1]], color: '#f0f000', placed: false }, // O-piece
    { id: 3, shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0', placed: false }, // T-piece
    { id: 4, shape: [[1, 0], [1, 1], [0, 1]], color: '#00f000', placed: false }, // S-piece
    { id: 5, shape: [[1, 1, 1], [1, 0, 0]], color: '#0000f0', placed: false }, // L-piece
  ]);
  
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState(null);
  const gridRef = useRef(null);

  const canPlacePiece = (shape, row, col) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const gridRow = row + r;
          const gridCol = col + c;
          if (gridRow < 0 || gridRow >= 5 || gridCol < 0 || gridCol >= 5 || grid[gridRow][gridCol]) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const placePiece = (shape, row, col, pieceId) => {
    const newGrid = grid.map(row => [...row]);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          newGrid[row + r][col + c] = pieceId;
        }
      }
    }
    setGrid(newGrid);
    setPieces(pieces.map(p => p.id === pieceId ? { ...p, placed: true } : p));
  };

  const handleStart = (e, piece) => {
    e.preventDefault();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    
    setDragging(piece);
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
  };

  const handleMove = (e) => {
    if (!dragging || !gridRef.current) return;
    
    e.preventDefault();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellSize = gridRect.width / 5;
    
    const col = Math.floor((clientX - gridRect.left) / cellSize);
    const row = Math.floor((clientY - gridRect.top) / cellSize);
    
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  };

  const handleEnd = (e) => {
    if (!dragging || !hoveredCell) {
      setDragging(null);
      setHoveredCell(null);
      return;
    }
    
    if (canPlacePiece(dragging.shape, hoveredCell.row, hoveredCell.col)) {
      placePiece(dragging.shape, hoveredCell.row, hoveredCell.col, dragging.id);
    }
    
    setDragging(null);
    setHoveredCell(null);
  };

  const getPieceColor = (cellValue) => {
    if (!cellValue) return 'transparent';
    const piece = pieces.find(p => p.id === cellValue);
    return piece ? piece.color : '#cccccc';
  };

  const resetGame = () => {
    setGrid(Array(5).fill().map(() => Array(5).fill(false)));
    setPieces(pieces.map(p => ({ ...p, placed: false })));
  };

  const isComplete = grid.every(row => row.every(cell => cell !== false));

  return (
    <div 
      className="game-container"
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Arial', sans-serif;
          overflow: hidden;
        }
        
        .game-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          touch-action: none;
        }
        
        h1 {
          color: white;
          font-size: 2.5rem;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .instructions {
          color: white;
          font-size: 1rem;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
          background: rgba(0,0,0,0.3);
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          width: min(400px, 90vw);
          aspect-ratio: 1;
        }
        
        .cell {
          background: rgba(255,255,255,0.1);
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .cell.filled {
          border: 2px solid rgba(255,255,255,0.4);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .cell.preview {
          background: rgba(255,255,255,0.3);
          border: 2px dashed white;
        }
        
        .cell.invalid-preview {
          background: rgba(255,0,0,0.3);
          border: 2px dashed red;
        }
        
        .pieces-container {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 20px;
        }
        
        .piece {
          display: grid;
          gap: 2px;
          padding: 10px;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          cursor: grab;
          transition: transform 0.2s;
          touch-action: none;
        }
        
        .piece:active {
          cursor: grabbing;
        }
        
        .piece:hover {
          transform: scale(1.05);
        }
        
        .piece.placed {
          opacity: 0.3;
          pointer-events: none;
        }
        
        .piece-cell {
          width: 30px;
          height: 30px;
          border-radius: 3px;
          border: 1px solid rgba(0,0,0,0.2);
        }
        
        .piece-cell.empty {
          background: transparent;
          border: none;
        }
        
        .reset-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 30px;
          font-size: 1rem;
          font-weight: bold;
          border-radius: 25px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          transition: all 0.3s;
        }
        
        .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        
        .reset-button:active {
          transform: translateY(0);
        }
        
        .success-message {
          color: white;
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 20px;
          animation: bounce 0.5s;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @media (max-width: 600px) {
          h1 {
            font-size: 2rem;
          }
          
          .piece-cell {
            width: 25px;
            height: 25px;
          }
        }
      `}</style>
      
      <h1>🧩 Tetris Puzzle</h1>
      <p className="instructions">Drag and drop the pieces to fill the 5×5 grid!</p>
      
      <div className="grid" ref={gridRef}>
        {grid.map((row, r) => 
          row.map((cell, c) => {
            let className = 'cell';
            let backgroundColor = 'transparent';
            
            if (cell !== false) {
              className += ' filled';
              backgroundColor = getPieceColor(cell);
            } else if (hoveredCell && dragging) {
              const { row: hRow, col: hCol } = hoveredCell;
              const shape = dragging.shape;
              
              for (let sr = 0; sr < shape.length; sr++) {
                for (let sc = 0; sc < shape[sr].length; sc++) {
                  if (shape[sr][sc] && r === hRow + sr && c === hCol + sc) {
                    const canPlace = canPlacePiece(shape, hRow, hCol);
                    className += canPlace ? ' preview' : ' invalid-preview';
                    if (canPlace) {
                      backgroundColor = dragging.color;
                    }
                  }
                }
              }
            }
            
            return (
              <div
                key={`${r}-${c}`}
                className={className}
                style={{ backgroundColor }}
              />
            );
          })
        )}
      </div>
      
      {isComplete && (
        <div className="success-message">🎉 Puzzle Complete! 🎉</div>
      )}
      
      <div className="pieces-container">
        {pieces.map(piece => (
          <div
            key={piece.id}
            className={`piece ${piece.placed ? 'placed' : ''}`}
            style={{
              gridTemplateColumns: `repeat(${piece.shape[0].length}, 30px)`,
              gridTemplateRows: `repeat(${piece.shape.length}, 30px)`
            }}
            onMouseDown={(e) => handleStart(e, piece)}
            onTouchStart={(e) => handleStart(e, piece)}
          >
            {piece.shape.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`piece-cell ${cell ? '' : 'empty'}`}
                  style={{
                    backgroundColor: cell ? piece.color : 'transparent'
                  }}
                />
              ))
            )}
          </div>
        ))}
      </div>
      
      <button className="reset-button" onClick={resetGame}>
        Reset Puzzle
      </button>
    </div>
  );
};

export default TetrisPuzzle;

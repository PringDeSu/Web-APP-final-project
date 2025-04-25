import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const GameOfLife = () => {
  const [gameState, setGameState] = useState({ generation: 0, clusters: [] });
  const canvasRef = useRef(null);
  const CELL_SIZE = 10;
  const WIDTH = 50;
  const HEIGHT = 50;

  // Fetch game state from backend
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch('/api/game');
        const data = await response.json();
        setGameState(data);
      } catch (error) {
        console.error('Error fetching game state:', error);
      }
    };

    fetchGameState(); // Initial fetch
    const interval = setInterval(fetchGameState, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  // Render game state on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    for (let x = 0; x <= WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw cells
    gameState.clusters.forEach(cluster => {
      const size = cluster.size;
      ctx.fillStyle =
        size <= 5 ? '#3b82f6' : // Blue for small (1-5)
        size <= 15 ? '#22c55e' : // Green for medium (6-15)
        '#ef4444'; // Red for large (16+)
      cluster.cells.forEach(cell => {
        ctx.fillRect(
          cell.x * CELL_SIZE,
          cell.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      });
    });
  }, [gameState]);

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Game of Life</h1>
      <p className="text-lg mb-4">Generation: {gameState.generation}</p>
      <canvas
        ref={canvasRef}
        width={WIDTH * CELL_SIZE}
        height={HEIGHT * CELL_SIZE}
        className="border border-gray-300"
      />
      <div className="mt-4">
        <p><span className="inline-block w-4 h-4 bg-blue-500 mr-2"></span>Small (1-5 cells)</p>
        <p><span className="inline-block w-4 h-4 bg-green-500 mr-2"></span>Medium (6-15 cells)</p>
        <p><span className="inline-block w-4 h-4 bg-red-500 mr-2"></span>Large (16+ cells)</p>
      </div>
    </div>
  );
};

export default GameOfLife;

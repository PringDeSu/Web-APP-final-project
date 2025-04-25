const express = require('express');
const cors = require('cors');
const app = express();
const port = 9487;

app.use(cors());
app.use(express.json());

const WIDTH = 50;
const HEIGHT = 50;
let grid = Array(HEIGHT).fill().map(() => Array(WIDTH).fill(0));
let generation = 0;

// Initialize grid with random live cells
function initializeGrid() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      grid[y][x] = Math.random() > 0.7 ? 1 : 0;
    }
  }
}

// Count live neighbors
function countNeighbors(x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = (x + dx + WIDTH) % WIDTH;
      const ny = (y + dy + HEIGHT) % HEIGHT;
      count += grid[ny][nx];
    }
  }
  return count;
}

// Update grid for next generation
function updateGrid() {
  const newGrid = Array(HEIGHT).fill().map(() => Array(WIDTH).fill(0));
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const neighbors = countNeighbors(x, y);
      if (grid[y][x] === 1 && (neighbors === 2 || neighbors === 3)) {
        newGrid[y][x] = 1;
      } else if (grid[y][x] === 0 && neighbors === 3) {
        newGrid[y][x] = 1;
      }
    }
  }
  grid = newGrid;
  generation++;
}

// Find clusters using flood-fill
function findClusters() {
  const visited = Array(HEIGHT).fill().map(() => Array(WIDTH).fill(false));
  const clusters = [];

  function floodFill(x, y, cluster) {
    if (
      x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT ||
      visited[y][x] || grid[y][x] === 0
    ) return;
    visited[y][x] = true;
    cluster.push({ x, y });
    floodFill(x + 1, y, cluster);
    floodFill(x - 1, y, cluster);
    floodFill(x, y + 1, cluster);
    floodFill(x, y - 1, cluster);
  }

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (grid[y][x] === 1 && !visited[y][x]) {
        const cluster = [];
        floodFill(x, y, cluster);
        clusters.push(cluster);
      }
    }
  }
  return clusters;
}

// API endpoint to get game state
app.get('/api/game', (req, res) => {
  updateGrid();
  const clusters = findClusters();
  res.json({
    generation,
    clusters: clusters.map(cluster => ({
      cells: cluster,
      size: cluster.length
    }))
  });
});

// Start server and initialize game
initializeGrid();
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
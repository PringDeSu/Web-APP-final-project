const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 9487;

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// --- MP3 Upload Logic ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Create uploads directory
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// MP3 upload endpoint
app.post('/api/upload', (req, res, next) => {
  upload.single('mp3File')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: 'Multer error', error: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'Upload failed', error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file selected' });
    }
    res.status(200).json({ message: 'File uploaded successfully', filename: req.file.filename });
  });
});

// --- Game of Life Logic ---
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

// Game of Life API endpoint
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

// Initialize game
initializeGrid();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
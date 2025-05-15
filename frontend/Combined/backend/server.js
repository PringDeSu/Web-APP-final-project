const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 9487;

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // 允許來自 port 3000 和 port 5173 的請求
  methods: ['GET', 'POST'], // GET 方法是播放器請求檔案時會用到的
  allowedHeaders: ['Content-Type'], // POST 上傳時可能需要 Content-Type
}));
app.use(express.json());

// --- Serve uploaded files ---
// 將 'uploads' 目錄下的文件，透過 '/uploads' 這個 URL 路徑提供出去
// 例如，如果檔案儲存為 '1678888888888.mp3'
// 前端就可以透過 'http://localhost:9487/uploads/1678888888888.mp3' 來訪問
app.use('/uploads', express.static('uploads'));

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
      console.error('Multer error:', err); // 記錄錯誤
      return res.status(500).json({ message: 'Multer error', error: err.message });
    } else if (err) {
      console.error('Upload failed:', err); // 記錄錯誤
      return res.status(500).json({ message: 'Upload failed', error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file selected' });
    }

    // 檔案上傳成功後，回傳完整的 URL 路徑給前端
    const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      url: fileUrl // 回傳完整的檔案 URL
    });
  });
});


// --- API to get the latest uploaded MP3 URL ---
app.get('/api/latest_upload_url', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads'); // 確保路徑正確

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return res.status(500).json({ message: '無法讀取上傳檔案目錄', error: err.message });
    }

    // 過濾出 mp3 檔案 (可以根據需要添加其他音頻格式)
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));

    if (mp3Files.length === 0) {
      return res.status(404).json({ message: '目前沒有上傳的 MP3 檔案' });
    }

    // 找到最新修改的檔案 (通常是最新上傳的)
    const latestFile = mp3Files.reduce((latest, file) => {
      const filePath = path.join(uploadsDir, file);
      const fileStats = fs.statSync(filePath); // 同步獲取檔案狀態，簡單起見
      if (!latest || fileStats.mtimeMs > latest.mtimeMs) {
        return { name: file, mtimeMs: fileStats.mtimeMs };
      }
      return latest;
    }, null);

    if (!latestFile) {
         return res.status(404).json({ message: '無法找到最新的 MP3 檔案' });
    }

    // 回傳完整的檔案 URL
    const fileUrl = `http://localhost:${port}/uploads/${latestFile.name}`; // 使用後端的 port
    res.json({ url: fileUrl, filename: latestFile.name });
  });
});
// --- Game of Life Logic ---
// ... (這部分不變，省略) ...
const WIDTH = 50;
const HEIGHT = 50;
let grid = Array(HEIGHT).fill().map(() => Array(WIDTH).fill(0));
let generation = 0;

function initializeGrid() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      grid[y][x] = Math.random() > 0.7 ? 1 : 0;
    }
  }
}

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
  // 避免在生產環境暴露詳細錯誤訊息
  const statusCode = err.status || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message || 'Something went wrong';
  res.status(statusCode).json({ message, error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
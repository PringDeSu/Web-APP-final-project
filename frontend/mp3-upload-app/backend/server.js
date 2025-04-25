const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// 配置 CORS，明確允許前端來源
app.use(cors({
  origin: 'http://localhost:3000', // 允許來自前端的請求
  methods: ['GET', 'POST'], // 允許的 HTTP 方法
  allowedHeaders: ['Content-Type'], // 允許的頭部
}));

app.use(express.json());

// 配置 Multer 存儲
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Saving to uploads/');
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制為 10MB
});

// 創建上傳目錄
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 上傳端點
app.post('/api/upload', (req, res, next) => {
  upload.single('mp3File')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer 錯誤:', err);
      return res.status(500).json({ message: 'Multer 文件上傳錯誤', error: err.message });
    } else if (err) {
      console.error('其他錯誤:', err);
      return res.status(500).json({ message: '文件上傳失敗', error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: '未選擇文件' });
    }
    res.status(200).json({ message: '文件上傳成功', filename: req.file.filename });
  });
});

// 錯誤處理中間件，確保 CORS 頭部始終存在
app.use((err, req, res, next) => {
  console.error('伺服器錯誤:', err);
  res.status(500).json({ message: '伺服器內部錯誤', error: err.message });
});

app.listen(9487, () => {
  console.log('後端運行在 http://localhost:9487');
});
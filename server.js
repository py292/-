const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();

// 文件存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'video/mp4', 
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'image/jpeg',
    'image/png'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 上传配置
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB
  }
});

// 启用CORS
app.use(cors());

// 文件上传API
app.post('/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const results = req.files.map(file => ({
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      status: 'success'
    }));

    res.json({
      message: '文件上传成功',
      results: results
    });
  } catch (error) {
    res.status(500).json({ 
      error: '文件上传失败',
      details: error.message 
    });
  }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer错误处理
    res.status(400).json({ 
      error: '文件上传错误',
      details: err.message 
    });
  } else if (err) {
    // 其他错误处理
    res.status(500).json({ 
      error: '服务器错误',
      details: err.message 
    });
  }
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器正在运行：http://localhost:${PORT}`);
});

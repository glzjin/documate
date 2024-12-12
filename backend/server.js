const express = require('express');
const handleUpload = require('./upload');
const handleAsk = require('./ask');

const app = express();

// CORS middleware
function corsMiddleware(req, res, next) {
  // 检查环境变量，默认启用CORS
  const enableCors = process.env.ENABLE_CORS !== 'false';
  
  if (enableCors) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  }
  
  next();
}

// API 密钥验证中间件
function apiKeyMiddleware(req, res, next) {
  const apiKey = process.env.API_KEY;
  
  // 如果未配置 API_KEY，跳过验证
  if (!apiKey) {
    console.warn('API_KEY not configured, skipping authentication');
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  // 验证 Authorization 头的值
  if (authHeader !== apiKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

// 使用CORS中间件
app.use(corsMiddleware);

app.use(express.json());

// 使用 API 密钥验证中间件保护上传路由
app.post('/upload', apiKeyMiddleware, handleUpload);
app.post('/ask', handleAsk);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS is ${process.env.ENABLE_CORS !== 'false' ? 'enabled' : 'disabled'}`);
}); 
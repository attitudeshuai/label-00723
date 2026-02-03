/**
 * 医院设备管理系统 - 后端入口文件
 * 提供RESTful API服务
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// 导入路由
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const categoryRoutes = require('./routes/category');
const stockInRoutes = require('./routes/stockIn');
const stockOutRoutes = require('./routes/stockOut');
const depreciationRoutes = require('./routes/depreciation');
const scrapRoutes = require('./routes/scrap');
const repairRoutes = require('./routes/repair');
const reportRoutes = require('./routes/report');

// 导入中间件
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 公开路由（无需认证）
app.use('/api/auth', authRoutes);

// 受保护路由（需要认证）
app.use('/api/equipment', authMiddleware, equipmentRoutes);
app.use('/api/category', authMiddleware, categoryRoutes);
app.use('/api/stock-in', authMiddleware, stockInRoutes);
app.use('/api/stock-out', authMiddleware, stockOutRoutes);
app.use('/api/depreciation', authMiddleware, depreciationRoutes);
app.use('/api/scrap', authMiddleware, scrapRoutes);
app.use('/api/repair', authMiddleware, repairRoutes);
app.use('/api/report', authMiddleware, reportRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`医院设备管理系统后端服务已启动，端口: ${PORT}`);
});

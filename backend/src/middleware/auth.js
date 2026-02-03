/**
 * 认证中间件
 * 验证请求中的token
 */

const { users } = require('../models/data');

// 简单的token存储（实际应使用Redis等）
const tokenStore = new Map();

// 验证token
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }
  
  const userId = tokenStore.get(token);
  if (!userId) {
    return res.status(401).json({ success: false, message: '无效的认证令牌' });
  }
  
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ success: false, message: '用户不存在' });
  }
  
  // 将用户信息附加到请求对象
  req.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    department: user.department
  };
  
  next();
}

// 存储token
function storeToken(token, userId) {
  tokenStore.set(token, userId);
}

// 移除token
function removeToken(token) {
  tokenStore.delete(token);
}

module.exports = authMiddleware;
module.exports.storeToken = storeToken;
module.exports.removeToken = removeToken;

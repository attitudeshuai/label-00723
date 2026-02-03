/**
 * 认证路由
 * 处理用户登录、登出
 */

const express = require('express');
const CryptoJS = require('crypto-js');
const router = express.Router();
const { users } = require('../models/data');
const { storeToken, removeToken } = require('../middleware/auth');

// 用户登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  
  // 密码MD5加密
  const passwordHash = CryptoJS.MD5(password).toString();
  
  // 查找用户
  const user = users.find(u => u.username === username && u.password === passwordHash);
  
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  
  // 生成token
  const token = CryptoJS.lib.WordArray.random(32).toString();
  storeToken(token, user.id);
  
  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        department: user.department
      }
    }
  });
});

// 用户登出
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    removeToken(token);
  }
  res.json({ success: true, message: '登出成功' });
});

// 获取当前用户信息
router.get('/current', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  // 这里简化处理，实际应该从token中获取用户信息
  res.json({ success: true, message: '获取成功' });
});

module.exports = router;

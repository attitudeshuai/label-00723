/**
 * 设备分类路由
 * 管理设备分类信息
 */

const express = require('express');
const router = express.Router();
const { categories, generateId } = require('../models/data');

// 获取所有分类
router.get('/', (req, res) => {
  res.json({ success: true, data: categories });
});

// 获取单个分类
router.get('/:id', (req, res) => {
  const category = categories.find(c => c.id === parseInt(req.params.id));
  if (!category) {
    return res.status(404).json({ success: false, message: '分类不存在' });
  }
  res.json({ success: true, data: category });
});

// 创建分类
router.post('/', (req, res) => {
  const { name, code, description } = req.body;
  
  if (!name || !code) {
    return res.status(400).json({ success: false, message: '名称和编码不能为空' });
  }
  
  // 检查编码是否重复
  if (categories.find(c => c.code === code)) {
    return res.status(400).json({ success: false, message: '编码已存在' });
  }
  
  const newCategory = {
    id: generateId('category'),
    name,
    code,
    description: description || ''
  };
  
  categories.push(newCategory);
  res.json({ success: true, message: '创建成功', data: newCategory });
});

// 更新分类
router.put('/:id', (req, res) => {
  const index = categories.findIndex(c => c.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: '分类不存在' });
  }
  
  const { name, code, description } = req.body;
  
  // 检查编码是否与其他分类重复
  if (code && categories.find(c => c.code === code && c.id !== parseInt(req.params.id))) {
    return res.status(400).json({ success: false, message: '编码已存在' });
  }
  
  categories[index] = {
    ...categories[index],
    name: name || categories[index].name,
    code: code || categories[index].code,
    description: description !== undefined ? description : categories[index].description
  };
  
  res.json({ success: true, message: '更新成功', data: categories[index] });
});

// 删除分类
router.delete('/:id', (req, res) => {
  const index = categories.findIndex(c => c.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: '分类不存在' });
  }
  
  categories.splice(index, 1);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;

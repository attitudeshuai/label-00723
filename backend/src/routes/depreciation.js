/**
 * 设备折旧路由
 * 管理设备折旧计算
 */

const express = require('express');
const router = express.Router();
const { 
  depreciationRecords, 
  equipmentItems, 
  equipmentTypes,
  categories,
  generateId 
} = require('../models/data');

// 获取折旧记录列表
router.get('/', (req, res) => {
  const { equipmentItemId, year, month } = req.query;
  
  let result = depreciationRecords.map(record => {
    const item = equipmentItems.find(i => i.id === record.equipmentItemId);
    const et = item ? equipmentTypes.find(e => e.id === item.equipmentTypeId) : null;
    const category = et ? categories.find(c => c.id === et.categoryId) : null;
    return {
      ...record,
      serialNumber: item?.serialNumber || '',
      equipmentName: et?.name || '',
      categoryName: category?.name || ''
    };
  });
  
  // 筛选
  if (equipmentItemId) {
    result = result.filter(r => r.equipmentItemId === parseInt(equipmentItemId));
  }
  if (year) {
    result = result.filter(r => r.year === parseInt(year));
  }
  if (month) {
    result = result.filter(r => r.month === parseInt(month));
  }
  
  // 按日期倒序
  result.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json({ success: true, data: result });
});

// 执行自动折旧（按月）
router.post('/auto', (req, res) => {
  const { year, month } = req.body;
  
  if (!year || !month) {
    return res.status(400).json({ success: false, message: '年份和月份不能为空' });
  }
  
  const results = [];
  
  // 遍历所有在用设备
  equipmentItems.forEach(item => {
    if (item.status !== '在用' && item.status !== '在库') return;
    if (item.currentValue <= 0) return;
    
    // 检查是否已经折旧过
    const exists = depreciationRecords.find(r => 
      r.equipmentItemId === item.id && 
      r.year === parseInt(year) && 
      r.month === parseInt(month)
    );
    if (exists) return;
    
    // 获取设备类型信息
    const et = equipmentTypes.find(e => e.id === item.equipmentTypeId);
    if (!et) return;
    
    // 计算月折旧额（年折旧率/12）
    const monthlyRate = et.depreciationRate / 12 / 100;
    const depreciationAmount = Math.round(item.purchasePrice * monthlyRate * 100) / 100;
    const beforeValue = item.currentValue;
    const afterValue = Math.max(0, beforeValue - depreciationAmount);
    
    // 创建折旧记录
    const record = {
      id: generateId('depreciation'),
      equipmentItemId: item.id,
      year: parseInt(year),
      month: parseInt(month),
      beforeValue,
      depreciationAmount,
      afterValue,
      type: '自动',
      date: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
    };
    
    depreciationRecords.push(record);
    
    // 更新设备当前价值
    item.currentValue = afterValue;
    
    results.push(record);
  });
  
  res.json({ 
    success: true, 
    message: `成功处理 ${results.length} 条折旧记录`,
    data: results 
  });
});

// 手动折旧调整
router.post('/manual', (req, res) => {
  const { equipmentItemId, adjustAmount, reason } = req.body;
  
  if (!equipmentItemId || adjustAmount === undefined) {
    return res.status(400).json({ success: false, message: '必填字段不能为空' });
  }
  
  const item = equipmentItems.find(i => i.id === parseInt(equipmentItemId));
  if (!item) {
    return res.status(400).json({ success: false, message: '设备不存在' });
  }
  
  const now = new Date();
  const beforeValue = item.currentValue;
  const afterValue = Math.max(0, beforeValue - parseFloat(adjustAmount));
  
  const record = {
    id: generateId('depreciation'),
    equipmentItemId: parseInt(equipmentItemId),
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    beforeValue,
    depreciationAmount: parseFloat(adjustAmount),
    afterValue,
    type: '手动',
    reason: reason || '',
    date: now.toISOString().split('T')[0]
  };
  
  depreciationRecords.push(record);
  item.currentValue = afterValue;
  
  res.json({ success: true, message: '折旧调整成功', data: record });
});

// 获取设备折旧汇总
router.get('/summary', (req, res) => {
  const summary = equipmentItems.map(item => {
    const et = equipmentTypes.find(e => e.id === item.equipmentTypeId);
    const category = et ? categories.find(c => c.id === et.categoryId) : null;
    const totalDepreciation = item.purchasePrice - item.currentValue;
    const depreciationRate = item.purchasePrice > 0 
      ? Math.round(totalDepreciation / item.purchasePrice * 10000) / 100 
      : 0;
    
    return {
      id: item.id,
      serialNumber: item.serialNumber,
      equipmentName: et?.name || '',
      categoryName: category?.name || '',
      purchaseDate: item.purchaseDate,
      purchasePrice: item.purchasePrice,
      currentValue: item.currentValue,
      totalDepreciation,
      depreciationRate: `${depreciationRate}%`,
      status: item.status
    };
  });
  
  res.json({ success: true, data: summary });
});

module.exports = router;

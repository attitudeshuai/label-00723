/**
 * 设备报废路由
 * 管理设备报废单据
 */

const express = require('express');
const router = express.Router();
const { 
  scrapRecords, 
  equipmentItems, 
  equipmentTypes,
  inventory,
  categories,
  generateId, 
  generateOrderNo 
} = require('../models/data');

// 获取报废记录列表
router.get('/', (req, res) => {
  const { startDate, endDate, reason } = req.query;
  
  let result = scrapRecords.map(record => {
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
  
  // 按日期筛选
  if (startDate) {
    result = result.filter(r => r.date >= startDate);
  }
  if (endDate) {
    result = result.filter(r => r.date <= endDate);
  }
  if (reason) {
    result = result.filter(r => r.reason.includes(reason));
  }
  
  // 按日期倒序
  result.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json({ success: true, data: result });
});

// 获取单个报废记录
router.get('/:id', (req, res) => {
  const record = scrapRecords.find(r => r.id === parseInt(req.params.id));
  if (!record) {
    return res.status(404).json({ success: false, message: '报废记录不存在' });
  }
  
  const item = equipmentItems.find(i => i.id === record.equipmentItemId);
  const et = item ? equipmentTypes.find(e => e.id === item.equipmentTypeId) : null;
  
  res.json({
    success: true,
    data: {
      ...record,
      serialNumber: item?.serialNumber || '',
      equipmentName: et?.name || ''
    }
  });
});

// 创建报废记录
router.post('/', (req, res) => {
  const { equipmentItemId, reason, scrapValue, date, remark } = req.body;
  
  if (!equipmentItemId || !reason) {
    return res.status(400).json({ success: false, message: '必填字段不能为空' });
  }
  
  // 查找设备
  const item = equipmentItems.find(i => i.id === parseInt(equipmentItemId));
  if (!item) {
    return res.status(400).json({ success: false, message: '设备不存在' });
  }
  
  if (item.status === '已报废') {
    return res.status(400).json({ success: false, message: '该设备已报废' });
  }
  
  const orderNo = generateOrderNo('BF');
  const recordDate = date || new Date().toISOString().split('T')[0];
  
  // 创建报废记录
  const newRecord = {
    id: generateId('scrap'),
    orderNo,
    equipmentItemId: parseInt(equipmentItemId),
    reason,
    originalValue: item.purchasePrice,
    currentValue: item.currentValue,
    scrapValue: scrapValue || 0,
    date: recordDate,
    operator: req.user.username,
    remark: remark || '',
    status: '已报废'
  };
  
  scrapRecords.push(newRecord);
  
  // 更新设备状态
  const previousStatus = item.status;
  item.status = '已报废';
  item.currentValue = 0;
  
  // 如果设备在库中，更新库存
  if (previousStatus === '在库') {
    const inv = inventory.find(i => i.equipmentTypeId === item.equipmentTypeId);
    if (inv && inv.quantity > 0) {
      inv.quantity -= 1;
    }
  }
  
  res.json({ success: true, message: '报废成功', data: newRecord });
});

// 获取可报废的设备列表
router.get('/available/items', (req, res) => {
  const availableItems = equipmentItems
    .filter(item => item.status !== '已报废')
    .map(item => {
      const et = equipmentTypes.find(e => e.id === item.equipmentTypeId);
      return {
        ...item,
        equipmentName: et?.name || '',
        brand: et?.brand || '',
        model: et?.model || ''
      };
    });
  
  res.json({ success: true, data: availableItems });
});

module.exports = router;

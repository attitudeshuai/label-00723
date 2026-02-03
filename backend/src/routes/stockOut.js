/**
 * 设备出库路由
 * 管理设备出库单据
 */

const express = require('express');
const router = express.Router();
const { 
  stockOutRecords, 
  equipmentItems, 
  equipmentTypes,
  inventory,
  categories,
  generateId, 
  generateOrderNo 
} = require('../models/data');

// 获取出库记录列表
router.get('/', (req, res) => {
  const { startDate, endDate, department } = req.query;
  
  let result = stockOutRecords.map(record => {
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
  if (department) {
    result = result.filter(r => r.department.includes(department));
  }
  
  // 按日期倒序
  result.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json({ success: true, data: result });
});

// 获取单个出库记录
router.get('/:id', (req, res) => {
  const record = stockOutRecords.find(r => r.id === parseInt(req.params.id));
  if (!record) {
    return res.status(404).json({ success: false, message: '出库记录不存在' });
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

// 创建出库记录
router.post('/', (req, res) => {
  const { equipmentItemId, department, location, date, remark } = req.body;
  
  if (!equipmentItemId || !department) {
    return res.status(400).json({ success: false, message: '必填字段不能为空' });
  }
  
  // 查找设备
  const item = equipmentItems.find(i => i.id === parseInt(equipmentItemId));
  if (!item) {
    return res.status(400).json({ success: false, message: '设备不存在' });
  }
  
  if (item.status !== '在库') {
    return res.status(400).json({ success: false, message: '该设备不在库中，无法出库' });
  }
  
  const orderNo = generateOrderNo('CK');
  const recordDate = date || new Date().toISOString().split('T')[0];
  
  // 创建出库记录
  const newRecord = {
    id: generateId('stockOut'),
    orderNo,
    equipmentItemId: parseInt(equipmentItemId),
    department,
    date: recordDate,
    operator: req.user.username,
    remark: remark || ''
  };
  
  stockOutRecords.push(newRecord);
  
  // 更新设备状态
  item.status = '在用';
  item.department = department;
  item.location = location || department;
  
  // 更新库存
  const inv = inventory.find(i => i.equipmentTypeId === item.equipmentTypeId);
  if (inv && inv.quantity > 0) {
    inv.quantity -= 1;
  }
  
  res.json({ success: true, message: '出库成功', data: newRecord });
});

// 获取可出库的设备列表
router.get('/available/items', (req, res) => {
  const availableItems = equipmentItems
    .filter(item => item.status === '在库')
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

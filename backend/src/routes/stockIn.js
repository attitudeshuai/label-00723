/**
 * 设备入库路由
 * 管理设备入库单据
 */

const express = require('express');
const router = express.Router();
const { 
  stockInRecords, 
  equipmentTypes, 
  equipmentItems, 
  inventory,
  categories,
  generateId, 
  generateOrderNo 
} = require('../models/data');

// 获取入库记录列表
router.get('/', (req, res) => {
  const { startDate, endDate, equipmentTypeId } = req.query;
  
  let result = stockInRecords.map(record => {
    const et = equipmentTypes.find(e => e.id === record.equipmentTypeId);
    const category = et ? categories.find(c => c.id === et.categoryId) : null;
    return {
      ...record,
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
  if (equipmentTypeId) {
    result = result.filter(r => r.equipmentTypeId === parseInt(equipmentTypeId));
  }
  
  // 按日期倒序
  result.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json({ success: true, data: result });
});

// 获取单个入库记录
router.get('/:id', (req, res) => {
  const record = stockInRecords.find(r => r.id === parseInt(req.params.id));
  if (!record) {
    return res.status(404).json({ success: false, message: '入库记录不存在' });
  }
  
  const et = equipmentTypes.find(e => e.id === record.equipmentTypeId);
  res.json({
    success: true,
    data: { ...record, equipmentName: et?.name || '' }
  });
});

// 创建入库记录
router.post('/', (req, res) => {
  const { equipmentTypeId, quantity, unitPrice, supplier, date, remark, serialNumbers } = req.body;
  
  if (!equipmentTypeId || !quantity || !unitPrice) {
    return res.status(400).json({ success: false, message: '必填字段不能为空' });
  }
  
  const et = equipmentTypes.find(e => e.id === parseInt(equipmentTypeId));
  if (!et) {
    return res.status(400).json({ success: false, message: '设备类型不存在' });
  }
  
  const totalPrice = quantity * unitPrice;
  const orderNo = generateOrderNo('RK');
  const recordDate = date || new Date().toISOString().split('T')[0];
  
  // 创建入库记录
  const newRecord = {
    id: generateId('stockIn'),
    orderNo,
    equipmentTypeId: parseInt(equipmentTypeId),
    quantity: parseInt(quantity),
    unitPrice: parseFloat(unitPrice),
    totalPrice,
    supplier: supplier || '',
    date: recordDate,
    operator: req.user.username,
    remark: remark || ''
  };
  
  stockInRecords.push(newRecord);
  
  // 更新库存
  let inv = inventory.find(i => i.equipmentTypeId === parseInt(equipmentTypeId));
  if (inv) {
    inv.quantity += parseInt(quantity);
  } else {
    inventory.push({
      id: generateId('inventory'),
      equipmentTypeId: parseInt(equipmentTypeId),
      quantity: parseInt(quantity),
      location: '待分配',
      status: '正常'
    });
  }
  
  // 创建设备明细记录
  const serialNumberList = serialNumbers || [];
  for (let i = 0; i < quantity; i++) {
    const sn = serialNumberList[i] || `${et.name.substring(0, 2).toUpperCase()}-${new Date().getFullYear()}-${String(generateId('equipmentItem')).padStart(3, '0')}`;
    equipmentItems.push({
      id: generateId('equipmentItem'),
      equipmentTypeId: parseInt(equipmentTypeId),
      serialNumber: sn,
      purchaseDate: recordDate,
      purchasePrice: parseFloat(unitPrice),
      currentValue: parseFloat(unitPrice),
      location: '待分配',
      status: '在库',
      department: ''
    });
  }
  
  res.json({ success: true, message: '入库成功', data: newRecord });
});

module.exports = router;

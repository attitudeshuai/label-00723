/**
 * 设备维修路由
 * 管理设备维修单据
 */

const express = require('express');
const router = express.Router();
const { 
  repairRecords, 
  equipmentItems, 
  equipmentTypes,
  categories,
  generateId, 
  generateOrderNo 
} = require('../models/data');

// 获取维修记录列表
router.get('/', (req, res) => {
  const { status, equipmentItemId, startDate, endDate } = req.query;
  
  let result = repairRecords.map(record => {
    const item = equipmentItems.find(i => i.id === record.equipmentItemId);
    const et = item ? equipmentTypes.find(e => e.id === item.equipmentTypeId) : null;
    const category = et ? categories.find(c => c.id === et.categoryId) : null;
    return {
      ...record,
      serialNumber: item?.serialNumber || '',
      equipmentName: et?.name || '',
      categoryName: category?.name || '',
      location: item?.location || ''
    };
  });
  
  // 筛选
  if (status) {
    result = result.filter(r => r.status === status);
  }
  if (equipmentItemId) {
    result = result.filter(r => r.equipmentItemId === parseInt(equipmentItemId));
  }
  if (startDate) {
    result = result.filter(r => r.startDate >= startDate);
  }
  if (endDate) {
    result = result.filter(r => r.startDate <= endDate);
  }
  
  // 按日期倒序
  result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  
  res.json({ success: true, data: result });
});

// 获取单个维修记录
router.get('/:id', (req, res) => {
  const record = repairRecords.find(r => r.id === parseInt(req.params.id));
  if (!record) {
    return res.status(404).json({ success: false, message: '维修记录不存在' });
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

// 创建维修记录
router.post('/', (req, res) => {
  const { equipmentItemId, faultDesc, repairContent, cost, startDate, remark } = req.body;
  
  if (!equipmentItemId || !faultDesc) {
    return res.status(400).json({ success: false, message: '必填字段不能为空' });
  }
  
  // 查找设备
  const item = equipmentItems.find(i => i.id === parseInt(equipmentItemId));
  if (!item) {
    return res.status(400).json({ success: false, message: '设备不存在' });
  }
  
  if (item.status === '已报废') {
    return res.status(400).json({ success: false, message: '已报废设备无法维修' });
  }
  
  const orderNo = generateOrderNo('WX');
  const recordDate = startDate || new Date().toISOString().split('T')[0];
  
  // 创建维修记录
  const newRecord = {
    id: generateId('repair'),
    orderNo,
    equipmentItemId: parseInt(equipmentItemId),
    faultDesc,
    repairContent: repairContent || '',
    cost: cost || 0,
    startDate: recordDate,
    endDate: null,
    status: '维修中',
    operator: req.user.username,
    remark: remark || ''
  };
  
  repairRecords.push(newRecord);
  
  // 更新设备状态
  item.status = '维修中';
  
  res.json({ success: true, message: '维修单创建成功', data: newRecord });
});

// 更新维修记录（完成维修）
router.put('/:id', (req, res) => {
  const record = repairRecords.find(r => r.id === parseInt(req.params.id));
  if (!record) {
    return res.status(404).json({ success: false, message: '维修记录不存在' });
  }
  
  const { repairContent, cost, endDate, status, remark } = req.body;
  
  // 更新记录
  if (repairContent !== undefined) record.repairContent = repairContent;
  if (cost !== undefined) record.cost = parseFloat(cost);
  if (endDate !== undefined) record.endDate = endDate;
  if (status !== undefined) record.status = status;
  if (remark !== undefined) record.remark = remark;
  
  // 如果维修完成，更新设备状态
  if (status === '已完成') {
    const item = equipmentItems.find(i => i.id === record.equipmentItemId);
    if (item) {
      item.status = '在用';
    }
  }
  
  res.json({ success: true, message: '更新成功', data: record });
});

// 获取可维修的设备列表
router.get('/available/items', (req, res) => {
  const availableItems = equipmentItems
    .filter(item => item.status !== '已报废' && item.status !== '维修中')
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

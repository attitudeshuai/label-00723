/**
 * 报表路由
 * 提供各类报表查询
 */

const express = require('express');
const router = express.Router();
const { 
  stockInRecords,
  stockOutRecords,
  depreciationRecords,
  equipmentItems, 
  equipmentTypes,
  categories,
  inventory
} = require('../models/data');

// 入库查询报表
router.get('/stock-in', (req, res) => {
  const { startDate, endDate, categoryId, equipmentTypeId } = req.query;
  
  let result = stockInRecords.map(record => {
    const et = equipmentTypes.find(e => e.id === record.equipmentTypeId);
    const category = et ? categories.find(c => c.id === et.categoryId) : null;
    return {
      ...record,
      equipmentName: et?.name || '',
      brand: et?.brand || '',
      model: et?.model || '',
      categoryId: et?.categoryId,
      categoryName: category?.name || ''
    };
  });
  
  // 筛选
  if (startDate) result = result.filter(r => r.date >= startDate);
  if (endDate) result = result.filter(r => r.date <= endDate);
  if (categoryId) result = result.filter(r => r.categoryId === parseInt(categoryId));
  if (equipmentTypeId) result = result.filter(r => r.equipmentTypeId === parseInt(equipmentTypeId));
  
  // 统计
  const totalQuantity = result.reduce((sum, r) => sum + r.quantity, 0);
  const totalAmount = result.reduce((sum, r) => sum + r.totalPrice, 0);
  
  res.json({ 
    success: true, 
    data: {
      records: result,
      summary: { totalQuantity, totalAmount }
    }
  });
});

// 出库查询报表
router.get('/stock-out', (req, res) => {
  const { startDate, endDate, department } = req.query;
  
  let result = stockOutRecords.map(record => {
    const item = equipmentItems.find(i => i.id === record.equipmentItemId);
    const et = item ? equipmentTypes.find(e => e.id === item.equipmentTypeId) : null;
    const category = et ? categories.find(c => c.id === et.categoryId) : null;
    return {
      ...record,
      serialNumber: item?.serialNumber || '',
      equipmentName: et?.name || '',
      brand: et?.brand || '',
      model: et?.model || '',
      categoryName: category?.name || '',
      purchasePrice: item?.purchasePrice || 0
    };
  });
  
  // 筛选
  if (startDate) result = result.filter(r => r.date >= startDate);
  if (endDate) result = result.filter(r => r.date <= endDate);
  if (department) result = result.filter(r => r.department.includes(department));
  
  // 统计
  const totalCount = result.length;
  const totalValue = result.reduce((sum, r) => sum + r.purchasePrice, 0);
  
  // 按科室分组统计
  const byDepartment = {};
  result.forEach(r => {
    if (!byDepartment[r.department]) {
      byDepartment[r.department] = { count: 0, value: 0 };
    }
    byDepartment[r.department].count += 1;
    byDepartment[r.department].value += r.purchasePrice;
  });
  
  res.json({ 
    success: true, 
    data: {
      records: result,
      summary: { totalCount, totalValue, byDepartment }
    }
  });
});

// 设备存放明细报表
router.get('/inventory', (req, res) => {
  const { location, status, categoryId } = req.query;
  
  let result = equipmentItems.map(item => {
    const et = equipmentTypes.find(e => e.id === item.equipmentTypeId);
    const category = et ? categories.find(c => c.id === et.categoryId) : null;
    return {
      ...item,
      equipmentName: et?.name || '',
      brand: et?.brand || '',
      model: et?.model || '',
      spec: et?.spec || '',
      unit: et?.unit || '',
      categoryId: et?.categoryId,
      categoryName: category?.name || ''
    };
  });
  
  // 筛选
  if (location) result = result.filter(r => r.location.includes(location));
  if (status) result = result.filter(r => r.status === status);
  if (categoryId) result = result.filter(r => r.categoryId === parseInt(categoryId));
  
  // 统计
  const totalCount = result.length;
  const totalValue = result.reduce((sum, r) => sum + r.currentValue, 0);
  const totalOriginalValue = result.reduce((sum, r) => sum + r.purchasePrice, 0);
  
  // 按状态分组
  const byStatus = {};
  result.forEach(r => {
    if (!byStatus[r.status]) {
      byStatus[r.status] = { count: 0, value: 0 };
    }
    byStatus[r.status].count += 1;
    byStatus[r.status].value += r.currentValue;
  });
  
  // 按位置分组
  const byLocation = {};
  result.forEach(r => {
    if (!byLocation[r.location]) {
      byLocation[r.location] = { count: 0, value: 0 };
    }
    byLocation[r.location].count += 1;
    byLocation[r.location].value += r.currentValue;
  });
  
  res.json({ 
    success: true, 
    data: {
      records: result,
      summary: { totalCount, totalValue, totalOriginalValue, byStatus, byLocation }
    }
  });
});

// 折旧明细报表
router.get('/depreciation', (req, res) => {
  const { equipmentItemId, year, startDate, endDate } = req.query;
  
  let result = depreciationRecords.map(record => {
    const item = equipmentItems.find(i => i.id === record.equipmentItemId);
    const et = item ? equipmentTypes.find(e => e.id === item.equipmentTypeId) : null;
    const category = et ? categories.find(c => c.id === et.categoryId) : null;
    return {
      ...record,
      serialNumber: item?.serialNumber || '',
      equipmentName: et?.name || '',
      brand: et?.brand || '',
      categoryName: category?.name || '',
      purchasePrice: item?.purchasePrice || 0
    };
  });
  
  // 筛选
  if (equipmentItemId) result = result.filter(r => r.equipmentItemId === parseInt(equipmentItemId));
  if (year) result = result.filter(r => r.year === parseInt(year));
  if (startDate) result = result.filter(r => r.date >= startDate);
  if (endDate) result = result.filter(r => r.date <= endDate);
  
  // 统计
  const totalDepreciation = result.reduce((sum, r) => sum + r.depreciationAmount, 0);
  
  // 按年月分组
  const byYearMonth = {};
  result.forEach(r => {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    if (!byYearMonth[key]) {
      byYearMonth[key] = 0;
    }
    byYearMonth[key] += r.depreciationAmount;
  });
  
  res.json({ 
    success: true, 
    data: {
      records: result,
      summary: { totalDepreciation, byYearMonth }
    }
  });
});

// 仪表盘统计数据
router.get('/dashboard', (req, res) => {
  // 设备总数
  const totalEquipment = equipmentItems.length;
  
  // 在用设备数
  const inUseCount = equipmentItems.filter(i => i.status === '在用').length;
  
  // 在库设备数
  const inStockCount = equipmentItems.filter(i => i.status === '在库').length;
  
  // 维修中设备数
  const repairingCount = equipmentItems.filter(i => i.status === '维修中').length;
  
  // 设备总价值
  const totalValue = equipmentItems.reduce((sum, i) => sum + i.currentValue, 0);
  
  // 设备原值
  const totalOriginalValue = equipmentItems.reduce((sum, i) => sum + i.purchasePrice, 0);
  
  // 累计折旧
  const totalDepreciation = totalOriginalValue - totalValue;
  
  // 本月入库数量
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyStockIn = stockInRecords
    .filter(r => r.date.startsWith(currentMonth))
    .reduce((sum, r) => sum + r.quantity, 0);
  
  // 本月出库数量
  const monthlyStockOut = stockOutRecords
    .filter(r => r.date.startsWith(currentMonth))
    .length;
  
  // 按分类统计
  const byCategory = categories.map(cat => {
    const typeIds = equipmentTypes.filter(et => et.categoryId === cat.id).map(et => et.id);
    const items = equipmentItems.filter(i => typeIds.includes(i.equipmentTypeId));
    return {
      name: cat.name,
      count: items.length,
      value: items.reduce((sum, i) => sum + i.currentValue, 0)
    };
  });
  
  res.json({
    success: true,
    data: {
      totalEquipment,
      inUseCount,
      inStockCount,
      repairingCount,
      totalValue,
      totalOriginalValue,
      totalDepreciation,
      monthlyStockIn,
      monthlyStockOut,
      byCategory
    }
  });
});

module.exports = router;

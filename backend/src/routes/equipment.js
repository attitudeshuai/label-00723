/**
 * 设备字典路由
 * 管理设备类型定义
 */

const express = require('express');
const router = express.Router();
const { equipmentTypes, categories, equipmentItems, generateId } = require('../models/data');

// 获取所有设备类型
router.get('/types', (req, res) => {
  const { categoryId, keyword } = req.query;
  
  let result = equipmentTypes.map(et => {
    const category = categories.find(c => c.id === et.categoryId);
    return { ...et, categoryName: category?.name || '' };
  });
  
  // 按分类筛选
  if (categoryId) {
    result = result.filter(et => et.categoryId === parseInt(categoryId));
  }
  
  // 按关键词搜索
  if (keyword) {
    result = result.filter(et => 
      et.name.includes(keyword) || 
      et.brand.includes(keyword) || 
      et.model.includes(keyword)
    );
  }
  
  res.json({ success: true, data: result });
});

// 获取单个设备类型
router.get('/types/:id', (req, res) => {
  const et = equipmentTypes.find(e => e.id === parseInt(req.params.id));
  if (!et) {
    return res.status(404).json({ success: false, message: '设备类型不存在' });
  }
  
  const category = categories.find(c => c.id === et.categoryId);
  res.json({ success: true, data: { ...et, categoryName: category?.name || '' } });
});

// 创建设备类型
router.post('/types', (req, res) => {
  const { categoryId, name, brand, model, spec, unit, lifeYears, depreciationRate } = req.body;
  
  if (!categoryId || !name || !brand || !model) {
    return res.status(400).json({ success: false, message: '必填字段不能为空' });
  }
  
  const newType = {
    id: generateId('equipmentType'),
    categoryId: parseInt(categoryId),
    name,
    brand,
    model,
    spec: spec || '',
    unit: unit || '台',
    lifeYears: lifeYears || 10,
    depreciationRate: depreciationRate || 10
  };
  
  equipmentTypes.push(newType);
  res.json({ success: true, message: '创建成功', data: newType });
});

// 更新设备类型
router.put('/types/:id', (req, res) => {
  const index = equipmentTypes.findIndex(e => e.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: '设备类型不存在' });
  }
  
  const { categoryId, name, brand, model, spec, unit, lifeYears, depreciationRate } = req.body;
  
  equipmentTypes[index] = {
    ...equipmentTypes[index],
    categoryId: categoryId ? parseInt(categoryId) : equipmentTypes[index].categoryId,
    name: name || equipmentTypes[index].name,
    brand: brand || equipmentTypes[index].brand,
    model: model || equipmentTypes[index].model,
    spec: spec !== undefined ? spec : equipmentTypes[index].spec,
    unit: unit || equipmentTypes[index].unit,
    lifeYears: lifeYears || equipmentTypes[index].lifeYears,
    depreciationRate: depreciationRate || equipmentTypes[index].depreciationRate
  };
  
  res.json({ success: true, message: '更新成功', data: equipmentTypes[index] });
});

// 删除设备类型
router.delete('/types/:id', (req, res) => {
  const index = equipmentTypes.findIndex(e => e.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: '设备类型不存在' });
  }
  
  equipmentTypes.splice(index, 1);
  res.json({ success: true, message: '删除成功' });
});

// 获取所有设备明细
router.get('/items', (req, res) => {
  const { equipmentTypeId, status, department, keyword } = req.query;
  
  let result = equipmentItems.map(item => {
    const et = equipmentTypes.find(e => e.id === item.equipmentTypeId);
    const category = et ? categories.find(c => c.id === et.categoryId) : null;
    return {
      ...item,
      equipmentName: et?.name || '',
      brand: et?.brand || '',
      model: et?.model || '',
      categoryName: category?.name || ''
    };
  });
  
  // 筛选
  if (equipmentTypeId) {
    result = result.filter(item => item.equipmentTypeId === parseInt(equipmentTypeId));
  }
  if (status) {
    result = result.filter(item => item.status === status);
  }
  if (department) {
    result = result.filter(item => item.department.includes(department));
  }
  if (keyword) {
    result = result.filter(item => 
      item.serialNumber.includes(keyword) ||
      item.equipmentName.includes(keyword) ||
      item.location.includes(keyword)
    );
  }
  
  res.json({ success: true, data: result });
});

// 获取单个设备明细
router.get('/items/:id', (req, res) => {
  const item = equipmentItems.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({ success: false, message: '设备不存在' });
  }
  
  const et = equipmentTypes.find(e => e.id === item.equipmentTypeId);
  const category = et ? categories.find(c => c.id === et.categoryId) : null;
  
  res.json({
    success: true,
    data: {
      ...item,
      equipmentName: et?.name || '',
      brand: et?.brand || '',
      model: et?.model || '',
      categoryName: category?.name || ''
    }
  });
});

module.exports = router;

/**
 * 数据存储模块 - 纯前端版本
 * 使用 localStorage 持久化数据
 */

const DataStore = {
  // 初始化数据
  init() {
    if (!localStorage.getItem('hospital_data_initialized')) {
      this.resetData();
      localStorage.setItem('hospital_data_initialized', 'true');
    }
  },

  // 重置为初始数据
  resetData() {
    const initialData = {
      users: [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: '系统管理员', department: '信息科' },
        { id: 2, username: 'user', password: 'user123', role: 'user', name: '普通用户', department: '设备科' }
      ],
      categories: [
        { id: 1, name: '影像设备', code: 'YX', description: 'CT、MRI、X光等影像诊断设备' },
        { id: 2, name: '检验设备', code: 'JY', description: '血液分析、生化分析等检验设备' },
        { id: 3, name: '治疗设备', code: 'ZL', description: '手术器械、治疗仪器等' },
        { id: 4, name: '监护设备', code: 'JH', description: '心电监护、呼吸机等监护设备' },
        { id: 5, name: '辅助设备', code: 'FZ', description: '病床、轮椅等辅助设备' }
      ],
      equipmentTypes: [
        { id: 1, categoryId: 1, name: 'CT扫描仪', brand: '西门子', model: 'SOMATOM', spec: '64排', unit: '台', lifeYears: 10, depreciationRate: 10 },
        { id: 2, categoryId: 1, name: 'MRI', brand: 'GE', model: 'SIGNA', spec: '3.0T', unit: '台', lifeYears: 10, depreciationRate: 10 },
        { id: 3, categoryId: 2, name: '全自动生化分析仪', brand: '罗氏', model: 'cobas 8000', spec: '模块化', unit: '台', lifeYears: 8, depreciationRate: 12.5 },
        { id: 4, categoryId: 3, name: '手术床', brand: '迈瑞', model: 'HyBase 8300', spec: '电动', unit: '张', lifeYears: 10, depreciationRate: 10 },
        { id: 5, categoryId: 4, name: '多参数监护仪', brand: '飞利浦', model: 'IntelliVue', spec: 'MX800', unit: '台', lifeYears: 8, depreciationRate: 12.5 }
      ],
      equipmentItems: [
        { id: 1, equipmentTypeId: 1, serialNumber: 'CT-2023-001', purchaseDate: '2023-01-15', purchasePrice: 5000000, currentValue: 4500000, location: '影像中心1号机房', status: '在用', department: '影像科' },
        { id: 2, equipmentTypeId: 1, serialNumber: 'CT-2023-002', purchaseDate: '2023-03-20', purchasePrice: 5200000, currentValue: 4680000, location: '影像中心2号机房', status: '在用', department: '影像科' },
        { id: 3, equipmentTypeId: 2, serialNumber: 'MRI-2022-001', purchaseDate: '2022-06-10', purchasePrice: 12000000, currentValue: 10200000, location: '影像中心MRI室', status: '在用', department: '影像科' },
        { id: 4, equipmentTypeId: 3, serialNumber: 'BIO-2023-001', purchaseDate: '2023-02-28', purchasePrice: 800000, currentValue: 700000, location: '检验科生化室', status: '在用', department: '检验科' },
        { id: 5, equipmentTypeId: 4, serialNumber: 'BED-2023-001', purchaseDate: '2023-03-01', purchasePrice: 150000, currentValue: 135000, location: '手术室1号', status: '在用', department: '手术室' },
        { id: 6, equipmentTypeId: 5, serialNumber: 'MON-2023-001', purchaseDate: '2023-04-15', purchasePrice: 50000, currentValue: 43750, location: 'ICU-01床', status: '在用', department: 'ICU' }
      ],
      stockInRecords: [
        { id: 1, orderNo: 'RK-2023-0001', equipmentTypeId: 1, quantity: 2, unitPrice: 5000000, totalPrice: 10000000, supplier: '西门子医疗', date: '2023-01-15', operator: 'admin', remark: '新购CT设备2台' },
        { id: 2, orderNo: 'RK-2022-0001', equipmentTypeId: 2, quantity: 1, unitPrice: 12000000, totalPrice: 12000000, supplier: 'GE医疗', date: '2022-06-10', operator: 'admin', remark: '新购MRI设备' },
        { id: 3, orderNo: 'RK-2023-0002', equipmentTypeId: 3, quantity: 1, unitPrice: 800000, totalPrice: 800000, supplier: '罗氏诊断', date: '2023-02-28', operator: 'admin', remark: '新购生化分析仪' },
        { id: 4, orderNo: 'RK-2023-0003', equipmentTypeId: 4, quantity: 1, unitPrice: 150000, totalPrice: 150000, supplier: '迈瑞医疗', date: '2023-03-01', operator: 'admin', remark: '新购手术床' },
        { id: 5, orderNo: 'RK-2023-0004', equipmentTypeId: 5, quantity: 1, unitPrice: 50000, totalPrice: 50000, supplier: '飞利浦医疗', date: '2023-04-15', operator: 'admin', remark: '新购监护仪' }
      ],
      stockOutRecords: [
        { id: 1, orderNo: 'CK-2023-0001', equipmentItemId: 1, department: '影像科', date: '2023-01-16', operator: 'admin', remark: '分配至影像中心1号机房' },
        { id: 2, orderNo: 'CK-2023-0002', equipmentItemId: 2, department: '影像科', date: '2023-03-21', operator: 'admin', remark: '分配至影像中心2号机房' },
        { id: 3, orderNo: 'CK-2022-0001', equipmentItemId: 3, department: '影像科', date: '2022-06-11', operator: 'admin', remark: '分配至影像中心MRI室' },
        { id: 4, orderNo: 'CK-2023-0003', equipmentItemId: 4, department: '检验科', date: '2023-03-01', operator: 'admin', remark: '分配至检验科生化室' },
        { id: 5, orderNo: 'CK-2023-0004', equipmentItemId: 5, department: '手术室', date: '2023-03-02', operator: 'admin', remark: '分配至手术室1号' },
        { id: 6, orderNo: 'CK-2023-0005', equipmentItemId: 6, department: 'ICU', date: '2023-04-16', operator: 'admin', remark: '分配至ICU使用' }
      ],
      depreciationRecords: [
        { id: 1, equipmentItemId: 1, year: 2023, month: 12, beforeValue: 4750000, depreciationAmount: 250000, afterValue: 4500000, type: '自动', date: '2023-12-31' },
        { id: 2, equipmentItemId: 3, year: 2023, month: 12, beforeValue: 10800000, depreciationAmount: 600000, afterValue: 10200000, type: '自动', date: '2023-12-31' }
      ],
      scrapRecords: [],
      repairRecords: [
        { id: 1, orderNo: 'WX-2023-0001', equipmentItemId: 5, faultDesc: '显示屏故障', repairContent: '更换显示屏', cost: 5000, startDate: '2023-11-01', endDate: '2023-11-03', status: '已完成', operator: 'admin' }
      ],
      idGenerators: { category: 6, equipmentType: 6, equipmentItem: 7, stockIn: 6, stockOut: 7, depreciation: 3, scrap: 1, repair: 2 }
    };
    localStorage.setItem('hospital_data', JSON.stringify(initialData));
  },

  // 获取所有数据
  getData() {
    return JSON.parse(localStorage.getItem('hospital_data') || '{}');
  },

  // 保存所有数据
  saveData(data) {
    localStorage.setItem('hospital_data', JSON.stringify(data));
  },

  // 生成新ID
  generateId(type) {
    const data = this.getData();
    const id = data.idGenerators[type]++;
    this.saveData(data);
    return id;
  },

  // 生成单据号
  generateOrderNo(prefix) {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}-${random}`;
  }
};

// 初始化数据
DataStore.init();

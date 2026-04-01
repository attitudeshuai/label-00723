/**
 * API模块 - 纯前端版本
 * 使用本地数据存储模拟后端API
 */

const API = {
  // 获取token
  getToken() {
    return localStorage.getItem('token');
  },
  
  // 设置token
  setToken(token) {
    localStorage.setItem('token', token);
  },
  
  // 清除token
  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 模拟异步延迟
  async delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // 认证相关
  auth: {
    async login(username, password) {
      await API.delay();
      const data = DataStore.getData();
      const user = data.users.find(u => u.username === username && u.password === password);
      if (user) {
        const token = 'token_' + Date.now();
        return { success: true, data: { token, user: { id: user.id, name: user.name, role: user.role, department: user.department } } };
      }
      return { success: false, message: '用户名或密码错误' };
    },
    async logout() {
      await API.delay();
      return { success: true };
    }
  },
  
  // 分类相关
  category: {
    async list() {
      await API.delay();
      const data = DataStore.getData();
      return { success: true, data: data.categories };
    },
    async get(id) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.categories.find(c => c.id === parseInt(id));
      return item ? { success: true, data: item } : { success: false, message: '分类不存在' };
    },
    async create(formData) {
      await API.delay();
      const data = DataStore.getData();
      const newItem = { id: DataStore.generateId('category'), ...formData };
      data.categories.push(newItem);
      DataStore.saveData(data);
      return { success: true, data: newItem };
    },
    async update(id, formData) {
      await API.delay();
      const data = DataStore.getData();
      const index = data.categories.findIndex(c => c.id === parseInt(id));
      if (index === -1) return { success: false, message: '分类不存在' };
      data.categories[index] = { ...data.categories[index], ...formData };
      DataStore.saveData(data);
      return { success: true, data: data.categories[index] };
    },
    async delete(id) {
      await API.delay();
      const data = DataStore.getData();
      const index = data.categories.findIndex(c => c.id === parseInt(id));
      if (index === -1) return { success: false, message: '分类不存在' };
      data.categories.splice(index, 1);
      DataStore.saveData(data);
      return { success: true };
    }
  },
  
  // 设备类型相关
  equipment: {
    async listTypes(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let result = data.equipmentTypes.map(t => {
        const cat = data.categories.find(c => c.id === t.categoryId);
        return { ...t, categoryName: cat ? cat.name : '' };
      });
      if (params.categoryId) result = result.filter(t => t.categoryId === parseInt(params.categoryId));
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        result = result.filter(t => t.name.toLowerCase().includes(kw) || t.brand.toLowerCase().includes(kw) || t.model.toLowerCase().includes(kw));
      }
      return { success: true, data: result };
    },
    async getType(id) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.equipmentTypes.find(t => t.id === parseInt(id));
      return item ? { success: true, data: item } : { success: false, message: '设备类型不存在' };
    },
    async createType(formData) {
      await API.delay();
      const data = DataStore.getData();
      const newItem = { id: DataStore.generateId('equipmentType'), ...formData, categoryId: parseInt(formData.categoryId), lifeYears: parseInt(formData.lifeYears), depreciationRate: parseFloat(formData.depreciationRate) };
      data.equipmentTypes.push(newItem);
      DataStore.saveData(data);
      return { success: true, data: newItem };
    },
    async updateType(id, formData) {
      await API.delay();
      const data = DataStore.getData();
      const index = data.equipmentTypes.findIndex(t => t.id === parseInt(id));
      if (index === -1) return { success: false, message: '设备类型不存在' };
      data.equipmentTypes[index] = { ...data.equipmentTypes[index], ...formData, categoryId: parseInt(formData.categoryId), lifeYears: parseInt(formData.lifeYears), depreciationRate: parseFloat(formData.depreciationRate) };
      DataStore.saveData(data);
      return { success: true, data: data.equipmentTypes[index] };
    },
    async deleteType(id) {
      await API.delay();
      const data = DataStore.getData();
      const index = data.equipmentTypes.findIndex(t => t.id === parseInt(id));
      if (index === -1) return { success: false, message: '设备类型不存在' };
      data.equipmentTypes.splice(index, 1);
      DataStore.saveData(data);
      return { success: true };
    },
    async listItems(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let result = data.equipmentItems.map(item => {
        const type = data.equipmentTypes.find(t => t.id === item.equipmentTypeId);
        return { ...item, equipmentName: type ? type.name : '', brand: type ? type.brand : '', model: type ? type.model : '' };
      });
      if (params.status) result = result.filter(i => i.status === params.status);
      if (params.department) result = result.filter(i => i.department && i.department.includes(params.department));
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        result = result.filter(i => i.serialNumber.toLowerCase().includes(kw) || i.equipmentName.toLowerCase().includes(kw) || (i.location && i.location.toLowerCase().includes(kw)));
      }
      return { success: true, data: result };
    },
    async getItem(id) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.equipmentItems.find(i => i.id === parseInt(id));
      if (!item) {
        return { success: false, message: '设备不存在' };
      }
      const type = data.equipmentTypes.find(t => t.id === item.equipmentTypeId);
      return {
        success: true,
        data: {
          ...item,
          equipmentName: type ? type.name : '',
          brand: type ? type.brand : '',
          model: type ? type.model : '',
          spec: type ? type.spec : '',
          unit: type ? type.unit : '',
          lifeYears: type ? type.lifeYears : 10,
          depreciationRate: type ? type.depreciationRate : 10
        }
      };
    }
  },

  // 入库相关
  stockIn: {
    async list(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let result = data.stockInRecords.map(r => {
        const type = data.equipmentTypes.find(t => t.id === r.equipmentTypeId);
        const cat = type ? data.categories.find(c => c.id === type.categoryId) : null;
        return { ...r, equipmentName: type ? type.name : '', categoryName: cat ? cat.name : '' };
      });
      if (params.startDate) result = result.filter(r => r.date >= params.startDate);
      if (params.endDate) result = result.filter(r => r.date <= params.endDate);
      return { success: true, data: result };
    },
    async get(id) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.stockInRecords.find(r => r.id === parseInt(id));
      return item ? { success: true, data: item } : { success: false, message: '入库记录不存在' };
    },
    async create(formData) {
      await API.delay();
      const data = DataStore.getData();
      const type = data.equipmentTypes.find(t => t.id === parseInt(formData.equipmentTypeId));
      if (!type) return { success: false, message: '设备类型不存在' };
      
      const quantity = parseInt(formData.quantity);
      const unitPrice = parseFloat(formData.unitPrice);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 创建入库记录
      const stockIn = {
        id: DataStore.generateId('stockIn'),
        orderNo: DataStore.generateOrderNo('RK'),
        equipmentTypeId: type.id,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        supplier: formData.supplier || '',
        date: formData.date || new Date().toISOString().split('T')[0],
        operator: user.name || 'admin',
        remark: formData.remark || ''
      };
      data.stockInRecords.push(stockIn);
      
      // 创建设备明细
      for (let i = 0; i < quantity; i++) {
        const serialNumber = `${type.name.substring(0, 2).toUpperCase()}-${new Date().getFullYear()}-${String(data.idGenerators.equipmentItem).padStart(3, '0')}`;
        const item = {
          id: DataStore.generateId('equipmentItem'),
          equipmentTypeId: type.id,
          serialNumber,
          purchaseDate: stockIn.date,
          purchasePrice: unitPrice,
          currentValue: unitPrice,
          location: '',
          status: '在库',
          department: ''
        };
        data.equipmentItems.push(item);
      }
      
      DataStore.saveData(data);
      return { success: true, data: stockIn };
    }
  },
  
  // 出库相关
  stockOut: {
    async list(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let result = data.stockOutRecords.map(r => {
        const item = data.equipmentItems.find(i => i.id === r.equipmentItemId);
        const type = item ? data.equipmentTypes.find(t => t.id === item.equipmentTypeId) : null;
        return { ...r, serialNumber: item ? item.serialNumber : '', equipmentName: type ? type.name : '' };
      });
      if (params.startDate) result = result.filter(r => r.date >= params.startDate);
      if (params.endDate) result = result.filter(r => r.date <= params.endDate);
      if (params.department) result = result.filter(r => r.department && r.department.includes(params.department));
      return { success: true, data: result };
    },
    async get(id) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.stockOutRecords.find(r => r.id === parseInt(id));
      return item ? { success: true, data: item } : { success: false, message: '出库记录不存在' };
    },
    async create(formData) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.equipmentItems.find(i => i.id === parseInt(formData.equipmentItemId));
      if (!item) return { success: false, message: '设备不存在' };
      if (item.status !== '在库') return { success: false, message: '设备不在库中' };
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const stockOut = {
        id: DataStore.generateId('stockOut'),
        orderNo: DataStore.generateOrderNo('CK'),
        equipmentItemId: item.id,
        department: formData.department,
        date: formData.date || new Date().toISOString().split('T')[0],
        operator: user.name || 'admin',
        remark: formData.remark || ''
      };
      data.stockOutRecords.push(stockOut);
      
      // 更新设备状态
      item.status = '在用';
      item.department = formData.department;
      item.location = formData.location || '';
      
      DataStore.saveData(data);
      return { success: true, data: stockOut };
    },
    async getAvailableItems() {
      await API.delay();
      const data = DataStore.getData();
      const result = data.equipmentItems.filter(i => i.status === '在库').map(item => {
        const type = data.equipmentTypes.find(t => t.id === item.equipmentTypeId);
        return { ...item, equipmentName: type ? type.name : '', brand: type ? type.brand : '', model: type ? type.model : '' };
      });
      return { success: true, data: result };
    }
  },
  
  // 折旧相关
  depreciation: {
    async list(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let result = data.depreciationRecords.map(r => {
        const item = data.equipmentItems.find(i => i.id === r.equipmentItemId);
        const type = item ? data.equipmentTypes.find(t => t.id === item.equipmentTypeId) : null;
        return { ...r, serialNumber: item ? item.serialNumber : '', equipmentName: type ? type.name : '' };
      });
      return { success: true, data: result };
    },
    async autoDepreciate(year, month) {
      await API.delay();
      const data = DataStore.getData();
      const items = data.equipmentItems.filter(i => i.status === '在用' && i.currentValue > 0);
      let count = 0;
      
      items.forEach(item => {
        const type = data.equipmentTypes.find(t => t.id === item.equipmentTypeId);
        if (!type) return;
        
        const monthlyRate = type.depreciationRate / 12 / 100;
        const depAmount = Math.round(item.purchasePrice * monthlyRate * 100) / 100;
        const beforeValue = item.currentValue;
        const afterValue = Math.max(0, beforeValue - depAmount);
        
        const record = {
          id: DataStore.generateId('depreciation'),
          equipmentItemId: item.id,
          year: parseInt(year),
          month: parseInt(month),
          beforeValue,
          depreciationAmount: depAmount,
          afterValue,
          type: '自动',
          date: `${year}-${String(month).padStart(2, '0')}-28`
        };
        data.depreciationRecords.push(record);
        item.currentValue = afterValue;
        count++;
      });
      
      DataStore.saveData(data);
      return { success: true, message: `已完成${count}台设备的折旧计算` };
    },
    async manualAdjust(formData) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.equipmentItems.find(i => i.id === parseInt(formData.equipmentItemId));
      if (!item) return { success: false, message: '设备不存在' };
      
      const adjustAmount = parseFloat(formData.adjustAmount);
      const beforeValue = item.currentValue;
      const afterValue = Math.max(0, beforeValue - adjustAmount);
      
      const record = {
        id: DataStore.generateId('depreciation'),
        equipmentItemId: item.id,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        beforeValue,
        depreciationAmount: adjustAmount,
        afterValue,
        type: '手动',
        date: new Date().toISOString().split('T')[0],
        reason: formData.reason || ''
      };
      data.depreciationRecords.push(record);
      item.currentValue = afterValue;
      
      DataStore.saveData(data);
      return { success: true, data: record };
    },
    async getSummary() {
      await API.delay();
      const data = DataStore.getData();
      const result = data.equipmentItems.filter(i => i.status !== '已报废').map(item => {
        const type = data.equipmentTypes.find(t => t.id === item.equipmentTypeId);
        const totalDep = item.purchasePrice - item.currentValue;
        const depRate = item.purchasePrice > 0 ? ((totalDep / item.purchasePrice) * 100).toFixed(1) + '%' : '0%';
        return {
          ...item,
          equipmentName: type ? type.name : '',
          totalDepreciation: totalDep,
          depreciationRate: depRate
        };
      });
      return { success: true, data: result };
    }
  },

  // 报废相关
  scrap: {
    async list(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let result = data.scrapRecords.map(r => {
        const item = data.equipmentItems.find(i => i.id === r.equipmentItemId);
        const type = item ? data.equipmentTypes.find(t => t.id === item.equipmentTypeId) : null;
        return { ...r, serialNumber: item ? item.serialNumber : '', equipmentName: type ? type.name : '' };
      });
      return { success: true, data: result };
    },
    async get(id) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.scrapRecords.find(r => r.id === parseInt(id));
      return item ? { success: true, data: item } : { success: false, message: '报废记录不存在' };
    },
    async create(formData) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.equipmentItems.find(i => i.id === parseInt(formData.equipmentItemId));
      if (!item) return { success: false, message: '设备不存在' };
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const scrap = {
        id: DataStore.generateId('scrap'),
        orderNo: DataStore.generateOrderNo('BF'),
        equipmentItemId: item.id,
        reason: formData.reason,
        originalValue: item.purchasePrice,
        currentValue: item.currentValue,
        scrapValue: parseFloat(formData.scrapValue) || 0,
        date: formData.date || new Date().toISOString().split('T')[0],
        operator: user.name || 'admin',
        remark: formData.remark || ''
      };
      data.scrapRecords.push(scrap);
      item.status = '已报废';
      
      DataStore.saveData(data);
      return { success: true, data: scrap };
    },
    async getAvailableItems() {
      await API.delay();
      const data = DataStore.getData();
      const result = data.equipmentItems.filter(i => i.status !== '已报废').map(item => {
        const type = data.equipmentTypes.find(t => t.id === item.equipmentTypeId);
        return { ...item, equipmentName: type ? type.name : '', brand: type ? type.brand : '', model: type ? type.model : '' };
      });
      return { success: true, data: result };
    }
  },
  
  // 维修相关
  repair: {
    async list(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let result = data.repairRecords.map(r => {
        const item = data.equipmentItems.find(i => i.id === r.equipmentItemId);
        const type = item ? data.equipmentTypes.find(t => t.id === item.equipmentTypeId) : null;
        return { ...r, serialNumber: item ? item.serialNumber : '', equipmentName: type ? type.name : '' };
      });
      if (params.status) result = result.filter(r => r.status === params.status);
      return { success: true, data: result };
    },
    async get(id) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.repairRecords.find(r => r.id === parseInt(id));
      return item ? { success: true, data: item } : { success: false, message: '维修记录不存在' };
    },
    async create(formData) {
      await API.delay();
      const data = DataStore.getData();
      const item = data.equipmentItems.find(i => i.id === parseInt(formData.equipmentItemId));
      if (!item) return { success: false, message: '设备不存在' };
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const repair = {
        id: DataStore.generateId('repair'),
        orderNo: DataStore.generateOrderNo('WX'),
        equipmentItemId: item.id,
        faultDesc: formData.faultDesc,
        repairContent: '',
        cost: parseFloat(formData.cost) || 0,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        endDate: null,
        status: '维修中',
        operator: user.name || 'admin',
        remark: formData.remark || ''
      };
      data.repairRecords.push(repair);
      item.status = '维修中';
      
      DataStore.saveData(data);
      return { success: true, data: repair };
    },
    async update(id, formData) {
      await API.delay();
      const data = DataStore.getData();
      const index = data.repairRecords.findIndex(r => r.id === parseInt(id));
      if (index === -1) return { success: false, message: '维修记录不存在' };
      
      const repair = data.repairRecords[index];
      Object.assign(repair, formData);
      if (formData.cost) repair.cost = parseFloat(formData.cost);
      
      // 如果维修完成，更新设备状态
      if (formData.status === '已完成') {
        const item = data.equipmentItems.find(i => i.id === repair.equipmentItemId);
        if (item) item.status = '在用';
      }
      
      DataStore.saveData(data);
      return { success: true, data: repair };
    },
    async getAvailableItems() {
      await API.delay();
      const data = DataStore.getData();
      const result = data.equipmentItems.filter(i => i.status === '在用').map(item => {
        const type = data.equipmentTypes.find(t => t.id === item.equipmentTypeId);
        return { ...item, equipmentName: type ? type.name : '', brand: type ? type.brand : '', model: type ? type.model : '' };
      });
      return { success: true, data: result };
    }
  },
  
  // 报表相关
  report: {
    async dashboard() {
      await API.delay();
      const data = DataStore.getData();
      const items = data.equipmentItems;
      const activeItems = items.filter(i => i.status !== '已报废'); // 排除已报废设备
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const totalEquipment = activeItems.length; // 只统计未报废设备
      const inUseCount = items.filter(i => i.status === '在用').length;
      const inStockCount = items.filter(i => i.status === '在库').length;
      const repairingCount = items.filter(i => i.status === '维修中').length;
      const scrapCount = items.filter(i => i.status === '已报废').length; // 报废数量单独统计
      const totalValue = activeItems.reduce((sum, i) => sum + (i.currentValue || 0), 0);
      const totalOriginalValue = activeItems.reduce((sum, i) => sum + (i.purchasePrice || 0), 0);
      const totalDepreciation = totalOriginalValue - totalValue;
      const monthlyStockIn = data.stockInRecords.filter(r => r.date && r.date.startsWith(thisMonth)).length;
      const monthlyStockOut = data.stockOutRecords.filter(r => r.date && r.date.startsWith(thisMonth)).length;
      
      // 分类统计时排除已报废设备
      const byCategory = data.categories.map(cat => {
        const typeIds = data.equipmentTypes.filter(t => t.categoryId === cat.id).map(t => t.id);
        const catItems = activeItems.filter(i => typeIds.includes(i.equipmentTypeId));
        return { name: cat.name, count: catItems.length, value: catItems.reduce((sum, i) => sum + (i.currentValue || 0), 0) };
      });
      
      return { success: true, data: { totalEquipment, inUseCount, inStockCount, repairingCount, scrapCount, totalValue, totalOriginalValue, totalDepreciation, monthlyStockIn, monthlyStockOut, byCategory } };
    },
    async stockIn(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let records = data.stockInRecords.map(r => {
        const type = data.equipmentTypes.find(t => t.id === r.equipmentTypeId);
        const cat = type ? data.categories.find(c => c.id === type.categoryId) : null;
        return { ...r, equipmentName: type ? type.name : '', categoryName: cat ? cat.name : '', brand: type ? type.brand : '', model: type ? type.model : '' };
      });
      if (params.startDate) records = records.filter(r => r.date >= params.startDate);
      if (params.endDate) records = records.filter(r => r.date <= params.endDate);
      if (params.categoryId) {
        const typeIds = data.equipmentTypes.filter(t => t.categoryId === parseInt(params.categoryId)).map(t => t.id);
        records = records.filter(r => typeIds.includes(r.equipmentTypeId));
      }
      const summary = {
        totalQuantity: records.reduce((sum, r) => sum + (r.quantity || 0), 0),
        totalAmount: records.reduce((sum, r) => sum + (r.totalPrice || 0), 0)
      };
      return { success: true, data: { records, summary } };
    },
    async stockOut(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let records = data.stockOutRecords.map(r => {
        const item = data.equipmentItems.find(i => i.id === r.equipmentItemId);
        const type = item ? data.equipmentTypes.find(t => t.id === item.equipmentTypeId) : null;
        return { ...r, serialNumber: item ? item.serialNumber : '', equipmentName: type ? type.name : '', brand: type ? type.brand : '', purchasePrice: item ? item.purchasePrice : 0 };
      });
      if (params.startDate) records = records.filter(r => r.date >= params.startDate);
      if (params.endDate) records = records.filter(r => r.date <= params.endDate);
      if (params.department) records = records.filter(r => r.department && r.department.includes(params.department));
      const summary = {
        totalCount: records.length,
        totalValue: records.reduce((sum, r) => sum + (r.purchasePrice || 0), 0)
      };
      return { success: true, data: { records, summary } };
    },
    async inventory(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let records = data.equipmentItems.map(item => {
        const type = data.equipmentTypes.find(t => t.id === item.equipmentTypeId);
        const cat = type ? data.categories.find(c => c.id === type.categoryId) : null;
        return { ...item, equipmentName: type ? type.name : '', brand: type ? type.brand : '', model: type ? type.model : '', categoryName: cat ? cat.name : '' };
      });
      if (params.status) records = records.filter(i => i.status === params.status);
      if (params.location) records = records.filter(i => i.location && i.location.includes(params.location));
      if (params.categoryId) {
        const typeIds = data.equipmentTypes.filter(t => t.categoryId === parseInt(params.categoryId)).map(t => t.id);
        records = records.filter(i => typeIds.includes(i.equipmentTypeId));
      }
      const summary = {
        totalCount: records.length,
        totalOriginalValue: records.reduce((sum, i) => sum + (i.purchasePrice || 0), 0),
        totalValue: records.reduce((sum, i) => sum + (i.currentValue || 0), 0)
      };
      return { success: true, data: { records, summary } };
    },
    async depreciation(params = {}) {
      await API.delay();
      const data = DataStore.getData();
      let records = data.depreciationRecords.map(r => {
        const item = data.equipmentItems.find(i => i.id === r.equipmentItemId);
        const type = item ? data.equipmentTypes.find(t => t.id === item.equipmentTypeId) : null;
        return { ...r, serialNumber: item ? item.serialNumber : '', equipmentName: type ? type.name : '', brand: type ? type.brand : '', purchasePrice: item ? item.purchasePrice : 0 };
      });
      if (params.year) records = records.filter(r => r.year === parseInt(params.year));
      if (params.startDate) records = records.filter(r => r.date >= params.startDate);
      if (params.endDate) records = records.filter(r => r.date <= params.endDate);
      const summary = {
        totalDepreciation: records.reduce((sum, r) => sum + (r.depreciationAmount || 0), 0)
      };
      return { success: true, data: { records, summary } };
    }
  }
};

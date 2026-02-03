/**
 * API请求模块
 * 封装所有后端API调用
 */

const API = {
  baseUrl: '/api',
  
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
  
  // 通用请求方法
  async request(url, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      // 登录接口不需要刷新页面，直接返回错误
      if (response.status === 401 && url !== '/auth/login') {
        this.clearToken();
        window.location.reload();
        return { success: false, message: '登录已过期' };
      }
      
      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      return { success: false, message: '网络请求失败' };
    }
  },
  
  // GET请求
  get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl, { method: 'GET' });
  },
  
  // POST请求
  post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  // PUT请求
  put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  // DELETE请求
  delete(url) {
    return this.request(url, { method: 'DELETE' });
  },
  
  // 认证相关
  auth: {
    login(username, password) {
      return API.post('/auth/login', { username, password });
    },
    logout() {
      return API.post('/auth/logout');
    }
  },
  
  // 分类相关
  category: {
    list() {
      return API.get('/category');
    },
    get(id) {
      return API.get(`/category/${id}`);
    },
    create(data) {
      return API.post('/category', data);
    },
    update(id, data) {
      return API.put(`/category/${id}`, data);
    },
    delete(id) {
      return API.delete(`/category/${id}`);
    }
  },
  
  // 设备类型相关
  equipment: {
    listTypes(params = {}) {
      return API.get('/equipment/types', params);
    },
    getType(id) {
      return API.get(`/equipment/types/${id}`);
    },
    createType(data) {
      return API.post('/equipment/types', data);
    },
    updateType(id, data) {
      return API.put(`/equipment/types/${id}`, data);
    },
    deleteType(id) {
      return API.delete(`/equipment/types/${id}`);
    },
    listItems(params = {}) {
      return API.get('/equipment/items', params);
    },
    getItem(id) {
      return API.get(`/equipment/items/${id}`);
    }
  },
  
  // 入库相关
  stockIn: {
    list(params = {}) {
      return API.get('/stock-in', params);
    },
    get(id) {
      return API.get(`/stock-in/${id}`);
    },
    create(data) {
      return API.post('/stock-in', data);
    }
  },
  
  // 出库相关
  stockOut: {
    list(params = {}) {
      return API.get('/stock-out', params);
    },
    get(id) {
      return API.get(`/stock-out/${id}`);
    },
    create(data) {
      return API.post('/stock-out', data);
    },
    getAvailableItems() {
      return API.get('/stock-out/available/items');
    }
  },
  
  // 折旧相关
  depreciation: {
    list(params = {}) {
      return API.get('/depreciation', params);
    },
    autoDepreciate(year, month) {
      return API.post('/depreciation/auto', { year, month });
    },
    manualAdjust(data) {
      return API.post('/depreciation/manual', data);
    },
    getSummary() {
      return API.get('/depreciation/summary');
    }
  },
  
  // 报废相关
  scrap: {
    list(params = {}) {
      return API.get('/scrap', params);
    },
    get(id) {
      return API.get(`/scrap/${id}`);
    },
    create(data) {
      return API.post('/scrap', data);
    },
    getAvailableItems() {
      return API.get('/scrap/available/items');
    }
  },
  
  // 维修相关
  repair: {
    list(params = {}) {
      return API.get('/repair', params);
    },
    get(id) {
      return API.get(`/repair/${id}`);
    },
    create(data) {
      return API.post('/repair', data);
    },
    update(id, data) {
      return API.put(`/repair/${id}`, data);
    },
    getAvailableItems() {
      return API.get('/repair/available/items');
    }
  },
  
  // 报表相关
  report: {
    dashboard() {
      return API.get('/report/dashboard');
    },
    stockIn(params = {}) {
      return API.get('/report/stock-in', params);
    },
    stockOut(params = {}) {
      return API.get('/report/stock-out', params);
    },
    inventory(params = {}) {
      return API.get('/report/inventory', params);
    },
    depreciation(params = {}) {
      return API.get('/report/depreciation', params);
    }
  }
};

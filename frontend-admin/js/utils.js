/**
 * 工具函数模块
 */

const Utils = {
  // 格式化金额
  formatMoney(value) {
    if (value === null || value === undefined) return '¥0.00';
    return '¥' + Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },
  
  // 格式化日期
  formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
  },
  
  // 格式化日期时间
  formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  },
  
  // 获取今天日期字符串
  getToday() {
    return new Date().toISOString().split('T')[0];
  },
  
  // 获取本月第一天
  getMonthStart() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  },
  
  // 获取本月最后一天
  getMonthEnd() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  },
  
  // 防抖函数
  debounce(fn, delay = 300) {
    let timer = null;
    return function(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },
  
  // 节流函数
  throttle(fn, delay = 300) {
    let last = 0;
    return function(...args) {
      const now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn.apply(this, args);
      }
    };
  },
  
  // 深拷贝
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  
  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  // 导出CSV
  exportCSV(data, filename, headers) {
    const csvContent = [
      headers.map(h => h.label).join(','),
      ...data.map(row => headers.map(h => {
        let value = row[h.key];
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        return value ?? '';
      }).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${Utils.getToday()}.csv`;
    link.click();
  },
  
  // 获取状态标签样式
  getStatusClass(status) {
    const statusMap = {
      '在用': 'success',
      '在库': 'info',
      '维修中': 'warning',
      '已报废': 'error',
      '已完成': 'success',
      '正常': 'success'
    };
    return statusMap[status] || 'info';
  },
  
  // 表单验证
  validateForm(formData, rules) {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
      const value = formData[field];
      if (rule.required && (!value || value === '')) {
        errors.push(`${rule.label}不能为空`);
      }
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${rule.label}不能小于${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${rule.label}不能大于${rule.max}`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${rule.label}格式不正确`);
      }
    }
    return errors;
  },
  
  // 调整颜色亮度（用于Canvas渐变）
  adjustColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const newR = Math.round(r + (255 - r) * (1 - factor));
    const newG = Math.round(g + (255 - g) * (1 - factor));
    const newB = Math.round(b + (255 - b) * (1 - factor));
    return `rgb(${newR}, ${newG}, ${newB})`;
  }
};

/**
 * 页面模块
 * 各功能页面的渲染和逻辑
 */

const Pages = {
  // 当前页面数据缓存
  cache: {},
  
  // 仪表盘页面
  async dashboard() {
    const content = document.getElementById('pageContent');
    content.innerHTML = Components.loading();
    
    const res = await API.report.dashboard();
    if (!res.success) {
      content.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
      return;
    }
    
    const data = res.data;
    
    content.innerHTML = `
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-icon blue">📦</div>
          <div class="stat-info">
            <h3>${data.totalEquipment}</h3>
            <p>设备总数</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">✓</div>
          <div class="stat-info">
            <h3>${data.inUseCount}</h3>
            <p>在用设备</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">📥</div>
          <div class="stat-info">
            <h3>${data.inStockCount}</h3>
            <p>在库设备</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">🔧</div>
          <div class="stat-info">
            <h3>${data.repairingCount}</h3>
            <p>维修中</p>
          </div>
        </div>
      </div>
      
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-icon blue">💰</div>
          <div class="stat-info">
            <h3>${Utils.formatMoney(data.totalValue)}</h3>
            <p>设备净值</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">💵</div>
          <div class="stat-info">
            <h3>${Utils.formatMoney(data.totalOriginalValue)}</h3>
            <p>设备原值</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">📉</div>
          <div class="stat-info">
            <h3>${Utils.formatMoney(data.totalDepreciation)}</h3>
            <p>累计折旧</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">📊</div>
          <div class="stat-info">
            <h3>${data.monthlyStockIn} / ${data.monthlyStockOut}</h3>
            <p>本月入库/出库</p>
          </div>
        </div>
      </div>
      
      <div class="chart-row">
        <div class="card chart-card">
          <div class="card-header">
            <span class="card-title">设备状态分布</span>
          </div>
          <div class="card-body chart-container">
            <canvas id="statusPieChart" width="300" height="300"></canvas>
          </div>
        </div>
        <div class="card chart-card">
          <div class="card-header">
            <span class="card-title">分类设备数量</span>
          </div>
          <div class="card-body chart-container">
            <canvas id="categoryBarChart" width="400" height="300"></canvas>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">设备分类统计</span>
        </div>
        <div class="card-body">
          ${Components.renderTable(data.byCategory, [
            { key: 'name', label: '分类名称' },
            { key: 'count', label: '设备数量' },
            { key: 'value', label: '设备价值', type: 'money' }
          ])}
        </div>
      </div>
    `;
    
    // 绘制Canvas图表
    this.drawStatusPieChart(data);
    this.drawCategoryBarChart(data.byCategory);
  },
  
  // 绘制设备状态饼图
  drawStatusPieChart(data) {
    const canvas = document.getElementById('statusPieChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const statusData = [
      { label: '在用', value: data.inUseCount, color: '#52c41a' },
      { label: '在库', value: data.inStockCount, color: '#1890ff' },
      { label: '维修中', value: data.repairingCount, color: '#faad14' },
      { label: '已报废', value: data.scrapCount || 0, color: '#ff4d4f' }
    ].filter(item => item.value > 0);
    
    const total = statusData.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', centerX, centerY);
      return;
    }
    
    let startAngle = -Math.PI / 2;
    
    // 绘制饼图扇形
    statusData.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      
      // 绘制白色边框
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 计算标签位置
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(midAngle) * labelRadius;
      const labelY = centerY + Math.sin(midAngle) * labelRadius;
      
      // 绘制百分比标签
      const percent = ((item.value / total) * 100).toFixed(1);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percent}%`, labelX, labelY);
      
      startAngle += sliceAngle;
    });
    
    // 绘制图例（居中显示）
    const legendY = canvas.height - 25;
    const legendItemWidth = 80; // 每个图例项的宽度
    const totalLegendWidth = statusData.length * legendItemWidth;
    let legendX = (canvas.width - totalLegendWidth) / 2; // 计算起始位置使图例居中
    
    statusData.forEach((item, index) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY, 12, 12);
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${item.label}(${item.value})`, legendX + 16, legendY + 6);
      legendX += legendItemWidth;
    });
  },
  
  // 绘制分类柱状图
  drawCategoryBarChart(categoryData) {
    const canvas = document.getElementById('categoryBarChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const padding = { top: 30, right: 20, bottom: 60, left: 50 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;
    
    if (!categoryData || categoryData.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    const maxValue = Math.max(...categoryData.map(d => d.count), 1);
    const barWidth = Math.min(50, (chartWidth / categoryData.length) * 0.6);
    const barGap = (chartWidth - barWidth * categoryData.length) / (categoryData.length + 1);
    
    // 绘制Y轴
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, canvas.height - padding.bottom);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 绘制X轴
    ctx.beginPath();
    ctx.moveTo(padding.left, canvas.height - padding.bottom);
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.stroke();
    
    // 绘制Y轴刻度
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = padding.top + (chartHeight / yTicks) * i;
      const value = Math.round(maxValue * (1 - i / yTicks));
      
      ctx.beginPath();
      ctx.moveTo(padding.left - 5, y);
      ctx.lineTo(padding.left, y);
      ctx.stroke();
      
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toString(), padding.left - 8, y);
      
      // 绘制网格线
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvas.width - padding.right, y);
      ctx.strokeStyle = '#eee';
      ctx.stroke();
      ctx.strokeStyle = '#ddd';
    }
    
    // 绘制柱状图
    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
    categoryData.forEach((item, index) => {
      const barHeight = (item.count / maxValue) * chartHeight;
      const x = padding.left + barGap + (barWidth + barGap) * index;
      const y = canvas.height - padding.bottom - barHeight;
      
      // 绘制柱子（带渐变）
      const gradient = ctx.createLinearGradient(x, y, x, canvas.height - padding.bottom);
      const color = colors[index % colors.length];
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, Utils.adjustColor(color, 0.7));
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // 绘制柱子顶部数值
      ctx.fillStyle = '#333';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(item.count.toString(), x + barWidth / 2, y - 3);
      
      // 绘制X轴标签
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      ctx.textBaseline = 'top';
      
      // 处理长标签，截断显示
      let label = item.name;
      if (label.length > 4) {
        label = label.substring(0, 4) + '..';
      }
      ctx.fillText(label, x + barWidth / 2, canvas.height - padding.bottom + 8);
    });
  },
  
  // 设备分类页面
  async category() {
    const content = document.getElementById('pageContent');
    content.innerHTML = Components.loading();
    
    const res = await API.category.list();
    if (!res.success) {
      content.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
      return;
    }
    
    this.cache.categories = res.data;
    
    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">设备分类管理</span>
          <button class="btn btn-primary" onclick="Pages.showCategoryForm()">+ 新增分类</button>
        </div>
        <div class="card-body">
          ${Components.renderTable(res.data, [
            { key: 'id', label: 'ID', width: '60px' },
            { key: 'code', label: '编码', width: '100px' },
            { key: 'name', label: '名称' },
            { key: 'description', label: '描述' },
            { key: 'actions', label: '操作', width: '150px', render: (_, row) => `
              <div class="action-btns">
                <button class="btn btn-sm btn-outline" onclick="Pages.showCategoryForm(${row.id})">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="Pages.deleteCategory(${row.id})">删除</button>
              </div>
            `}
          ])}
        </div>
      </div>
    `;
  },
  
  // 显示分类表单
  async showCategoryForm(id) {
    let data = { name: '', code: '', description: '' };
    if (id) {
      const item = this.cache.categories?.find(c => c.id === id);
      if (item) data = { ...item };
    }
    
    Components.showModal({
      title: id ? '编辑分类' : '新增分类',
      content: `
        <form id="categoryForm">
          <div class="form-group">
            <label>编码 <span class="required">*</span></label>
            <input type="text" class="form-control" name="code" value="${data.code}" required>
          </div>
          <div class="form-group">
            <label>名称 <span class="required">*</span></label>
            <input type="text" class="form-control" name="name" value="${data.name}" required>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea class="form-control" name="description">${data.description}</textarea>
          </div>
        </form>
      `,
      onConfirm: async () => {
        const form = document.getElementById('categoryForm');
        const formData = new FormData(form);
        const submitData = Object.fromEntries(formData);
        
        if (!submitData.code || !submitData.name) {
          Components.error('请填写必填项');
          return false;
        }
        
        const res = id 
          ? await API.category.update(id, submitData)
          : await API.category.create(submitData);
        
        if (res.success) {
          Components.success(id ? '更新成功' : '创建成功');
          this.category();
        } else {
          Components.error(res.message);
          return false;
        }
      }
    });
  },
  
  // 删除分类
  deleteCategory(id) {
    Components.confirm('确定要删除该分类吗？', async () => {
      const res = await API.category.delete(id);
      if (res.success) {
        Components.success('删除成功');
        this.category();
      } else {
        Components.error(res.message);
      }
    });
  },
  
  // 设备字典页面
  async equipment() {
    const content = document.getElementById('pageContent');
    content.innerHTML = Components.loading();
    
    // 加载分类
    const catRes = await API.category.list();
    this.cache.categories = catRes.data || [];
    
    // 加载设备类型
    const res = await API.equipment.listTypes();
    if (!res.success) {
      content.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
      return;
    }
    
    this.cache.equipmentTypes = res.data;
    
    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">设备字典管理</span>
          <button class="btn btn-primary" onclick="Pages.showEquipmentForm()">+ 新增设备类型</button>
        </div>
        <div class="card-body">
          <div class="search-bar">
            <div class="form-group">
              <label>设备分类</label>
              <select class="form-control" id="filterCategory" onchange="Pages.filterEquipment()">
                ${Components.renderSelect(this.cache.categories.map(c => ({ value: c.id, label: c.name })), '', '全部分类')}
              </select>
            </div>
            <div class="form-group">
              <label>关键词</label>
              <input type="text" class="form-control" id="filterKeyword" placeholder="名称/品牌/型号" onkeyup="Pages.filterEquipment()">
            </div>
          </div>
          <div id="equipmentTable">
            ${this.renderEquipmentTable(res.data)}
          </div>
        </div>
      </div>
    `;
  },
  
  renderEquipmentTable(data) {
    return Components.renderTable(data, [
      { key: 'id', label: 'ID', width: '60px' },
      { key: 'categoryName', label: '分类' },
      { key: 'name', label: '名称' },
      { key: 'brand', label: '品牌' },
      { key: 'model', label: '型号' },
      { key: 'spec', label: '规格' },
      { key: 'unit', label: '单位', width: '60px' },
      { key: 'lifeYears', label: '使用年限', width: '80px' },
      { key: 'depreciationRate', label: '折旧率', width: '80px', render: v => `${v}%` },
      { key: 'actions', label: '操作', width: '150px', render: (_, row) => `
        <div class="action-btns">
          <button class="btn btn-sm btn-outline" onclick="Pages.showEquipmentForm(${row.id})">编辑</button>
          <button class="btn btn-sm btn-danger" onclick="Pages.deleteEquipment(${row.id})">删除</button>
        </div>
      `}
    ]);
  },
  
  async filterEquipment() {
    const categoryId = document.getElementById('filterCategory').value;
    const keyword = document.getElementById('filterKeyword').value;
    
    const res = await API.equipment.listTypes({ categoryId, keyword });
    if (res.success) {
      document.getElementById('equipmentTable').innerHTML = this.renderEquipmentTable(res.data);
    }
  },
  
  async showEquipmentForm(id) {
    // 实时加载最新分类数据
    const catRes = await API.category.list();
    this.cache.categories = catRes.data || [];
    
    if (this.cache.categories.length === 0) {
      Components.warning('请先添加设备分类');
      return;
    }
    
    let data = { categoryId: '', name: '', brand: '', model: '', spec: '', unit: '台', lifeYears: 10, depreciationRate: 10 };
    if (id) {
      const item = this.cache.equipmentTypes?.find(e => e.id === id);
      if (item) data = { ...item };
    }
    
    Components.showModal({
      title: id ? '编辑设备类型' : '新增设备类型',
      content: `
        <form id="equipmentForm">
          <div class="form-row">
            <div class="form-group">
              <label>设备分类 <span class="required">*</span></label>
              <select class="form-control" name="categoryId" required>
                ${Components.renderSelect(this.cache.categories.map(c => ({ value: c.id, label: c.name })), data.categoryId)}
              </select>
            </div>
            <div class="form-group">
              <label>设备名称 <span class="required">*</span></label>
              <input type="text" class="form-control" name="name" value="${data.name}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>品牌 <span class="required">*</span></label>
              <input type="text" class="form-control" name="brand" value="${data.brand}" required>
            </div>
            <div class="form-group">
              <label>型号 <span class="required">*</span></label>
              <input type="text" class="form-control" name="model" value="${data.model}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>规格</label>
              <input type="text" class="form-control" name="spec" value="${data.spec}">
            </div>
            <div class="form-group">
              <label>单位</label>
              <input type="text" class="form-control" name="unit" value="${data.unit}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>使用年限</label>
              <input type="number" class="form-control" name="lifeYears" value="${data.lifeYears}" min="1">
            </div>
            <div class="form-group">
              <label>年折旧率(%)</label>
              <input type="number" class="form-control" name="depreciationRate" value="${data.depreciationRate}" min="0" max="100" step="0.1">
            </div>
          </div>
        </form>
      `,
      onConfirm: async () => {
        const form = document.getElementById('equipmentForm');
        const formData = new FormData(form);
        const submitData = Object.fromEntries(formData);
        
        if (!submitData.categoryId || !submitData.name || !submitData.brand || !submitData.model) {
          Components.error('请填写必填项');
          return false;
        }
        
        const res = id 
          ? await API.equipment.updateType(id, submitData)
          : await API.equipment.createType(submitData);
        
        if (res.success) {
          Components.success(id ? '更新成功' : '创建成功');
          this.equipment();
        } else {
          Components.error(res.message);
          return false;
        }
      }
    });
  },
  
  deleteEquipment(id) {
    Components.confirm('确定要删除该设备类型吗？', async () => {
      const res = await API.equipment.deleteType(id);
      if (res.success) {
        Components.success('删除成功');
        this.equipment();
      } else {
        Components.error(res.message);
      }
    });
  },
  
  // 设备明细页面
  async inventory() {
    const content = document.getElementById('pageContent');
    content.innerHTML = Components.loading();
    
    const res = await API.equipment.listItems();
    if (!res.success) {
      content.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
      return;
    }
    
    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">设备明细</span>
        </div>
        <div class="card-body">
          <div class="search-bar">
            <div class="form-group">
              <label>状态</label>
              <select class="form-control" id="filterStatus" onchange="Pages.filterInventory()">
                <option value="">全部状态</option>
                <option value="在用">在用</option>
                <option value="在库">在库</option>
                <option value="维修中">维修中</option>
                <option value="已报废">已报废</option>
              </select>
            </div>
            <div class="form-group">
              <label>科室</label>
              <input type="text" class="form-control" id="filterDept" placeholder="科室名称" onkeyup="Pages.filterInventory()">
            </div>
            <div class="form-group">
              <label>关键词</label>
              <input type="text" class="form-control" id="filterKw" placeholder="序列号/名称/位置" onkeyup="Pages.filterInventory()">
            </div>
          </div>
          <div id="inventoryTable">
            ${this.renderInventoryTable(res.data)}
          </div>
        </div>
      </div>
    `;
  },
  
  renderInventoryTable(data) {
    return Components.renderTable(data, [
      { key: 'serialNumber', label: '序列号' },
      { key: 'equipmentName', label: '设备名称' },
      { key: 'brand', label: '品牌' },
      { key: 'model', label: '型号' },
      { key: 'department', label: '使用科室' },
      { key: 'location', label: '存放位置' },
      { key: 'purchaseDate', label: '购入日期', type: 'date' },
      { key: 'purchasePrice', label: '购入价格', type: 'money' },
      { key: 'currentValue', label: '当前价值', type: 'money' },
      { key: 'status', label: '状态', type: 'status' }
    ]);
  },
  
  async filterInventory() {
    const status = document.getElementById('filterStatus').value;
    const department = document.getElementById('filterDept').value;
    const keyword = document.getElementById('filterKw').value;
    
    const res = await API.equipment.listItems({ status, department, keyword });
    if (res.success) {
      document.getElementById('inventoryTable').innerHTML = this.renderInventoryTable(res.data);
    }
  }
};

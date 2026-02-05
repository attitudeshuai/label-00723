/**
 * 页面模块 - 第二部分
 * 入库、出库、折旧、报废、维修页面
 */

// 设备入库页面
Pages.stockIn = async function() {
  const content = document.getElementById('pageContent');
  content.innerHTML = Components.loading();
  
  // 加载设备类型
  const typeRes = await API.equipment.listTypes();
  this.cache.equipmentTypes = typeRes.data || [];
  
  // 加载入库记录
  const res = await API.stockIn.list();
  if (!res.success) {
    content.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
    return;
  }
  
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">设备入库管理</span>
        <button class="btn btn-primary" onclick="Pages.showStockInForm()">+ 新增入库</button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <div class="form-group">
            <label>日期范围</label>
            <div id="stockInDateRange"></div>
          </div>
        </div>
        <div id="stockInTable">
          ${this.renderStockInTable(res.data)}
        </div>
      </div>
    </div>
  `;
  
  // 初始化日期范围选择器，选择后自动搜索
  this.stockInDatePicker = Components.createDateRangePicker('stockInDateRange', {
    onChange: () => Pages.filterStockIn()
  });
};

Pages.renderStockInTable = function(data) {
  return Components.renderTable(data, [
    { key: 'orderNo', label: '入库单号' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'categoryName', label: '分类' },
    { key: 'quantity', label: '数量' },
    { key: 'unitPrice', label: '单价', type: 'money' },
    { key: 'totalPrice', label: '总价', type: 'money' },
    { key: 'supplier', label: '供应商' },
    { key: 'date', label: '入库日期', type: 'date' },
    { key: 'operator', label: '操作人' }
  ]);
};

Pages.filterStockIn = async function() {
  const dateRange = this.stockInDatePicker ? this.stockInDatePicker.getValue() : {};
  const startDate = dateRange.startDate || '';
  const endDate = dateRange.endDate || '';
  
  const res = await API.stockIn.list({ startDate, endDate });
  if (res.success) {
    document.getElementById('stockInTable').innerHTML = this.renderStockInTable(res.data);
  }
};

Pages.showStockInForm = async function() {
  // 实时加载最新设备类型数据
  const typeRes = await API.equipment.listTypes();
  this.cache.equipmentTypes = typeRes.data || [];
  
  if (this.cache.equipmentTypes.length === 0) {
    Components.warning('请先在设备字典中添加设备类型');
    return;
  }
  
  Components.showModal({
    title: '新增入库',
    content: `
      <form id="stockInForm">
        <div class="form-row">
          <div class="form-group">
            <label>设备类型 <span class="required">*</span></label>
            <select class="form-control" name="equipmentTypeId" required>
              ${Components.renderSelect(this.cache.equipmentTypes.map(e => ({ value: e.id, label: `${e.name} - ${e.brand} ${e.model}` })), '')}
            </select>
          </div>
          <div class="form-group">
            <label>数量 <span class="required">*</span></label>
            <input type="number" class="form-control" name="quantity" value="1" min="1" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>单价 <span class="required">*</span></label>
            <input type="number" class="form-control" name="unitPrice" step="0.01" min="0" required>
          </div>
          <div class="form-group">
            <label>入库日期</label>
            <input type="date" class="form-control" name="date" value="${Utils.getToday()}">
          </div>
        </div>
        <div class="form-group">
          <label>供应商</label>
          <input type="text" class="form-control" name="supplier">
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea class="form-control" name="remark"></textarea>
        </div>
      </form>
    `,
    onConfirm: async () => {
      const form = document.getElementById('stockInForm');
      const formData = new FormData(form);
      const submitData = Object.fromEntries(formData);
      
      if (!submitData.equipmentTypeId || !submitData.quantity || !submitData.unitPrice) {
        Components.error('请填写必填项');
        return false;
      }
      
      const res = await API.stockIn.create(submitData);
      if (res.success) {
        Components.success('入库成功');
        Pages.stockIn();
      } else {
        Components.error(res.message);
        return false;
      }
    }
  });
};

// 设备出库页面
Pages.stockOut = async function() {
  const content = document.getElementById('pageContent');
  content.innerHTML = Components.loading();
  
  // 加载可出库设备
  const availRes = await API.stockOut.getAvailableItems();
  this.cache.availableItems = availRes.data || [];
  
  // 加载出库记录
  const res = await API.stockOut.list();
  if (!res.success) {
    content.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
    return;
  }
  
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">设备出库管理</span>
        <button class="btn btn-primary" onclick="Pages.showStockOutForm()">+ 新增出库</button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <div class="form-group">
            <label>日期范围</label>
            <div id="stockOutDateRange"></div>
          </div>
          <div class="form-group">
            <label>科室</label>
            <input type="text" class="form-control" id="stockOutDept" placeholder="科室名称" onkeyup="Pages.filterStockOut()">
          </div>
        </div>
        <div id="stockOutTable">
          ${this.renderStockOutTable(res.data)}
        </div>
      </div>
    </div>
  `;
  
  // 初始化日期范围选择器，选择后自动搜索
  this.stockOutDatePicker = Components.createDateRangePicker('stockOutDateRange', {
    onChange: () => Pages.filterStockOut()
  });
};

Pages.renderStockOutTable = function(data) {
  return Components.renderTable(data, [
    { key: 'orderNo', label: '出库单号' },
    { key: 'serialNumber', label: '设备序列号' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'department', label: '领用科室' },
    { key: 'date', label: '出库日期', type: 'date' },
    { key: 'operator', label: '操作人' },
    { key: 'remark', label: '备注' }
  ]);
};

Pages.filterStockOut = async function() {
  const dateRange = this.stockOutDatePicker ? this.stockOutDatePicker.getValue() : {};
  const startDate = dateRange.startDate || '';
  const endDate = dateRange.endDate || '';
  const department = document.getElementById('stockOutDept').value;
  
  const res = await API.stockOut.list({ startDate, endDate, department });
  if (res.success) {
    document.getElementById('stockOutTable').innerHTML = this.renderStockOutTable(res.data);
  }
};

Pages.showStockOutForm = async function() {
  // 实时加载最新可出库设备数据
  const availRes = await API.stockOut.getAvailableItems();
  this.cache.availableItems = availRes.data || [];
  
  if (this.cache.availableItems.length === 0) {
    Components.warning('暂无可出库的设备，请先进行入库操作');
    return;
  }
  
  Components.showModal({
    title: '新增出库',
    content: `
      <form id="stockOutForm">
        <div class="form-group">
          <label>选择设备 <span class="required">*</span></label>
          <select class="form-control" name="equipmentItemId" required>
            ${Components.renderSelect(this.cache.availableItems.map(e => ({ 
              value: e.id, 
              label: `${e.serialNumber} - ${e.equipmentName} (${e.brand} ${e.model})` 
            })), '')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>领用科室 <span class="required">*</span></label>
            <input type="text" class="form-control" name="department" required>
          </div>
          <div class="form-group">
            <label>存放位置</label>
            <input type="text" class="form-control" name="location">
          </div>
        </div>
        <div class="form-group">
          <label>出库日期</label>
          <input type="date" class="form-control" name="date" value="${Utils.getToday()}">
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea class="form-control" name="remark"></textarea>
        </div>
      </form>
    `,
    onConfirm: async () => {
      const form = document.getElementById('stockOutForm');
      const formData = new FormData(form);
      const submitData = Object.fromEntries(formData);
      
      if (!submitData.equipmentItemId || !submitData.department) {
        Components.error('请填写必填项');
        return false;
      }
      
      const res = await API.stockOut.create(submitData);
      if (res.success) {
        Components.success('出库成功');
        Pages.stockOut();
      } else {
        Components.error(res.message);
        return false;
      }
    }
  });
};

// 设备折旧页面
Pages.depreciation = async function() {
  const content = document.getElementById('pageContent');
  content.innerHTML = Components.loading();
  
  // 加载折旧汇总
  const summaryRes = await API.depreciation.getSummary();
  const summary = summaryRes.data || [];
  
  // 加载折旧记录
  const res = await API.depreciation.list();
  
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">设备折旧管理</span>
        <div>
          <button class="btn btn-primary" onclick="Pages.showAutoDepreciationForm()">执行自动折旧</button>
          <button class="btn btn-outline" onclick="Pages.showManualDepreciationForm()">手动调整</button>
        </div>
      </div>
      <div class="card-body">
        <h4 style="margin-bottom: 15px;">折旧汇总</h4>
        ${Components.renderTable(summary, [
          { key: 'serialNumber', label: '序列号' },
          { key: 'equipmentName', label: '设备名称' },
          { key: 'purchaseDate', label: '购入日期', type: 'date' },
          { key: 'purchasePrice', label: '原值', type: 'money' },
          { key: 'currentValue', label: '净值', type: 'money' },
          { key: 'totalDepreciation', label: '累计折旧', type: 'money' },
          { key: 'depreciationRate', label: '折旧比例' },
          { key: 'status', label: '状态', type: 'status' }
        ])}
        
        <h4 style="margin: 30px 0 15px;">折旧记录</h4>
        ${Components.renderTable(res.data || [], [
          { key: 'date', label: '日期', type: 'date' },
          { key: 'serialNumber', label: '序列号' },
          { key: 'equipmentName', label: '设备名称' },
          { key: 'beforeValue', label: '折旧前价值', type: 'money' },
          { key: 'depreciationAmount', label: '折旧金额', type: 'money' },
          { key: 'afterValue', label: '折旧后价值', type: 'money' },
          { key: 'type', label: '类型' }
        ])}
      </div>
    </div>
  `;
};

Pages.showAutoDepreciationForm = function() {
  const now = new Date();
  Components.showModal({
    title: '执行自动折旧',
    content: `
      <form id="autoDepForm">
        <p style="margin-bottom: 20px; color: #666;">系统将根据设备的折旧率自动计算并记录折旧金额</p>
        <div class="form-row">
          <div class="form-group">
            <label>年份 <span class="required">*</span></label>
            <input type="number" class="form-control" name="year" value="${now.getFullYear()}" min="2020" max="2030" required>
          </div>
          <div class="form-group">
            <label>月份 <span class="required">*</span></label>
            <input type="number" class="form-control" name="month" value="${now.getMonth() + 1}" min="1" max="12" required>
          </div>
        </div>
      </form>
    `,
    onConfirm: async () => {
      const form = document.getElementById('autoDepForm');
      const formData = new FormData(form);
      const year = formData.get('year');
      const month = formData.get('month');
      
      const res = await API.depreciation.autoDepreciate(year, month);
      if (res.success) {
        Components.success(res.message);
        Pages.depreciation();
      } else {
        Components.error(res.message);
        return false;
      }
    }
  });
};

Pages.showManualDepreciationForm = async function() {
  const itemsRes = await API.equipment.listItems({ status: '在用' });
  const items = itemsRes.data || [];
  
  Components.showModal({
    title: '手动折旧调整',
    content: `
      <form id="manualDepForm">
        <div class="form-group">
          <label>选择设备 <span class="required">*</span></label>
          <select class="form-control" name="equipmentItemId" required>
            ${Components.renderSelect(items.map(e => ({ 
              value: e.id, 
              label: `${e.serialNumber} - ${e.equipmentName} (当前价值: ${Utils.formatMoney(e.currentValue)})` 
            })), '')}
          </select>
        </div>
        <div class="form-group">
          <label>调整金额 <span class="required">*</span></label>
          <input type="number" class="form-control" name="adjustAmount" step="0.01" min="0" required>
        </div>
        <div class="form-group">
          <label>调整原因</label>
          <textarea class="form-control" name="reason"></textarea>
        </div>
      </form>
    `,
    onConfirm: async () => {
      const form = document.getElementById('manualDepForm');
      const formData = new FormData(form);
      const submitData = Object.fromEntries(formData);
      
      if (!submitData.equipmentItemId || !submitData.adjustAmount) {
        Components.error('请填写必填项');
        return false;
      }
      
      const res = await API.depreciation.manualAdjust(submitData);
      if (res.success) {
        Components.success('调整成功');
        Pages.depreciation();
      } else {
        Components.error(res.message);
        return false;
      }
    }
  });
};

// 设备报废页面
Pages.scrap = async function() {
  const content = document.getElementById('pageContent');
  content.innerHTML = Components.loading();
  
  // 加载可报废设备
  const availRes = await API.scrap.getAvailableItems();
  this.cache.scrapItems = availRes.data || [];
  
  // 加载报废记录
  const res = await API.scrap.list();
  
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">设备报废管理</span>
        <button class="btn btn-primary" onclick="Pages.showScrapForm()">+ 新增报废</button>
      </div>
      <div class="card-body">
        ${Components.renderTable(res.data || [], [
          { key: 'orderNo', label: '报废单号' },
          { key: 'serialNumber', label: '设备序列号' },
          { key: 'equipmentName', label: '设备名称' },
          { key: 'reason', label: '报废原因' },
          { key: 'originalValue', label: '原值', type: 'money' },
          { key: 'currentValue', label: '报废时净值', type: 'money' },
          { key: 'scrapValue', label: '残值', type: 'money' },
          { key: 'date', label: '报废日期', type: 'date' },
          { key: 'operator', label: '操作人' }
        ])}
      </div>
    </div>
  `;
};

Pages.showScrapForm = async function() {
  // 实时加载最新可报废设备数据
  const availRes = await API.scrap.getAvailableItems();
  this.cache.scrapItems = availRes.data || [];
  
  if (this.cache.scrapItems.length === 0) {
    Components.warning('暂无可报废的设备');
    return;
  }
  
  Components.showModal({
    title: '新增报废',
    content: `
      <form id="scrapForm">
        <div class="form-group">
          <label>选择设备 <span class="required">*</span></label>
          <select class="form-control" name="equipmentItemId" required>
            ${Components.renderSelect(this.cache.scrapItems.map(e => ({ 
              value: e.id, 
              label: `${e.serialNumber} - ${e.equipmentName} (${e.status})` 
            })), '')}
          </select>
        </div>
        <div class="form-group">
          <label>报废原因 <span class="required">*</span></label>
          <select class="form-control" name="reason" required>
            <option value="">请选择</option>
            <option value="使用年限到期">使用年限到期</option>
            <option value="设备损坏无法修复">设备损坏无法修复</option>
            <option value="技术淘汰">技术淘汰</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>残值</label>
            <input type="number" class="form-control" name="scrapValue" value="0" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>报废日期</label>
            <input type="date" class="form-control" name="date" value="${Utils.getToday()}">
          </div>
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea class="form-control" name="remark"></textarea>
        </div>
      </form>
    `,
    onConfirm: async () => {
      const form = document.getElementById('scrapForm');
      const formData = new FormData(form);
      const submitData = Object.fromEntries(formData);
      
      if (!submitData.equipmentItemId || !submitData.reason) {
        Components.error('请填写必填项');
        return false;
      }
      
      const res = await API.scrap.create(submitData);
      if (res.success) {
        Components.success('报废成功');
        Pages.scrap();
      } else {
        Components.error(res.message);
        return false;
      }
    }
  });
};

// 设备维修页面
Pages.repair = async function() {
  const content = document.getElementById('pageContent');
  content.innerHTML = Components.loading();
  
  // 加载可维修设备
  const availRes = await API.repair.getAvailableItems();
  this.cache.repairItems = availRes.data || [];
  
  // 加载维修记录
  const res = await API.repair.list();
  
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">设备维修管理</span>
        <button class="btn btn-primary" onclick="Pages.showRepairForm()">+ 新增维修</button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <div class="form-group">
            <label>状态</label>
            <select class="form-control" id="repairStatus" onchange="Pages.filterRepair()">
              <option value="">全部</option>
              <option value="维修中">维修中</option>
              <option value="已完成">已完成</option>
            </select>
          </div>
        </div>
        <div id="repairTable">
          ${this.renderRepairTable(res.data || [])}
        </div>
      </div>
    </div>
  `;
};

Pages.renderRepairTable = function(data) {
  return Components.renderTable(data, [
    { key: 'orderNo', label: '维修单号' },
    { key: 'serialNumber', label: '设备序列号' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'faultDesc', label: '故障描述' },
    { key: 'repairContent', label: '维修内容' },
    { key: 'cost', label: '维修费用', type: 'money' },
    { key: 'startDate', label: '开始日期', type: 'date' },
    { key: 'endDate', label: '完成日期', type: 'date' },
    { key: 'status', label: '状态', type: 'status' },
    { key: 'actions', label: '操作', width: '100px', render: (_, row) => 
      row.status === '维修中' ? `<button class="btn btn-sm btn-success" onclick="Pages.completeRepair(${row.id})">完成</button>` : '-'
    }
  ]);
};

Pages.filterRepair = async function() {
  const status = document.getElementById('repairStatus').value;
  const res = await API.repair.list({ status });
  if (res.success) {
    document.getElementById('repairTable').innerHTML = this.renderRepairTable(res.data);
  }
};

Pages.showRepairForm = async function() {
  // 实时加载最新可维修设备数据
  const availRes = await API.repair.getAvailableItems();
  this.cache.repairItems = availRes.data || [];
  
  if (this.cache.repairItems.length === 0) {
    Components.warning('暂无可维修的设备');
    return;
  }
  
  Components.showModal({
    title: '新增维修',
    content: `
      <form id="repairForm">
        <div class="form-group">
          <label>选择设备 <span class="required">*</span></label>
          <select class="form-control" name="equipmentItemId" required>
            ${Components.renderSelect(this.cache.repairItems.map(e => ({ 
              value: e.id, 
              label: `${e.serialNumber} - ${e.equipmentName} (${e.location})` 
            })), '')}
          </select>
        </div>
        <div class="form-group">
          <label>故障描述 <span class="required">*</span></label>
          <textarea class="form-control" name="faultDesc" required></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>预估费用</label>
            <input type="number" class="form-control" name="cost" value="0" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>开始日期</label>
            <input type="date" class="form-control" name="startDate" value="${Utils.getToday()}">
          </div>
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea class="form-control" name="remark"></textarea>
        </div>
      </form>
    `,
    onConfirm: async () => {
      const form = document.getElementById('repairForm');
      const formData = new FormData(form);
      const submitData = Object.fromEntries(formData);
      
      if (!submitData.equipmentItemId || !submitData.faultDesc) {
        Components.error('请填写必填项');
        return false;
      }
      
      const res = await API.repair.create(submitData);
      if (res.success) {
        Components.success('维修单创建成功');
        Pages.repair();
      } else {
        Components.error(res.message);
        return false;
      }
    }
  });
};

Pages.completeRepair = function(id) {
  Components.showModal({
    title: '完成维修',
    content: `
      <form id="completeRepairForm">
        <div class="form-group">
          <label>维修内容</label>
          <textarea class="form-control" name="repairContent"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>实际费用</label>
            <input type="number" class="form-control" name="cost" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>完成日期</label>
            <input type="date" class="form-control" name="endDate" value="${Utils.getToday()}">
          </div>
        </div>
      </form>
    `,
    onConfirm: async () => {
      const form = document.getElementById('completeRepairForm');
      const formData = new FormData(form);
      const submitData = Object.fromEntries(formData);
      submitData.status = '已完成';
      
      const res = await API.repair.update(id, submitData);
      if (res.success) {
        Components.success('维修完成');
        Pages.repair();
      } else {
        Components.error(res.message);
        return false;
      }
    }
  });
};

/**
 * 页面模块 - 第三部分
 * 报表页面
 */

// 入库报表
Pages.reportStockIn = async function() {
  const content = document.getElementById('pageContent');
  content.innerHTML = Components.loading();
  
  // 加载分类
  const catRes = await API.category.list();
  this.cache.categories = catRes.data || [];
  
  // 加载报表数据（默认查询全部）
  const res = await API.report.stockIn({});
  
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">设备入库查询报表</span>
        <button class="btn btn-success" onclick="Pages.exportStockInReport()">导出CSV</button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <div class="form-group">
            <label>日期范围</label>
            <div id="rptStockInDateRange"></div>
          </div>
          <div class="form-group">
            <label>设备分类</label>
            <select class="form-control" id="rptStockInCat" onchange="Pages.queryStockInReport()">
              ${Components.renderSelect(this.cache.categories.map(c => ({ value: c.id, label: c.name })), '', '全部分类')}
            </select>
          </div>
        </div>
        
        <div class="stat-cards" style="margin: 20px 0;">
          <div class="stat-card">
            <div class="stat-icon blue">📦</div>
            <div class="stat-info">
              <h3 id="rptStockInQty">${res.data?.summary?.totalQuantity || 0}</h3>
              <p>入库总数量</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">💰</div>
            <div class="stat-info">
              <h3 id="rptStockInAmt">${Utils.formatMoney(res.data?.summary?.totalAmount || 0)}</h3>
              <p>入库总金额</p>
            </div>
          </div>
        </div>
        
        <div id="rptStockInTable">
          ${this.renderReportStockInTable(res.data?.records || [])}
        </div>
      </div>
    </div>
  `;
  
  // 初始化日期范围选择器，选择后自动搜索
  this.rptStockInDatePicker = Components.createDateRangePicker('rptStockInDateRange', {
    onChange: () => Pages.queryStockInReport()
  });
  
  this.cache.stockInReportData = res.data?.records || [];
};

Pages.renderReportStockInTable = function(data) {
  return Components.renderTable(data, [
    { key: 'orderNo', label: '入库单号' },
    { key: 'date', label: '入库日期', type: 'date' },
    { key: 'categoryName', label: '设备分类' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'brand', label: '品牌' },
    { key: 'model', label: '型号' },
    { key: 'quantity', label: '数量' },
    { key: 'unitPrice', label: '单价', type: 'money' },
    { key: 'totalPrice', label: '总价', type: 'money' },
    { key: 'supplier', label: '供应商' },
    { key: 'operator', label: '操作人' }
  ]);
};

Pages.queryStockInReport = async function() {
  const dateRange = this.rptStockInDatePicker ? this.rptStockInDatePicker.getValue() : {};
  const startDate = dateRange.startDate || '';
  const endDate = dateRange.endDate || '';
  const categoryId = document.getElementById('rptStockInCat').value;
  
  const res = await API.report.stockIn({ startDate, endDate, categoryId });
  if (res.success) {
    document.getElementById('rptStockInQty').textContent = res.data.summary.totalQuantity;
    document.getElementById('rptStockInAmt').textContent = Utils.formatMoney(res.data.summary.totalAmount);
    document.getElementById('rptStockInTable').innerHTML = this.renderReportStockInTable(res.data.records);
    this.cache.stockInReportData = res.data.records;
  }
};

Pages.exportStockInReport = function() {
  Utils.exportCSV(this.cache.stockInReportData || [], '入库报表', [
    { key: 'orderNo', label: '入库单号' },
    { key: 'date', label: '入库日期' },
    { key: 'categoryName', label: '设备分类' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'quantity', label: '数量' },
    { key: 'unitPrice', label: '单价' },
    { key: 'totalPrice', label: '总价' },
    { key: 'supplier', label: '供应商' }
  ]);
};

// 出库报表
Pages.reportStockOut = async function() {
  const content = document.getElementById('pageContent');
  content.innerHTML = Components.loading();
  
  // 加载报表数据（默认查询全部）
  const res = await API.report.stockOut({});
  
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">设备出库查询报表</span>
        <button class="btn btn-success" onclick="Pages.exportStockOutReport()">导出CSV</button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <div class="form-group">
            <label>日期范围</label>
            <div id="rptStockOutDateRange"></div>
          </div>
          <div class="form-group">
            <label>科室</label>
            <input type="text" class="form-control" id="rptStockOutDept" placeholder="科室名称" onkeyup="Pages.queryStockOutReport()">
          </div>
        </div>
        
        <div class="stat-cards" style="margin: 20px 0;">
          <div class="stat-card">
            <div class="stat-icon blue">📤</div>
            <div class="stat-info">
              <h3 id="rptStockOutCnt">${res.data?.summary?.totalCount || 0}</h3>
              <p>出库总数量</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">💰</div>
            <div class="stat-info">
              <h3 id="rptStockOutVal">${Utils.formatMoney(res.data?.summary?.totalValue || 0)}</h3>
              <p>出库总价值</p>
            </div>
          </div>
        </div>
        
        <div id="rptStockOutTable">
          ${this.renderReportStockOutTable(res.data?.records || [])}
        </div>
      </div>
    </div>
  `;
  
  // 初始化日期范围选择器，选择后自动搜索
  this.rptStockOutDatePicker = Components.createDateRangePicker('rptStockOutDateRange', {
    onChange: () => Pages.queryStockOutReport()
  });
  
  this.cache.stockOutReportData = res.data?.records || [];
};

Pages.renderReportStockOutTable = function(data) {
  return Components.renderTable(data, [
    { key: 'orderNo', label: '出库单号' },
    { key: 'date', label: '出库日期', type: 'date' },
    { key: 'serialNumber', label: '设备序列号' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'brand', label: '品牌' },
    { key: 'department', label: '领用科室' },
    { key: 'purchasePrice', label: '设备价值', type: 'money' },
    { key: 'operator', label: '操作人' }
  ]);
};

Pages.queryStockOutReport = async function() {
  const dateRange = this.rptStockOutDatePicker ? this.rptStockOutDatePicker.getValue() : {};
  const startDate = dateRange.startDate || '';
  const endDate = dateRange.endDate || '';
  const department = document.getElementById('rptStockOutDept').value;
  
  const res = await API.report.stockOut({ startDate, endDate, department });
  if (res.success) {
    document.getElementById('rptStockOutCnt').textContent = res.data.summary.totalCount;
    document.getElementById('rptStockOutVal').textContent = Utils.formatMoney(res.data.summary.totalValue);
    document.getElementById('rptStockOutTable').innerHTML = this.renderReportStockOutTable(res.data.records);
    this.cache.stockOutReportData = res.data.records;
  }
};

Pages.exportStockOutReport = function() {
  Utils.exportCSV(this.cache.stockOutReportData || [], '出库报表', [
    { key: 'orderNo', label: '出库单号' },
    { key: 'date', label: '出库日期' },
    { key: 'serialNumber', label: '设备序列号' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'department', label: '领用科室' },
    { key: 'purchasePrice', label: '设备价值' }
  ]);
};

// 存放明细报表
Pages.reportInventory = async function() {
  const content = document.getElementById('pageContent');
  content.innerHTML = Components.loading();
  
  // 加载分类
  const catRes = await API.category.list();
  this.cache.categories = catRes.data || [];
  
  const res = await API.report.inventory();
  
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">设备存放明细报表</span>
        <button class="btn btn-success" onclick="Pages.exportInventoryReport()">导出CSV</button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <div class="form-group">
            <label>存放位置</label>
            <input type="text" class="form-control" id="rptInvLoc" placeholder="位置关键词" onkeyup="Pages.queryInventoryReport()">
          </div>
          <div class="form-group">
            <label>状态</label>
            <select class="form-control" id="rptInvStatus" onchange="Pages.queryInventoryReport()">
              <option value="">全部状态</option>
              <option value="在用">在用</option>
              <option value="在库">在库</option>
              <option value="维修中">维修中</option>
              <option value="已报废">已报废</option>
            </select>
          </div>
          <div class="form-group">
            <label>设备分类</label>
            <select class="form-control" id="rptInvCat" onchange="Pages.queryInventoryReport()">
              ${Components.renderSelect(this.cache.categories.map(c => ({ value: c.id, label: c.name })), '', '全部分类')}
            </select>
          </div>
        </div>
        
        <div class="stat-cards" style="margin: 20px 0;">
          <div class="stat-card">
            <div class="stat-icon blue">📦</div>
            <div class="stat-info">
              <h3 id="rptInvCnt">${res.data?.summary?.totalCount || 0}</h3>
              <p>设备总数</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">💵</div>
            <div class="stat-info">
              <h3 id="rptInvOrig">${Utils.formatMoney(res.data?.summary?.totalOriginalValue || 0)}</h3>
              <p>设备原值</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">💰</div>
            <div class="stat-info">
              <h3 id="rptInvCur">${Utils.formatMoney(res.data?.summary?.totalValue || 0)}</h3>
              <p>设备净值</p>
            </div>
          </div>
        </div>
        
        <div id="rptInvTable">
          ${this.renderReportInventoryTable(res.data?.records || [])}
        </div>
      </div>
    </div>
  `;
  
  this.cache.inventoryReportData = res.data?.records || [];
};

Pages.renderReportInventoryTable = function(data) {
  return Components.renderTable(data, [
    { key: 'serialNumber', label: '序列号' },
    { key: 'categoryName', label: '分类' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'brand', label: '品牌' },
    { key: 'model', label: '型号' },
    { key: 'department', label: '使用科室' },
    { key: 'location', label: '存放位置' },
    { key: 'purchaseDate', label: '购入日期', type: 'date' },
    { key: 'purchasePrice', label: '原值', type: 'money' },
    { key: 'currentValue', label: '净值', type: 'money' },
    { key: 'status', label: '状态', type: 'status' }
  ]);
};

Pages.queryInventoryReport = async function() {
  const location = document.getElementById('rptInvLoc').value;
  const status = document.getElementById('rptInvStatus').value;
  const categoryId = document.getElementById('rptInvCat').value;
  
  const res = await API.report.inventory({ location, status, categoryId });
  if (res.success) {
    document.getElementById('rptInvCnt').textContent = res.data.summary.totalCount;
    document.getElementById('rptInvOrig').textContent = Utils.formatMoney(res.data.summary.totalOriginalValue);
    document.getElementById('rptInvCur').textContent = Utils.formatMoney(res.data.summary.totalValue);
    document.getElementById('rptInvTable').innerHTML = this.renderReportInventoryTable(res.data.records);
    this.cache.inventoryReportData = res.data.records;
  }
};

Pages.exportInventoryReport = function() {
  Utils.exportCSV(this.cache.inventoryReportData || [], '存放明细报表', [
    { key: 'serialNumber', label: '序列号' },
    { key: 'categoryName', label: '分类' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'department', label: '使用科室' },
    { key: 'location', label: '存放位置' },
    { key: 'purchasePrice', label: '原值' },
    { key: 'currentValue', label: '净值' },
    { key: 'status', label: '状态' }
  ]);
};

// 折旧报表
Pages.reportDepreciation = async function() {
  const content = document.getElementById('pageContent');
  content.innerHTML = Components.loading();
  
  // 加载报表数据（默认查询全部）
  const res = await API.report.depreciation({});
  
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">设备折旧明细报表</span>
        <button class="btn btn-success" onclick="Pages.exportDepreciationReport()">导出CSV</button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <div class="form-group">
            <label>年份</label>
            <input type="number" class="form-control" id="rptDepYear" placeholder="全部年份" min="2020" max="2030" onchange="Pages.queryDepreciationReport()">
          </div>
          <div class="form-group">
            <label>日期范围</label>
            <div id="rptDepDateRange"></div>
          </div>
        </div>
        
        <div class="stat-cards" style="margin: 20px 0;">
          <div class="stat-card">
            <div class="stat-icon orange">📉</div>
            <div class="stat-info">
              <h3 id="rptDepTotal">${Utils.formatMoney(res.data?.summary?.totalDepreciation || 0)}</h3>
              <p>累计折旧金额</p>
            </div>
          </div>
        </div>
        
        <div id="rptDepTable">
          ${this.renderReportDepreciationTable(res.data?.records || [])}
        </div>
      </div>
    </div>
  `;
  
  // 初始化日期范围选择器，选择后自动搜索
  this.rptDepDatePicker = Components.createDateRangePicker('rptDepDateRange', {
    onChange: () => Pages.queryDepreciationReport()
  });
  
  this.cache.depreciationReportData = res.data?.records || [];
};

Pages.renderReportDepreciationTable = function(data) {
  return Components.renderTable(data, [
    { key: 'date', label: '折旧日期', type: 'date' },
    { key: 'serialNumber', label: '设备序列号' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'brand', label: '品牌' },
    { key: 'purchasePrice', label: '原值', type: 'money' },
    { key: 'beforeValue', label: '折旧前价值', type: 'money' },
    { key: 'depreciationAmount', label: '折旧金额', type: 'money' },
    { key: 'afterValue', label: '折旧后价值', type: 'money' },
    { key: 'type', label: '折旧类型' }
  ]);
};

Pages.queryDepreciationReport = async function() {
  const year = document.getElementById('rptDepYear').value;
  const dateRange = this.rptDepDatePicker ? this.rptDepDatePicker.getValue() : {};
  const startDate = dateRange.startDate || '';
  const endDate = dateRange.endDate || '';
  
  const res = await API.report.depreciation({ year, startDate, endDate });
  if (res.success) {
    document.getElementById('rptDepTotal').textContent = Utils.formatMoney(res.data.summary.totalDepreciation);
    document.getElementById('rptDepTable').innerHTML = this.renderReportDepreciationTable(res.data.records);
    this.cache.depreciationReportData = res.data.records;
  }
};

Pages.exportDepreciationReport = function() {
  Utils.exportCSV(this.cache.depreciationReportData || [], '折旧报表', [
    { key: 'date', label: '折旧日期' },
    { key: 'serialNumber', label: '设备序列号' },
    { key: 'equipmentName', label: '设备名称' },
    { key: 'beforeValue', label: '折旧前价值' },
    { key: 'depreciationAmount', label: '折旧金额' },
    { key: 'afterValue', label: '折旧后价值' },
    { key: 'type', label: '折旧类型' }
  ]);
};

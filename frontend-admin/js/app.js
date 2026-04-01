/**
 * 应用主入口
 * 初始化和路由管理
 */

const App = {
  currentPage: 'dashboard',
  
  // 初始化应用
  init() {
    // 检查登录状态
    const token = API.getToken();
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.showApp(JSON.parse(user));
    } else {
      this.showLogin();
    }
    
    // 绑定事件
    this.bindEvents();
  },
  
  // 显示登录页
  showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  },
  
  // 显示主应用
  showApp(user) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    // 显示用户信息
    document.getElementById('currentUser').textContent = user.name;
    document.getElementById('currentRole').textContent = user.role === 'admin' ? '管理员' : '普通用户';
    
    // 加载默认页面
    this.navigateTo('dashboard');
  },
  
  // 绑定事件
  bindEvents() {
    // 登录表单
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // 隐藏之前的错误
      document.getElementById('loginError').classList.add('hidden');
      
      const res = await API.auth.login(username, password);
      if (res.success) {
        API.setToken(res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        Components.success('登录成功');
        this.showApp(res.data.user);
      } else {
        // 显示友好的错误提示
        const errorEl = document.getElementById('loginError');
        document.getElementById('loginErrorMsg').textContent = res.message || '用户名或密码错误，请重试';
        errorEl.classList.remove('hidden');
      }
    });
    
    // 密码显示/隐藏切换
    document.getElementById('togglePassword').addEventListener('click', function() {
      const passwordInput = document.getElementById('password');
      const eyeIcon = document.getElementById('eyeIcon');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        this.title = '隐藏密码';
      } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        this.title = '显示密码';
      }
    });
    
    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await API.auth.logout();
      API.clearToken();
      Components.success('已退出登录');
      this.showLogin();
    });
    
    // 侧边栏切换
    document.getElementById('toggleSidebar').addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('collapsed');
    });
    
    // 导航点击
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) {
          this.navigateTo(page);
        }
      });
    });
  },
  
  // 页面导航
  navigateTo(page, params = {}) {
    this.currentPage = page;
    this.currentParams = params;
    
    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    
    // 更新页面标题
    const titles = {
      dashboard: '仪表盘',
      category: '设备分类',
      equipment: '设备字典',
      inventory: '设备明细',
      equipmentDetail: '设备详情',
      stockIn: '设备入库',
      stockOut: '设备出库',
      depreciation: '设备折旧',
      scrap: '设备报废',
      repair: '设备维修',
      reportStockIn: '入库查询报表',
      reportStockOut: '出库查询报表',
      reportInventory: '存放明细报表',
      reportDepreciation: '折旧明细报表'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    
    // 加载页面内容
    if (Pages[page]) {
      Pages[page](params);
    } else {
      document.getElementById('pageContent').innerHTML = `
        <div class="empty-state">
          <div class="icon">🚧</div>
          <p>页面开发中...</p>
        </div>
      `;
    }
  }
};

// 全局跳转函数，确保onclick可以调用
function navigateToPage(page, params) {
  App.navigateTo(page, params || {});
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

/**
 * UI组件模块
 */

const Components = {
  // 日期选择器
  datePickers: new Map(),
  dateRangePickers: new Map(),
  
  // 创建日期范围选择器
  createDateRangePicker(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // 状态
    const state = {
      startDate: options.startDate || null,
      endDate: options.endDate || null,
      tempStart: null,
      tempEnd: null,
      leftMonth: new Date(),
      rightMonth: new Date(),
      isOpen: false,
      selecting: false
    };
    
    // 初始化右侧月份为下个月
    state.rightMonth.setMonth(state.rightMonth.getMonth() + 1);
    
    // 快捷选项
    const shortcuts = [
      { label: '今天', getValue: () => { const d = new Date(); return [d, d]; } },
      { label: '昨天', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return [d, d]; } },
      { label: '近7天', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return [s, e]; } },
      { label: '近30天', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return [s, e]; } },
      { label: '本月', getValue: () => { const s = new Date(); s.setDate(1); return [s, new Date()]; } },
      { label: '上月', getValue: () => { const e = new Date(); e.setDate(0); const s = new Date(e); s.setDate(1); return [s, e]; } }
    ];
    
    const formatDate = (date) => {
      if (!date) return '';
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    const parseDate = (str) => {
      if (!str) return null;
      const parts = str.split('-');
      return new Date(parts[0], parts[1] - 1, parts[2]);
    };
    
    const isSameDay = (d1, d2) => {
      if (!d1 || !d2) return false;
      return d1.getFullYear() === d2.getFullYear() && 
             d1.getMonth() === d2.getMonth() && 
             d1.getDate() === d2.getDate();
    };
    
    const isInRange = (date, start, end) => {
      if (!start || !end || !date) return false;
      const d = date.getTime();
      const s = start.getTime();
      const e = end.getTime();
      return d > Math.min(s, e) && d < Math.max(s, e);
    };
    
    // 渲染组件
    const render = () => {
      const displayStart = state.startDate ? formatDate(state.startDate) : '';
      const displayEnd = state.endDate ? formatDate(state.endDate) : '';
      const hasValue = displayStart || displayEnd;
      
      container.innerHTML = `
        <div class="date-range-picker">
          <div class="date-range-input ${state.isOpen ? 'active' : ''}">
            <span class="date-icon">📅</span>
            <div class="date-value ${!hasValue ? 'placeholder' : ''}">
              ${hasValue ? `
                <span>${displayStart || '开始日期'}</span>
                <span class="date-separator">至</span>
                <span>${displayEnd || '结束日期'}</span>
              ` : '选择日期范围'}
            </div>
            ${hasValue ? '<button type="button" class="clear-btn" title="清除">✕</button>' : ''}
          </div>
          <div class="date-range-dropdown ${state.isOpen ? 'show' : ''}">
            <div class="date-range-container">
              <div class="date-range-shortcuts">
                ${shortcuts.map((s, i) => `<div class="shortcut-item" data-index="${i}">${s.label}</div>`).join('')}
              </div>
              <div class="date-range-calendars">
                <div class="date-range-calendar" id="${containerId}-left"></div>
                <div class="date-range-calendar" id="${containerId}-right"></div>
              </div>
            </div>
            <div class="date-range-footer">
              <div class="date-range-preview">
                ${state.tempStart || state.tempEnd ? `
                  已选择: <span>${formatDate(state.tempStart) || '?'}</span> 至 <span>${formatDate(state.tempEnd) || '?'}</span>
                ` : '请选择日期范围'}
              </div>
              <div class="date-range-actions">
                <button type="button" class="date-range-cancel">取消</button>
                <button type="button" class="date-range-confirm">确定</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      if (state.isOpen) {
        renderCalendar(`${containerId}-left`, state.leftMonth, false);
        renderCalendar(`${containerId}-right`, state.rightMonth, true);
      }
      
      bindEvents();
    };
    
    // 渲染日历
    const renderCalendar = (calId, viewDate, isRight) => {
      const cal = document.getElementById(calId);
      if (!cal) return;
      
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDay = firstDay.getDay();
      const daysInMonth = lastDay.getDate();
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const effectiveStart = state.tempStart || state.startDate;
      const effectiveEnd = state.tempEnd || state.endDate;
      
      let daysHtml = '';
      
      // 上月日期
      for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        daysHtml += `<div class="calendar-day other-month">${day}</div>`;
      }
      
      // 当月日期
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        let classes = 'calendar-day';
        
        if (isSameDay(date, today)) classes += ' today';
        if (isSameDay(date, effectiveStart)) classes += ' start-date';
        if (isSameDay(date, effectiveEnd)) classes += ' end-date';
        if (isInRange(date, effectiveStart, effectiveEnd)) classes += ' in-range';
        
        daysHtml += `<div class="${classes}" data-date="${formatDate(date)}">${day}</div>`;
      }
      
      // 下月日期
      const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
      const nextMonthDays = totalCells - startDay - daysInMonth;
      for (let day = 1; day <= nextMonthDays; day++) {
        daysHtml += `<div class="calendar-day other-month">${day}</div>`;
      }
      
      cal.innerHTML = `
        <div class="calendar-header">
          ${!isRight ? `
            <button type="button" class="prev-year" title="上一年">«</button>
            <button type="button" class="prev-month" title="上一月">‹</button>
          ` : '<div></div>'}
          <span class="calendar-title">${year}年 ${monthNames[month]}</span>
          ${isRight ? `
            <button type="button" class="next-month" title="下一月">›</button>
            <button type="button" class="next-year" title="下一年">»</button>
          ` : '<div></div>'}
        </div>
        <div class="calendar-weekdays">
          ${weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
        </div>
        <div class="calendar-days">${daysHtml}</div>
      `;
      
      // 绑定日历事件
      if (!isRight) {
        const prevYear = cal.querySelector('.prev-year');
        const prevMonth = cal.querySelector('.prev-month');
        if (prevYear) prevYear.onclick = (e) => { e.stopPropagation(); state.leftMonth.setFullYear(state.leftMonth.getFullYear() - 1); state.rightMonth.setFullYear(state.rightMonth.getFullYear() - 1); render(); };
        if (prevMonth) prevMonth.onclick = (e) => { e.stopPropagation(); state.leftMonth.setMonth(state.leftMonth.getMonth() - 1); state.rightMonth.setMonth(state.rightMonth.getMonth() - 1); render(); };
      } else {
        const nextMonth = cal.querySelector('.next-month');
        const nextYear = cal.querySelector('.next-year');
        if (nextMonth) nextMonth.onclick = (e) => { e.stopPropagation(); state.leftMonth.setMonth(state.leftMonth.getMonth() + 1); state.rightMonth.setMonth(state.rightMonth.getMonth() + 1); render(); };
        if (nextYear) nextYear.onclick = (e) => { e.stopPropagation(); state.leftMonth.setFullYear(state.leftMonth.getFullYear() + 1); state.rightMonth.setFullYear(state.rightMonth.getFullYear() + 1); render(); };
      }
      
      // 日期点击
      cal.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
        dayEl.onclick = (e) => {
          e.stopPropagation();
          const dateStr = dayEl.dataset.date;
          const clickedDate = parseDate(dateStr);
          
          if (!state.tempStart || (state.tempStart && state.tempEnd)) {
            // 开始新选择
            state.tempStart = clickedDate;
            state.tempEnd = null;
          } else {
            // 完成选择
            if (clickedDate < state.tempStart) {
              state.tempEnd = state.tempStart;
              state.tempStart = clickedDate;
            } else {
              state.tempEnd = clickedDate;
            }
          }
          render();
        };
      });
    };
    
    // 绑定事件
    const bindEvents = () => {
      const picker = container.querySelector('.date-range-picker');
      const input = container.querySelector('.date-range-input');
      const clearBtn = container.querySelector('.clear-btn');
      const cancelBtn = container.querySelector('.date-range-cancel');
      const confirmBtn = container.querySelector('.date-range-confirm');
      const shortcutItems = container.querySelectorAll('.shortcut-item');
      
      if (input) {
        input.onclick = (e) => {
          if (e.target.classList.contains('clear-btn')) return;
          e.stopPropagation();
          state.isOpen = !state.isOpen;
          if (state.isOpen) {
            state.tempStart = state.startDate;
            state.tempEnd = state.endDate;
            // 关闭其他
            document.querySelectorAll('.date-range-dropdown.show').forEach(d => {
              if (!picker.contains(d)) d.classList.remove('show');
            });
          }
          render();
        };
      }
      
      if (clearBtn) {
        clearBtn.onclick = (e) => {
          e.stopPropagation();
          state.startDate = null;
          state.endDate = null;
          state.tempStart = null;
          state.tempEnd = null;
          render();
          if (options.onChange) options.onChange(null, null);
        };
      }
      
      if (cancelBtn) {
        cancelBtn.onclick = (e) => {
          e.stopPropagation();
          state.isOpen = false;
          state.tempStart = state.startDate;
          state.tempEnd = state.endDate;
          render();
        };
      }
      
      if (confirmBtn) {
        confirmBtn.onclick = (e) => {
          e.stopPropagation();
          state.startDate = state.tempStart;
          state.endDate = state.tempEnd;
          state.isOpen = false;
          render();
          if (options.onChange) options.onChange(formatDate(state.startDate), formatDate(state.endDate));
        };
      }
      
      shortcutItems.forEach(item => {
        item.onclick = (e) => {
          e.stopPropagation();
          const idx = parseInt(item.dataset.index);
          const [start, end] = shortcuts[idx].getValue();
          state.tempStart = start;
          state.tempEnd = end;
          state.leftMonth = new Date(start);
          state.rightMonth = new Date(start);
          state.rightMonth.setMonth(state.rightMonth.getMonth() + 1);
          render();
        };
      });
    };
    
    // 点击外部关闭
    const handleClickOutside = (e) => {
      const picker = container.querySelector('.date-range-picker');
      if (picker && !picker.contains(e.target) && state.isOpen) {
        state.isOpen = false;
        render();
      }
    };
    document.addEventListener('click', handleClickOutside);
    
    // 初始渲染
    render();
    
    // 存储实例
    this.dateRangePickers.set(containerId, state);
    
    return {
      getValue: () => ({ startDate: formatDate(state.startDate), endDate: formatDate(state.endDate) }),
      setValue: (start, end) => {
        state.startDate = start ? parseDate(start) : null;
        state.endDate = end ? parseDate(end) : null;
        state.tempStart = state.startDate;
        state.tempEnd = state.endDate;
        render();
      },
      clear: () => {
        state.startDate = null;
        state.endDate = null;
        state.tempStart = null;
        state.tempEnd = null;
        render();
      },
      destroy: () => {
        document.removeEventListener('click', handleClickOutside);
        this.dateRangePickers.delete(containerId);
      }
    };
  },
  
  // 创建日期选择器
  createDatePicker(inputId, options = {}) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // 创建包装器
    const wrapper = document.createElement('div');
    wrapper.className = 'date-picker-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    
    // 修改input样式
    input.className = 'date-picker-input';
    input.type = 'text';
    input.readOnly = true;
    input.placeholder = options.placeholder || '选择日期';
    
    // 添加图标
    const icon = document.createElement('span');
    icon.className = 'date-picker-icon';
    icon.innerHTML = '📅';
    wrapper.appendChild(icon);
    
    // 创建下拉面板
    const dropdown = document.createElement('div');
    dropdown.className = 'date-picker-dropdown';
    dropdown.id = `${inputId}-dropdown`;
    wrapper.appendChild(dropdown);
    
    // 存储状态
    const state = {
      selectedDate: input.value ? new Date(input.value) : null,
      viewDate: input.value ? new Date(input.value) : new Date(),
      isOpen: false
    };
    
    this.datePickers.set(inputId, state);
    
    // 渲染日历
    const renderCalendar = () => {
      const year = state.viewDate.getFullYear();
      const month = state.viewDate.getMonth();
      const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      
      // 获取当月第一天和最后一天
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDay = firstDay.getDay();
      const daysInMonth = lastDay.getDate();
      
      // 获取上月天数
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      
      // 生成日期格子
      let daysHtml = '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 上月日期
      for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        daysHtml += `<div class="date-picker-day other-month" data-date="${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}">${day}</div>`;
      }
      
      // 当月日期
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const date = new Date(year, month, day);
        let classes = 'date-picker-day';
        
        if (date.getTime() === today.getTime()) {
          classes += ' today';
        }
        if (state.selectedDate && date.getTime() === state.selectedDate.getTime()) {
          classes += ' selected';
        }
        
        daysHtml += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
      }
      
      // 下月日期
      const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
      const nextMonthDays = totalCells - startDay - daysInMonth;
      for (let day = 1; day <= nextMonthDays; day++) {
        daysHtml += `<div class="date-picker-day other-month" data-date="${year}-${String(month + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}">${day}</div>`;
      }
      
      dropdown.innerHTML = `
        <div class="date-picker-header">
          <button type="button" class="prev-year" title="上一年">«</button>
          <button type="button" class="prev-month" title="上一月">‹</button>
          <span class="date-picker-title">${year}年 ${monthNames[month]}</span>
          <button type="button" class="next-month" title="下一月">›</button>
          <button type="button" class="next-year" title="下一年">»</button>
        </div>
        <div class="date-picker-weekdays">
          ${weekdays.map(d => `<div class="date-picker-weekday">${d}</div>`).join('')}
        </div>
        <div class="date-picker-days">
          ${daysHtml}
        </div>
        <div class="date-picker-footer">
          <button type="button" class="date-picker-clear">清除</button>
          <button type="button" class="date-picker-today">今天</button>
        </div>
      `;
      
      // 绑定事件
      dropdown.querySelector('.prev-year').onclick = (e) => { e.stopPropagation(); state.viewDate.setFullYear(state.viewDate.getFullYear() - 1); renderCalendar(); };
      dropdown.querySelector('.prev-month').onclick = (e) => { e.stopPropagation(); state.viewDate.setMonth(state.viewDate.getMonth() - 1); renderCalendar(); };
      dropdown.querySelector('.next-month').onclick = (e) => { e.stopPropagation(); state.viewDate.setMonth(state.viewDate.getMonth() + 1); renderCalendar(); };
      dropdown.querySelector('.next-year').onclick = (e) => { e.stopPropagation(); state.viewDate.setFullYear(state.viewDate.getFullYear() + 1); renderCalendar(); };
      
      dropdown.querySelector('.date-picker-clear').onclick = (e) => {
        e.stopPropagation();
        state.selectedDate = null;
        input.value = '';
        closeDropdown();
        if (options.onChange) options.onChange('');
      };
      
      dropdown.querySelector('.date-picker-today').onclick = (e) => {
        e.stopPropagation();
        const today = new Date();
        state.selectedDate = today;
        state.viewDate = new Date(today);
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        input.value = dateStr;
        closeDropdown();
        if (options.onChange) options.onChange(dateStr);
      };
      
      dropdown.querySelectorAll('.date-picker-day').forEach(dayEl => {
        dayEl.onclick = (e) => {
          e.stopPropagation();
          const dateStr = dayEl.dataset.date;
          state.selectedDate = new Date(dateStr);
          state.viewDate = new Date(dateStr);
          input.value = dateStr;
          closeDropdown();
          if (options.onChange) options.onChange(dateStr);
        };
      });
    };
    
    const openDropdown = () => {
      state.isOpen = true;
      dropdown.classList.add('show');
      renderCalendar();
    };
    
    const closeDropdown = () => {
      state.isOpen = false;
      dropdown.classList.remove('show');
    };
    
    // 点击输入框打开
    input.onclick = (e) => {
      e.stopPropagation();
      if (state.isOpen) {
        closeDropdown();
      } else {
        // 关闭其他日期选择器
        document.querySelectorAll('.date-picker-dropdown.show').forEach(d => d.classList.remove('show'));
        openDropdown();
      }
    };
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        closeDropdown();
      }
    });
    
    return {
      getValue: () => input.value,
      setValue: (value) => {
        input.value = value;
        if (value) {
          state.selectedDate = new Date(value);
          state.viewDate = new Date(value);
        } else {
          state.selectedDate = null;
        }
      },
      clear: () => {
        input.value = '';
        state.selectedDate = null;
      }
    };
  },
  
  // 显示提示框
  toast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type}`;
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  },
  
  // 成功提示
  success(message) {
    this.toast(message, 'success');
  },
  
  // 错误提示
  error(message) {
    this.toast(message, 'error');
  },
  
  // 警告提示
  warning(message) {
    this.toast(message, 'warning');
  },
  
  // 显示模态框
  showModal(options) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const footer = document.getElementById('modalFooter');
    
    title.textContent = options.title || '提示';
    body.innerHTML = options.content || '';
    
    // 设置底部按钮
    if (options.footer === false) {
      footer.classList.add('hidden');
    } else {
      footer.classList.remove('hidden');
      const cancelBtn = footer.querySelector('.modal-cancel');
      const confirmBtn = footer.querySelector('.modal-confirm');
      
      cancelBtn.textContent = options.cancelText || '取消';
      confirmBtn.textContent = options.confirmText || '确定';
      
      // 移除旧的事件监听
      const newCancelBtn = cancelBtn.cloneNode(true);
      const newConfirmBtn = confirmBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      
      newCancelBtn.onclick = () => {
        this.hideModal();
        options.onCancel?.();
      };
      
      newConfirmBtn.onclick = () => {
        if (options.onConfirm) {
          const result = options.onConfirm();
          if (result !== false) {
            this.hideModal();
          }
        } else {
          this.hideModal();
        }
      };
    }
    
    modal.classList.remove('hidden');
    
    // 点击遮罩关闭
    modal.querySelector('.modal-overlay').onclick = () => this.hideModal();
    modal.querySelector('.modal-close').onclick = () => this.hideModal();
  },
  
  // 隐藏模态框
  hideModal() {
    document.getElementById('modal').classList.add('hidden');
  },
  
  // 确认对话框
  confirm(message, onConfirm) {
    this.showModal({
      title: '确认',
      content: `<p style="text-align: center; padding: 20px 0;">${message}</p>`,
      onConfirm
    });
  },
  
  // 渲染表格
  renderTable(data, columns, options = {}) {
    if (!data || data.length === 0) {
      return `
        <div class="empty-state">
          <div class="icon">📭</div>
          <p>暂无数据</p>
        </div>
      `;
    }
    
    const headerHtml = columns.map(col => 
      `<th style="${col.width ? `width: ${col.width}` : ''}">${col.label}</th>`
    ).join('');
    
    const bodyHtml = data.map((row, index) => {
      const cells = columns.map(col => {
        let value = row[col.key];
        if (col.render) {
          value = col.render(value, row, index);
        } else if (col.type === 'money') {
          value = Utils.formatMoney(value);
        } else if (col.type === 'date') {
          value = Utils.formatDate(value);
        } else if (col.type === 'status') {
          value = `<span class="status-tag ${Utils.getStatusClass(value)}">${value}</span>`;
        }
        return `<td>${value ?? '-'}</td>`;
      }).join('');
      return `<tr data-id="${row.id}">${cells}</tr>`;
    }).join('');
    
    return `
      <div class="table-container">
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    `;
  },
  
  // 渲染分页
  renderPagination(current, total, pageSize, onChange) {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return '';
    
    let html = '<div class="pagination">';
    
    // 上一页
    html += `<button ${current === 1 ? 'disabled' : ''} data-page="${current - 1}">‹</button>`;
    
    // 页码
    const range = 2;
    let start = Math.max(1, current - range);
    let end = Math.min(totalPages, current + range);
    
    if (start > 1) {
      html += `<button data-page="1">1</button>`;
      if (start > 2) html += `<span>...</span>`;
    }
    
    for (let i = start; i <= end; i++) {
      html += `<button class="${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) html += `<span>...</span>`;
      html += `<button data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // 下一页
    html += `<button ${current === totalPages ? 'disabled' : ''} data-page="${current + 1}">›</button>`;
    
    html += '</div>';
    
    // 绑定事件
    setTimeout(() => {
      document.querySelectorAll('.pagination button').forEach(btn => {
        btn.onclick = () => {
          const page = parseInt(btn.dataset.page);
          if (page && page !== current) {
            onChange(page);
          }
        };
      });
    }, 0);
    
    return html;
  },
  
  // 渲染下拉选项
  renderSelect(options, selected, placeholder = '请选择') {
    let html = `<option value="">${placeholder}</option>`;
    options.forEach(opt => {
      const value = typeof opt === 'object' ? opt.value : opt;
      const label = typeof opt === 'object' ? opt.label : opt;
      html += `<option value="${value}" ${value == selected ? 'selected' : ''}>${label}</option>`;
    });
    return html;
  },
  
  // 加载状态
  loading() {
    return '<div class="loading"></div>';
  }
};

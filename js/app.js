/**
 * 标题: TaskApp
 * 说明: 主控制器 - 初始化/事件绑定/业务逻辑协调
 * 时间: 2026-03-03 22:01
 * @author: zhoujunyu
 */

const TaskApp = {

    /** 当前选中的新任务优先级 */
    currentPriority: 'mid',

    /** 当前为新任务选择的标签列表 */
    selectedNewTaskTags: [],

    /** 当前为新任务选择的清单 */
    selectedCategory: '',

    /** 标签弹窗当前选中的颜色索引 */
    tagPopupColorIndex: 0,

    /** 标签弹窗使用场景：'toolbar'(添加栏) | 'detail'(详情面板) */
    tagPopupMode: 'toolbar',

    /** 优先级循环顺序 */
    priorityOrder: ['low', 'mid', 'high'],

    /** 优先级显示文本 */
    priorityLabels: {
        low: '低优先级',
        mid: '中优先级',
        high: '高优先级'
    },

    /** 优先级旗帜颜色 class */
    priorityFlagClass: {
        low: 'flag-blue',
        mid: 'flag-orange',
        high: 'flag-red'
    },

    /**
     * 包装通用确认弹窗 返回 Promise
     * @param {string} title 标题
     * @param {string} msg 提示内容
     * @returns {Promise<boolean>}
     */
    showConfirm(title, msg) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const titleEl = document.getElementById('confirm-modal-title');
            const msgEl = document.getElementById('confirm-modal-msg');
            const cancelBtn = document.getElementById('confirm-modal-cancel');
            const confirmBtn = document.getElementById('confirm-modal-btn');
            const closeBtn = document.getElementById('confirm-modal-close');

            if (!modal) {
                resolve(confirm(msg)); // fallback
                return;
            }

            titleEl.textContent = title;
            msgEl.textContent = msg;
            modal.classList.remove('hidden');

            const cleanup = () => {
                modal.classList.add('hidden');
                cancelBtn.removeEventListener('click', onCancel);
                closeBtn.removeEventListener('click', onCancel);
                confirmBtn.removeEventListener('click', onConfirm);
            };

            const onCancel = () => { cleanup(); resolve(false); };
            const onConfirm = () => { cleanup(); resolve(true); };

            cancelBtn.addEventListener('click', onCancel);
            closeBtn.addEventListener('click', onCancel);
            confirmBtn.addEventListener('click', onConfirm);
        });
    },

    /**
     * 应用初始化入口

     */
    async init() {
        // 绑定登录弹窗事件
        this._bindLoginEvents();

        // 检查是否已登录（localStorage 中有 token）
        const token = localStorage.getItem('taskList_token');
        if (token) {
            // 已登录，隐藏登录弹窗，加载数据
            document.getElementById('login-modal').classList.add('hidden');
            await this._loadAppData();
        }
        // 未登录则显示登录弹窗，等待用户操作
    },

    /**
     * 登录成功后加载数据并渲染
     */
    async _loadAppData() {
        // 获取用户信息并显示
        await this._fetchUserInfo();

        // 初始化数据（从 API 加载）
        await TaskData.init();

        // 初始渲染
        TaskRender.renderAll();

        // 绑定所有事件
        this._bindAddTask();
        this._bindTaskListEvents();
        this._bindDetailEvents();
        this._bindSearchEvent();
        this._bindSidebarNav();
        this._bindClearCompleted();
        this._bindPriorityToggle();
        this._bindTagPopup();
        this._bindCategoryPopup();
        this._bindCalendarPopup();
        this._bindNotificationEvents();
        this._bindClickOutside();
        this._bindFolderEvents();
        this._bindLogoutEvent();
    },

    /**
     * 获取当前用户信息并在左下角显示
     */
    async _fetchUserInfo() {
        const userInfo = await Api.getUserInfo();
        if (userInfo) {
            const avatarParams = new URLSearchParams({
                name: userInfo.nickname || userInfo.username,
                background: '667eea',
                color: 'fff',
                size: '128'
            });
            const defaultAvatar = `https://ui-avatars.com/api/?${avatarParams.toString()}`;
            
            document.getElementById('sidebar-user-name').textContent = userInfo.nickname || userInfo.username;
            document.getElementById('sidebar-user-avatar').src = userInfo.avatar || defaultAvatar;
        }
    },

    /**
     * 绑定退出登录事件
     */
    _bindLogoutEvent() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const confirmed = await TaskApp.showConfirm('提示', '确定要退出登录吗？');
                if (confirmed) {
                    localStorage.removeItem('taskList_token');
                    localStorage.removeItem('taskList_userId');
                    location.reload();
                }
            });
        }
    },

    /**
     * 绑定登录弹窗事件
     * @private
     */
    _bindLoginEvents() {
        const modal = document.getElementById('login-modal');
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const nicknameField = document.getElementById('login-nickname-field');
        const nicknameInput = document.getElementById('login-nickname');
        const loginBtn = document.getElementById('login-btn');
        const errorEl = document.getElementById('login-error');
        const toggleLink = document.getElementById('login-toggle');
        const toggleText = document.getElementById('login-toggle-text');
        const subtitle = document.getElementById('login-subtitle');

        let isRegisterMode = false;

        /** 显示错误信息 */
        const showError = (msg) => {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        };

        /** 隐藏错误 */
        const hideError = () => {
            errorEl.classList.add('hidden');
        };

        /** 切换登录/注册模式 */
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            isRegisterMode = !isRegisterMode;
            hideError();
            if (isRegisterMode) {
                subtitle.textContent = '创建新账户';
                loginBtn.textContent = '注 册';
                toggleText.textContent = '已有账户？';
                toggleLink.textContent = '立即登录';
                nicknameField.classList.remove('hidden');
            } else {
                subtitle.textContent = '登录你的账户';
                loginBtn.textContent = '登 录';
                toggleText.textContent = '没有账户？';
                toggleLink.textContent = '立即注册';
                nicknameField.classList.add('hidden');
            }
        });

        /** 提交登录/注册 */
        const handleSubmit = async () => {
            hideError();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username) { showError('请输入用户名'); usernameInput.focus(); return; }
            if (!password) { showError('请输入密码'); passwordInput.focus(); return; }

            loginBtn.disabled = true;
            loginBtn.textContent = isRegisterMode ? '注册中...' : '登录中...';

            try {
                if (isRegisterMode) {
                    // 注册
                    const nickname = nicknameInput.value.trim();
                    const registerRes = await fetch(API_BASE + '/user/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password, nickname: nickname || username })
                    });
                    const registerJson = await registerRes.json();
                    
                    if (registerJson.code !== 200) {
                        showError(registerJson.msg || '注册失败：用户名已存在');
                        loginBtn.disabled = false;
                        loginBtn.textContent = '注 册';
                        return;
                    }
                    // 注册成功，向下走到登录逻辑自动登录
                }

                // 登录
                const loginRes = await Api.request('/user/login', 'POST', { username, password });
                if (!loginRes) {
                    showError('用户名或密码错误');
                    loginBtn.disabled = false;
                    loginBtn.textContent = isRegisterMode ? '注 册' : '登 录';
                    return;
                }

                // 保存登录信息
                localStorage.setItem('taskList_token', loginRes.token);
                localStorage.setItem('taskList_userId', loginRes.userId);

                // 更新 API 的 userId
                // Api 的 USER_ID 是常量，这里直接修改 header
                // 隐藏弹窗，加载应用
                modal.classList.add('hidden');
                await this._loadAppData();
            } catch (e) {
                showError('网络异常，请稍后重试');
                loginBtn.disabled = false;
                loginBtn.textContent = isRegisterMode ? '注 册' : '登 录';
            }
        };

        // 点击按钮提交
        loginBtn.addEventListener('click', handleSubmit);

        // Enter 提交
        [usernameInput, passwordInput, nicknameInput].forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleSubmit();
            });
        });
    },

    /* ============================================
       添加任务
       ============================================ */

    /**
     * 绑定添加任务事件（回车 + 点击按钮）
     * @private
     */
    _bindAddTask() {
        const input = document.querySelector('.add-task-input');
        const submitBtn = document.querySelector('.add-submit-btn');

        // 回车添加
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                this._doAddTask(input);
            }
        });

        // 点击按钮添加
        submitBtn.addEventListener('click', () => {
            if (input.value.trim()) {
                this._doAddTask(input);
            }
        });
    },
    /**
     * 执行添加任务逻辑
     * @param {HTMLInputElement} input - 输入框元素
     * @private
     */
    _doAddTask(input) {
        const dueDateRaw = this.selectedDueDateRaw || window.localStorage.getItem('taskList_tempDueDate') || '';

        const task = TaskData.addTask(input.value, this.currentPriority, this.selectedCategory, this.selectedNewTaskTags, dueDateRaw);
        
        TaskData.selectedTaskId = task.id;
        input.value = '';
        this.selectedNewTaskTags = [];
        this.selectedCategory = '';
        this.selectedDueDateRaw = '';
        document.getElementById('toolbar-date-text').textContent = '今天';

        this._updateToolbarTagDisplay();
        this._updateToolbarCategoryDisplay();
        TaskRender.renderAll();
    },

    /**
     * 更新工具栏标签按钮的显示（每个标签独立显示对应颜色）
     * @private
     */
    _updateToolbarTagDisplay() {
        const tagBtn = document.querySelector('.toolbar-btn[title="添加标签"]');
        if (!tagBtn) return;

        // 移除所有旧的标签元素
        tagBtn.querySelectorAll('.toolbar-tag-item').forEach(el => el.remove());

        if (this.selectedNewTaskTags.length > 0) {
            this.selectedNewTaskTags.forEach(tagText => {
                const tc = TaskData.getTagColor(tagText);
                const span = document.createElement('span');
                span.className = 'toolbar-tag-item';
                span.textContent = '#' + tagText;
                span.style.color = tc.color;
                span.style.background = '#fff';
                span.style.borderColor = '#e2e8f0';
                tagBtn.appendChild(span);
            });
            tagBtn.classList.add('tag-active');
        } else {
            tagBtn.classList.remove('tag-active');
        }
    },

    /**
     * 更新工具栏清单按钮的显示
     * @private
     */
    _updateToolbarCategoryDisplay() {
        const btn = document.getElementById('toolbar-category-btn');
        if (!btn) return;

        // 移除旧的文字
        const oldLabel = btn.querySelector('.cat-label');
        if (oldLabel) oldLabel.remove();

        if (this.selectedCategory) {
            const span = document.createElement('span');
            span.className = 'cat-label';
            span.textContent = this.selectedCategory;
            btn.appendChild(span);
            btn.classList.add('tag-active');
        } else {
            btn.classList.remove('tag-active');
        }
    },

    /**
     * 绑定清单选择弹窗事件
     * @private
     */
    _bindCategoryPopup() {
        const btn = document.getElementById('toolbar-category-btn');
        const popup = document.getElementById('category-popup');
        if (!btn || !popup) return;

        // 点击按钮 → 切换弹窗
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._closeAllDropdowns();
            // 关闭标签弹窗
            const tagPopup = document.getElementById('tag-popup');
            if (tagPopup) tagPopup.classList.add('hidden');
            // 定位到按钮正下方
            const toolbar = btn.closest('.add-task-toolbar');
            if (toolbar) {
                const btnRect = btn.getBoundingClientRect();
                const toolbarRect = toolbar.getBoundingClientRect();
                popup.style.left = (btnRect.left - toolbarRect.left) + 'px';
            }
            popup.classList.toggle('hidden');
        });

        // 点击弹窗内的选项
        popup.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = e.target.closest('[data-cat]');
            if (!item) return;
            this.selectedCategory = item.dataset.cat;
            this._updateToolbarCategoryDisplay();
            popup.classList.add('hidden');
        });
    },

    /**
     * 绑定自定义日历选择弹窗事件
     * @private
     */
    _bindCalendarPopup() {
        this.calendarCurrentDate = new Date();
        const btn = document.getElementById('toolbar-date-btn');
        const popup = document.getElementById('calendar-popup');
        if (!btn || !popup) return;

        // 点击日历按钮切换弹窗
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = popup.classList.contains('hidden');
            this._closeAllDropdowns();
            
            // 关闭其他特定弹窗
            const tagPopup = document.getElementById('tag-popup');
            if (tagPopup) tagPopup.classList.add('hidden');
            const catPopup = document.getElementById('category-popup');
            if (catPopup) catPopup.classList.add('hidden');

            if (isHidden) {
                // 如果是新打开，定位并重设当前观察月份为今天（或已选日期）
                this.calendarCurrentDate = this.selectedDueDateRaw ? new Date(this.selectedDueDateRaw) : new Date();
                this.calendarView = 'days';
                this._renderCalendar(this.calendarCurrentDate);
                
                // 定位
                const btnRect = btn.getBoundingClientRect();
                const toolbar = btn.closest('.add-task-toolbar');
                if (toolbar) {
                    const toolbarRect = toolbar.getBoundingClientRect();
                    popup.style.left = (btnRect.left - toolbarRect.left) + 'px';
                }
                popup.classList.remove('hidden');
            } else {
                popup.classList.add('hidden');
            }
        });

        const prevBtn = document.getElementById('calendar-prev-month');
        const nextBtn = document.getElementById('calendar-next-month');
        const headerText = document.getElementById('calendar-month-year');

        headerText.addEventListener('click', (e) => {
            e.stopPropagation();
            this.calendarView = this.calendarView === 'months' ? 'days' : 'months';
            this._renderCalendar(this.calendarCurrentDate);
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.calendarView === 'months') {
                this.calendarCurrentDate.setFullYear(this.calendarCurrentDate.getFullYear() - 1);
            } else {
                this.calendarCurrentDate.setMonth(this.calendarCurrentDate.getMonth() - 1);
            }
            this._renderCalendar(this.calendarCurrentDate);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.calendarView === 'months') {
                this.calendarCurrentDate.setFullYear(this.calendarCurrentDate.getFullYear() + 1);
            } else {
                this.calendarCurrentDate.setMonth(this.calendarCurrentDate.getMonth() + 1);
            }
            this._renderCalendar(this.calendarCurrentDate);
        });

        const clearBtn = document.getElementById('calendar-clear-btn');
        const todayBtn = document.getElementById('calendar-today-btn');
        const dateText = document.getElementById('toolbar-date-text');

        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectedDueDateRaw = '';
            dateText.textContent = '今天';
            popup.classList.add('hidden');
        });

        todayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            this.selectedDueDateRaw = `${year}-${month}-${day}`;
            dateText.textContent = '今天';
            popup.classList.add('hidden');
        });

        // 阻止弹窗内点击事件冒泡
        popup.addEventListener('click', e => e.stopPropagation());
    },

    /**
     * 渲染自定义日历内容
     */
    _renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const headerText = document.getElementById('calendar-month-year');
        const daysContainer = document.getElementById('calendar-days');
        const weekdaysContainer = document.querySelector('.calendar-weekdays');

        if (this.calendarView === 'months') {
            headerText.innerHTML = `${year}年 <span class="material-symbols-outlined">arrow_drop_down</span>`;
            weekdaysContainer.style.display = 'none';
            daysContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
            daysContainer.style.gap = '8px';

            let html = '';
            const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
            const todayDate = new Date();
            for (let i = 0; i < 12; i++) {
                let classes = ['calendar-month-item'];
                if (year === todayDate.getFullYear() && i === todayDate.getMonth()) {
                    classes.push('today');
                }
                const selectedDate = this.selectedDueDateRaw ? new Date(this.selectedDueDateRaw) : null;
                if (selectedDate && year === selectedDate.getFullYear() && i === selectedDate.getMonth()) {
                    classes.push('selected');
                }
                html += `<div class="calendar-month-item ${classes.slice(1).join(' ')}" data-month="${i}">${monthNames[i]}</div>`;
            }
            daysContainer.innerHTML = html;

            daysContainer.querySelectorAll('.calendar-month-item').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.calendarCurrentDate.setMonth(parseInt(el.dataset.month, 10));
                    this.calendarCurrentDate.setFullYear(year);
                    this.calendarView = 'days';
                    this._renderCalendar(this.calendarCurrentDate);
                });
            });
            return;
        }

        headerText.innerHTML = `${year}年${String(month + 1).padStart(2, '0')}月 <span class="material-symbols-outlined">arrow_drop_down</span>`;
        weekdaysContainer.style.display = 'grid';
        daysContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysContainer.style.gap = '4px';
        daysContainer.innerHTML = '';

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        let startDayOfWeek = firstDay.getDay(); // 0 is Sunday
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Mon=0...Sun=6

        const today = new Date();
        today.setHours(0,0,0,0);

        let html = '';

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            html += `<div class="calendar-day prev-month">${prevMonthLastDay - i}</div>`;
        }

        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const currentCellDate = new Date(year, month, i);
            const y = currentCellDate.getFullYear();
            const m = String(currentCellDate.getMonth() + 1).padStart(2, '0');
            const d = String(currentCellDate.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            let classes = ['calendar-day'];
            if (currentCellDate.getTime() === today.getTime()) {
                classes.push('today');
            }
            if (this.selectedDueDateRaw === dateStr) {
                classes.push('selected');
            }

            html += `<div class="calendar-day ${classes.slice(1).join(' ')}" data-date="${dateStr}">${i}</div>`;
        }

        // Next month days (fill up to 42 cells typically)
        const totalCellsArea = startDayOfWeek + lastDay.getDate();
        const nextMonthDaysLength = 42 - totalCellsArea; 
        for (let i = 1; i <= nextMonthDaysLength; i++) {
            html += `<div class="calendar-day next-month">${i}</div>`;
        }

        daysContainer.innerHTML = html;

        // Bind clicks to actual month days
        daysContainer.querySelectorAll('.calendar-day[data-date]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const selDateStr = el.dataset.date;
                this.selectedDueDateRaw = selDateStr;
                
                // update text
                const dateText = document.getElementById('toolbar-date-text');
                const parts = selDateStr.split('-');
                
                const d = new Date(selDateStr);
                const td = new Date();
                td.setHours(0,0,0,0);
                const to = new Date(td);
                to.setDate(to.getDate() + 1);
                
                if (d.getTime() === td.getTime()) {
                    dateText.textContent = '今天';
                } else if (d.getTime() === to.getTime()) {
                    dateText.textContent = '明天';
                } else {
                    dateText.textContent = `${parts[1]}-${parts[2]}`;
                }
                
                document.getElementById('calendar-popup').classList.add('hidden');
            });
        });
    },

    /* ============================================
       优先级切换
       ============================================ */

    /**
     * 绑定优先级按钮切换事件
     * @private
     */
    _bindPriorityToggle() {
        const priorityBtn = document.querySelector('.toolbar-btn[title="设置优先级"]');
        if (!priorityBtn) return;

        priorityBtn.addEventListener('click', () => {
            // 循环切换优先级
            const idx = this.priorityOrder.indexOf(this.currentPriority);
            this.currentPriority = this.priorityOrder[(idx + 1) % this.priorityOrder.length];

            // 更新按钮显示
            const flagIcon = priorityBtn.querySelector('.material-symbols-outlined');
            const labelSpan = priorityBtn.querySelector('span:last-child');

            flagIcon.className = 'material-symbols-outlined ' + (this.priorityFlagClass[this.currentPriority] || '');
            labelSpan.textContent = this.priorityLabels[this.currentPriority];
        });
    },

    /* ============================================
       标签弹窗
       ============================================ */

    /**
     * 绑定标签弹窗所有事件
     * @private
     */
    _bindTagPopup() {
        const tagBtn = document.querySelector('.toolbar-btn[title="添加标签"]');
        const popup = document.getElementById('tag-popup');

        if (!tagBtn || !popup) return;

        // 点击标签按钮 → 打开/关闭弹窗
        tagBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.tagPopupMode = 'toolbar';
            // 关闭清单弹窗
            const catPopup = document.getElementById('category-popup');
            if (catPopup) catPopup.classList.add('hidden');
            // 定位到按钮正下方
            const toolbar = tagBtn.closest('.add-task-toolbar');
            if (toolbar) {
                const btnRect = tagBtn.getBoundingClientRect();
                const toolbarRect = toolbar.getBoundingClientRect();
                popup.style.left = (btnRect.left - toolbarRect.left) + 'px';
            }
            this._toggleTagPopup(popup);
        });

        // 弹窗内事件委托
        popup.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleTagPopupClick(e, popup);
        });

        // 弹窗内输入框事件
        popup.addEventListener('input', (e) => {
            if (e.target.classList.contains('tag-popup-input')) {
                this._handleTagInputChange(e.target, popup);
            }
        });

        // 弹窗内回车创建
        popup.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('tag-popup-input')) {
                e.preventDefault();
                this._handleCreateTag(popup);
            }
        });
    },

    /**
     * 切换标签弹窗显示/隐藏
     * @param {HTMLElement} popup
     * @private
     */
    _toggleTagPopup(popup) {
        if (popup.classList.contains('hidden')) {
            // 确定当前已选标签
            let selectedTags = [];
            if (this.tagPopupMode === 'toolbar') {
                selectedTags = [...this.selectedNewTaskTags];
            } else {
                const task = TaskData.getSelectedTask();
                selectedTags = task ? [...(task.tags || [])] : [];
            }

            this.tagPopupColorIndex = 0;
            TaskRender.renderTagPopup(popup, selectedTags);
            // 默认选中第一个颜色
            const firstDot = popup.querySelector('.color-dot[data-color-index="0"]');
            if (firstDot) firstDot.classList.add('active');

            popup.classList.remove('hidden');
        } else {
            popup.classList.add('hidden');
        }
    },

    /**
     * 处理标签弹窗内的点击事件
     * @param {Event} e
     * @param {HTMLElement} popup
     * @private
     */
    _handleTagPopupClick(e, popup) {
        // 1. 删除标签
        const deleteBtn = e.target.closest('[data-delete-tag]');
        if (deleteBtn) {
            const tagId = parseInt(deleteBtn.dataset.deleteTag);
            TaskData.deleteTag(tagId);
            // 重新渲染弹窗
            const selectedTags = this.tagPopupMode === 'toolbar'
                ? this.selectedNewTaskTags
                : (TaskData.getSelectedTask()?.tags || []);
            TaskRender.renderTagPopup(popup, selectedTags);
            this._selectColorDot(popup, this.tagPopupColorIndex);
            TaskRender.renderAll();
            return;
        }

        // 2. 选择/取消选择标签
        const tagItem = e.target.closest('.tag-popup-item');
        if (tagItem && !e.target.closest('.tag-popup-delete')) {
            const tagText = tagItem.dataset.tagText;
            this._toggleTagSelection(tagText, popup);
            return;
        }

        // 3. 选择颜色
        const colorDot = e.target.closest('.color-dot');
        if (colorDot) {
            this.tagPopupColorIndex = parseInt(colorDot.dataset.colorIndex);
            // 更新颜色选择UI
            popup.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            colorDot.classList.add('active');
            return;
        }

        // 4. 创建标签
        if (e.target.closest('.tag-popup-create-btn')) {
            this._handleCreateTag(popup);
        }
    },

    /**
     * 切换标签选中状态
     * @param {string} tagText
     * @param {HTMLElement} popup
     * @private
     */
    _toggleTagSelection(tagText, popup) {
        if (this.tagPopupMode === 'toolbar') {
            // 工具栏模式：管理 selectedNewTaskTags
            const idx = this.selectedNewTaskTags.indexOf(tagText);
            if (idx >= 0) {
                this.selectedNewTaskTags.splice(idx, 1);
            } else {
                this.selectedNewTaskTags.push(tagText);
            }
            this._updateToolbarTagDisplay();
            TaskRender.renderTagPopup(popup, this.selectedNewTaskTags);
        } else {
            // 详情模式：操作任务的 tags 并请求 API
            const task = TaskData.getSelectedTask();
            if (!task) return;
            if (!task.tags) task.tags = [];

            const idx = task.tags.indexOf(tagText);
            if (idx >= 0) {
                task.tags.splice(idx, 1);
            } else {
                task.tags.push(tagText);
            }
            // 使用新增的专门方法处理本地和后端的同步
            TaskData.updateTaskTags(task.id, task.tags);

            TaskRender.renderTagPopup(popup, task.tags);
            TaskRender.renderDetail();
            TaskRender.renderTaskList();
        }
        this._selectColorDot(popup, this.tagPopupColorIndex);
    },

    /**
     * 处理创建新标签
     * @param {HTMLElement} popup
     * @private
     */
    _handleCreateTag(popup) {
        const input = popup.querySelector('.tag-popup-input');
        const text = input ? input.value.trim() : '';
        if (!text) return;

        // 创建标签
        const newTag = TaskData.addTag(text, this.tagPopupColorIndex);

        // 自动选中新标签
        this._toggleTagSelection(newTag.text, popup);

        // 重渲染侧栏标签
        TaskRender.renderSidebarTags();
    },

    /**
     * 设置颜色圆点的激活状态
     * @param {HTMLElement} popup
     * @param {number} idx
     * @private
     */
    _selectColorDot(popup, idx) {
        popup.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        const dot = popup.querySelector(`.color-dot[data-color-index="${idx}"]`);
        if (dot) dot.classList.add('active');
    },

    /**
     * 处理标签输入框内容变化（控制创建按钮启用/禁用）
     * @param {HTMLInputElement} input
     * @param {HTMLElement} popup
     * @private
     */
    _handleTagInputChange(input, popup) {
        const createBtn = popup.querySelector('.tag-popup-create-btn');
        if (createBtn) {
            createBtn.disabled = !input.value.trim();
        }
    },

    /**
     * 关闭所有属性下拉菜单
     * @private
     */
    _closeAllDropdowns() {
        document.querySelectorAll('.prop-dropdown').forEach(dd => {
            dd.classList.add('hidden');
        });
    },

    /**
     * 绑定点击页面空白处关闭弹窗和下拉
     * @private
     */
    _bindClickOutside() {
        document.addEventListener('click', () => {
            // 关闭标签弹窗
            const popup = document.getElementById('tag-popup');
            if (popup && !popup.classList.contains('hidden')) {
                popup.classList.add('hidden');
            }
            // 关闭清单弹窗
            const catPopup = document.getElementById('category-popup');
            if (catPopup && !catPopup.classList.contains('hidden')) {
                catPopup.classList.add('hidden');
            }
            // 关闭日历弹窗
            const calPopup = document.getElementById('calendar-popup');
            if (calPopup && !calPopup.classList.contains('hidden')) {
                calPopup.classList.add('hidden');
            }
            // 关闭详情页日历弹窗
            const detailCalPopup = document.getElementById('detail-calendar-popup');
            if (detailCalPopup && !detailCalPopup.classList.contains('hidden')) {
                detailCalPopup.classList.add('hidden');
            }
            // 关闭清单更多操作弹窗
            const folderMorePopup = document.getElementById('folder-more-popup');
            if (folderMorePopup && !folderMorePopup.classList.contains('hidden')) {
                folderMorePopup.classList.add('hidden');
            }
            // 关闭通知弹窗
            const notifPopup = document.getElementById('notification-popup');
            if (notifPopup && !notifPopup.classList.contains('hidden')) {
                notifPopup.classList.add('hidden');
            }
            // 关闭所有属性下拉
            this._closeAllDropdowns();
        });
    },

    /* ============================================
       任务列表交互
       ============================================ */

    /**
     * 选中任务并异步加载详情（含子任务）
     * @param {number} taskId
     * @private
     */
    async _selectTask(taskId) {
        TaskData.selectedTaskId = taskId;
        TaskRender.renderAll(); // 先触发骨架/基础状态渲染

        await TaskData.loadSelectedTaskDetail();
        TaskRender.renderDetail(); // 数据返回后，再次更新右侧详情
    },

    /**
     * 用事件委托绑定任务列表的点击/勾选事件
     * @private
     */
    _bindTaskListEvents() {
        const taskList = document.querySelector('.task-list');
        let clickTimer = null;

        taskList.addEventListener('click', (e) => {
            // 1. 复选框勾选（立即执行，不延时）
            const toggleInput = e.target.closest('[data-toggle-id]');
            if (toggleInput) {
                if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
                const taskId = parseInt(toggleInput.dataset.toggleId);
                TaskData.toggleTask(taskId);
                TaskRender.renderAll();
                return;
            }

            // 如果正在编辑，不触发选中
            if (e.target.closest('.inline-edit-input')) return;

            // 2. 点击标题/描述 → 延时选中（给双击编辑让路）
            const titleOrDesc = e.target.closest('.task-title') || e.target.closest('.task-desc');
            if (titleOrDesc) {
                const taskItem = e.target.closest('.task-item');
                if (!taskItem) return;
                const taskId = parseInt(taskItem.dataset.taskId);
                if (clickTimer) clearTimeout(clickTimer);
                clickTimer = setTimeout(() => {
                    clickTimer = null;
                    this._selectTask(taskId);
                }, 250);
                return;
            }

            // 3. 点击任务行其他区域 → 立即选中
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
                const taskId = parseInt(taskItem.dataset.taskId);
                this._selectTask(taskId);
            }
        });

        // 双击标题/描述 → 取消单击延时 → 进入内联编辑
        taskList.addEventListener('dblclick', (e) => {
            // 取消单击的延时选中
            if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }

            const titleEl = e.target.closest('.task-title');
            const descEl = e.target.closest('.task-desc');
            const target = titleEl || descEl;
            if (!target) return;

            e.stopPropagation();
            e.preventDefault();

            const taskItem = target.closest('.task-item');
            if (!taskItem) return;
            const taskId = parseInt(taskItem.dataset.taskId);
            const isTitle = !!titleEl;

            // 选中该任务
            this._selectTask(taskId);

            // 创建内联输入框
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'inline-edit-input';
            input.value = target.textContent;
            const origText = target.textContent;

            // 替换为输入框
            target.style.display = 'none';
            target.parentNode.insertBefore(input, target.nextSibling);
            input.focus();
            input.select();

            // 保存并退出编辑
            const saveEdit = () => {
                const newVal = input.value.trim();
                if (newVal && newVal !== origText) {
                    if (isTitle) {
                        TaskData.updateTitle(taskId, newVal);
                    } else {
                        TaskData.updateDesc(taskId, newVal);
                    }
                }
                input.remove();
                target.style.display = '';
                if (newVal && newVal !== origText) {
                    target.textContent = newVal;
                }
                // 同步右侧面板
                if (TaskData.selectedTaskId === taskId) {
                    TaskRender.renderDetail();
                }
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    input.blur();
                }
                if (ev.key === 'Escape') {
                    input.value = origText;
                    input.blur();
                }
            });
        });
    },

    /* ============================================
       详情面板交互
       ============================================ */

    /**
     * 绑定详情面板内的所有事件
     * @private
     */
    _bindDetailEvents() {
        const panel = document.querySelector('.detail-panel');

        // 1. 标题编辑
        const titleInput = panel.querySelector('.detail-title-input');
        titleInput.addEventListener('input', () => {
            if (TaskData.selectedTaskId) {
                TaskData.updateTitle(TaskData.selectedTaskId, titleInput.value);
                const activeItem = document.querySelector(`.task-item[data-task-id="${TaskData.selectedTaskId}"] .task-title`);
                if (activeItem) activeItem.textContent = titleInput.value;
            }
        });

        // 1.5 描述内容编辑
        const descInput = panel.querySelector('.detail-desc-input');
        descInput.addEventListener('input', () => {
            if (TaskData.selectedTaskId) {
                TaskData.updateDesc(TaskData.selectedTaskId, descInput.value);
                // 同步更新左侧列表中的描述
                const activeDesc = document.querySelector(`.task-item[data-task-id="${TaskData.selectedTaskId}"] .task-desc`);
                if (activeDesc) {
                    activeDesc.textContent = descInput.value;
                }
            }
        });

        // 2. 备注编辑
        const noteArea = panel.querySelector('.note-textarea');
        noteArea.addEventListener('input', () => {
            if (TaskData.selectedTaskId) {
                TaskData.updateNote(TaskData.selectedTaskId, noteArea.value);
            }
        });

        // 3. 删除任务
        const deleteBtn = panel.querySelector('.detail-delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (TaskData.selectedTaskId) {
                TaskData.deleteTask(TaskData.selectedTaskId);
                TaskRender.renderAll();
            }
        });

        // 4. 隐藏详情面板
        const hideBtn = panel.querySelector('.hide-btn');
        hideBtn.addEventListener('click', () => {
            TaskData.selectedTaskId = null;
            panel.classList.add('hidden');
            TaskRender.renderTaskList();
        });

        // 5. 详情面板复选框 (完成状态)
        const detailCheckbox = panel.querySelector('.detail-header input[type="checkbox"]');
        detailCheckbox.addEventListener('change', () => {
            if (TaskData.selectedTaskId) {
                TaskData.toggleTask(TaskData.selectedTaskId);
                TaskRender.renderAll();
            }
        });

        // 5.5. 详情面板提醒开关 (Reminder)
        const remindSwitch = panel.querySelector('#detail-remind-switch');
        if (remindSwitch) {
            remindSwitch.addEventListener('change', () => {
                if (TaskData.selectedTaskId) {
                    const reminderVal = remindSwitch.checked ? 1 : 0;
                    TaskData.updateReminder(TaskData.selectedTaskId, reminderVal);
                }
            });
        }

        // 6. 子任务容器事件委托
        const subtaskList = panel.querySelector('.subtask-list');
        subtaskList.addEventListener('click', (e) => {
            this._handleSubtaskClick(e, panel);
        });

        subtaskList.addEventListener('keydown', (e) => {
            this._handleSubtaskKeydown(e);
        });

        // 7. 子任务头部"添加"按钮
        const subtaskAddBtn = panel.querySelector('.subtask-add-btn');
        subtaskAddBtn.addEventListener('click', () => {
            this._showSubtaskInput(panel);
        });

        // 8. 详情面板标签区域点击 → 打开弹窗（编辑当前任务标签）
        const detailTagsRow = panel.querySelector('.detail-tags-list');
        if (detailTagsRow) {
            detailTagsRow.addEventListener('click', (e) => {
                e.stopPropagation();
                this.tagPopupMode = 'detail';
                const popup = document.getElementById('tag-popup');
                popup.style.right = '340px';
                popup.style.left = 'auto';
                popup.style.top = '220px';
                this._toggleTagPopup(popup);
            });
        }

        // 9. 优先级下拉编辑
        const priorityRow = panel.querySelector('#priority-prop-row');
        const priorityDropdown = panel.querySelector('#priority-dropdown');

        priorityRow.addEventListener('click', (e) => {
            e.stopPropagation();
            // 点击下拉项 → 更新优先级
            const item = e.target.closest('[data-priority]');
            if (item) {
                const newPriority = item.dataset.priority;
                if (TaskData.selectedTaskId) {
                    TaskData.updatePriority(TaskData.selectedTaskId, newPriority);
                    priorityDropdown.classList.add('hidden');
                    TaskRender.renderAll();
                }
                return;
            }
            // 点击属性行 → 切换下拉显示
            this._closeAllDropdowns();
            priorityDropdown.classList.toggle('hidden');
        });

        // 10. 清单下拉编辑
        const categoryRow = panel.querySelector('#category-prop-row');
        const categoryDropdown = panel.querySelector('#category-dropdown');

        categoryRow.addEventListener('click', (e) => {
            e.stopPropagation();
            // 点击下拉项 → 更新分类
            const item = e.target.closest('[data-category]');
            if (item) {
                const newCategory = item.dataset.category;
                if (TaskData.selectedTaskId) {
                    TaskData.updateCategory(TaskData.selectedTaskId, newCategory);
                    categoryDropdown.classList.add('hidden');
                    TaskRender.renderAll();
                }
                return;
            }
            // 点击属性行 → 切换下拉显示
            this._closeAllDropdowns();
            
            if (categoryDropdown.classList.contains('hidden')) {
                let html = '';
                TaskData.folders.forEach(folder => {
                    const fc = typeof FOLDER_COLORS !== 'undefined' ? (FOLDER_COLORS[folder.colorIndex] || FOLDER_COLORS[0]) : { color: 'var(--text-secondary)' };
                    html += `
                        <div class="prop-dropdown-item" data-category="${folder.name}">
                            <span class="material-symbols-outlined" style="font-size:16px;color:${fc.color}">folder</span>
                            ${folder.name}
                        </div>
                    `;
                });
                categoryDropdown.innerHTML = html;
            }
            
            categoryDropdown.classList.toggle('hidden');
        });

        // 11. 截止日期日历弹窗编辑
        this._bindDetailCalendar(panel);
    },

    /**
     * 绑定详情页日历弹窗事件
     * @param {HTMLElement} panel
     * @private
     */
    _bindDetailCalendar(panel) {
        const duedateRow = panel.querySelector('#duedate-prop-row');
        const popup = document.getElementById('detail-calendar-popup');
        if (!duedateRow || !popup) return;

        this.detailCalendarDate = new Date();
        this.detailCalendarView = 'days';

        // 点击截止日期行 → 切换日历
        duedateRow.addEventListener('click', (e) => {
            e.stopPropagation();
            // 如果点击的是日历弹窗内部就忽略
            if (e.target.closest('.calendar-popup')) return;

            const isHidden = popup.classList.contains('hidden');
            this._closeAllDropdowns();

            if (isHidden) {
                const task = TaskData.tasks.find(t => t.id === TaskData.selectedTaskId);
                this.detailCalendarView = 'days';
                this.detailCalendarDate = task && task.dueDateRaw ? new Date(task.dueDateRaw) : new Date();
                this._renderDetailCalendar(this.detailCalendarDate);
                popup.classList.remove('hidden');
            } else {
                popup.classList.add('hidden');
            }
        });

        // 弹窗内阻止冒泡
        popup.addEventListener('click', e => e.stopPropagation());

        // 月/年切换
        const headerText = document.getElementById('detail-calendar-month-year');
        const prevBtn = document.getElementById('detail-calendar-prev');
        const nextBtn = document.getElementById('detail-calendar-next');

        headerText.addEventListener('click', (e) => {
            e.stopPropagation();
            this.detailCalendarView = this.detailCalendarView === 'months' ? 'days' : 'months';
            this._renderDetailCalendar(this.detailCalendarDate);
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.detailCalendarView === 'months') {
                this.detailCalendarDate.setFullYear(this.detailCalendarDate.getFullYear() - 1);
            } else {
                this.detailCalendarDate.setMonth(this.detailCalendarDate.getMonth() - 1);
            }
            this._renderDetailCalendar(this.detailCalendarDate);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.detailCalendarView === 'months') {
                this.detailCalendarDate.setFullYear(this.detailCalendarDate.getFullYear() + 1);
            } else {
                this.detailCalendarDate.setMonth(this.detailCalendarDate.getMonth() + 1);
            }
            this._renderDetailCalendar(this.detailCalendarDate);
        });

        // 清除 / 今天
        document.getElementById('detail-calendar-clear').addEventListener('click', (e) => {
            e.stopPropagation();
            this._updateTaskDueDate('');
            popup.classList.add('hidden');
        });

        document.getElementById('detail-calendar-today').addEventListener('click', (e) => {
            e.stopPropagation();
            const d = new Date();
            const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            this._updateTaskDueDate(dateStr);
            popup.classList.add('hidden');
        });
    },

    /**
     * 渲染详情页日历
     */
    _renderDetailCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const headerText = document.getElementById('detail-calendar-month-year');
        const daysContainer = document.getElementById('detail-calendar-days');
        const weekdaysContainer = document.querySelector('.detail-cal-weekdays');

        const task = TaskData.tasks.find(t => t.id === TaskData.selectedTaskId);
        const selectedRaw = task ? (task.dueDateRaw || '') : '';

        if (this.detailCalendarView === 'months') {
            headerText.innerHTML = `${year}年 <span class="material-symbols-outlined">arrow_drop_down</span>`;
            if (weekdaysContainer) weekdaysContainer.style.display = 'none';
            daysContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
            daysContainer.style.gap = '8px';

            let html = '';
            const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
            const todayDate = new Date();
            for (let i = 0; i < 12; i++) {
                let cls = '';
                if (year === todayDate.getFullYear() && i === todayDate.getMonth()) cls += ' today';
                const selDate = selectedRaw ? new Date(selectedRaw) : null;
                if (selDate && year === selDate.getFullYear() && i === selDate.getMonth()) cls += ' selected';
                html += `<div class="calendar-month-item${cls}" data-month="${i}">${monthNames[i]}</div>`;
            }
            daysContainer.innerHTML = html;
            daysContainer.querySelectorAll('.calendar-month-item').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.detailCalendarDate.setMonth(parseInt(el.dataset.month, 10));
                    this.detailCalendarDate.setFullYear(year);
                    this.detailCalendarView = 'days';
                    this._renderDetailCalendar(this.detailCalendarDate);
                });
            });
            return;
        }

        headerText.innerHTML = `${year}年${String(month+1).padStart(2,'0')}月 <span class="material-symbols-outlined">arrow_drop_down</span>`;
        if (weekdaysContainer) weekdaysContainer.style.display = 'grid';
        daysContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysContainer.style.gap = '4px';

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startDayOfWeek = firstDay.getDay();
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        const today = new Date();
        today.setHours(0,0,0,0);

        let html = '';
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            html += `<div class="calendar-day prev-month">${prevMonthLastDay - i}</div>`;
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const cellDate = new Date(year, month, i);
            const y = cellDate.getFullYear();
            const m = String(cellDate.getMonth()+1).padStart(2,'0');
            const d = String(cellDate.getDate()).padStart(2,'0');
            const dateStr = `${y}-${m}-${d}`;
            let cls = '';
            if (cellDate.getTime() === today.getTime()) cls += ' today';
            if (selectedRaw === dateStr) cls += ' selected';
            html += `<div class="calendar-day${cls}" data-date="${dateStr}">${i}</div>`;
        }
        const totalCells = startDayOfWeek + lastDay.getDate();
        for (let i = 1; i <= 42 - totalCells; i++) {
            html += `<div class="calendar-day next-month">${i}</div>`;
        }
        daysContainer.innerHTML = html;

        daysContainer.querySelectorAll('.calendar-day[data-date]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this._updateTaskDueDate(el.dataset.date);
                document.getElementById('detail-calendar-popup').classList.add('hidden');
            });
        });
    },

    /**
     * 更新当前选中任务的截止日期并同步后端
     * @param {string} dateStr - YYYY-MM-DD 格式或空字符串
     */
    _updateTaskDueDate(dateStr) {
        const task = TaskData.tasks.find(t => t.id === TaskData.selectedTaskId);
        if (!task) return;

        task.dueDateRaw = dateStr;
        task.dueDate = dateStr ? TaskData._formatDueDate(dateStr) : '无';
        task.dueDateOverdue = dateStr ? (new Date(dateStr) < new Date(new Date().setHours(0,0,0,0))) : false;
        TaskData.save();

        // 更新 UI
        const dateEl = document.querySelector('.prop-value-date');
        if (dateEl) dateEl.textContent = task.dueDate;
        TaskRender.renderTaskList();

        // 同步后端
        if (TaskData.useApi && !String(task.id).startsWith('temp_')) {
            const apiDueDate = dateStr ? dateStr + 'T23:59:59' : null;
            Api.updateTask({ id: task.id, dueDate: apiDueDate });
        }
    },

    /**
     * 处理子任务区域的点击事件
     * @param {Event} e
     * @param {HTMLElement} panel
     * @private
     */
    _handleSubtaskClick(e, panel) {
        const subToggle = e.target.closest('[data-subtask-toggle]');
        if (subToggle && TaskData.selectedTaskId) {
            const subId = parseInt(subToggle.dataset.subtaskToggle);
            TaskData.toggleSubtask(TaskData.selectedTaskId, subId);
            TaskRender.renderDetail();
            return;
        }

        const addTrigger = e.target.closest('#subtask-add-trigger');
        if (addTrigger) {
            this._showSubtaskInput(panel);
        }
    },

    /**
     * 显示子任务输入框
     * @param {HTMLElement} panel
     * @private
     */
    _showSubtaskInput(panel) {
        const inputRow = panel.querySelector('#subtask-input-row');
        const trigger = panel.querySelector('#subtask-add-trigger');

        if (!inputRow || !trigger) return;

        trigger.classList.add('hidden');
        inputRow.classList.remove('hidden');
        const input = inputRow.querySelector('.subtask-input');
        if (input) {
            input.value = '';
            input.focus();
        }
    },

    /**
     * 处理子任务输入框的按键事件
     * @param {KeyboardEvent} e
     * @private
     */
    _handleSubtaskKeydown(e) {
        if (e.key === 'Enter' && e.target.classList.contains('subtask-input')) {
            e.preventDefault();
            const text = e.target.value.trim();
            if (text && TaskData.selectedTaskId) {
                TaskData.addSubtask(TaskData.selectedTaskId, text);
                TaskRender.renderDetail();
                setTimeout(() => {
                    const panel = document.querySelector('.detail-panel');
                    this._showSubtaskInput(panel);
                }, 50);
            }
        }
        if (e.key === 'Escape' && e.target.classList.contains('subtask-input')) {
            const panel = document.querySelector('.detail-panel');
            const inputRow = panel.querySelector('#subtask-input-row');
            const trigger = panel.querySelector('#subtask-add-trigger');
            if (inputRow) inputRow.classList.add('hidden');
            if (trigger) trigger.classList.remove('hidden');
        }
    },

    /* ============================================
       搜索过滤
       ============================================ */

    /**
     * 绑定搜索框实时过滤事件
     * @private
     */
    _bindSearchEvent() {
        const searchInput = document.querySelector('.search-input');
        searchInput.addEventListener('input', () => {
            TaskData.searchKeyword = searchInput.value;
            TaskRender.renderTaskList();
            TaskRender.renderFooter();
        });
    },

    /* ============================================
       侧栏导航
       ============================================ */

    /**
     * 绑定侧栏导航点击事件
     * @private
     */
    _bindSidebarNav() {
        // 快捷导航
        const navLinks = document.querySelectorAll('.nav-group .nav-link');
        const filterKeys = ['all', 'today', 'week'];

        navLinks.forEach((link, idx) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                TaskData.currentFilter = filterKeys[idx];
                TaskRender.renderAll();
            });
        });

        // 文件夹导航
        const folderLinks = document.querySelectorAll('.folder-link');
        const folderNames = ['工作', '学习', '生活'];

        folderLinks.forEach((link, idx) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                TaskData.currentFilter = folderNames[idx];
                TaskRender.renderAll();
            });
        });
    },

    /* ============================================
       消息通知
       ============================================ */
    _bindNotificationEvents() {
        const btn = document.getElementById('notification-btn');
        const popup = document.getElementById('notification-popup');
        const list = document.getElementById('notification-list');

        if (!btn || !popup || !list) return;

        // 1. 点击按钮切换弹窗显隐
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._closeAllDropdowns();
            // 手动收起其他可能存在的弹窗
            document.querySelectorAll('.calendar-popup, .category-popup, .tag-popup, .modal-overlay').forEach(el => {
                if (el.id !== 'notification-popup' && !el.classList.contains('hidden')) {
                    el.classList.add('hidden');
                }
            });
            popup.classList.toggle('hidden');
        });

        // 2. 阻止点击弹窗内部时关闭弹窗
        popup.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 3. 点击某条通知，直接在此处展开对应任务的详情
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.notification-item');
            if (item) {
                const taskIdStr = item.dataset.taskId || item.getAttribute('data-task-id');
                const taskId = parseInt(taskIdStr);
                if (!isNaN(taskId)) {
                    TaskData.selectedTaskId = taskId;
                    TaskRender.renderTaskList();
                    TaskRender.renderDetail();
                    popup.classList.add('hidden');
                    
                    // 强制在移动端展示详情侧拉面板
                    document.body.classList.add('show-detail');

                    // 确保主列表滚动到该任务位置
                    setTimeout(() => {
                        const taskEl = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
                        if (taskEl) taskEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                }
            }
        });
    },

    /* ============================================
       清除已完成
       ============================================ */

    /**
     * 绑定清除已完成按钮事件
     * @private
     */
    _bindClearCompleted() {
        const clearBtn = document.querySelector('.clear-btn');
        clearBtn.addEventListener('click', () => {
            TaskData.clearCompleted();
            TaskRender.renderAll();
        });
    },

    /**
     * 绑定文件夹新增/删除/重命名事件
     * @private
     */
    _bindFolderEvents() {
        const modal = document.getElementById('folder-modal');
        const modalTitle = document.getElementById('folder-modal-title');
        const modalInput = document.getElementById('folder-modal-input');
        const modalColors = document.getElementById('folder-modal-colors');
        const confirmBtn = document.getElementById('folder-modal-confirm');
        const cancelBtn = document.getElementById('folder-modal-cancel');
        const closeBtn = document.getElementById('folder-modal-close');

        let selectedColorIndex = 0;
        let editingFolderId = null; // null 表示新建模式

        /** 渲染颜色选择圆点 */
        const renderColorDots = () => {
            modalColors.innerHTML = FOLDER_COLORS.map((fc, i) => 
                `<div class="modal-color-dot ${i === selectedColorIndex ? 'selected' : ''}" 
                      data-color-idx="${i}" 
                      style="background:${fc.color}"></div>`
            ).join('');
        };

        /** 打开弹窗 */
        const openModal = (title, defaultName = '', colorIdx = 0, folderId = null) => {
            modalTitle.textContent = title;
            modalInput.value = defaultName;
            selectedColorIndex = colorIdx;
            editingFolderId = folderId;
            renderColorDots();
            confirmBtn.disabled = !defaultName.trim();
            modal.classList.remove('hidden');
            setTimeout(() => modalInput.focus(), 50);
        };

        /** 关闭弹窗 */
        const closeModal = () => {
            modal.classList.add('hidden');
            modalInput.value = '';
            editingFolderId = null;
        };

        // 颜色点击
        modalColors.addEventListener('click', (e) => {
            const dot = e.target.closest('.modal-color-dot');
            if (!dot) return;
            selectedColorIndex = parseInt(dot.dataset.colorIdx);
            renderColorDots();
        });

        // 输入框状态
        modalInput.addEventListener('input', () => {
            confirmBtn.disabled = !modalInput.value.trim();
        });

        // Enter 确认
        modalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && modalInput.value.trim()) {
                confirmBtn.click();
            }
            if (e.key === 'Escape') closeModal();
        });

        // 确定按钮
        confirmBtn.addEventListener('click', () => {
            const name = modalInput.value.trim();
            if (!name) return;
            if (editingFolderId !== null) {
                // 重命名模式
                TaskData.renameFolder(editingFolderId, name);
                const folder = TaskData.folders.find(f => f.id === editingFolderId);
                if (folder) { folder.colorIndex = selectedColorIndex; TaskData.saveFolders(); }
            } else {
                // 新建模式
                TaskData.addFolder(name, selectedColorIndex);
            }
            closeModal();
            TaskRender.renderAll();
        });

        // 取消/关闭
        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        // 新增文件夹按钮
        const addBtn = document.getElementById('add-folder-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const nextColor = TaskData.folders.length % FOLDER_COLORS.length;
                openModal('新建清单', '', nextColor);
            });
        }

        // 文件夹列表事件委托
        const folderList = document.querySelector('.folder-list');
        if (!folderList) return;

        // 点击 more 按钮 → 弹出操作选择
        folderList.addEventListener('click', (e) => {
            e.preventDefault();
            const moreBtn = e.target.closest('[data-folder-more]');
            if (moreBtn) {
                e.stopPropagation();
                const folderId = parseInt(moreBtn.dataset.folderMore);
                const folder = TaskData.folders.find(f => f.id === folderId);
                if (!folder) return;

                const folderPopup = document.getElementById('folder-more-popup');
                if (!folderPopup) return;

                // 将 folderId 绑在弹窗上
                folderPopup.dataset.folderId = folderId;
                
                // 计算定位并显示
                const rect = moreBtn.getBoundingClientRect();
                folderPopup.style.top = (rect.bottom + window.scrollY + 8) + 'px';
                folderPopup.style.left = (rect.left + window.scrollX - 88) + 'px';
                
                // 清理并显示
                this._closeAllDropdowns();
                folderPopup.classList.remove('hidden');
                
                return;
            }

            // 点击文件夹 → 按该清单筛选
            const folderLink = e.target.closest('.folder-link');
            if (folderLink) {
                const folderName = folderLink.dataset.folderName;
                TaskData.currentFilter = folderName;
                TaskRender.renderAll();
            }
        });

        // 双击文件夹名 → 内联重命名
        folderList.addEventListener('dblclick', (e) => {
            const nameEl = e.target.closest('.folder-name');
            if (!nameEl) return;
            e.preventDefault();
            e.stopPropagation();

            const folderLink = nameEl.closest('.folder-link');
            if (!folderLink) return;
            if (folderLink.dataset.folderName === 'uncategorized') return;
            
            const folderId = parseInt(folderLink.dataset.folderId);

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'inline-edit-input';
            input.value = nameEl.textContent;
            const origText = nameEl.textContent;

            nameEl.style.display = 'none';
            nameEl.parentNode.insertBefore(input, nameEl.nextSibling);
            input.focus();
            input.select();

            const saveEdit = () => {
                const newVal = input.value.trim();
                if (newVal && newVal !== origText) {
                    TaskData.renameFolder(folderId, newVal);
                }
                input.remove();
                nameEl.style.display = '';
                if (newVal && newVal !== origText) {
                    nameEl.textContent = newVal;
                    TaskRender.renderCategoryPopup();
                }
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
                if (ev.key === 'Escape') { input.value = origText; input.blur(); }
            });
        });

        // 绑定清单更多操作弹窗事件
        const folderMorePopup = document.getElementById('folder-more-popup');
        if (folderMorePopup) {
            folderMorePopup.addEventListener('click', async (e) => {
                e.stopPropagation();
                const folderId = parseInt(folderMorePopup.dataset.folderId);
                const folder = TaskData.folders.find(f => f.id === folderId);
                if (!folder) return;

                if (e.target.closest('#folder-edit-action')) {
                    folderMorePopup.classList.add('hidden');
                    openModal('编辑清单', folder.name, folder.colorIndex, folderId);
                } else if (e.target.closest('#folder-delete-action')) {
                    folderMorePopup.classList.add('hidden');
                    const confirmed = await TaskApp.showConfirm('删除警告', `确定要彻底删除清单 "${folder.name}" 吗？该操作不可恢复！`);
                    if (confirmed) {
                        TaskData.deleteFolder(folderId);
                        TaskRender.renderAll();
                    }
                }
            });
        }
    }
};

/* ============================================
   页面加载完成后初始化
   ============================================ */
document.addEventListener('DOMContentLoaded', async () => {
    await TaskApp.init();
});

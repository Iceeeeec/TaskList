/**
 * 标题: TaskRender
 * 说明: DOM 渲染模块 - 任务列表/详情面板/侧栏计数/状态栏
 * 时间: 2026-03-03 21:35
 * @author: zhoujunyu
 */

const TaskRender = {

    /* ============================================
       优先级配置映射表
       ============================================ */
    priorityConfig: {
        high: { label: '高', badgeClass: 'priority-high' },
        mid:  { label: '中', badgeClass: 'priority-mid' },
        low:  { label: '低', badgeClass: 'priority-low' }
    },

    /* ============================================
       筛选视图标题映射表
       ============================================ */
    filterTitles: {
        all: '所有任务',
        today: '今天',
        week: '最近七天',
        uncategorized: '未分类'
    },

    /**
     * 渲染主区域标题（根据当前筛选切换）
     */
    renderMainTitle() {
        const h2 = document.querySelector('.main-header h2');
        const title = this.filterTitles[TaskData.currentFilter] || TaskData.currentFilter;
        h2.textContent = title;
    },

    /**
     * 渲染动态日期
     */
    renderDate() {
        const dateEl = document.querySelector('.date-text');
        const now = new Date();
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekday = weekdays[now.getDay()];
        dateEl.textContent = `今天是星期${weekday}，${month}月${day}日`;
    },

    /**
     * 渲染任务列表（按优先级排序，已完成置底）
     */
    renderTaskList() {
        const container = document.querySelector('.task-list');
        const tasks = TaskData.getFilteredTasks();

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-outlined">task_alt</span>
                    <p>暂无任务</p>
                </div>`;
            return;
        }

        // 优先级权重：high=0, mid=1, low=2
        const priorityWeight = { high: 0, mid: 1, low: 2 };

        // 排序：已完成任务置底，未完成按优先级从高到低
        const sorted = [...tasks].sort((a, b) => {
            // 已完成的沉底
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            // 同状态按优先级排序
            const wa = priorityWeight[a.priority] ?? 1;
            const wb = priorityWeight[b.priority] ?? 1;
            return wa - wb;
        });

        container.innerHTML = sorted.map(task => this._buildTaskItem(task)).join('');
    },

    /**
     * 构建单个任务项 HTML
     * @param {Object} task - 任务对象
     * @returns {string} HTML 字符串
     * @private
     */
    _buildTaskItem(task) {
        const isActive = task.id === TaskData.selectedTaskId;
        const isCompleted = task.completed;

        // 动态 class 组合
        let itemClass = 'task-item';
        if (isActive) itemClass += ' active';
        if (isCompleted) itemClass += ' completed';

        // 优先级
        let priorityHtml = '';
        if (isCompleted) {
            priorityHtml = '<span class="priority-badge priority-done">完成</span>';
        } else {
            const pConf = this.priorityConfig[task.priority] || this.priorityConfig.mid;
            priorityHtml = `<span class="priority-badge ${pConf.badgeClass}">
                <span class="dot"></span> ${pConf.label}
            </span>`;
        }

        // 截止日期样式
        const dateClass = task.dueDateOverdue && !isCompleted ? 'task-date overdue' : 'task-date';

        // 描述行（可选）
        const descHtml = task.desc ? `<p class="task-desc">${this._escapeHtml(task.desc)}</p>` : '';

        // 标签显示（带自定义颜色）
        const tagsHtml = (task.tags && task.tags.length > 0)
            ? task.tags.map(tag => {
                const tc = TaskData.getTagColor(tag);
                return `<span class="task-tag" style="color:${tc.color};background:${tc.bg};border-color:${tc.border}">#${this._escapeHtml(tag)}</span>`;
            }).join('')
            : '';

        return `
        <div class="${itemClass}" data-task-id="${task.id}">
            <label class="checkbox-wrapper${isCompleted ? ' completed' : ''}" data-toggle-id="${task.id}">
                <input type="checkbox" ${isCompleted ? 'checked' : ''}/>
                <div class="checkbox-custom">
                    <span class="material-symbols-outlined">check</span>
                </div>
            </label>
            <div class="task-content">
                <div class="task-title-row">
                    <span class="task-title">${this._escapeHtml(task.title)}</span>
                    <span class="task-category ${task.categoryClass}">${this._escapeHtml(task.category)}</span>
                    ${tagsHtml}
                </div>
                ${descHtml}
            </div>
            <div class="task-priority">${priorityHtml}</div>
            <div class="${dateClass}">${this._escapeHtml(task.dueDate)}</div>
        </div>`;
    },

    /**
     * 渲染右侧详情面板
     */
    renderDetail() {
        const panel = document.querySelector('.detail-panel');
        const task = TaskData.getSelectedTask();

        if (!task) {
            panel.classList.add('hidden');
            return;
        }

        panel.classList.remove('hidden');

        // 标题
        const titleInput = panel.querySelector('.detail-title-input');
        titleInput.value = task.title;

        // 复选框同步
        const checkbox = panel.querySelector('.detail-header input[type="checkbox"]');
        checkbox.checked = task.completed;

        // 描述内容
        const descInput = panel.querySelector('.detail-desc-input');
        if (descInput) {
            descInput.value = task.desc || '';
        }

        // 属性值
        panel.querySelector('.prop-value-date').textContent = task.dueDate;

        // 优先级
        const priorityEl = panel.querySelector('.prop-value-priority');
        const pConf = this.priorityConfig[task.priority] || this.priorityConfig.mid;
        priorityEl.innerHTML = `<span class="priority-dot" style="background-color: var(--priority-${task.priority})"></span> ${pConf.label}`;

        // 清单
        panel.querySelector('.prop-value-list').textContent = task.category;

        // 标签（带自定义颜色）
        const tagsContainer = panel.querySelector('.detail-tags-list');
        if (tagsContainer) {
            if (task.tags && task.tags.length > 0) {
                tagsContainer.innerHTML = task.tags.map(tag => {
                    const tc = TaskData.getTagColor(tag);
                    return `<span class="detail-tag" style="color:${tc.color};background:${tc.bg};border-color:${tc.border}">#${this._escapeHtml(tag)}</span>`;
                }).join('');
            } else {
                tagsContainer.innerHTML = '<span class="prop-value-empty">无标签</span>';
            }
        }

        // 提醒开关
        const remindSwitch = panel.querySelector('#detail-remind-switch');
        if (remindSwitch) {
            // task.reminder 为 1 代表开启，0 代表关闭
            remindSwitch.checked = task.reminder === 1;
        }

        // 子任务
        this._renderSubtasks(task);

        // 备注
        const textarea = panel.querySelector('.note-textarea');
        textarea.value = task.note || '';

        // 创建时间
        panel.querySelector('.detail-create-date').textContent = '创建于 ' + this._getCreateDate();
    },

    /**
     * 渲染子任务列表
     * @param {Object} task - 任务对象
     * @private
     */
    _renderSubtasks(task) {
        const container = document.querySelector('.subtask-list');
        let html = '';

        // 已有子任务
        task.subtasks.forEach(sub => {
            html += `
            <div class="subtask-item" data-sub-id="${sub.id}">
                <label class="checkbox-small">
                    <input type="checkbox" ${sub.done ? 'checked' : ''} data-subtask-toggle="${sub.id}"/>
                    <div class="checkbox-box">
                        <span class="material-symbols-outlined">check</span>
                    </div>
                </label>
                <span class="subtask-text${sub.done ? ' done' : ''}">${this._escapeHtml(sub.text)}</span>
            </div>`;
        });

        // 添加子任务占位
        html += `
        <div class="subtask-add-placeholder" id="subtask-add-trigger">
            <span class="material-symbols-outlined">add</span>
            <span>新子任务...</span>
        </div>
        <div class="subtask-input-row hidden" id="subtask-input-row">
            <input type="text" class="subtask-input" placeholder="输入子任务，回车保存..." />
        </div>`;

        container.innerHTML = html;
    },

    /**
     * 渲染侧栏导航计数
     */
    renderSidebarCounts() {
        const counts = TaskData.getSidebarCounts();
        const navLinks = document.querySelectorAll('.nav-group .nav-link');

        if (navLinks[0]) navLinks[0].querySelector('.count').textContent = counts.all;
        if (navLinks[1]) navLinks[1].querySelector('.count').textContent = counts.today;
        if (navLinks[2]) navLinks[2].querySelector('.count').textContent = counts.week;
    },

    /**
     * 渲染侧栏导航激活状态
     */
    renderSidebarActive() {
        const navLinks = document.querySelectorAll('.nav-group .nav-link');
        const folderLinks = document.querySelectorAll('.folder-link');

        // 清除所有激活
        navLinks.forEach(link => link.classList.remove('active'));
        folderLinks.forEach(link => link.classList.remove('active'));

        // 设置当前激活
        const filterMap = { all: 0, today: 1, week: 2 };
        if (filterMap[TaskData.currentFilter] !== undefined) {
            navLinks[filterMap[TaskData.currentFilter]].classList.add('active');
        } else {
            // 文件夹高亮
            folderLinks.forEach(link => {
                if (link.dataset && link.dataset.folderName === TaskData.currentFilter) {
                    link.classList.add('active');
                }
            });
        }
    },

    /**
     * 渲染底部状态栏
     */
    renderFooter() {
        const footer = document.querySelector('.main-footer span');
        const count = TaskData.getPendingCount();
        footer.textContent = `${count} 个待办任务`;
    },

    /**
     * 全部重新渲染
     */
    renderAll() {
        this.renderDate();
        this.renderMainTitle();
        this.renderTaskList();
        this.renderDetail();
        this.renderSidebarCounts();
        this.renderSidebarActive();
        this.renderFooter();
        this.renderSidebarTags();
        this.renderSidebarFolders();
        this.renderCategoryPopup();
        this.renderNotifications();
    },

    /**
     * 渲染右上角消息弹窗内容和红点角标
     */
    renderNotifications() {
        const badge = document.getElementById('notification-badge');
        const list = document.getElementById('notification-list');
        if (!badge || !list) return;

        // 筛选：未完成 && 开启了提醒 && 今天截止 
        const todayTasks = TaskData.tasks.filter(t => 
            !t.completed && 
            t.reminder === 1 && 
            t.dueDate && t.dueDate.includes('今天')
        );

        // 更新红点角标
        if (todayTasks.length > 0) {
            badge.textContent = todayTasks.length > 99 ? '99+' : todayTasks.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        // 更新下拉列表
        if (todayTasks.length === 0) {
            list.innerHTML = '<div class="notification-empty">今天暂无提醒任务</div>';
            return;
        }

        let html = '';
        todayTasks.forEach(t => {
            html += `
            <div class="notification-item" data-task-id="${t.id}">
                <div class="notification-item-title">${this._escapeHtml(t.title)}</div>
                <div class="notification-item-time">
                    <span class="material-symbols-outlined" style="font-size:14px;">schedule</span>
                    ${this._escapeHtml(t.dueDate.replace('今天 ', '') || '全天')}
                </div>
            </div>`;
        });
        list.innerHTML = html;
    },

    /**
     * 渲染侧栏文件夹列表（动态）
     */
    renderSidebarFolders() {
        const container = document.querySelector('.folder-list');
        if (!container) return;

        const counts = TaskData.getSidebarCounts();

        let html = `
            <a class="folder-link" href="#" data-folder-name="uncategorized">
                <span class="material-symbols-outlined" style="color:var(--text-placeholder)">inventory_2</span>
                <span class="folder-name">未分类</span>
                <span class="count" style="margin-left:auto; font-size:12px; color:var(--text-muted)">${counts.uncategorized || 0}</span>
            </a>
        `;

        html += TaskData.folders.map(folder => {
            const fc = FOLDER_COLORS[folder.colorIndex] || FOLDER_COLORS[0];
            return `
            <a class="folder-link" href="#" data-folder-id="${folder.id}" data-folder-name="${this._escapeHtml(folder.name)}">
                <span class="material-symbols-outlined ${fc.icon}">folder</span>
                <span class="folder-name">${this._escapeHtml(folder.name)}</span>
                <span class="more-btn" data-folder-more="${folder.id}">
                    <span class="material-symbols-outlined">more_horiz</span>
                </span>
            </a>`;
        }).join('');
        container.innerHTML = html;
    },

    /**
     * 渲染工具栏清单选择弹窗选项（同步文件夹列表）
     */
    renderCategoryPopup() {
        const popup = document.getElementById('category-popup');
        if (!popup) return;

        let html = `<div class="category-popup-item" data-cat="">
            <span class="material-symbols-outlined" style="font-size:16px;color:var(--text-placeholder)">block</span>
            无清单
        </div>`;

        html += TaskData.folders.map(folder => {
            const fc = FOLDER_COLORS[folder.colorIndex] || FOLDER_COLORS[0];
            return `<div class="category-popup-item" data-cat="${this._escapeHtml(folder.name)}">
                <span class="material-symbols-outlined" style="font-size:16px;color:${fc.color}">folder</span>
                ${this._escapeHtml(folder.name)}
            </div>`;
        }).join('');

        popup.innerHTML = html;
    },

    /**
     * 渲染侧栏标签区域（动态同步自定义标签）
     */
    renderSidebarTags() {
        const container = document.querySelector('.tag-list');
        if (!container) return;

        container.innerHTML = TaskData.tags.map(tag => {
            const tc = TAG_COLORS[tag.colorIndex] || TAG_COLORS[5];
            return `<span class="sidebar-tag" style="color:${tc.color};background:#fff;border-color:#e2e8f0" data-tag-text="${this._escapeHtml(tag.text)}">#${this._escapeHtml(tag.text)}</span>`;
        }).join('');
    },

    /**
     * 渲染标签选择弹窗内容
     * @param {HTMLElement} popup - 弹窗容器元素
     * @param {Array} selectedTags - 当前已选标签文字数组
     */
    renderTagPopup(popup, selectedTags = []) {
        // 已有标签列表
        let tagsHtml = TaskData.tags.map(tag => {
            const tc = TAG_COLORS[tag.colorIndex] || TAG_COLORS[5];
            const isSelected = selectedTags.includes(tag.text);
            return `
            <div class="tag-popup-item ${isSelected ? 'selected' : ''}" data-tag-id="${tag.id}" data-tag-text="${this._escapeHtml(tag.text)}">
                <span class="tag-popup-color" style="background:${tc.color}"></span>
                <span class="tag-popup-text">#${this._escapeHtml(tag.text)}</span>
                ${isSelected ? '<span class="material-symbols-outlined tag-check">check</span>' : ''}
                <button class="tag-popup-delete" data-delete-tag="${tag.id}" title="删除标签">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>`;
        }).join('');

        // 颜色选择器
        const colorsHtml = TAG_COLORS.map((c, idx) =>
            `<button class="color-dot" data-color-index="${idx}" style="background:${c.color}" title="${c.name}"></button>`
        ).join('');

        popup.innerHTML = `
        <div class="tag-popup-header">选择标签</div>
        <div class="tag-popup-list">${tagsHtml || '<p class="tag-popup-empty">暂无标签</p>'}</div>
        <div class="tag-popup-divider"></div>
        <div class="tag-popup-create">
            <div class="tag-popup-create-row">
                <input type="text" class="tag-popup-input" placeholder="输入新标签名..." maxlength="10"/>
            </div>
            <div class="tag-popup-colors">${colorsHtml}</div>
            <button class="tag-popup-create-btn" disabled>创建标签</button>
        </div>`;
    },

    /**
     * HTML 转义防 XSS
     * @param {string} str
     * @returns {string}
     * @private
     */
    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * 获取创建日期显示文本
     * @returns {string}
     * @private
     */
    _getCreateDate() {
        const now = new Date();
        return `${now.getMonth() + 1}月${now.getDate()}日`;
    }
};

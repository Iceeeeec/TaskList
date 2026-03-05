/**
 * 标题: TaskData
 * 说明: 任务数据模型 - 从后端 API 加载/CRUD 操作
 * 时间: 2026-03-04 15:01
 * @author: zhoujunyu
 */

/* ============================================
   存储键名常量（本地缓存备用）
   ============================================ */
const STORAGE_KEY = "taskList_data";
const TAGS_STORAGE_KEY = "taskList_tags";
const FOLDERS_STORAGE_KEY = "taskList_folders";

/* ============================================
   文件夹颜色方案
   ============================================ */
const FOLDER_COLORS = [
    { name: '蓝色',   icon: 'icon-blue',   color: 'var(--primary)' },
    { name: '绿色',   icon: 'icon-green',  color: '#22c55e' },
    { name: '橙色',   icon: 'icon-orange', color: '#f97316' },
    { name: '紫色',   icon: 'icon-purple', color: '#8b5cf6' },
    { name: '灰色',   icon: 'icon-muted',  color: '#94a3b8' },
];

/* ============================================
   默认文件夹数据
   ============================================ */
const DEFAULT_FOLDERS = [
    { id: 1, name: '工作', colorIndex: 0 },
    { id: 2, name: '学习', colorIndex: 1 },
    { id: 3, name: '生活', colorIndex: 2 },
];

/* ============================================
   预设标签颜色方案
   ============================================ */
const TAG_COLORS = [
    { name: '红色',   color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    { name: '橙色',   color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
    { name: '黄色',   color: '#eab308', bg: '#fefce8', border: '#fde68a' },
    { name: '绿色',   color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
    { name: '蓝色',   color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    { name: '紫色',   color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
    { name: '粉色',   color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8' },
    { name: '青色',   color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
];

/* ============================================
   默认标签数据
   ============================================ */
const DEFAULT_TAGS = [
    { id: 1, text: '紧急', colorIndex: 0 },
    { id: 2, text: '待定', colorIndex: 4 },
    { id: 3, text: '想法', colorIndex: 5 },
];

/* ============================================
   TaskData 数据管理类
   ============================================ */
const TaskData = {
  /** 任务列表数组 */
  tasks: [],

  /** 自增ID计数器 */
  nextId: 100,

  /** 当前选中任务的ID */
  selectedTaskId: null,

  /** 当前搜索关键词 */
  searchKeyword: "",

  /** 当前筛选视图：'all' | 'today' | 'week' | 文件夹ID */
  currentFilter: "all",

  /** 自定义标签列表 */
  tags: [],

  /** 标签自增ID */
  nextTagId: 100,

  /** 文件夹列表 */
  folders: [],

  /** 文件夹自增ID */
  nextFolderId: 100,

  /** 是否使用后端 API（设为 false 可切回 localStorage） */
  useApi: true,

  /**
   * 初始化 - 从后端 API 加载数据
   */
  async init() {
    if (this.useApi) {
      try {
        // 并行加载文件夹、标签、任务
        const [folders, tags, tasks] = await Promise.all([
          Api.getFolders(),
          Api.getTags(),
          Api.getTaskList('all')
        ]);

        if (folders) {
          this.folders = folders.map(f => ({
            id: f.id, name: f.name, colorIndex: f.colorIndex
          }));
        }

        if (tags) {
          this.tags = tags.map(t => ({
            id: t.id, text: t.name, colorIndex: t.colorIndex
          }));
        }

        if (tasks) {
          this.tasks = tasks.map(t => this._apiTaskToLocal(t));
        }

        // 默认选中第一个未完成任务
        const firstUncompleted = this.tasks.find(t => !t.completed);
        if (firstUncompleted) {
          this.selectedTaskId = firstUncompleted.id;
        }
        return;
      } catch (e) {
        console.warn('API 加载失败，回退到 localStorage:', e);
      }
    }

    // 回退：从 localStorage 读取
    this._initFromLocalStorage();
  },

  /**
   * 将 API 返回的任务数据转为前端格式
   * @param {Object} t - API 任务对象
   * @returns {Object} 前端任务对象
   */
  _apiTaskToLocal(t) {
    const categoryClassMap = {
      '工作': 'cat-blue', '学习': 'cat-green', '生活': 'cat-purple',
      '健康': 'cat-green', '家庭': 'cat-muted',
    };
    const folderName = t.folder ? t.folder.name : '';
    return {
      id: t.id,
      title: t.title,
      desc: t.description || '',
      priority: t.priority || 'mid',
      category: folderName,
      categoryClass: categoryClassMap[folderName] || '',
      dueDate: t.dueDate ? this._formatDueDate(t.dueDate) : '',
      dueDateRaw: t.dueDate || null,
      dueDateOverdue: t.dueDate ? new Date(t.dueDate) < new Date() : false,
      completed: t.completed === 1 || t.completed === true,
      subtasks: (t.subtasks || []).map(s => ({
        id: s.id, text: s.text, done: s.done === 1
      })),
      note: t.note || '',
      tags: (t.tags || []).map(tag => tag.name),
      folderId: t.folder ? t.folder.id : null,
      reminder: t.reminder != null ? t.reminder : 1,
    };
  },

  /**
   * 格式化截止日期为前端显示文本
   * @param {string} dateStr - ISO 日期字符串
   * @returns {string} 显示文本（今天/明天/周X等）
   */
  _formatDueDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    const time = date.toTimeString().slice(0, 5); // HH:mm

    if (diffDays === 0) return '今天 ' + time;
    if (diffDays === 1) return '明天 ' + time;
    if (diffDays === -1) return '昨天';
    if (diffDays > 1 && diffDays <= 7) {
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      return '周' + weekdays[date.getDay()];
    }
    return (date.getMonth() + 1) + '月' + date.getDate() + '日';
  },

  /**
   * 从 localStorage 初始化（备用）
   */
  _initFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.tasks = parsed.tasks || [];
        this.nextId = parsed.nextId || 100;
      } catch (e) {
        this.tasks = [];
      }
    }
    const savedTags = localStorage.getItem(TAGS_STORAGE_KEY);
    if (savedTags) {
      try {
        const parsed = JSON.parse(savedTags);
        this.tags = parsed.tags || [];
      } catch (e) {
        this.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
      }
    } else {
      this.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
    }
    const savedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (savedFolders) {
      try {
        const parsed = JSON.parse(savedFolders);
        this.folders = parsed.folders || [];
      } catch (e) {
        this.folders = JSON.parse(JSON.stringify(DEFAULT_FOLDERS));
      }
    } else {
      this.folders = JSON.parse(JSON.stringify(DEFAULT_FOLDERS));
    }
    if (this.tasks.length > 1) {
      this.selectedTaskId = this.tasks[1].id;
    }
  },

  /**
   * 保存任务数据到 localStorage（兼容）
   */
  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tasks: this.tasks, nextId: this.nextId,
    }));
  },

  /**
   * 保存标签到 localStorage（兼容）
   */
  saveTags() {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify({
      tags: this.tags, nextTagId: this.nextTagId,
    }));
  },

  /**
   * 保存文件夹到 localStorage（兼容）
   */
  saveFolders() {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify({
      folders: this.folders, nextFolderId: this.nextFolderId,
    }));
  },

  /* ============================================
     标签管理
     ============================================ */

  /**
   * 创建新标签
   * @param {string} text - 标签文字
   * @param {number} colorIndex - 颜色索引
   * @returns {Object} 新标签
   */
  addTag(text, colorIndex) {
    const tag = { id: this.nextTagId++, text, colorIndex };
    this.tags.push(tag);
    this.saveTags();
    // API 同步
    if (this.useApi) Api.addTag(text, colorIndex);
    return tag;
  },

  /**
   * 删除标签
   * @param {number} tagId - 标签ID
   */
  deleteTag(tagId) {
    const tag = this.tags.find(t => t.id === tagId);
    this.tags = this.tags.filter(t => t.id !== tagId);
    // 同时从所有任务中移除此标签
    if (tag) {
      this.tasks.forEach(task => {
        task.tags = task.tags.filter(t => t !== tag.text);
      });
    }
    this.saveTags();
    this.save();
    if (this.useApi) Api.deleteTag(tagId);
  },

  /**
   * 根据标签文字获取颜色方案
   * @param {string} tagText - 标签文字
   * @returns {Object} 颜色方案
   */
  getTagColor(tagText) {
    const tag = this.tags.find(t => t.text === tagText);
    if (tag) return TAG_COLORS[tag.colorIndex] || TAG_COLORS[5];
    return TAG_COLORS[5];
  },

  /**
   * 根据文字查找标签对象
   * @param {string} text - 标签文字
   * @returns {Object|null}
   */
  getTagByText(text) {
    return this.tags.find(t => t.text === text) || null;
  },

  /* ============================================
     任务 CRUD
     ============================================ */

  /**
   * 添加新任务
   * @param {string} title
   * @param {string} priority
   * @param {string} category
   * @param {Array<string>} tags - 标签数组
   * @param {string} dueDateRaw - YYYY-MM-DD 格式
   */
  addTask(title, priority = "mid", category = "", tags = [], dueDateRaw = "") {
    const categoryClassMap = {
      '工作': 'cat-blue', '学习': 'cat-green', '生活': 'cat-purple',
      '健康': 'cat-green', '家庭': 'cat-muted',
    };
    
    const folder = category ? this.folders.find(f => f.name === category) : null;
    
    let displayDueDate = dueDateRaw ? this._formatDueDate(dueDateRaw) : "今天";
    let isOverdue = dueDateRaw ? (new Date(dueDateRaw) < new Date(new Date().setHours(0,0,0,0))) : false;

    // 为后端请求拼装后缀
    let apiDueDate = null;
    if (dueDateRaw) {
        apiDueDate = dueDateRaw + "T23:59:59";
    }
    
    const task = {
      id: "temp_" + Date.now(),
      title: title.trim(),
      desc: "",
      priority,
      category: category || "",
      categoryClass: categoryClassMap[category] || "",
      dueDate: displayDueDate,
      dueDateOverdue: isOverdue,
      completed: false,
      subtasks: [],
      note: "",
      tags: [...tags],
      folderId: folder ? folder.id : null,
    };
    this.tasks.unshift(task);
    this.save();

    // API 同步
    if (this.useApi) {
      const tagIds = tags.map(name => {
        const t = this.getTagByText(name);
        return t ? t.id : null;
      }).filter(id => id !== null);
      
      Api.addTask(title.trim(), priority, folder ? folder.id : null, tagIds, apiDueDate).then(apiTask => {
        if (apiTask) {
          // 用 API 返回的ID替换本地临时ID
          task.id = apiTask.id;
          if (this.selectedTaskId === "temp_" + Date.now() || this.selectedTaskId === task.id || String(this.selectedTaskId).startsWith("temp_")) {
              this.selectedTaskId = apiTask.id;
          }
        }
      });
    }
    return task;
  },

  /**
   * 切换任务完成状态
   * @param {number} id - 任务ID
   */
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save();
      if (this.useApi) Api.toggleTask(id);
    }
  },

  /**
   * 删除任务
   * @param {number} id - 任务ID
   */
  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.selectedTaskId === id) {
      this.selectedTaskId = this.tasks.length > 0 ? this.tasks[0].id : null;
    }
    this.save();
    if (this.useApi) Api.deleteTask(id);
  },

  /**
   * 获取选中任务
   * @returns {Object|null}
   */
  getSelectedTask() {
    return this.tasks.find(t => t.id === this.selectedTaskId) || null;
  },

  /**
   * 根据 API 加载选中任务的详情（包含子任务）
   */
  async loadSelectedTaskDetail() {
      if (!this.useApi || !this.selectedTaskId || String(this.selectedTaskId).startsWith("temp_")) return;
      const detail = await Api.getTaskDetail(this.selectedTaskId);
      if (detail) {
          const task = this.tasks.find(t => t.id === this.selectedTaskId);
          if (task) {
              task.subtasks = detail.subtasks ? detail.subtasks.map(s => ({
                  id: s.id,
                  text: s.text,
                  done: s.done === 1
              })) : [];
              task.tags = detail.tags ? detail.tags.map(tag => tag.name) : [];
              task.desc = detail.description || "";
              task.note = detail.note || "";
              // 解析截止日期
              if (detail.dueDate) {
                  const raw = String(detail.dueDate).substring(0, 10); // "YYYY-MM-DD"
                  task.dueDateRaw = raw;
                  task.dueDate = this._formatDueDate(raw);
              } else {
                  task.dueDateRaw = '';
                  task.dueDate = '无';
              }
              this.save();
          }
      }
  },

  /**
   * 更新任务标题
   */
  updateTitle(id, newTitle) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.title = newTitle.trim();
      this.save();
      if (this.useApi) Api.updateTask({ id, title: newTitle.trim() });
    }
  },

  /**
   * 更新任务备注
   */
  updateNote(id, note) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.note = note;
      this.save();
      if (this.useApi) Api.updateTask({ id, note });
    }
  },

  /**
   * 更新任务描述
   */
  updateDesc(id, desc) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.desc = desc;
      this.save();
      if (this.useApi) Api.updateTask({ id, description: desc });
    }
  },

  /**
   * 更新任务提醒开关
   */
  updateReminder(id, reminder) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.reminder = reminder;
      this.save();
      if (this.useApi) Api.updateTask({ id, reminder });
    }
  },

  /**
   * 更新任务优先级
   */
  updatePriority(id, priority) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.priority = priority;
      this.save();
      if (this.useApi) Api.updateTask({ id, priority });
    }
  },

  /**
   * 更新任务分类（清单）
   */
  updateCategory(id, category) {
    const categoryClassMap = {
      '工作': 'cat-blue', '学习': 'cat-green', '生活': 'cat-purple',
      '健康': 'cat-green', '家庭': 'cat-muted',
    };
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.category = category;
      task.categoryClass = categoryClassMap[category] || '';
      const folder = category ? this.folders.find(f => f.name === category) : null;
      task.folderId = folder ? folder.id : null;
      this.save();
      if (this.useApi) Api.updateTask({ id, folderId: folder ? folder.id : null });
    }
  },

  /**
   * 更新任务关联的标签
   * @param {number} taskId
   * @param {Array<string>} tagNames
   */
  updateTaskTags(taskId, tagNames) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.tags = tagNames;
    this.save();
    
    if (this.useApi) {
      // 将前端的标签名称转换为数据库存的 tagId
      const tagIds = tagNames.map(name => {
        const t = this.getTagByText(name);
        return t ? t.id : null;
      }).filter(id => id !== null);
      
      Api.updateTaskTags(taskId, tagIds);
    }
  },

  /**
   * 清除已完成任务
   */
  clearCompleted() {
    this.tasks = this.tasks.filter(t => !t.completed);
    if (!this.tasks.find(t => t.id === this.selectedTaskId)) {
      this.selectedTaskId = this.tasks.length > 0 ? this.tasks[0].id : null;
    }
    this.save();
    if (this.useApi) Api.clearCompleted();
  },

  /* ============================================
     子任务管理
     ============================================ */

  /**
   * 按 ID 模糊搜索返回子任务等，未实现省略
   */

  /**
   * 将 YYYY-MM-DD 格式化为用于展示的相对日期文本，或者MM月DD日
   */
  _formatDueDate(dateStr) {
      if (!dateStr) return "无";
      const targetDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const targetTime = targetDate.getTime();
      if (targetDate.toDateString() === today.toDateString()) {
          return "今天";
      } else if (targetDate.toDateString() === tomorrow.toDateString()) {
          return "明天";
      } else if (targetTime < today.getTime()) {
          return "已过期";
      } else {
          return (targetDate.getMonth() + 1) + "月" + targetDate.getDate() + "日";
      }
  },

  /**
   * 添加子任务
   */
  addSubtask(taskId, text) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      const sub = { id: Date.now(), text, done: false };
      task.subtasks.push(sub);
      this.save();
      if (this.useApi) {
        Api.addSubtask(taskId, text).then(res => {
          if (res && res.id) {
            sub.id = res.id;
            this.save();
          }
        });
      }
    }
  },

  /**
   * 切换子任务完成状态
   */
  toggleSubtask(taskId, subId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      const sub = task.subtasks.find(s => s.id === subId);
      if (sub) {
        sub.done = !sub.done;
        this.save();
        if (this.useApi) Api.toggleSubtask(subId);
      }
    }
  },

  /* ============================================
     查询方法
     ============================================ */

  /**
   * 获取过滤后的任务列表
   * @returns {Array}
   */
  getFilteredTasks() {
    let result = [...this.tasks];

    if (this.currentFilter === "today") {
      result = result.filter((t) => t.dueDate && t.dueDate.includes("今天"));
    } else if (this.currentFilter === "week") {
      result = result.filter(
        (t) => !t.dueDate || !t.dueDate.includes("昨天") || !t.completed,
      );
    } else if (this.currentFilter === "uncategorized") {
      result = result.filter((t) => !t.category || t.category === "");
    } else if (this.currentFilter !== "all") {
      // 按文件夹名称筛选
      result = result.filter((t) => t.category === this.currentFilter);
    }

    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(kw) ||
          t.desc.toLowerCase().includes(kw) ||
          t.category.toLowerCase().includes(kw) ||
          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(kw))),
      );
    }

    return result;
  },

  /**
   * 获取未完成任务数量
   */
  getPendingCount() {
    return this.tasks.filter((t) => !t.completed).length;
  },

  /**
   * 获取侧栏各导航项的计数
   */
  getSidebarCounts() {
    return {
      all: this.tasks.length,
      today: this.tasks.filter((t) => t.dueDate && t.dueDate.includes("今天")).length,
      week: this.tasks.filter(
        (t) => !t.dueDate || !t.dueDate.includes("昨天") || !t.completed,
      ).length,
      uncategorized: this.tasks.filter((t) => !t.category || t.category === "").length
    };
  },

  /* ============================================
     文件夹管理
     ============================================ */

  /**
   * 添加新文件夹
   */
  addFolder(name, colorIndex = 0) {
    const folder = { id: this.nextFolderId++, name: name.trim(), colorIndex };
    this.folders.push(folder);
    this.saveFolders();
    if (this.useApi) {
      Api.addFolder(name.trim(), colorIndex).then(() => {
        // 重新加载以同步ID
        Api.getFolders().then(list => {
          if (list) this.folders = list.map(f => ({
            id: f.id, name: f.name, colorIndex: f.colorIndex
          }));
        });
      });
    }
    return folder;
  },

  /**
   * 删除文件夹
   */
  deleteFolder(id) {
    this.folders = this.folders.filter((f) => f.id !== id);
    this.saveFolders();
    if (this.useApi) Api.deleteFolder(id);
  },

  /**
   * 重命名文件夹
   */
  renameFolder(id, newName) {
    const folder = this.folders.find((f) => f.id === id);
    if (folder) {
      folder.name = newName.trim();
      this.saveFolders();
      if (this.useApi) Api.updateFolder(id, newName.trim(), folder.colorIndex);
    }
  },

  /**
   * 将 YYYY-MM-DD 格式化为用于展示的相对日期文本，或者MM月DD日
   */
  _formatDueDate(dateStr) {
      if (!dateStr) return "今天";
      const targetDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const targetTime = targetDate.getTime();
      if (targetDate.toDateString() === today.toDateString()) {
          return "今天";
      } else if (targetDate.toDateString() === tomorrow.toDateString()) {
          return "明天";
      } else if (targetTime < today.getTime()) {
          return "已过期";
      } else {
          return (targetDate.getMonth() + 1) + "月" + targetDate.getDate() + "日";
      }
  }
};

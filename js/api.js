/**
 * 标题: Api
 * 说明: 后端 API 请求封装 - 统一 fetch 调用
 * 时间: 2026-03-04 15:01
 * @author: zhoujunyu
 */

// const API_BASE = 'http://localhost:8733/api'; // 本地开发时使用
const API_BASE = '/api'; // 部署到服务器时使用，配合 Nginx 反向代理
// 如果后端跨域且没有使用 Nginx，可以直接写服务器 IP: const API_BASE = 'http://你的服务器IP:8733/api';

/** 获取当前登录用户ID */
function getLoginUserId() {
    return localStorage.getItem('taskList_userId') || '1';
}

const Api = {

    /**
     * 通用请求方法
     * @param {string} url - 接口路径
     * @param {string} method - 请求方法
     * @param {Object} body - 请求体
     * @returns {Promise<Object>} 响应数据
     */
    async request(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'userId': getLoginUserId()
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const res = await fetch(API_BASE + url, options);
            const json = await res.json();
            if (json.code !== 200) {
                console.error('API Error:', json.msg);
                return null;
            }
            return json.data;
        } catch (e) {
            console.error('Network Error:', e);
            return null;
        }
    },

    /* ============ 用户 ============ */

    /** 获取用户信息 */
    async getUserInfo() {
        return this.request('/user/info');
    },

    /* ============ 文件夹 ============ */

    /** 获取文件夹列表 */
    async getFolders() {
        return this.request('/folder/list');
    },

    /** 新建文件夹 */
    async addFolder(name, colorIndex) {
        return this.request('/folder/add', 'POST', { name, colorIndex });
    },

    /** 修改文件夹 */
    async updateFolder(id, name, colorIndex) {
        return this.request('/folder/update', 'PUT', { id, name, colorIndex });
    },

    /** 删除文件夹 */
    async deleteFolder(id) {
        return this.request('/folder/delete/' + id, 'DELETE');
    },

    /* ============ 标签 ============ */

    /** 获取标签列表 */
    async getTags() {
        return this.request('/tag/list');
    },

    /** 新建标签 */
    async addTag(name, colorIndex) {
        return this.request('/tag/add', 'POST', { name, colorIndex });
    },

    /** 删除标签 */
    async deleteTag(id) {
        return this.request('/tag/delete/' + id, 'DELETE');
    },

    /* ============ 任务 ============ */

    /** 获取任务列表 */
    async getTaskList(filter = 'all', keyword = '') {
        let url = '/task/list?filter=' + encodeURIComponent(filter);
        if (keyword) url += '&keyword=' + encodeURIComponent(keyword);
        return this.request(url);
    },

    /** 获取任务详情 */
    async getTaskDetail(id) {
        return this.request('/task/detail/' + id);
    },

    /** 新建任务 */
    async addTask(title, priority, folderId, tagIds, dueDate) {
        return this.request('/task/add', 'POST', {
            title, priority, folderId, tagIds, dueDate
        });
    },

    /** 修改任务 */
    async updateTask(task) {
        return this.request('/task/update', 'PUT', task);
    },

    /** 切换任务完成状态 */
    async toggleTask(id) {
        return this.request('/task/toggle/' + id, 'PUT');
    },

    /** 删除任务 */
    async deleteTask(id) {
        return this.request('/task/delete/' + id, 'DELETE');
    },

    /** 清除已完成任务 */
    async clearCompleted() {
        return this.request('/task/clearCompleted', 'DELETE');
    },

    /** 更新任务标签 */
    async updateTaskTags(taskId, tagIds) {
        return this.request('/task/tags', 'PUT', { taskId, tagIds });
    },

    /* ============ 子任务 ============ */

    /** 添加子任务 */
    async addSubtask(taskId, text) {
        return this.request('/subtask/add', 'POST', { taskId, text });
    },

    /** 切换子任务完成状态 */
    async toggleSubtask(id) {
        return this.request('/subtask/toggle/' + id, 'PUT');
    },

    /** 删除子任务 */
    async deleteSubtask(id) {
        return this.request('/subtask/delete/' + id, 'DELETE');
    }
};

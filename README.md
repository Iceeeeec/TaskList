<h1 align="center">✅ TaskList - 任务管理系统</h1>

<p align="center">
  <em>一款功能丰富、界面优雅的全栈任务管理应用</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/前端-HTML%20%2F%20CSS%20%2F%20JS-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/后端-Spring%20Boot-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/数据库-MySQL%208.0-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

---

## 📸 界面预览

> 💡 暗色主题 · 三栏布局 · 现代设计

![界面预览](http://shuwu-java.oss-cn-chengdu.aliyuncs.com/Typroa/TaskList%E9%A1%B9%E7%9B%AE%E6%88%AA%E5%9B%BE.png)

```
┌──────────────┬────────────────────────────┬──────────────────┐
│              │                            │                  │
│   📂 侧栏    │      📋 任务列表            │   📝 任务详情    │
│              │                            │                  │
│  所有任务     │  ☐ 完成季度项目报告   🔴 高  │  标题 / 描述     │
│  今天         │  ☐ 预约牙医检查      🟡 中  │  截止日期       │
│  最近七天     │  ☑ 整理读书笔记      🔵 低  │  优先级         │
│              │                            │  清单 / 标签     │
│  ─────────   │  ─────────────────────     │  子任务         │
│  📁 工作      │  搜索... 🔍                │  备注           │
│  📁 学习      │                            │                  │
│  📁 生活      │  + 添加新任务，按回车保存... │                  │
│              │                            │                  │
│  🏷 #紧急     │  ─────────────────────     │  创建于 03-04   │
│  🏷 #待定     │  3 个待办任务  [清除已完成]  │  [隐藏详情面板]  │
│              │                            │                  │
└──────────────┴────────────────────────────┴──────────────────┘
```

---

## ✨ 功能特性

### 📋 核心功能

| 功能           | 说明                                               |
| -------------- | -------------------------------------------------- |
| **任务管理**   | 创建、编辑、删除、完成任务，支持优先级（高/中/低） |
| **清单文件夹** | 自定义文件夹分类，支持颜色标识，可新建/编辑/删除   |
| **标签系统**   | 多彩标签（8色方案），支持任务多标签关联            |
| **子任务**     | 为主任务添加子任务，独立跟踪完成状态               |
| **截止日期**   | 自定义日历组件选择日期，支持月视图 / 日视图切换    |
| **搜索过滤**   | 关键词搜索 + 多维度筛选（全部/今天/本周/按文件夹） |
| **消息提醒**   | 今日到期 + 已开启提醒的任务自动显示通知角标        |
| **清除已完成** | 一键批量清除所有已完成任务                         |

### 🔐 用户系统

- 用户注册 / 登录（Token 认证）
- 多用户数据隔离
- 退出登录

### 🎨 界面设计

- **暗色主题** — 深色调搭配紫色渐变，护眼舒适
- **三栏布局** — 侧栏导航 + 任务列表 + 详情面板
- **响应式交互** — 优先级旗帜动态切换、标签弹窗、日历组件等
- **现代字体** — 使用 Google Fonts (Manrope) + Material Symbols 图标
- **流畅动画** — 丰富的 hover/transition/checkbox 微动画

---

## 🏗 技术架构

```
                    ┌─────────────────────────────┐
                    │       Nginx (Port 80)       │
                    │   静态文件托管 + 反向代理      │
                    └────────┬──────────┬──────────┘
                             │          │
                    /        │          │  /api/*
                             ▼          ▼
              ┌──────────────────┐  ┌──────────────────┐
              │     Frontend     │  │     Backend       │
              │  HTML/CSS/JS     │  │  Spring Boot      │
              │  (纯静态，无框架) │  │  (Port 8080)      │
              └──────────────────┘  └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │   MySQL 8.0      │
                                    │  (Port 3306)     │
                                    └──────────────────┘
```

### 前端模块

| 文件           | 职责                              |
| -------------- | --------------------------------- |
| `js/api.js`    | API 请求封装，统一 fetch 调用     |
| `js/data.js`   | 数据模型层，任务/标签/文件夹 CRUD |
| `js/render.js` | DOM 渲染模块，列表/详情/侧栏/通知 |
| `js/app.js`    | 主控制器，事件绑定与业务协调      |

### CSS 模块

| 文件                 | 职责                              |
| -------------------- | --------------------------------- |
| `css/variables.css`  | CSS 变量（颜色/间距/字体）        |
| `css/reset.css`      | 全局重置样式                      |
| `css/layout.css`     | 三栏布局框架                      |
| `css/sidebar.css`    | 侧栏样式                          |
| `css/main.css`       | 主内容区样式                      |
| `css/detail.css`     | 详情面板样式                      |
| `css/components.css` | 公共组件（弹窗/日历/标签/按钮等） |
| `css/scrollbar.css`  | 自定义滚动条                      |

### 数据库表

| 表名           | 说明                   |
| -------------- | ---------------------- |
| `sys_user`     | 用户表                 |
| `task_folder`  | 清单文件夹表           |
| `task_tag`     | 标签表                 |
| `task_info`    | 任务主表               |
| `task_subtask` | 子任务表               |
| `task_tag_rel` | 任务-标签关联表（N:M） |

> 📄 完整的数据库设计和 API 文档见 [doc/接口文档.md](doc/接口文档.md)

---

## 🚀 快速开始

### 环境要求

- **Java** 8+
- **MySQL** 8.0+
- **Nginx**（部署时需要）
- **Maven**（后端构建）

### 1. 克隆项目

```bash
git clone https://github.com/your-username/TaskList.git
cd TaskList
```

### 2. 初始化数据库

```bash
# 登录 MySQL，创建数据库并执行建表语句
mysql -u root -p
```

```sql
CREATE DATABASE tasklist DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tasklist;
SOURCE doc/init.sql;  -- 或手动执行 doc/接口文档.md 中的建表 SQL
```

### 3. 启动后端

```bash
cd backend
# 修改 application.yml 中的数据库连接信息
mvn spring-boot:run
```

### 4. 启动前端（开发模式）

直接用浏览器打开 `index.html`，或使用 Live Server：

```bash
# VS Code 安装 Live Server 插件后，右键 index.html → Open with Live Server
```

> ⚠️ 开发时如需直连后端，可临时将 `js/api.js` 中的 `API_BASE` 改为 `http://localhost:8080/api`

---

## 📦 部署指南

### 方式一：Nginx + Java（推荐）

#### 1）上传前端文件

将 `index.html`、`css/`、`js/`、`doc/` 上传到服务器，例如 `/opt/tasklist/frontend/`

#### 2）配置 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /opt/tasklist/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 3）启动后端

```bash
nohup java -jar app.jar --spring.profiles.active=prod > app.log 2>&1 &
```

### 方式二：Docker Compose 一键部署

```yaml
version: "3.8"
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: tasklist
    volumes:
      - mysql_data:/var/lib/mysql
    restart: always

  backend:
    build: ./backend
    depends_on: [mysql]
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/tasklist
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: your_password
    restart: always

  nginx:
    image: nginx:alpine
    volumes:
      - ./frontend:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    ports: ["80:80"]
    depends_on: [backend]
    restart: always

volumes:
  mysql_data:
```

```bash
docker-compose up -d --build
```

---

## 📁 项目结构

```
TaskList/
├── index.html              # 主页面
├── css/                    # 样式模块
│   ├── variables.css       #   CSS 变量定义
│   ├── reset.css           #   全局重置
│   ├── layout.css          #   三栏布局
│   ├── sidebar.css         #   侧栏
│   ├── main.css            #   主内容区
│   ├── detail.css          #   详情面板
│   ├── components.css      #   公共组件
│   └── scrollbar.css       #   滚动条
├── js/                     # 逻辑模块
│   ├── api.js              #   API 请求封装
│   ├── data.js             #   数据模型层
│   ├── render.js           #   DOM 渲染
│   └── app.js              #   主控制器
├── doc/                    # 文档
│   └── 接口文档.md          #   数据库设计 + API 文档
└── README.md               # 项目说明
```

---

## 📄 API 接口概览

| 模块   | 方法 | 路径                    | 说明                  |
| ------ | ---- | ----------------------- | --------------------- |
| 用户   | POST | `/api/user/login`       | 登录                  |
| 用户   | POST | `/api/user/register`    | 注册                  |
| 用户   | GET  | `/api/user/info`        | 用户信息              |
| 文件夹 | GET  | `/api/folder/list`      | 文件夹列表            |
| 文件夹 | POST | `/api/folder/add`       | 新建文件夹            |
| 标签   | GET  | `/api/tag/list`         | 标签列表              |
| 标签   | POST | `/api/tag/add`          | 新建标签              |
| 任务   | GET  | `/api/task/list`        | 任务列表（筛选+搜索） |
| 任务   | POST | `/api/task/add`         | 新建任务              |
| 任务   | PUT  | `/api/task/update`      | 修改任务              |
| 任务   | PUT  | `/api/task/toggle/{id}` | 切换完成状态          |
| 子任务 | POST | `/api/subtask/add`      | 添加子任务            |

> 完整文档请查看 [doc/接口文档.md](doc/接口文档.md)

---

## 🛤 路线图

- [ ] 任务拖拽排序
- [ ] 截止日期倒计时提醒
- [ ] 数据统计仪表盘
- [ ] 移动端适配 (PWA)
- [ ] i18n 多语言支持
- [ ] 暗色/亮色主题切换

---

## 📝 License

[MIT](LICENSE) © zhoujunyu
"# TaskList"

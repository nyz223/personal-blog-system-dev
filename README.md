# 个人博客系统

## 项目简介

个人博客系统是一个基于Node.js和Express框架开发的Web应用，支持用户登录、文章管理、评论等功能。

## 技术栈

- **后端**：Node.js + Express + CORS
- **前端**：HTML5 + CSS3 + JavaScript
- **数据存储**：JSON文件
- **部署**：可部署到任意支持Node.js的云平台

## 功能特性

1. **用户认证**：支持登录功能，区分管理员和普通用户
2. **文章管理**：支持创建、查看、编辑文章
3. **评论系统**：支持对文章发表评论
4. **分类和标签**：文章支持分类和标签管理
5. **响应式设计**：适配不同屏幕尺寸
6. **主分支新增功能**：添加了文章搜索功能
7. **功能分支新增功能**：添加了分类管理功能

## 目录结构

```
personal-blog-system/
├── backend/           # 后端代码
│   ├── server.js      # 服务器主文件
│   └── package.json   # 依赖管理
├── frontend/          # 前端代码
│   └── index.html     # 前端主页面
├── database/          # 数据存储
│   └── data.json      # 数据文件
└── README.md          # 项目说明
```

## 安装和运行

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动服务器

```bash
npm start
```

服务器将运行在 http://localhost:3000

### 3. 访问前端

打开浏览器，访问 http://localhost:8080/frontend/index.html

## 测试账号

- **管理员**：用户名：admin，密码：admin123
- **普通用户**：用户名：user，密码：user123

## 部署指南

### 部署到Heroku

1. 创建Heroku账号并安装Heroku CLI
2. 在项目根目录初始化git仓库
3. 创建Heroku应用
4. 部署代码

```bash
heroku create
git add .
git commit -m "Initial commit"
git push heroku master
```

### 部署到Vercel

1. 创建Vercel账号
2. 连接GitHub仓库
3. 配置部署设置
4. 部署项目

## API文档

### 登录
- **URL**：/api/login
- **方法**：POST
- **参数**：username, password
- **返回**：用户信息

### 文章管理
- **获取文章列表**：GET /api/posts
- **获取单篇文章**：GET /api/posts/:id
- **创建文章**：POST /api/posts
- **更新文章**：PUT /api/posts/:id
- **删除文章**：DELETE /api/posts/:id

### 评论管理
- **获取评论**：GET /api/posts/:id/comments
- **添加评论**：POST /api/posts/:id/comments

## 开发记录

1. **系统设计**：使用UML工具设计了用例图、类图和状态图
2. **后端开发**：实现了基于Express的API接口
3. **前端开发**：实现了响应式的用户界面
4. **数据存储**：使用JSON文件存储数据
5. **测试**：进行了功能测试和兼容性测试

## 未来计划

1. 添加数据库支持（MySQL或MongoDB）
2. 实现文章搜索功能
3. 添加用户注册功能
4. 优化前端界面，使用现代前端框架
5. 添加更多安全特性

## 许可证

MIT License
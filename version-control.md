# 任务二：版本控制 - 管理系统代码

## 准备工作

1. **安装Git**
   - 下载地址：<https://git-scm.com/downloads>
   - 按照默认选项安装
2. **创建远程仓库**
   - **GitHub**：访问 <https://github.com/new>
   - **Gitee**：访问 <https://gitee.com/projects/new>
   - 仓库名称：`personal-blog-system-dev`
   - 勾选「初始化README」

## 执行步骤

### 1. 初始化本地仓库

\# 进入项目目录

cd c:\Trae CN\项目\personal-blog-system

<br />

\# 初始化git

git init

<br />

\# 配置用户信息

git config user.name "Your Name"

git config user.email "your.email\@example.com"

<br />

\# 添加所有文件

git add .

<br />

\# 初始提交

git commit -m "初始化个人博客系统"

### 2. 关联远程仓库

```bash
# 添加远程仓库（GitHub示例）
git remote add origin https://github.com/your-username/personal-blog-system-dev.git

# 推送主分支
git push -u origin master
```

### 3. 创建功能分支

```bash
# 创建并切换到功能分支
git checkout -b feature-comments

# 在该分支上实现评论功能
# 例如：修改 frontend/index.html 完善评论功能

# 提交更改
git add .
git commit -m "实现评论功能"

# 推送到远程
git push origin feature-comments
```

### 4. 合并分支到主分支

```bash
# 切换到主分支
git checkout master

# 合并功能分支
git merge feature-comments

# 推送到远程
git push origin master
```

### 5. 模拟合并冲突

```bash
# 切换到功能分支
git checkout feature-comments

# 修改同一文件的同一位置
# 例如：修改 frontend/index.html 中的导航栏

git add .
git commit -m "修改导航栏（功能分支）"
git push origin feature-comments

# 切换到主分支
git checkout master

# 在主分支修改同一位置
# 例如：修改 frontend/index.html 中的导航栏

git add .
git commit -m "修改导航栏（主分支）"
git push origin master

# 尝试合并（会产生冲突）
git merge feature-comments
```

### 6. 解决合并冲突

打开冲突文件（如 `frontend/index.html`），会看到冲突标记：

```html
<<<<<<< HEAD
<!-- 主分支的代码 -->
=======
<!-- 功能分支的代码 -->
>>>>>>> feature-comments
```

编辑文件，选择保留的内容，删除冲突标记，然后：

```bash
git add .
git commit -m "解决合并冲突"
git push origin master
```

### 7. 查看提交历史

```bash
# 查看详细提交历史
git log --oneline --graph

# 截图保存提交历史
```

## 验证

- [ ] 远程仓库包含完整代码
- [ ] 提交历史显示所有操作
- [ ] 合并冲突已解决
- [ ] 所有功能正常运行

## 常见问题

1. **Git 命令未找到**：确保Git已正确安装并添加到环境变量
2. **推送失败**：检查网络连接和仓库权限
3. **合并冲突**：仔细分析冲突内容，保留正确的代码

## 参考资料

- Git官方文档：<https://git-scm.com/doc>
- GitHub帮助：<https://docs.github.com>
- Gitee帮助：<https://gitee.com/help>


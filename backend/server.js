const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, '../database/data.json');

if (!fs.existsSync(dataPath)) {
  const initialData = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'user', password: 'user123', role: 'user' }
  ],
  categories: [
    { id: 1, name: '个人', description: '个人相关内容' },
    { id: 2, name: '技术', description: '技术相关内容' },
    { id: 3, name: '生活', description: '生活相关内容' }
  ],
  posts: [
    {
      id: 1,
      title: '欢迎来到个人博客',
      content: '这是我的第一篇博客文章，希望大家喜欢！',
      author: 'admin',
      createdAt: new Date().toISOString(),
      status: 'published',
      categoryId: 1,
      tags: ['博客', '欢迎'],
      favorites: 0,
      favoritedBy: []
    }
  ],
  comments: [
    {
      id: 1,
      postId: 1,
      content: '这是一条评论',
      author: 'user',
      createdAt: new Date().toISOString()
    }
  ]
};
  fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
}

function readData() {
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// 登录接口
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const data = readData();
  const user = data.users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.json({ success: false, message: '用户名或密码错误' });
  }
});

// 用户注册
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const data = readData();
  const existingUser = data.users.find(u => u.username === username);
  if (existingUser) {
    return res.json({ success: false, message: '用户名已存在' });
  }
  const newUser = {
    id: data.users.length + 1,
    username,
    password,
    role: 'user'
  };
  data.users.push(newUser);
  writeData(data);
  res.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

// 获取所有用户（管理员）
app.get('/api/users', (req, res) => {
  const { search } = req.query;
  const data = readData();
  let users = data.users;
  if (search) {
    const keyword = search.toLowerCase();
    users = users.filter(u => u.username.toLowerCase().includes(keyword));
  }
  users = users.map(u => ({ id: u.id, username: u.username, role: u.role }));
  res.json(users);
});

// 删除用户（管理员）
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const userIndex = data.users.findIndex(u => u.id === parseInt(id));
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  const user = data.users[userIndex];
  if (user.username === 'admin') {
    return res.status(403).json({ success: false, message: '不能删除管理员账号' });
  }
  // 删除用户的所有文章
  data.posts = data.posts.filter(post => post.author !== user.username);
  data.users.splice(userIndex, 1);
  writeData(data);
  res.json({ success: true });
});

// 更新用户角色（管理员）
app.put('/api/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const data = readData();
  const userIndex = data.users.findIndex(u => u.id === parseInt(id));
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  const user = data.users[userIndex];
  if (user.username === 'admin') {
    return res.status(403).json({ success: false, message: '不能修改管理员角色' });
  }
  data.users[userIndex].role = role;
  writeData(data);
  res.json({ success: true, user: { id: data.users[userIndex].id, username: data.users[userIndex].username, role: data.users[userIndex].role } });
});

// 更新用户账户信息
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  const data = readData();
  const userIndex = data.users.findIndex(u => u.id === parseInt(id));
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  const user = data.users[userIndex];
  if (username) {
    const existingUser = data.users.find(u => u.username === username && u.id !== parseInt(id));
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    data.users[userIndex].username = username;
  }
  if (password) {
    data.users[userIndex].password = password;
  }
  writeData(data);
  res.json({ success: true, user: { id: data.users[userIndex].id, username: data.users[userIndex].username, role: data.users[userIndex].role } });
});

// 获取分类列表
app.get('/api/categories', (req, res) => {
  const data = readData();
  res.json(data.categories);
});

// 创建分类
app.post('/api/categories', (req, res) => {
  const { name, description } = req.body;
  const data = readData();
  const newCategory = {
    id: data.categories.length + 1,
    name,
    description
  };
  data.categories.push(newCategory);
  writeData(data);
  res.json(newCategory);
});

// 更新分类
app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const data = readData();
  const categoryIndex = data.categories.findIndex(c => c.id === parseInt(id));
  if (categoryIndex !== -1) {
    data.categories[categoryIndex] = { ...data.categories[categoryIndex], name, description };
    writeData(data);
    res.json(data.categories[categoryIndex]);
  } else {
    res.status(404).json({ message: '分类不存在' });
  }
});

// 删除分类
app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const categoryIndex = data.categories.findIndex(c => c.id === parseInt(id));
  if (categoryIndex !== -1) {
    data.categories.splice(categoryIndex, 1);
    writeData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: '分类不存在' });
  }
});

// 获取文章列表（支持搜索、分类、状态和作者筛选）
app.get('/api/posts', (req, res) => {
  const { search, categoryId, status, author } = req.query;
  const data = readData();
  let posts = data.posts;

  if (search) {
    const keyword = search.toLowerCase();
    posts = posts.filter(p => p.title.toLowerCase().includes(keyword) || p.content.toLowerCase().includes(keyword));
  }

  if (categoryId) {
    posts = posts.filter(p => p.categoryId === parseInt(categoryId));
  }

  if (status) {
    posts = posts.filter(p => p.status === status);
  }

  if (author) {
    posts = posts.filter(p => p.author === author);
  }

  // 确保所有文章都有收藏相关字段
  posts = posts.map(post => {
    return {
      ...post,
      favorites: post.favorites || 0,
      favoritedBy: post.favoritedBy || []
    };
  });

  res.json(posts);
});

// 获取单篇文章
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const post = data.posts.find(p => p.id === parseInt(id));
  if (post) {
    // 确保文章有收藏相关字段
    const postWithFavorites = {
      ...post,
      favorites: post.favorites || 0,
      favoritedBy: post.favoritedBy || []
    };
    res.json(postWithFavorites);
  } else {
    res.status(404).json({ message: '文章不存在' });
  }
});

// 创建文章
app.post('/api/posts', (req, res) => {
  const { title, content, author, categoryId, tags, status } = req.body;
  const data = readData();
  const newPost = {
    id: data.posts.length + 1,
    title,
    content,
    author,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: status || 'draft',
    categoryId,
    tags: tags || [],
    favorites: 0,
    favoritedBy: []
  };
  data.posts.push(newPost);
  writeData(data);
  res.json(newPost);
});

// 更新文章
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, status, categoryId, tags } = req.body;
  const data = readData();
  const postIndex = data.posts.findIndex(p => p.id === parseInt(id));
  if (postIndex !== -1) {
    data.posts[postIndex] = {
      ...data.posts[postIndex],
      title,
      content,
      status,
      categoryId,
      tags,
      updatedAt: new Date().toISOString()
    };
    writeData(data);
    res.json(data.posts[postIndex]);
  } else {
    res.status(404).json({ message: '文章不存在' });
  }
});

// 删除文章
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const postIndex = data.posts.findIndex(p => p.id === parseInt(id));
  if (postIndex !== -1) {
    data.posts.splice(postIndex, 1);
    data.comments = data.comments.filter(c => c.postId !== parseInt(id));
    writeData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: '文章不存在' });
  }
});

// 更新文章状态
app.patch('/api/posts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const data = readData();
  const postIndex = data.posts.findIndex(p => p.id === parseInt(id));

  if (postIndex === -1) {
    return res.status(404).json({ message: '文章不存在' });
  }

  const currentStatus = data.posts[postIndex].status;
  const validTransitions = {
    'draft': ['pending', 'published'],
    'pending': ['draft', 'published', 'archived'],
    'published': ['archived', 'pending'],
    'archived': ['draft']
  };

  if (!validTransitions[currentStatus].includes(status)) {
    return res.json({ success: false, message: `不能从 ${currentStatus} 转换为 ${status}` });
  }

  data.posts[postIndex].status = status;
  data.posts[postIndex].updatedAt = new Date().toISOString();
  writeData(data);
  res.json({ success: true, post: data.posts[postIndex] });
});

// 获取所有标签
app.get('/api/tags', (req, res) => {
  const data = readData();
  const allTags = new Set();
  data.posts.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => allTags.add(tag));
    }
  });
  res.json(Array.from(allTags));
});

// 添加文章标签
app.post('/api/posts/:id/tags', (req, res) => {
  const { id } = req.params;
  const { tag } = req.body;
  const data = readData();
  const postIndex = data.posts.findIndex(p => p.id === parseInt(id));

  if (postIndex === -1) {
    return res.status(404).json({ message: '文章不存在' });
  }

  if (!data.posts[postIndex].tags.includes(tag)) {
    data.posts[postIndex].tags.push(tag);
    data.posts[postIndex].updatedAt = new Date().toISOString();
    writeData(data);
  }

  res.json({ success: true, tags: data.posts[postIndex].tags });
});

// 删除文章标签
app.delete('/api/posts/:id/tags/:tag', (req, res) => {
  const { id, tag } = req.params;
  const data = readData();
  const postIndex = data.posts.findIndex(p => p.id === parseInt(id));

  if (postIndex === -1) {
    return res.status(404).json({ message: '文章不存在' });
  }

  data.posts[postIndex].tags = data.posts[postIndex].tags.filter(t => t !== tag);
  data.posts[postIndex].updatedAt = new Date().toISOString();
  writeData(data);
  res.json({ success: true, tags: data.posts[postIndex].tags });
});

// 获取评论
app.get('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const comments = data.comments.filter(c => c.postId === parseInt(id));
  res.json(comments);
});

// 添加评论
app.post('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const { content, author } = req.body;
  const data = readData();
  const newComment = {
    id: data.comments.length + 1,
    postId: parseInt(id),
    content,
    author,
    createdAt: new Date().toISOString()
  };
  data.comments.push(newComment);
  writeData(data);
  res.json(newComment);
});

// 删除评论
app.delete('/api/comments/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const commentIndex = data.comments.findIndex(c => c.id === parseInt(id));
  if (commentIndex !== -1) {
    data.comments.splice(commentIndex, 1);
    writeData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: '评论不存在' });
  }
});

// 收藏/取消收藏文章
app.post('/api/posts/:id/favorite', (req, res) => {
  const { id } = req.params;
  const { userId, username } = req.body;
  const data = readData();
  const postIndex = data.posts.findIndex(p => p.id === parseInt(id));
  
  if (postIndex === -1) {
    return res.status(404).json({ success: false, message: '文章不存在' });
  }
  
  const post = data.posts[postIndex];
  
  // 确保文章有收藏相关字段
  if (!post.favorites) post.favorites = 0;
  if (!post.favoritedBy) post.favoritedBy = [];
  
  // 检查用户是否已收藏
  const userIndex = post.favoritedBy.findIndex(user => user.userId === userId);
  let isFavorite;
  
  if (userIndex === -1) {
    // 收藏文章
    post.favoritedBy.push({ userId, username });
    post.favorites++;
    isFavorite = true;
  } else {
    // 取消收藏
    post.favoritedBy.splice(userIndex, 1);
    post.favorites = Math.max(0, post.favorites - 1);
    isFavorite = false;
  }
  
  writeData(data);
  res.json({ success: true, isFavorite, favorites: post.favorites });
});

// 获取用户收藏的文章
app.get('/api/users/:userId/favorites', (req, res) => {
  const { userId } = req.params;
  const data = readData();
  const favoritePosts = data.posts.filter(post => {
    return post.favoritedBy && post.favoritedBy.some(user => user.userId === parseInt(userId));
  });
  res.json(favoritePosts);
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
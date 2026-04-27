let currentUser = null;
let currentPostId = null;
const API_URL = 'https://personal-blog-system-dev-production.up.railway.app/api';

let currentFilterTag = null;
let currentPage = 1;
const postsPerPage = 6;
let totalPosts = 0;
let categoriesData = [];

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('edit-post-modal').style.display = 'none';

  currentUser = null;
  updateNavLinks();
  showPage('login');

  document.getElementById('login-form').addEventListener('submit', function(e) { e.preventDefault(); login(); });
  document.getElementById('register-form').addEventListener('submit', function(e) { e.preventDefault(); register(); });
  document.getElementById('comment-form').addEventListener('submit', function(e) { e.preventDefault(); submitComment(); });
  document.getElementById('create-post-form').addEventListener('submit', function(e) { e.preventDefault(); createPost(); });
  document.getElementById('create-category-form').addEventListener('submit', function(e) { e.preventDefault(); createCategory(); });
  document.getElementById('edit-post-form').addEventListener('submit', function(e) { e.preventDefault(); updatePost(); });

  document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); loadPosts(); }
  });
});

async function showPage(pageId) {
  document.querySelectorAll('[id$="-page"]').forEach(page => page.classList.add('hidden'));
  document.getElementById(pageId + '-page').classList.remove('hidden');
  if (pageId === 'home') {
    currentFilterTag = null;
    currentPage = 1;
    document.getElementById('search-input').value = '';
    document.getElementById('tag-filter-info').classList.add('hidden');
    await loadCategories();
    const filterSelect = document.getElementById('filter-category');
    if (filterSelect) filterSelect.value = '';
    loadPosts(1);
  }
  else if (pageId === 'dashboard') {
      loadMyPosts();
      loadCategories();
      updateDashboardTabs();
      const pendingSection = document.getElementById('admin-pending-section');
      if (currentUser && currentUser.role === 'admin') {
        pendingSection.classList.remove('hidden');
      } else {
        pendingSection.classList.add('hidden');
      }
    }
}

function filterByTag(tag) {
  currentFilterTag = tag;
  currentPage = 1;
  document.getElementById('current-filter-tag').textContent = tag;
  document.getElementById('tag-filter-info').classList.remove('hidden');
  loadPosts(1);
}

function clearTagFilter() {
  currentFilterTag = null;
  document.getElementById('tag-filter-info').classList.add('hidden');
  loadPosts(1);
}

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-nav button').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-content-' + tabName).classList.remove('hidden');
  document.getElementById('tab-' + tabName).classList.add('active');
  if (tabName === 'categories') loadCategories();
  if (tabName === 'users') loadUsers();
}

function updateDashboardTabs() {
  const tabCategories = document.getElementById('tab-categories');
  const tabUsers = document.getElementById('tab-users');
  if (currentUser && currentUser.role === 'admin') {
    tabCategories.classList.remove('hidden');
    tabUsers.classList.remove('hidden');
  } else {
    tabCategories.classList.add('hidden');
    tabUsers.classList.add('hidden');
    showTab('posts');
  }
}

function togglePendingPosts() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('您没有权限查看待审核文章');
    return;
  }

  const container = document.getElementById('pending-posts-container');
  const btn = document.getElementById('pending-toggle-btn');
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    btn.textContent = '📋 待审核文章 (收起)';
    loadPendingPosts();
  } else {
    container.classList.add('hidden');
    btn.textContent = '📋 待审核文章';
  }
}

function updateNavLinks() {
  if (currentUser) {
    document.getElementById('login-link').classList.add('hidden');
    document.getElementById('register-link').classList.add('hidden');
    document.getElementById('dashboard-link').classList.remove('hidden');
    document.getElementById('favorites-link').classList.remove('hidden');
    document.getElementById('logout-link').classList.add('hidden');
    document.getElementById('user-profile').classList.remove('hidden');
    const roleText = currentUser.role === 'admin' ? '管理员' : '普通用户';
    document.getElementById('user-role-text').textContent = `${currentUser.username} (${roleText})`;
  } else {
    document.getElementById('login-link').classList.remove('hidden');
    document.getElementById('register-link').classList.remove('hidden');
    document.getElementById('dashboard-link').classList.add('hidden');
    document.getElementById('favorites-link').classList.add('hidden');
    document.getElementById('logout-link').classList.add('hidden');
    document.getElementById('user-profile').classList.add('hidden');
  }
}

async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      currentUser = data.user;
      updateNavLinks();
      showPage('home');
    } else {
      alert('登录失败：' + data.message);
    }
  } catch (error) {
    alert('登录失败，请检查服务器是否运行');
  }
}

async function register() {
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  if (password !== confirmPassword) { alert('两次密码输入不一致'); return; }
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      alert('注册成功，请登录');
      showPage('login');
    } else {
      alert('注册失败：' + data.message);
    }
  } catch (error) {
    alert('注册失败，请检查服务器是否运行');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('user');
  updateNavLinks();
  showPage('login');
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`);
    categoriesData = await response.json();

    const filterSelect = document.getElementById('filter-category');
    if (filterSelect) {
      const currentValue = filterSelect.value;
      filterSelect.innerHTML = '<option value="">全部</option>';
      categoriesData.forEach(c => { filterSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`; });
      filterSelect.value = currentValue;
    }

    const postSelects = ['new-post-categoryId', 'edit-post-categoryId'];
    postSelects.forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        select.innerHTML = '<option value="">请选择</option>';
        categoriesData.forEach(c => { select.innerHTML += `<option value="${c.id}">${c.name}</option>`; });
      }
    });
    const container = document.getElementById('categories-container');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
      container.style.gap = '15px';
      container.style.gridAutoRows = 'minmax(150px, auto)';

      categoriesData.forEach(c => {
        container.innerHTML += `
          <div class="post-item">
            <h4>${c.name}</h4>
            <p>${c.description || ''}</p>
            <div class="post-actions">
              <button class="btn btn-danger" onclick="deleteCategory(${c.id})"><i class="fas fa-trash"></i> 删除</button>
            </div>
          </div>
        `;
      });
    }
  } catch (error) { console.error('加载分类失败:', error); }
}

async function createCategory() {
  if (!currentUser || currentUser.role !== 'admin') { alert('只有管理员可以创建分类'); return; }
  const name = document.getElementById('new-category-name').value;
  const description = document.getElementById('new-category-description').value;
  try {
    await fetch(`${API_URL}/categories`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    alert('分类创建成功');
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-category-description').value = '';
    loadCategories();
  } catch (error) { alert('创建分类失败'); }
}

async function deleteCategory(id) {
  if (!confirm('确定要删除该分类吗？')) return;
  try {
    await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
    alert('删除成功');
    loadCategories();
  } catch (error) { alert('删除失败'); }
}

function getCategoryName(categoryId) {
  const category = categoriesData.find(c => c.id === categoryId);
  return category ? category.name : '未分类';
}

async function loadPosts(page = 1) {
  if (categoriesData.length === 0) {
    await loadCategories();
  }

  const search = document.getElementById('search-input').value;
  const categoryId = document.getElementById('filter-category').value;
  const tagFilter = currentFilterTag;

  let url = `${API_URL}/posts?status=published`;

  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (categoryId) {
    url += `&categoryId=${parseInt(categoryId)}`;
  }

  const container = document.getElementById('posts-container');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p>加载中...</p></div>';

  const existingPagination = document.querySelector('.pagination');
  if (existingPagination) existingPagination.remove();

  try {
    const response = await fetch(url);
    let allPosts = await response.json();

    if (categoryId) {
      const catId = parseInt(categoryId);
      allPosts = allPosts.filter(p => p.categoryId === catId);
    }

    let filteredPosts = allPosts;
    if (tagFilter) {
      filteredPosts = allPosts.filter(post => post.tags && post.tags.includes(tagFilter));
    }

    totalPosts = filteredPosts.length;

    currentPage = page;
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const posts = filteredPosts.slice(startIndex, endIndex);

    container.innerHTML = '';

    if (posts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--gray-color);">
          <h3>暂无文章</h3>
          <p>没有找到符合条件的文章</p>
        </div>`;
      renderPagination();
      return;
    }

    posts.forEach(post => {
      const statusClass = 'status-' + post.status;
      const statusText = { draft: '草稿', pending: '待审核', published: '已发布', archived: '已归档' };
      const categoryName = getCategoryName(post.categoryId);

      const isFavorite = currentUser && post.favoritedBy && post.favoritedBy.some(user => user.userId === currentUser.id);

      container.innerHTML += `
        <div class="post-item">
          <div class="post-header">
            <h3><a href="#" onclick="showPostDetail(${post.id})" class="post-title">${post.title}</a></h3>
            <span class="status-badge ${statusClass}">${statusText[post.status]}</span>
          </div>
          <div class="post-excerpt">
            ${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}
          </div>
          <div class="post-meta">
            <span class="author">作者: ${post.author}</span>
            <span class="category">分类: ${categoryName}</span>
            <span class="date">${new Date(post.createdAt).toLocaleString()}</span>
            ${post.favorites ? `<span class="favorites">收藏: ${post.favorites}</span>` : ''}
          </div>
          <div class="tag-list">
            ${(post.tags || []).map(t => `<span class="tag-item" onclick="filterByTag('${t}')" style="cursor:pointer;">${t}</span>`).join('')}
          </div>
          <div class="post-footer">
            <a href="#" onclick="showPostDetail(${post.id})" class="read-more">阅读更多 →</a>
            <button class="btn btn-warning" onclick="toggleFavorite(${post.id})" id="favorite-btn-${post.id}">
              ${isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
            </button>
          </div>
        </div>`;
    });

    renderPagination();
  } catch (error) {
    console.error('加载文章失败:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--accent-color);">
        <h3>加载失败</h3>
        <p>无法加载文章，请稍后重试</p>
        <button class="btn" onclick="loadPosts(1)">重新加载</button>
      </div>`;
  }
}

function renderPagination() {
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  if (totalPages <= 1) {
    return;
  }

  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';
  paginationContainer.innerHTML = `
    <div class="pagination-info">
      共 ${totalPosts} 篇文章，第 ${currentPage} / ${totalPages} 页
    </div>
    <div class="pagination-buttons">
      <button class="btn ${currentPage === 1 ? 'btn-disabled' : ''}" onclick="${currentPage === 1 ? '' : 'loadPosts(1)'}">首页</button>
      <button class="btn ${currentPage === 1 ? 'btn-disabled' : ''}" onclick="${currentPage === 1 ? '' : 'loadPosts(' + (currentPage - 1) + ')'}">上一页</button>
      <button class="btn ${currentPage === totalPages ? 'btn-disabled' : ''}" onclick="${currentPage === totalPages ? '' : 'loadPosts(' + (currentPage + 1) + ')'}">下一页</button>
      <button class="btn ${currentPage === totalPages ? 'btn-disabled' : ''}" onclick="${currentPage === totalPages ? '' : 'loadPosts(' + totalPages + ')'}">末页</button>
    </div>
  `;

  const container = document.getElementById('posts-container');
  const existingPagination = document.querySelector('.pagination');
  if (existingPagination) {
    existingPagination.remove();
  }
  container.parentNode.insertBefore(paginationContainer, container.nextSibling);
}

async function showPostDetail(postId) {
  currentPostId = postId;
  try {
    const response = await fetch(`${API_URL}/posts/${postId}`);
    const post = await response.json();
    const statusText = { draft: '草稿', pending: '待审核', published: '已发布', archived: '已归档' };
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-meta').textContent = `作者: ${post.author} | 发布时间: ${new Date(post.createdAt).toLocaleString()}`;
    document.getElementById('post-tags').innerHTML = (post.tags || []).map(t => `<span class="tag-item">${t}</span>`).join('');
    document.getElementById('post-content').textContent = post.content;
    const actionsDiv = document.getElementById('post-actions');
    if (currentUser && (currentUser.role === 'admin' || currentUser.username === post.author)) {
      actionsDiv.classList.remove('hidden');
      actionsDiv.innerHTML = `
        <button class="btn btn-warning" onclick="openEditModal(${post.id})">编辑</button>
        <button class="btn btn-danger" onclick="deletePost(${post.id})">删除</button>`;
    } else {
      actionsDiv.classList.add('hidden');
    }

    const favoriteSection = document.getElementById('favorite-section');
    const isFavorite = currentUser && post.favoritedBy && post.favoritedBy.some(user => user.userId === currentUser.id);
    favoriteSection.innerHTML = `
      <button class="btn btn-warning" onclick="toggleFavorite(${post.id})" id="favorite-btn-detail-${post.id}">
        ${isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
      </button>
      ${post.favorites ? `<span style="margin-left: 10px; font-size: 14px; color: var(--gray-color);">收藏: ${post.favorites}</span>` : ''}
    `;

    loadComments(postId);
    showPage('post-detail');
  } catch (error) { alert('加载文章详情失败'); }
}

async function loadComments(postId) {
  try {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`);
    const comments = await response.json();
    const container = document.getElementById('comments-container');
    container.innerHTML = '';
    comments.forEach(comment => {
      const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.username === comment.author);
      container.innerHTML += `
        <div class="comment-item">
          <div><p>${comment.content}</p><div class="post-meta">作者: ${comment.author} | 评论时间: ${new Date(comment.createdAt).toLocaleString()}</div></div>
          ${canDelete ? `<button class="btn btn-danger" onclick="deleteComment(${comment.id})">删除</button>` : ''}
        </div>`;
    });
  } catch (error) { console.error('加载评论失败'); }
}

async function submitComment() {
  if (!currentUser) { alert('请先登录'); return; }
  const content = document.getElementById('comment-content').value;
  try {
    await fetch(`${API_URL}/posts/${currentPostId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author: currentUser.username })
    });
    document.getElementById('comment-content').value = '';
    loadComments(currentPostId);
  } catch (error) { alert('提交评论失败'); }
}

async function deleteComment(id) {
  if (!confirm('确定要删除该评论吗？')) return;
  try {
    await fetch(`${API_URL}/comments/${id}`, { method: 'DELETE' });
    loadComments(currentPostId);
  } catch (error) { alert('删除评论失败'); }
}

let myPostsPage = 1;
const myPostsPerPage = 6;
let totalMyPosts = 0;

async function loadMyPosts(page = 1) {
  if (!currentUser) return;

  const myPostsTitle = document.getElementById('my-posts-title');
  if (myPostsTitle) {
    myPostsTitle.textContent = currentUser.username + '的文章';
  }

  const container = document.getElementById('my-posts-container');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p>加载中...</p></div>';

  try {
    const response = await fetch(`${API_URL}/posts?author=${currentUser.username}`);
    const allPosts = await response.json();
    totalMyPosts = allPosts.length;

    myPostsPage = page;
    const startIndex = (page - 1) * myPostsPerPage;
    const endIndex = startIndex + myPostsPerPage;
    const posts = allPosts.slice(startIndex, endIndex);

    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
    container.style.gap = '15px';
    container.style.gridAutoRows = 'minmax(200px, auto)';

    if (posts.length === 0) {
      container.innerHTML = '<div style="grid-column: 1 / -1; text-align:center;padding:40px;"><p style="font-size:16px;color:var(--gray-color);">暂无文章</p></div>';
      return;
    }

    posts.forEach(post => {
      const statusText = { draft: '草稿', pending: '待审核', published: '已发布', archived: '已归档' };
      const statusClass = 'status-' + post.status;
      const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.username === post.author);
      container.innerHTML += `
        <div class="post-item">
          <h3>${post.title}<span class="status-badge ${statusClass}">${statusText[post.status]}</span></h3>
          <p>${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
          <div class="post-meta">创建时间: ${new Date(post.createdAt).toLocaleString()}</div>
          <div class="post-actions">
            ${canEdit ? `<button class="btn btn-warning" onclick="openEditModal(${post.id})">编辑</button>
            <button class="btn btn-danger" onclick="deletePost(${post.id})">删除</button>` : ''}
            ${post.status === 'draft' && canEdit ? `<button class="btn btn-success" onclick="updatePostStatus(${post.id}, 'pending')">提交审核</button>` : ''}
            ${post.status === 'pending' && currentUser.role === 'admin' ? `<button class="btn btn-success" onclick="updatePostStatus(${post.id}, 'published')">通过审核</button>
            <button class="btn btn-danger" onclick="updatePostStatus(${post.id}, 'draft')">拒绝</button>` : ''}
            ${post.status === 'published' && canEdit ? `<button class="btn" onclick="updatePostStatus(${post.id}, 'archived')">归档</button>` : ''}
            ${post.status === 'archived' && canEdit ? `<button class="btn btn-success" onclick="updatePostStatus(${post.id}, 'draft')">重新发布</button>` : ''}
          </div>
          <div class="tag-list" id="tags-${post.id}">
            ${(post.tags || []).map(t => `<span class="tag-item">${t}${canEdit ? `<span class="remove-tag" onclick="removeTag(${post.id}, '${t}')">×</span>` : ''}</span>`).join('')}
          </div>
        </div>`;
    });

    renderMyPostsPagination();
  } catch (error) {
    console.error('加载我的文章失败:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--accent-color);">
        <h3>加载失败</h3>
        <p>无法加载文章，请稍后重试</p>
        <button class="btn" onclick="loadMyPosts(1)">重新加载</button>
      </div>`;
  }
}

function renderMyPostsPagination() {
  const totalPages = Math.ceil(totalMyPosts / myPostsPerPage);
  if (totalPages <= 1) return;

  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';
  paginationContainer.innerHTML = `
    <div class="pagination-info">
      共 ${totalMyPosts} 篇文章，第 ${myPostsPage} / ${totalPages} 页
    </div>
    <div class="pagination-buttons">
      <button class="btn ${myPostsPage === 1 ? 'btn-disabled' : ''}" onclick="${myPostsPage === 1 ? '' : 'loadMyPosts(1)'}">首页</button>
      <button class="btn ${myPostsPage === 1 ? 'btn-disabled' : ''}" onclick="${myPostsPage === 1 ? '' : 'loadMyPosts(' + (myPostsPage - 1) + ')'}">上一页</button>
      <button class="btn ${myPostsPage === totalPages ? 'btn-disabled' : ''}" onclick="${myPostsPage === totalPages ? '' : 'loadMyPosts(' + (myPostsPage + 1) + ')'}">下一页</button>
      <button class="btn ${myPostsPage === totalPages ? 'btn-disabled' : ''}" onclick="${myPostsPage === totalPages ? '' : 'loadMyPosts(' + totalPages + ')'}">末页</button>
    </div>
  `;

  const container = document.getElementById('my-posts-container');
  const existingPagination = container.nextElementSibling;
  if (existingPagination && existingPagination.className === 'pagination') {
    existingPagination.remove();
  }
  container.parentNode.insertBefore(paginationContainer, container.nextSibling);
}

async function loadPendingPosts() {
  if (!currentUser || currentUser.role !== 'admin') return;
  try {
    const response = await fetch(`${API_URL}/posts?status=pending`);
    const posts = await response.json();
    const container = document.getElementById('pending-posts-container');
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
    container.style.gap = '15px';
    container.style.gridAutoRows = 'minmax(200px, auto)';

    if (posts.length === 0) {
      container.innerHTML = '<div style="grid-column: 1 / -1; text-align:center;padding:40px;"><p style="font-size:16px;color:var(--gray-color);">暂无待审核文章</p></div>';
      return;
    }
    posts.forEach(post => {
      const statusClass = 'status-pending';
      container.innerHTML += `
        <div class="post-item">
          <h3>${post.title}<span class="status-badge ${statusClass}">待审核</span></h3>
          <p>${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
          <div class="post-meta">作者: ${post.author} | 创建时间: ${new Date(post.createdAt).toLocaleString()}</div>
          <div class="post-actions">
            <button class="btn btn-success" onclick="updatePostStatus(${post.id}, 'published')">通过审核</button>
            <button class="btn btn-danger" onclick="updatePostStatus(${post.id}, 'draft')">拒绝</button>
          </div>
        </div>`;
    });
  } catch (error) { alert('加载待审核文章失败'); }
}

async function loadUsers() {
  if (!currentUser || currentUser.role !== 'admin') return;
  try {
    const search = document.getElementById('users-search').value;
    let url = `${API_URL}/users?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    const response = await fetch(url);
    const users = await response.json();
    const container = document.getElementById('users-container');
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    container.style.gap = '15px';
    container.style.gridAutoRows = 'minmax(150px, auto)';

    if (users.length === 0) {
      container.innerHTML = '<p style="text-align:center;padding:20px;">暂无用户</p>';
      return;
    }
    users.forEach(user => {
      const roleText = user.role === 'admin' ? '管理员' : '普通用户';
      const roleClass = user.role === 'admin' ? 'status-published' : 'status-draft';
      const isCurrentUser = user.username === currentUser.username;
      container.innerHTML += `
        <div class="post-item">
          <h3>${user.username}${isCurrentUser ? ' (当前账号)' : ''}</h3>
          <div class="post-meta">
            <span class="status-badge ${roleClass}">${roleText}</span>
            ${isCurrentUser ? '<span class="status-badge status-pending">当前账号</span>' : ''}
          </div>
          <div class="post-actions">
            ${!isCurrentUser && user.username !== 'admin' ? `
              <button class="btn btn-warning" onclick="showRoleModal(${user.id}, '${user.username}', '${user.role}')"><i class="fas fa-edit"></i> 修改角色</button>
              <button class="btn btn-danger" onclick="deleteUser(${user.id}, '${user.username}')"><i class="fas fa-trash"></i> 删除</button>
            ` : ''}
          </div>
        </div>`;
    });
  } catch (error) { alert('加载用户列表失败'); }
}

function showRoleModal(userId, username, currentRole) {
  const newRole = prompt(`请输入 ${username} 的新角色 (admin/user):`, currentRole === 'admin' ? 'user' : 'admin');
  if (newRole && (newRole === 'admin' || newRole === 'user')) {
    updateUserRole(userId, newRole);
  }
}

async function updateUserRole(userId, role) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await response.json();
    if (data.success) {
      alert('角色更新成功');
      loadUsers();
    } else {
      alert('角色更新失败：' + data.message);
    }
  } catch (error) { alert('角色更新失败'); }
}

async function deleteUser(userId, username) {
  if (!confirm(`确定要删除用户 "${username}" 吗？`)) return;
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
    const data = await response.json();
    if (data.success) {
      alert('用户删除成功');
      loadUsers();
    } else {
      alert('用户删除失败：' + data.message);
    }
  } catch (error) { alert('用户删除失败'); }
}

function loadAccountInfo() {
  if (!currentUser) return;
  document.getElementById('current-username').textContent = currentUser.username;
}

function showAccountModal() {
  if (!currentUser) return;
  loadAccountInfo();
  document.getElementById('account-modal').style.display = 'flex';
}

function closeAccountModal() {
  document.getElementById('account-modal').style.display = 'none';
  document.getElementById('new-username').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
}

document.getElementById('update-account-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!currentUser) { alert('请先登录'); return; }

  const newUsername = document.getElementById('new-username').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword && newPassword !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }

  try {
    const updateData = {};
    if (newUsername) updateData.username = newUsername;
    if (newPassword) updateData.password = newPassword;

    const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const data = await response.json();
    if (data.success) {
      alert('账户更新成功');
      currentUser = data.user;
      updateNavLinks();
      closeAccountModal();
    } else {
      alert('账户更新失败：' + data.message);
    }
  } catch (error) { alert('账户更新失败：' + error.message); }
});

document.getElementById('user-menu-toggle').addEventListener('click', function(e) {
  e.preventDefault();
  const dropdownMenu = document.getElementById('user-dropdown-menu');
  const toggle = e.currentTarget;

  dropdownMenu.classList.toggle('hidden');
  toggle.classList.toggle('open');
});

document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('user-dropdown-menu');
  const toggle = document.getElementById('user-menu-toggle');
  if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add('hidden');
    toggle.classList.remove('open');
  }
});

function toggleCreateForm() {
  const formContainer = document.getElementById('create-post-form-container');
  formContainer.classList.toggle('hidden');

  if (!formContainer.classList.contains('hidden')) {
    const publishedOption = document.getElementById('new-post-status-published');
    if (currentUser && currentUser.role === 'admin') {
      publishedOption.style.display = 'block';
    } else {
      publishedOption.style.display = 'none';
      document.getElementById('new-post-status').value = 'pending';
    }
  }
}

async function createPost() {
  if (!currentUser) { alert('请先登录'); return; }
  const title = document.getElementById('new-post-title').value;
  const content = document.getElementById('new-post-content').value;
  const categoryId = document.getElementById('new-post-categoryId').value;
  const tags = document.getElementById('new-post-tags').value.split(',').map(t => t.trim()).filter(t => t);
  let status = document.getElementById('new-post-status').value;

  if (currentUser.role !== 'admin' && status === 'published') {
    status = 'pending';
  }

  try {
    await fetch(`${API_URL}/posts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, author: currentUser.username, categoryId: parseInt(categoryId), tags, status })
    });
    alert('文章创建成功');
    document.getElementById('new-post-title').value = '';
    document.getElementById('new-post-content').value = '';
    document.getElementById('new-post-tags').value = '';
    loadMyPosts();
    if (document.getElementById('home-page').classList.contains('hidden') === false) {
      loadPosts();
    }
  } catch (error) { alert('创建文章失败'); }
}

async function updatePost() {
  const id = document.getElementById('edit-post-id').value;
  try {
    const postResponse = await fetch(`${API_URL}/posts/${id}`);
    const post = await postResponse.json();

    const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.username === post.author);
    if (!canEdit) {
      alert('您没有权限编辑这篇文章');
      return;
    }

    const title = document.getElementById('edit-post-title').value;
    const content = document.getElementById('edit-post-content').value;
    const categoryId = document.getElementById('edit-post-categoryId').value;
    const tags = document.getElementById('edit-post-tags').value.split(',').map(t => t.trim()).filter(t => t);
    const status = document.getElementById('edit-post-status').value;

    await fetch(`${API_URL}/posts/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, categoryId: parseInt(categoryId), tags, status })
    });
    alert('文章更新成功');
    closeEditModal();
    loadMyPosts();
    if (document.getElementById('home-page').classList.contains('hidden') === false) {
      loadPosts();
    }
  } catch (error) { alert('更新文章失败'); }
}

async function deletePost(id) {
  if (!confirm('确定要删除该文章吗？')) return;
  try {
    const postResponse = await fetch(`${API_URL}/posts/${id}`);
    const post = await postResponse.json();

    const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.username === post.author);
    if (!canDelete) {
      alert('您没有权限删除这篇文章');
      return;
    }

    await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE' });
    alert('删除成功');
    loadMyPosts();
    if (currentPostId === id) showPage('home');
    if (document.getElementById('home-page').classList.contains('hidden') === false) {
      loadPosts();
    }
  } catch (error) { alert('删除文章失败'); }
}

async function updatePostStatus(id, status) {
  try {
    const postResponse = await fetch(`${API_URL}/posts/${id}`);
    const post = await postResponse.json();

    const canUpdateStatus = currentUser && (currentUser.role === 'admin' || currentUser.username === post.author);
    if (!canUpdateStatus) {
      alert('您没有权限更新这篇文章的状态');
      return;
    }

    const response = await fetch(`${API_URL}/posts/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (data.success) {
      alert('状态更新成功');
      loadMyPosts();
      if (document.getElementById('home-page').classList.contains('hidden') === false) {
        loadPosts();
      }
      const pendingSection = document.getElementById('admin-pending-section');
      if (pendingSection && !pendingSection.classList.contains('hidden')) {
        loadPendingPosts();
      }
    } else {
      alert(data.message);
    }
  } catch (error) { alert('更新状态失败'); }
}

async function removeTag(postId, tag) {
  try {
    const postResponse = await fetch(`${API_URL}/posts/${postId}`);
    const post = await postResponse.json();

    const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.username === post.author);
    if (!canEdit) {
      alert('您没有权限修改这篇文章');
      return;
    }

    await fetch(`${API_URL}/posts/${postId}/tags/${encodeURIComponent(tag)}`, { method: 'DELETE' });
    loadMyPosts();
    if (document.getElementById('home-page').classList.contains('hidden') === false) {
      loadPosts();
    }
  } catch (error) { alert('删除标签失败'); }
}

async function toggleFavorite(postId) {
  if (!currentUser) {
    alert('请先登录');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/posts/${postId}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, username: currentUser.username })
    });
    const data = await response.json();
    if (data.success) {
      const btn = document.getElementById(`favorite-btn-${postId}`);
      if (btn) {
        btn.innerHTML = data.isFavorite ? '❤️ 已收藏' : '🤍 收藏';
      }

      const detailBtn = document.getElementById(`favorite-btn-detail-${postId}`);
      if (detailBtn) {
        const favoriteSection = document.getElementById('favorite-section');
        favoriteSection.innerHTML = `
          <button class="btn btn-warning" onclick="toggleFavorite(${postId})" id="favorite-btn-detail-${postId}">
            ${data.isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
          </button>
          <span style="margin-left: 10px; font-size: 14px; color: var(--gray-color);">收藏: ${data.favorites}</span>
        `;
      }

      if (!document.getElementById('favorites-page').classList.contains('hidden')) {
        showFavorites(favoritesPage);
      }
    }
  } catch (error) {
    alert('收藏操作失败');
  }
}

let favoritesPage = 1;
const favoritesPerPage = 6;
let totalFavorites = 0;

async function showFavorites(page = 1) {
  if (!currentUser) {
    alert('请先登录');
    showPage('login');
    return;
  }

  document.querySelectorAll('[id$="-page"]').forEach(page => page.classList.add('hidden'));
  document.getElementById('favorites-page').classList.remove('hidden');

  const container = document.getElementById('favorites-container');
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p>加载中...</p></div>';

  const existingPagination = document.querySelector('#favorites-page .pagination');
  if (existingPagination) existingPagination.remove();

  try {
    const response = await fetch(`${API_URL}/users/${currentUser.id}/favorites`);
    const allFavoritePosts = await response.json();
    totalFavorites = allFavoritePosts.length;

    favoritesPage = page;
    const startIndex = (page - 1) * favoritesPerPage;
    const endIndex = startIndex + favoritesPerPage;
    const favoritePosts = allFavoritePosts.slice(startIndex, endIndex);

    container.innerHTML = '';

    if (favoritePosts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--gray-color);">
          <h3>暂无收藏</h3>
          <p>您还没有收藏任何文章</p>
          <a href="#" onclick="showPage('home')" class="btn">去浏览文章</a>
        </div>`;
      return;
    }

    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    container.style.gap = '15px';
    container.style.gridAutoRows = 'minmax(200px, auto)';

    favoritePosts.forEach(post => {
      const statusClass = 'status-' + post.status;
      const statusText = { draft: '草稿', pending: '待审核', published: '已发布', archived: '已归档' };
      const categoryName = getCategoryName(post.categoryId);
      const isFavorite = true;

      container.innerHTML += `
        <div class="post-item">
          <div class="post-header">
            <h3><a href="#" onclick="showPostDetail(${post.id})" class="post-title">${post.title}</a></h3>
            <span class="status-badge ${statusClass}">${statusText[post.status]}</span>
          </div>
          <div class="post-excerpt">
            ${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}
          </div>
          <div class="post-meta">
            <span class="author">作者: ${post.author}</span>
            <span class="category">分类: ${categoryName}</span>
            <span class="date">${new Date(post.createdAt).toLocaleString()}</span>
            ${post.favorites ? `<span class="favorites">收藏: ${post.favorites}</span>` : ''}
          </div>
          <div class="tag-list">
            ${(post.tags || []).map(t => `<span class="tag-item" onclick="filterByTag('${t}')" style="cursor:pointer;">${t}</span>`).join('')}
          </div>
          <div class="post-footer">
            <a href="#" onclick="showPostDetail(${post.id})" class="read-more">阅读更多 →</a>
            <button class="btn btn-warning" onclick="toggleFavorite(${post.id})" id="favorite-btn-${post.id}">
              ❤️ 已收藏
            </button>
          </div>
        </div>`;
    });

    renderFavoritesPagination();
  } catch (error) {
    console.error('加载收藏失败:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--accent-color);">
        <h3>加载失败</h3>
        <p>无法加载收藏，请稍后重试</p>
        <button class="btn" onclick="showFavorites()">重新加载</button>
      </div>`;
  }
}

function renderFavoritesPagination() {
  const totalPages = Math.ceil(totalFavorites / favoritesPerPage);
  if (totalPages <= 1) return;

  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';
  paginationContainer.innerHTML = `
    <div class="pagination-info">
      共 ${totalFavorites} 篇收藏，第 ${favoritesPage} / ${totalPages} 页
    </div>
    <div class="pagination-buttons">
      <button class="btn ${favoritesPage === 1 ? 'btn-disabled' : ''}" onclick="${favoritesPage === 1 ? '' : 'showFavorites(1)'} ">首页</button>
      <button class="btn ${favoritesPage === 1 ? 'btn-disabled' : ''}" onclick="${favoritesPage === 1 ? '' : 'showFavorites(' + (favoritesPage - 1) + ')'} ">上一页</button>
      <button class="btn ${favoritesPage === totalPages ? 'btn-disabled' : ''}" onclick="${favoritesPage === totalPages ? '' : 'showFavorites(' + (favoritesPage + 1) + ')'} ">下一页</button>
      <button class="btn ${favoritesPage === totalPages ? 'btn-disabled' : ''}" onclick="${favoritesPage === totalPages ? '' : 'showFavorites(' + totalPages + ')'} ">末页</button>
    </div>
  `;

  const container = document.getElementById('favorites-container');
  const existingPagination = container.nextElementSibling;
  if (existingPagination && existingPagination.className === 'pagination') {
    existingPagination.remove();
  }
  container.parentNode.insertBefore(paginationContainer, container.nextSibling);
}

async function openEditModal(id) {
  try {
    const response = await fetch(`${API_URL}/posts/${id}`);
    const post = await response.json();

    const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.username === post.author);
    if (!canEdit) {
      alert('您没有权限编辑这篇文章');
      return;
    }

    document.getElementById('edit-post-id').value = post.id;
    document.getElementById('edit-post-title').value = post.title;
    document.getElementById('edit-post-content').value = post.content;
    document.getElementById('edit-post-categoryId').value = post.categoryId;
    document.getElementById('edit-post-tags').value = (post.tags || []).join(', ');
    document.getElementById('edit-post-status').value = post.status;
    document.getElementById('edit-post-modal').style.display = 'flex';
  } catch (error) {
    alert('加载文章失败');
  }
}

function closeEditModal() {
  document.getElementById('edit-post-modal').style.display = 'none';
}
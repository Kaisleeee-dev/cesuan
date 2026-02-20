const ui = {
  adminKey: document.getElementById('adminKey'),
  loadBtn: document.getElementById('loadBtn'),
  adminMsg: document.getElementById('adminMsg'),
  statsGrid: document.getElementById('statsGrid'),
  usersBox: document.getElementById('usersBox'),
  subsBox: document.getElementById('subsBox')
};

function renderStats(stats) {
  const cards = [
    ['总用户数', stats.totalUsers],
    ['活跃会话', stats.activeSessions],
    ['总订阅数', stats.totalSubscriptions],
    ['活跃订阅', stats.activeSubscriptions]
  ];

  ui.statsGrid.innerHTML = cards
    .map(
      ([k, v]) => `<article class="book-card"><h3>${k}</h3><p style="font-size:1.2rem;color:#67e8f9">${v}</p></article>`
    )
    .join('');
}

async function loadAdminData() {
  const key = ui.adminKey.value.trim();
  if (!key) {
    ui.adminMsg.textContent = '请先输入 Admin Key';
    return;
  }

  try {
    ui.adminMsg.textContent = '加载中...';
    const headers = { 'x-admin-key': key };

    const [statsResp, usersResp, subsResp] = await Promise.all([
      fetch('/api/admin/stats', { headers }),
      fetch('/api/admin/users?limit=20', { headers }),
      fetch('/api/admin/subscriptions?limit=20', { headers })
    ]);

    const stats = await statsResp.json();
    const users = await usersResp.json();
    const subs = await subsResp.json();

    if (!statsResp.ok) throw new Error(stats.error || 'stats 获取失败');
    if (!usersResp.ok) throw new Error(users.error || 'users 获取失败');
    if (!subsResp.ok) throw new Error(subs.error || 'subscriptions 获取失败');

    renderStats(stats.stats);
    ui.usersBox.textContent = JSON.stringify(users.users, null, 2);
    ui.subsBox.textContent = JSON.stringify(subs.subscriptions, null, 2);
    ui.adminMsg.textContent = '加载成功';
    localStorage.setItem('velioraAdminKey', key);
  } catch (error) {
    ui.adminMsg.textContent = `加载失败: ${error.message}`;
  }
}

function init() {
  const saved = localStorage.getItem('velioraAdminKey');
  if (saved) ui.adminKey.value = saved;
  ui.loadBtn.addEventListener('click', loadAdminData);
}

init();

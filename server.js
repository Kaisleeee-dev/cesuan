import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 4173);

const ADMIN_KEY = process.env.ADMIN_KEY || 'veliora-dev-admin';

const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(
    dbFile,
    JSON.stringify({ users: [], sessions: [], subscriptions: [], nextUserId: 1, nextSubId: 1 }, null, 2)
  );
}

const plans = [
  { id: 'basic', name: '基础版', priceCny: 29, features: ['每日3次AI测算', '基础书籍库', '多语言输出'] },
  { id: 'pro', name: '专业版', priceCny: 99, features: ['无限次AI测算', '高级体系联动', '优先响应'] },
  { id: 'global-plus', name: '全球企业版', priceCny: 299, features: ['多地区策略模板', '团队账号', 'API扩展支持'] }
];

function readDb() {
  return JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
}

function writeDb(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const digest = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${digest}`;
}

function verifyPassword(password, combined) {
  const [salt, original] = (combined || '').split(':');
  if (!salt || !original) return false;
  const digest = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(original));
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
}

function isPhone(value) {
  return /^\+?[0-9]{6,15}$/.test(value || '');
}

function getAuthUser(req, db) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const user = db.users.find((item) => item.id === session.userId);
  if (!user) return null;
  return { token, user };
}


function ensureAdmin(req) {
  const key = req.headers['x-admin-key'];
  return key && key === ADMIN_KEY;
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(urlPath).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = path.join(__dirname, safePath);
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end('Not Found');
  }

  const ext = path.extname(filePath);
  const typeMap = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };
  res.writeHead(200, { 'Content-Type': typeMap[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  try {
    if (method === 'GET' && url === '/api/plans') {
      return sendJson(res, 200, { plans });
    }

    if (method === 'POST' && url === '/api/auth/register') {
      const body = await parseBody(req);
      const { email, phone, password } = body;
      if (!email && !phone) return sendJson(res, 400, { error: '邮箱或手机号至少填写一个' });
      if (email && !isEmail(email)) return sendJson(res, 400, { error: '邮箱格式不正确' });
      if (phone && !isPhone(phone)) return sendJson(res, 400, { error: '手机号格式不正确' });
      if (!password || password.length < 6) return sendJson(res, 400, { error: '密码至少6位' });

      const db = readDb();
      const found = db.users.find((u) => (email && u.email === email) || (phone && u.phone === phone));
      if (found) return sendJson(res, 409, { error: '账号已存在' });

      const user = {
        id: db.nextUserId++,
        email: email || null,
        phone: phone || null,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      writeDb(db);
      return sendJson(res, 200, { success: true, userId: user.id });
    }

    if (method === 'POST' && url === '/api/auth/login') {
      const body = await parseBody(req);
      const { account, password } = body;
      if (!account || !password) return sendJson(res, 400, { error: '账号和密码不能为空' });
      if (!isEmail(account) && !isPhone(account)) return sendJson(res, 400, { error: '请输入合法邮箱或手机号' });

      const db = readDb();
      const user = db.users.find((u) => u.email === account || u.phone === account);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return sendJson(res, 401, { error: '账号或密码错误' });
      }

      const token = crypto.randomBytes(24).toString('hex');
      db.sessions.push({
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
      writeDb(db);
      return sendJson(res, 200, { token, user: { id: user.id, email: user.email, phone: user.phone } });
    }

    if (method === 'POST' && url === '/api/auth/logout') {
      const db = readDb();
      const authed = getAuthUser(req, db);
      if (!authed) return sendJson(res, 401, { error: '未登录' });
      db.sessions = db.sessions.filter((s) => s.token !== authed.token);
      writeDb(db);
      return sendJson(res, 200, { success: true });
    }

    if (method === 'GET' && url === '/api/auth/me') {
      const db = readDb();
      const authed = getAuthUser(req, db);
      if (!authed) return sendJson(res, 401, { error: '未登录' });
      return sendJson(res, 200, {
        user: {
          id: authed.user.id,
          email: authed.user.email,
          phone: authed.user.phone,
          createdAt: authed.user.createdAt
        }
      });
    }

    if (method === 'POST' && url === '/api/billing/subscribe') {
      const db = readDb();
      const authed = getAuthUser(req, db);
      if (!authed) return sendJson(res, 401, { error: '未登录' });
      const body = await parseBody(req);
      const plan = plans.find((item) => item.id === body.planId);
      if (!plan) return sendJson(res, 400, { error: '套餐不存在' });

      const sub = {
        id: db.nextSubId++,
        userId: authed.user.id,
        planId: plan.id,
        planName: plan.name,
        priceCny: plan.priceCny,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      db.subscriptions.push(sub);
      writeDb(db);
      return sendJson(res, 200, { success: true, message: `已开通 ${plan.name}`, subscription: sub });
    }

    if (method === 'GET' && url === '/api/billing/my-subscription') {
      const db = readDb();
      const authed = getAuthUser(req, db);
      if (!authed) return sendJson(res, 401, { error: '未登录' });
      const rows = db.subscriptions.filter((s) => s.userId === authed.user.id);
      const latest = rows.length ? rows[rows.length - 1] : null;
      return sendJson(res, 200, { subscription: latest });
    }


    if (method === 'GET' && url === '/api/admin/stats') {
      if (!ensureAdmin(req)) return sendJson(res, 403, { error: '无权限访问后台' });
      const db = readDb();
      const now = Date.now();
      const activeSessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now).length;
      const activeSubscriptions = db.subscriptions.filter((s) => s.status === 'active').length;
      return sendJson(res, 200, {
        stats: {
          totalUsers: db.users.length,
          activeSessions,
          totalSubscriptions: db.subscriptions.length,
          activeSubscriptions
        }
      });
    }

    if (method === 'GET' && url.startsWith('/api/admin/users')) {
      if (!ensureAdmin(req)) return sendJson(res, 403, { error: '无权限访问后台' });
      const db = readDb();
      const rawLimit = Number(new URL(req.url, 'http://localhost').searchParams.get('limit') || 20);
      const limit = Math.min(Math.max(rawLimit, 1), 100);
      const users = [...db.users]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map((u) => ({ id: u.id, email: u.email, phone: u.phone, createdAt: u.createdAt }));
      return sendJson(res, 200, { users });
    }

    if (method === 'GET' && url.startsWith('/api/admin/subscriptions')) {
      if (!ensureAdmin(req)) return sendJson(res, 403, { error: '无权限访问后台' });
      const db = readDb();
      const rawLimit = Number(new URL(req.url, 'http://localhost').searchParams.get('limit') || 20);
      const limit = Math.min(Math.max(rawLimit, 1), 100);
      const subscriptions = [...db.subscriptions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      return sendJson(res, 200, { subscriptions });
    }

    return serveStatic(req, res);
  } catch (error) {
    return sendJson(res, 500, { error: error.message || '服务器错误' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin key: ${ADMIN_KEY}`);
});

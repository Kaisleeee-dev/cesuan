const { request } = require('../../utils/request');
const config = require('../../config');

Page({
  data: {
    envOptions: Object.keys(config.ENV),
    envIndex: Object.keys(config.ENV).indexOf(config.activeEnv),
    apiBase: config.apiBase,
    regEmail: '',
    regPhone: '',
    regPassword: '',
    loginAccount: '',
    loginPassword: '',
    authMsg: '未登录',
    plans: [],
    billingMsg: ''
  },

  onLoad() {
    const app = getApp();
    const savedApiBase = wx.getStorageSync('apiBase');
    const savedToken = wx.getStorageSync('token');
    if (savedApiBase) {
      app.globalData.apiBase = savedApiBase;
      this.setData({ apiBase: savedApiBase });
    }
    if (savedToken) {
      app.globalData.token = savedToken;
      this.setData({ authMsg: '已恢复登录态' });
    }
    this.loadPlans();
    this.loadMe();
  },

  onEnvChange(e) {
    const envIndex = Number(e.detail.value);
    const envOptions = this.data.envOptions;
    const selectedEnv = envOptions[envIndex] || 'local';
    const app = getApp();
    const apiBase = config.ENV[selectedEnv].apiBase;

    wx.setStorageSync('velioraMiniEnv', selectedEnv);
    wx.setStorageSync('apiBase', apiBase);

    app.globalData.env = selectedEnv;
    app.globalData.apiBase = apiBase;

    this.setData({ envIndex, apiBase, authMsg: `已切换环境: ${selectedEnv}` });
    this.loadPlans();
  },

  onApiBaseInput(e) { this.setData({ apiBase: e.detail.value }); },
  onRegEmail(e) { this.setData({ regEmail: e.detail.value }); },
  onRegPhone(e) { this.setData({ regPhone: e.detail.value }); },
  onRegPassword(e) { this.setData({ regPassword: e.detail.value }); },
  onLoginAccount(e) { this.setData({ loginAccount: e.detail.value }); },
  onLoginPassword(e) { this.setData({ loginPassword: e.detail.value }); },

  saveApiBase() {
    const app = getApp();
    app.globalData.apiBase = this.data.apiBase;
    wx.setStorageSync('apiBase', this.data.apiBase);
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  async register() {
    try {
      const res = await request('/api/auth/register', 'POST', {
        email: this.data.regEmail,
        phone: this.data.regPhone,
        password: this.data.regPassword
      });
      this.setData({ authMsg: `注册成功，用户ID: ${res.userId}` });
    } catch (e) {
      this.setData({ authMsg: `注册失败: ${e.message}` });
    }
  },

  async login() {
    const app = getApp();
    try {
      const res = await request('/api/auth/login', 'POST', {
        account: this.data.loginAccount,
        password: this.data.loginPassword
      });
      app.globalData.token = res.token;
      wx.setStorageSync('token', res.token);
      this.setData({ authMsg: `登录成功: ${res.user.email || res.user.phone}` });
      this.loadMySubscription();
    } catch (e) {
      this.setData({ authMsg: `登录失败: ${e.message}` });
    }
  },

  async logout() {
    const app = getApp();
    try {
      await request('/api/auth/logout', 'POST', {});
    } catch (_e) {}
    app.globalData.token = '';
    wx.removeStorageSync('token');
    this.setData({ authMsg: '已退出登录', billingMsg: '' });
  },

  async loadPlans() {
    try {
      const res = await request('/api/plans');
      const plans = (res.plans || []).map((p) => ({
        ...p,
        featuresText: (p.features || []).join(' · ')
      }));
      this.setData({ plans });
    } catch (e) {
      this.setData({ billingMsg: `套餐加载失败: ${e.message}` });
    }
  },

  async subscribe(e) {
    const planId = e.currentTarget.dataset.id;
    try {
      const res = await request('/api/billing/subscribe', 'POST', { planId });
      this.setData({ billingMsg: res.message || '开通成功' });
    } catch (err) {
      this.setData({ billingMsg: `开通失败: ${err.message}` });
    }
  },

  async loadMySubscription() {
    try {
      const res = await request('/api/billing/my-subscription');
      if (res.subscription) {
        this.setData({
          billingMsg: `当前订阅: ${res.subscription.planName}（${res.subscription.status}）`
        });
      }
    } catch (_e) {}
  },

  async loadMe() {
    try {
      const res = await request('/api/auth/me');
      this.setData({ authMsg: `已登录: ${res.user.email || res.user.phone}` });
      this.loadMySubscription();
    } catch (_e) {}
  }
});

const ENV = {
  local: {
    name: 'local',
    apiBase: 'http://127.0.0.1:4173'
  },
  staging: {
    name: 'staging',
    apiBase: 'https://staging-api.veliora.example.com'
  },
  production: {
    name: 'production',
    apiBase: 'https://api.veliora.example.com'
  }
};

const activeEnv = wx.getStorageSync('velioraMiniEnv') || 'local';

module.exports = {
  ENV,
  activeEnv,
  apiBase: ENV[activeEnv]?.apiBase || ENV.local.apiBase
};

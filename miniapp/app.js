const config = require('./config');

App({
  globalData: {
    env: config.activeEnv,
    apiBase: config.apiBase,
    token: ''
  }
});

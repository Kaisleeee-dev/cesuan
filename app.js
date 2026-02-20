const languages = {
  zh: {
    name: '中文',
    ui: {
      title: '缘解 Veliora',
      greeting: '今天有什么想知道的吗？',
      language: '语言',
      region: '地区模式',
      coreEntry: '核心入口',
      entryEmotion: '情感洞察',
      entryMatch: '关系匹配',
      entryTrend: '人生趋势',
      entryAI: 'AI 咨询',
      dailyFortune: '今日运势',
      aiAdvisor: 'AI 咨询',
      send: '发送',
      reportTitle: '高级报告',
      overallScore: '总体评分',
      keyConclusion: '关键结论',
      deepAnalysis: '深度解析',
      actionAdvice: '建议行动',
      bookLibrary: '测算书籍库',
      navHome: '首页',
      navAnalysis: '分析',
      navAI: 'AI',
      navFav: '收藏',
      navMe: '我的',
      searching: 'AI 正在分析，请稍候...',
      noKey: '未配置 API Key，已返回演示模式结果。',
      error: '调用 AI 失败，请检查接口地址、模型名称或密钥。',
      searchPlaceholder: '搜索书名 / 体系',
      questionPlaceholder: '输入你的问题，立即获得结果...',
      conclusions: ['当前主题有积极推进空间', '关键在于沟通节奏与行动一致', '先小步验证，再持续加码'],
      actions: ['今天完成一个明确行动', '建立每周复盘机制', '保持情绪与目标同步']
    }
  },
  en: {
    name: 'English',
    ui: {
      title: 'Veliora',
      greeting: 'What would you like to know today?',
      language: 'Language',
      region: 'Region',
      coreEntry: 'Core Entrances',
      entryEmotion: 'Emotional Insight',
      entryMatch: 'Relationship Match',
      entryTrend: 'Life Trend',
      entryAI: 'AI Advisory',
      dailyFortune: 'Daily Fortune',
      aiAdvisor: 'AI Advisory',
      send: 'Send',
      reportTitle: 'Premium Report',
      overallScore: 'Overall Score',
      keyConclusion: 'Key Conclusions',
      deepAnalysis: 'Deep Analysis',
      actionAdvice: 'Action Plan',
      bookLibrary: 'Book Library',
      navHome: 'Home',
      navAnalysis: 'Analysis',
      navAI: 'AI',
      navFav: 'Saved',
      navMe: 'Me',
      searching: 'AI is analyzing your question...',
      noKey: 'No API key configured. Returning demo response.',
      error: 'AI request failed. Please check API base/model/key.',
      searchPlaceholder: 'Search title / system',
      questionPlaceholder: 'Type your question and get an instant result...',
      conclusions: ['Momentum is positive if actions stay consistent', 'Communication quality is the core amplifier', 'Small experiments outperform all-in decisions'],
      actions: ['Execute one concrete task today', 'Run a weekly review loop', 'Align emotional state with priority goals']
    }
  }
};

const books = [
  { title: '滴天髓', system: '八字命理', region: 'asia' },
  { title: '渊海子平', system: '四柱预测', region: 'asia' },
  { title: '紫微斗数全书', system: '紫微斗数', region: 'asia' },
  { title: 'The Pictorial Key to the Tarot', system: 'Tarot', region: 'europe' },
  { title: 'Three Books of Occult Philosophy', system: 'Western Occult', region: 'europe' },
  { title: 'I Ching (Wilhelm Translation)', system: 'I Ching', region: 'global' },
  { title: 'Kabbalah and Astrology', system: 'Kabbalah', region: 'middleEast' },
  { title: 'Picatrix', system: 'Astrological Magic', region: 'middleEast' },
  { title: 'El Gran Libro del Tarot', system: 'Tarot', region: 'americas' },
  { title: "Llewellyn's Complete Book of Astrology", system: 'Astrology', region: 'americas' }
];

const fortuneItems = [
  { key: 'emotion', label: '情感', icon: '❤️' },
  { key: 'career', label: '事业', icon: '💼' },
  { key: 'energy', label: '能量状态', icon: '⚡' }
];

const ui = {
  langSelect: document.getElementById('languageSelect'),
  regionSelect: document.getElementById('regionSelect'),
  searchInput: document.getElementById('searchInput'),
  bookGrid: document.getElementById('bookGrid'),
  askBtn: document.getElementById('askBtn'),
  questionInput: document.getElementById('questionInput'),
  apiBase: document.getElementById('apiBase'),
  apiKey: document.getElementById('apiKey'),
  apiModel: document.getElementById('apiModel'),
  chatList: document.getElementById('chatList'),
  entryGrid: document.getElementById('entryGrid'),
  fortuneGrid: document.getElementById('fortuneGrid'),
  floatingAiBtn: document.getElementById('floatingAiBtn'),
  scoreValue: document.getElementById('scoreValue'),
  conclusionList: document.getElementById('conclusionList'),
  analysisText: document.getElementById('analysisText'),
  actionList: document.getElementById('actionList'),
  bottomNav: document.querySelector('.bottom-nav')
};

let currentLanguage = 'zh';

function setupLanguages() {
  Object.entries(languages).forEach(([key, value]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = value.name;
    ui.langSelect.appendChild(option);
  });
  ui.langSelect.value = currentLanguage;
}

function applyLanguage(lang) {
  const selected = languages[lang] || languages.zh;
  currentLanguage = lang;

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (selected.ui[key]) node.textContent = selected.ui[key];
  });

  ui.searchInput.placeholder = selected.ui.searchPlaceholder;
  ui.questionInput.placeholder = selected.ui.questionPlaceholder;
  renderFortune();
  renderReportSkeleton();
}

function renderBooks() {
  const keyword = ui.searchInput.value.trim().toLowerCase();
  const region = ui.regionSelect.value;

  const filtered = books.filter((book) => {
    const matchesRegion = region === 'global' || book.region === region || book.region === 'global';
    const matchesKeyword = !keyword || book.title.toLowerCase().includes(keyword) || book.system.toLowerCase().includes(keyword);
    return matchesRegion && matchesKeyword;
  });

  ui.bookGrid.innerHTML = filtered
    .map(
      (book) => `<article class="book-card"><h3>${book.title}</h3><p>${book.system}</p><span class="tag">${book.region.toUpperCase()}</span></article>`
    )
    .join('');
}

function dailySeed() {
  const d = new Date();
  return Number(`${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`);
}

function scoreByOffset(offset) {
  const base = (dailySeed() * (offset + 13)) % 31;
  return 70 + base;
}

function renderFortune() {
  const localized = currentLanguage === 'en'
    ? { emotion: 'Emotion', career: 'Career', energy: 'Energy' }
    : { emotion: '情感', career: '事业', energy: '能量状态' };

  ui.fortuneGrid.innerHTML = fortuneItems
    .map((item, i) => `<article class="fortune-item"><p>${item.icon} ${localized[item.key]}</p><strong>${scoreByOffset(i)}</strong></article>`)
    .join('');
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  ui.chatList.appendChild(div);
  ui.chatList.scrollTop = ui.chatList.scrollHeight;
}

function demoAnswer(prompt) {
  return `问题: ${prompt}\n\n建议:\n1) 聚焦一项最关键目标并立即执行。\n2) 在关系中先表达真实需求再讨论方案。\n3) 72小时内完成一次结果复盘，调整下一步策略。`;
}

function renderReportSkeleton() {
  const pack = languages[currentLanguage].ui;
  ui.scoreValue.textContent = '--';
  ui.conclusionList.innerHTML = pack.conclusions.map((t) => `<li>${t}</li>`).join('');
  ui.analysisText.textContent = currentLanguage === 'en'
    ? 'Submit a question in AI chat to generate personalized deep analysis.'
    : '在 AI 咨询中提交问题后，这里会生成个性化深度解析。';
  ui.actionList.innerHTML = pack.actions.map((t) => `<li>${t}</li>`).join('');
}

function renderReportFromAnswer(answer) {
  const score = 80 + (answer.length % 18);
  ui.scoreValue.textContent = `${score}`;
  ui.analysisText.textContent = answer.slice(0, 260);
}

async function askAI() {
  const content = ui.questionInput.value.trim();
  if (!content) return;

  const pack = languages[currentLanguage].ui;
  appendMessage('user', content);
  appendMessage('ai', pack.searching);
  const loadingNode = ui.chatList.lastElementChild;

  const apiBase = (ui.apiBase.value || 'https://api.openai.com/v1').trim();
  const apiKey = ui.apiKey.value.trim();
  const model = (ui.apiModel.value || 'gpt-4o-mini').trim();
  localStorage.setItem('velioraAIConfig', JSON.stringify({ apiBase, model }));

  if (!apiKey) {
    const answer = `${pack.noKey}\n\n${demoAnswer(content)}`;
    loadingNode.textContent = answer;
    renderReportFromAnswer(answer);
    return;
  }

  try {
    const resp = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are Veliora, an empathetic insight assistant. Give concise, practical, non-deterministic guidance.' },
          { role: 'user', content: `Region:${ui.regionSelect.value}; Language:${currentLanguage}; Question:${content}` }
        ]
      })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'request failed');
    const answer = data.choices?.[0]?.message?.content || pack.error;
    loadingNode.textContent = answer;
    renderReportFromAnswer(answer);
  } catch (error) {
    loadingNode.textContent = `${pack.error}\n${error.message}`;
  }
}

function restoreAIConfig() {
  const raw = localStorage.getItem('velioraAIConfig');
  if (!raw) return;
  try {
    const cfg = JSON.parse(raw);
    ui.apiBase.value = cfg.apiBase || '';
    ui.apiModel.value = cfg.model || '';
  } catch (_error) {
    // ignore
  }
}

function bindQuickEntries() {
  ui.entryGrid.querySelectorAll('.entry-card').forEach((card) => {
    card.addEventListener('click', () => {
      ui.questionInput.value = card.dataset.prompt || '';
      document.getElementById('aiSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
      ui.questionInput.focus();
    });
  });
}

function bindNavigation() {
  ui.bottomNav.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const node = document.getElementById(target) || document.querySelector(`#${target}`);
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  ui.floatingAiBtn.addEventListener('click', () => {
    document.getElementById('aiSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    ui.questionInput.focus();
  });
}

setupLanguages();
restoreAIConfig();
applyLanguage(currentLanguage);
renderBooks();
bindQuickEntries();
bindNavigation();

ui.langSelect.addEventListener('change', (e) => applyLanguage(e.target.value));
ui.regionSelect.addEventListener('change', renderBooks);
ui.searchInput.addEventListener('input', renderBooks);
ui.askBtn.addEventListener('click', askAI);
ui.questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') askAI();
});

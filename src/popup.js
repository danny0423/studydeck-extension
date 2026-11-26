// popup：顯示登入狀態、最近加的 10 個待學習
import { ApiError, listTodo, me } from './api.js';
import { getSettings, logout, saveSettings } from './settings.js';

const $ = (id) => document.getElementById(id);
const SHOW = 10;

function setStatus(message, isError = false) {
  $('status').textContent = message;
  $('status').className = isError ? 'error' : 'muted';
}

function renderWords(words) {
  const list = $('words');
  list.replaceChildren(
    ...words.slice(0, SHOW).map((w) => {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = w.word;
      const reading = w.reading && w.reading !== w.word ? `（${w.reading}）` : '';
      li.append(strong, `${reading} ${w.meaning || ''}`);
      return li;
    }),
  );
}

async function load() {
  const settings = await getSettings();
  if (!settings.server || !settings.token) {
    setStatus('還沒登入，請按「設定」登入。', true);
    return;
  }
  try {
    // 每次打開都換一張新的登入憑證，180 天內有用過就一直保持登入
    const { token } = await me(settings);
    if (token) await saveSettings({ token });
    const { words } = await listTodo({ ...settings, token: token || settings.token });
    setStatus(`${settings.username}　待學習 ${words.length} 個${words.length > SHOW ? `（顯示最新 ${SHOW} 個）` : ''}`);
    renderWords(words);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await logout();
      setStatus('登入過期了，請按「設定」重新登入。', true);
      return;
    }
    setStatus(err.message, true);
  }
}

$('open').addEventListener('click', async () => {
  const { server } = await getSettings();
  if (!server) {
    chrome.runtime.openOptionsPage();
    return;
  }
  chrome.tabs.create({ url: new URL('/library?tab=todo', server).href });
});

$('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());

load();

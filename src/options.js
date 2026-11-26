import { login } from './api.js';
import { getSettings, logout, originPattern, saveSettings } from './settings.js';

const $ = (id) => document.getElementById(id);

function show(message, isError = false) {
  $('status').textContent = message;
  $('status').className = isError ? 'error' : '';
}

async function render() {
  const settings = await getSettings();
  $('server').value = settings.server;
  $('who').textContent = settings.token ? `目前登入：${settings.username}` : '目前沒有登入';
}

$('form').addEventListener('submit', (event) => {
  event.preventDefault();
  let server;
  try {
    server = new URL($('server').value.trim()).origin;
  } catch {
    show('網址格式不對', true);
    return;
  }
  if (!server.startsWith('https://')) {
    show('網址要是 https:// 開頭', true);
    return;
  }
  // 要權限一定要在按下按鈕的當下馬上要（前面不能先 await 別的），不然 Chrome 不讓問
  chrome.permissions.request({ origins: [originPattern(server)] }).then(async (granted) => {
    if (!granted) {
      show('沒有給權限，連不到 StudyDeck', true);
      return;
    }
    show('登入中…');
    try {
      const { token, user } = await login(server, $('identifier').value.trim(), $('password').value);
      await saveSettings({ server, token, username: user.username });
      $('password').value = '';
      show(`登入成功：${user.username}`);
      await render();
    } catch (err) {
      show(err.message, true);
    }
  });
});

$('logout').addEventListener('click', async () => {
  await logout();
  show('已登出');
  await render();
});

render();

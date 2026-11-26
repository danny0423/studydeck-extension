import { ApiError, listGroups, login } from './api.js';
import { LANG_OPTIONS } from './lang.js';
import { getSettings, logout, originPattern, saveSettings } from './settings.js';

const $ = (id) => document.getElementById(id);

function show(message, isError = false) {
  $('status').textContent = message;
  $('status').className = isError ? 'error' : '';
}

function option(value, label, name = '') {
  const el = document.createElement('option');
  el.value = value;
  el.textContent = label;
  el.dataset.name = name;
  return el;
}

// 分類選單：未分類＋StudyDeck 上這個帳號的分類（分類要到網站上建立）
async function renderGroups(settings) {
  const select = $('group');
  select.replaceChildren(option('', '未分類'));
  select.value = '';
  select.disabled = true;
  $('group-hint').textContent = '讀取分類中…';
  try {
    const { groups } = await listGroups(settings);
    select.append(...groups.map((g) => option(String(g.id), `${g.name}（${g.count}）`, g.name)));
    const exists = groups.some((g) => g.id === settings.groupId);
    select.value = exists ? String(settings.groupId) : '';
    select.disabled = false;
    if (settings.groupId !== null && !exists) {
      await saveSettings({ groupId: null, groupName: '' });
      $('group-hint').textContent = `原本選的「${settings.groupName}」已經不在了，改回未分類。`;
    } else {
      $('group-hint').textContent = groups.length ? '' : '還沒有分類。到網站建立後，按「重新讀取分類」。';
    }
  } catch (err) {
    // 還沒有分類功能的 StudyDeck：選單停在未分類，字照樣加得進去
    $('group-hint').textContent = err instanceof ApiError && err.status === 404
      ? '這個 StudyDeck 還沒有分類功能，字會加到未分類。'
      : err.message;
  }
}

async function render() {
  const settings = await getSettings();
  $('server').value = settings.server;
  $('who').textContent = settings.token ? `目前登入：${settings.username}` : '目前沒有登入';
  $('prefs').hidden = !settings.token;
  if (!settings.token) return;
  $('lang').replaceChildren(...LANG_OPTIONS.map(([value, label]) => option(value, label)));
  $('lang').value = settings.lang;
  await renderGroups(settings);
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
      const before = await getSettings();
      // 換了 StudyDeck 或帳號，原本選的分類就不是這個帳號的，改回未分類
      const sameAccount = before.server === server && before.username === user.username;
      await saveSettings({
        server,
        token,
        username: user.username,
        ...(sameAccount ? {} : { groupId: null, groupName: '' }),
      });
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

$('group').addEventListener('change', async () => {
  const picked = $('group').selectedOptions[0];
  const groupId = picked.value ? Number(picked.value) : null;
  await saveSettings({ groupId, groupName: picked.dataset.name });
  $('prefs-status').textContent = `已儲存：之後的字會加到「${picked.dataset.name || '未分類'}」`;
});

$('lang').addEventListener('change', async () => {
  await saveSettings({ lang: $('lang').value });
  $('prefs-status').textContent = `已儲存：單字的語言「${$('lang').selectedOptions[0].textContent}」`;
});

$('reload-groups').addEventListener('click', async () => renderGroups(await getSettings()));

$('manage-groups').addEventListener('click', async () => {
  const { server } = await getSettings();
  chrome.tabs.create({ url: new URL('/library?tab=todo', server).href });
});

render();

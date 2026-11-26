// 背景程式：右鍵選單「加到 StudyDeck 待學習」
// 流程：抓選的字和那一句 → 叫 StudyDeck 單字解析查意思 → 存進待學習（設定頁選的分類）→ 跳通知
import { ApiError, addTodo, explainWord, listGroups } from './api.js';
import { detectLang } from './lang.js';
import { getSettings, logout, saveSettings } from './settings.js';

const MENU_ID = 'studydeck-add';
const MAX_WORD = 50; // 後端單字解析的上限（explain.js）

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ID,
    title: '加到 StudyDeck 待學習：「%s」',
    contexts: ['selection'],
  });
  // 第一次裝好就打開設定頁，先登入
  if (reason === 'install') chrome.runtime.openOptionsPage();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID) collect(info, tab);
});

function notify(title, message) {
  chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon128.png', title, message });
}

// 在網頁裡抓字和句子；抓不到（chrome:// 頁面、PDF、別的網域的 iframe）就只用右鍵選單給的字
async function grab(info, tab) {
  const fallback = { word: (info.selectionText || '').replace(/\s+/g, ' ').trim(), sentence: '', pageLang: '' };
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [info.frameId ?? 0] },
      files: ['sentence.js', 'grab.js'],
    });
    return res?.result?.word ? res.result : fallback;
  } catch {
    return fallback;
  }
}

// 字已經在待學習時，告訴使用者它在哪個分類：「（在「X」裡）」；未分類或查不到就不寫
async function groupLabel(settings, groupId) {
  if (groupId == null) return '';
  try {
    const { groups } = await listGroups(settings);
    const group = groups.find((g) => g.id === groupId);
    return group ? `（在「${group.name}」裡）` : '';
  } catch {
    return '';
  }
}

async function notifySaved(settings, saved, added) {
  const reading = saved.reading && saved.reading !== saved.word ? `（${saved.reading}）` : '';
  const body = `${saved.word}${reading}　${saved.meaning || ''}`;
  if (!added) {
    notify(`已經在待學習裡了${await groupLabel(settings, saved.groupId)}`, body);
    return;
  }
  // 設定的分類在網站上被刪了：StudyDeck 會放到未分類（回 groupId: null），設定也改回未分類。
  // 舊版 StudyDeck 沒有分類功能，回傳根本沒有 groupId（undefined），不算這種情況
  if (settings.groupId !== null && saved.groupId === null) {
    await saveSettings({ groupId: null, groupName: '' });
    notify('已加入待學習（未分類）', `${body}。你選的分類「${settings.groupName}」已經不在了，可以到設定頁重選。`);
    return;
  }
  notify(settings.groupId !== null ? `已加入待學習・${settings.groupName}` : '已加入待學習', body);
}

async function collect(info, tab) {
  const settings = await getSettings();
  if (!settings.server || !settings.token) {
    notify('還沒登入 StudyDeck', '先在設定頁登入一次就好。');
    chrome.runtime.openOptionsPage();
    return;
  }

  const { word, sentence, pageLang } = await grab(info, tab);
  if (!word) return;
  if (word.length > MAX_WORD) {
    notify('選太長了', `一次選一個字或一個詞（${MAX_WORD} 字以內）。`);
    return;
  }
  // 設定頁可以指定語言；選「自動判斷」才用猜的
  const lang = settings.lang === 'auto' ? detectLang(word, sentence, pageLang) : settings.lang;

  await chrome.action.setBadgeText({ tabId: tab.id, text: '…' });
  try {
    // 單字解析要「句子裡有這個字」；沒抓到句子就用字本身當句子
    const { result } = await explainWord(settings, { sentence: sentence || word, word, lang });
    // 欄位照網站自己「加入待學習」的填法（quizlet/frontend/src/components/ExplainHost.jsx 的 todoFromWord）
    const item = {
      lang,
      word: result.dictionaryForm || word,
      reading: result.reading || '',
      meaning: result.meaning || '',
      partOfSpeech: result.partOfSpeech || '',
      sentence,
      translation: '',
      // 不帶＝未分類（舊版 StudyDeck 沒有分類功能，會忽略這個欄位）
      ...(settings.groupId !== null ? { groupId: settings.groupId } : {}),
    };
    const { word: saved, added } = await addTodo(settings, item);
    await notifySaved(settings, saved, added);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await logout();
      notify('登入過期了', '請到設定頁重新登入。');
      chrome.runtime.openOptionsPage();
      return;
    }
    notify('沒加成功', err.message);
  } finally {
    await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
  }
}

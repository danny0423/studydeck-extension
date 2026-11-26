// 設定：StudyDeck 網址、登入憑證（token）、帳號名稱、加字用的分類和語言，存在這台電腦的 chrome.storage.local
// 網址不寫死在程式裡（會公開在商店），第一次用時在設定頁填
const KEYS = ['server', 'token', 'username', 'groupId', 'groupName', 'lang'];

export async function getSettings() {
  const s = await chrome.storage.local.get(KEYS);
  return {
    server: s.server || '',
    token: s.token || '',
    username: s.username || '',
    groupId: Number.isSafeInteger(s.groupId) ? s.groupId : null, // 加到哪個待學習分類；null＝未分類
    groupName: s.groupName || '',
    lang: s.lang || 'auto', // 'auto'＝自動判斷；其他是 StudyDeck 的語言代碼（lang.js 的 LANG_OPTIONS）
  };
}

export const saveSettings = (patch) => chrome.storage.local.set(patch);

// 分類是跟著帳號的，登出就一起清掉
export const logout = () => chrome.storage.local.set({ token: '', username: '', groupId: null, groupName: '' });

// 要連 StudyDeck 得先拿到那個網址的權限（不寫 port：Chrome 的網址規則不寫 port 就是任何 port 都可以）
export function originPattern(server) {
  const url = new URL(server);
  return `${url.protocol}//${url.hostname}/*`;
}

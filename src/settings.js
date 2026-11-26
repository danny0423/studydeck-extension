// 設定：StudyDeck 網址、登入憑證（token）、帳號名稱，存在這台電腦的 chrome.storage.local
// 網址不寫死在程式裡（會公開在商店），第一次用時在設定頁填
export async function getSettings() {
  const s = await chrome.storage.local.get(['server', 'token', 'username']);
  return {
    server: s.server || '',
    token: s.token || '',
    username: s.username || '',
  };
}

export const saveSettings = (patch) => chrome.storage.local.set(patch);

export const logout = () => chrome.storage.local.set({ token: '', username: '' });

// 要連 StudyDeck 得先拿到那個網址的權限（不寫 port：Chrome 的網址規則不寫 port 就是任何 port 都可以）
export function originPattern(server) {
  const url = new URL(server);
  return `${url.protocol}//${url.hostname}/*`;
}

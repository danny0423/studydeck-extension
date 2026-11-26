// 模擬測試 src/background.js 的右鍵加字流程：Chrome 和 StudyDeck 都換成假的，不用開瀏覽器、不連網路。
// 用法：node tests/background-sim.mjs（全部通過會印「6/6 通過」，失敗會停在那一項）
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const store = {};
const notes = [];
let calls = [];
let routes = {};

globalThis.chrome = {
  runtime: { onInstalled: { addListener() {} }, openOptionsPage() { notes.push('(打開設定頁)'); } },
  contextMenus: { onClicked: { addListener(fn) { globalThis.onClicked = fn; } }, removeAll: async () => {}, create() {} },
  notifications: { create(o) { notes.push(`${o.title}｜${o.message}`); } },
  scripting: { executeScript: async () => [{ result: { word: '食べる', sentence: '今日はご飯を食べる。', pageLang: 'ja' } }] },
  action: { setBadgeText: async () => {} },
  storage: {
    local: {
      get: async (keys) => Object.fromEntries(keys.filter((k) => k in store).map((k) => [k, store[k]])),
      set: async (patch) => { Object.assign(store, patch); },
    },
  },
};

globalThis.fetch = async (url, opts) => {
  const key = `${opts.method} ${new URL(url).pathname}`;
  calls.push([key, opts.body ? JSON.parse(opts.body) : null]);
  const [status, data] = routes[key] ?? [404, { error: 'not found' }];
  return { ok: status < 400, status, json: async () => data };
};

await import(pathToFileURL(resolve('src/background.js')).href);

const explainOk = [200, { result: { dictionaryForm: '食べる', reading: 'たべる', meaning: '吃', partOfSpeech: '動詞' } }];
const word = (extra) => ({ word: '食べる', reading: 'たべる', meaning: '吃', ...extra });

async function run(settings, r) {
  for (const k of Object.keys(store)) delete store[k];
  Object.assign(store, { server: 'https://example.test', token: 't', username: 'u', lang: 'auto' }, settings);
  notes.length = 0;
  calls = [];
  routes = r;
  globalThis.onClicked({ menuItemId: 'studydeck-add', selectionText: '食べる', frameId: 0 }, { id: 1 });
  await new Promise((res) => setTimeout(res, 30));
  return {
    post: calls.find(([k]) => k === 'POST /api/todo-words')?.[1],
    explain: calls.find(([k]) => k === 'POST /api/explain')?.[1],
  };
}

const cases = [
  ['加到指定分類', async () => {
    const { post } = await run({ groupId: 5, groupName: '動詞練習' }, {
      'POST /api/explain': explainOk,
      'POST /api/todo-words': [201, { word: word({ groupId: 5 }), added: true }],
    });
    assert.equal(post.groupId, 5);
    assert.match(notes[0], /^已加入待學習・動詞練習｜/);
    assert.equal(store.groupId, 5);
  }],
  ['分類在網站上被刪了 → 未分類＋提醒＋設定改回未分類', async () => {
    await run({ groupId: 5, groupName: '動詞練習' }, {
      'POST /api/explain': explainOk,
      'POST /api/todo-words': [201, { word: word({ groupId: null }), added: true }],
    });
    assert.match(notes[0], /^已加入待學習（未分類）｜.*「動詞練習」已經不在了/);
    assert.equal(store.groupId, null);
  }],
  ['字已經在別的分類 → 說在哪個分類', async () => {
    const { post } = await run({ groupId: null }, {
      'POST /api/explain': explainOk,
      'POST /api/todo-words': [200, { word: word({ groupId: 7 }), added: false }],
      'GET /api/todo-groups': [200, { groups: [{ id: 7, name: '舊單字', count: 3 }], ungroupedCount: 0 }],
    });
    assert.equal('groupId' in post, false);
    assert.match(notes[0], /^已經在待學習裡了（在「舊單字」裡）｜/);
  }],
  ['舊版 StudyDeck（回傳沒有 groupId）→ 一般的已加入', async () => {
    await run({ groupId: null }, {
      'POST /api/explain': explainOk,
      'POST /api/todo-words': [201, { word: word({}), added: true }],
    });
    assert.match(notes[0], /^已加入待學習｜/);
  }],
  ['設定頁指定語言 → 不用猜的', async () => {
    const { explain, post } = await run({ groupId: null, lang: 'en-US' }, {
      'POST /api/explain': explainOk,
      'POST /api/todo-words': [201, { word: word({ groupId: null }), added: true }],
    });
    assert.equal(explain.lang, 'en-US');
    assert.equal(post.lang, 'en-US');
  }],
  ['登入過期 → 登出、打開設定頁', async () => {
    await run({ groupId: 5, groupName: '動詞練習' }, {
      'POST /api/explain': [401, { error: '登入狀態失效，請重新登入' }],
    });
    assert.match(notes[0], /^登入過期了｜/);
    assert.equal(notes[1], '(打開設定頁)');
    assert.equal(store.token, '');
    assert.equal(store.groupId, null);
  }],
];

for (const [name, fn] of cases) {
  await fn();
  console.log(`✓ ${name}`);
}
console.log(`${cases.length}/${cases.length} 通過`);

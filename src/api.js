// 呼叫 StudyDeck 後端。用的都是網站現成的 API，後端不用改：
//   登入      POST /api/auth/login   quizlet/backend/src/routes/auth.js
//   換新憑證  GET  /api/auth/me      同上（每次叫都給一張新的 180 天憑證）
//   單字解析  POST /api/explain      quizlet/backend/src/routes/explain.js
//   待學習    GET/POST /api/todo-words  quizlet/backend/src/routes/todo-words.js

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request({ server, token }, path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(new URL(path, server), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, '連不到 StudyDeck。網路有通嗎（用 Tailscale 的話要先開）？設定頁的網址對嗎？');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error || `StudyDeck 回應錯誤（${res.status}）`);
  return data;
}

// → { token, user: { username, ... } }
export const login = (server, identifier, password) =>
  request({ server }, '/api/auth/login', { method: 'POST', body: { identifier, password } });

// → { user, token }
export const me = (settings) => request(settings, '/api/auth/me');

// { sentence, word, lang } → { result: { dictionaryForm, reading, meaning, partOfSpeech, ... } }
export const explainWord = (settings, body) => request(settings, '/api/explain', { method: 'POST', body });

// { lang, word, reading, meaning, partOfSpeech, sentence, translation } → { word, added }
export const addTodo = (settings, item) => request(settings, '/api/todo-words', { method: 'POST', body: item });

// → { words: [...] }（新加的在前面）
export const listTodo = (settings) => request(settings, '/api/todo-words');

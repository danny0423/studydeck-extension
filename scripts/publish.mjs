// 上傳 zip 到 Chrome Web Store 並送審（Chrome Web Store API v2，用服務帳戶登入）。
// GitHub Actions 打 v* 標籤時會跑（.github/workflows/publish.yml），也可以在本機跑。
//
// 用法：node scripts/publish.mjs dist/studydeck-extension-1.0.1.zip
// 需要的環境變數：
//   CWS_SERVICE_ACCOUNT_KEY  服務帳戶的 JSON 金鑰「整個檔案內容」
//   CWS_PUBLISHER_ID         開發者後台「發布者 → 設定」裡的 publisher ID
//   CWS_EXTENSION_ID         這個 extension 在商店的 32 碼 ID
//
// 官方文件：https://developer.chrome.com/docs/webstore/using-api
//          https://developer.chrome.com/docs/webstore/service-accounts
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://chromewebstore.googleapis.com';
const POLL_TIMES = 30;
const POLL_MS = 10_000;

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`少了環境變數 ${name}`);
  return value;
}

const base64url = (data) => Buffer.from(data).toString('base64url');

// 服務帳戶登入：自己簽一張 JWT，拿去換 1 小時有效的 access token
// https://developers.google.com/identity/protocols/oauth2/service-account#httprest
export function buildJwt({ client_email: email, private_key: key }, now = Math.floor(Date.now() / 1000)) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key, 'base64url');
  return `${header}.${claims}.${signature}`;
}

async function getAccessToken(serviceAccount) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildJwt(serviceAccount),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`拿 access token 失敗：${JSON.stringify(data)}`);
  return data.access_token;
}

async function call(token, method, url, body) {
  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${url} 失敗（${res.status}）：${JSON.stringify(data)}`);
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const zipPath = process.argv[2];
  if (!zipPath) throw new Error('用法：node scripts/publish.mjs <zip 檔>');
  const serviceAccount = JSON.parse(env('CWS_SERVICE_ACCOUNT_KEY'));
  const item = `publishers/${env('CWS_PUBLISHER_ID')}/items/${env('CWS_EXTENSION_ID')}`;

  const token = await getAccessToken(serviceAccount);

  console.log(`上傳 ${zipPath}…`);
  const uploaded = await call(token, 'POST', `${API}/upload/v2/${item}:upload`, await readFile(zipPath));
  let state = uploaded.uploadState;
  for (let i = 0; state === 'IN_PROGRESS' && i < POLL_TIMES; i += 1) {
    await sleep(POLL_MS);
    state = (await call(token, 'GET', `${API}/v2/${item}:fetchStatus`)).lastAsyncUploadState;
  }
  if (state !== 'SUCCEEDED') throw new Error(`上傳沒成功（${state}）：${JSON.stringify(uploaded)}`);
  console.log('上傳成功');

  // 送審；審過就自動發布（用商店後台上次手動發布時的公開程度）
  const published = await call(token, 'POST', `${API}/v2/${item}:publish`);
  console.log(`已送審：${JSON.stringify(published)}`);
}

// 直接執行才跑 main（被 import 進來測 buildJwt 時不跑）
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

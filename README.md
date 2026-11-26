# StudyDeck 單字收集（Chrome 擴充功能）

在任何網站選字 → 按右鍵 →「加到 StudyDeck 待學習」：查意思、讀音，連同那一句例句存進 StudyDeck 的待學習。
之後在 StudyDeck「你的資料庫 → 待學習」勾幾個字做成學習集。

- 上架與自動發布：[docs/上架與自動發布.md](docs/上架與自動發布.md)
- 商店說明、權限理由：[docs/商店說明草稿.md](docs/商店說明草稿.md)
- 隱私權政策：[PRIVACY.md](PRIVACY.md)

## 流程與用到的 StudyDeck API

StudyDeck 後端只為這個 extension 加了「待學習分類」（`/api/todo-groups`），其他都是網站原本就有的 API。

| 步驟 | 做什麼 | 程式 |
| --- | --- | --- |
| 1 | 抓選的字和所在的那一句（跳過日文注音 `<rt>`） | `src/grab.js`、`src/sentence.js` |
| 2 | 語言：設定頁指定的，或自動判斷（有假名→日文） | `src/lang.js` |
| 3 | 查意思、讀音、原形、詞性：`POST /api/explain` | `src/api.js` |
| 4 | 存進待學習、設定頁選的分類：`POST /api/todo-words`（同語言同一個字只存一次） | `src/api.js` |
| 5 | 跳通知（加到哪個分類；分類被刪了會提醒） | `src/background.js` |

設定頁的分類選單：`GET /api/todo-groups`。分類要到 StudyDeck 網站「你的資料庫 → 待學習」建立。

## 開發時在自己的 Chrome 試裝

1. 把 `src` 資料夾拿到 Windows：VS Code 檔案總管對 `src` 按右鍵 → Download，或在 PowerShell 跑
   `scp -r <帳號>@<這台的 IP>:<專案路徑>/src "$HOME\Downloads\studydeck-extension"`
2. Chrome 開 `chrome://extensions` → 打開「開發人員模式」→「載入未封裝項目」→ 選那個資料夾。
3. 會自動跳出設定頁：填 StudyDeck 網址（https 開頭）、帳號密碼 → 登入 → Chrome 問權限時按「允許」。

## 要注意

| 狀況 | 會怎樣 |
| --- | --- |
| StudyDeck 在 Tailscale 裡，但電腦沒開 Tailscale | 連不到，通知「連不到 StudyDeck」 |
| 沒查過的字 | StudyDeck 會用 AI 解析，算進 StudyDeck 每天的 AI 次數 |
| chrome:// 頁面、PDF、別的網域的 iframe | 抓不到句子，只存單字 |
| 選超過 50 個字 | 不送出，通知「選太長了」 |
| 登入憑證過期（180 天沒用） | 通知後自動打開設定頁 |

## 指令

```bash
python3 scripts/make_assets.py              # 重做圖示（來源：../quizlet 的網站圖示）和宣傳圖
python3 scripts/pack.py                     # 打包成 dist/studydeck-extension-<版本>.zip
python3 scripts/fit_screenshot.py raw-screenshots/<你的檔名>.png   # 把截圖轉成商店要的 1280x800
```

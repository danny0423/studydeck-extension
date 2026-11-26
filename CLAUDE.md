# StudyDeck 單字收集（Chrome extension）

配合 StudyDeck 網站（`../quizlet`）使用的 Chrome 擴充功能。說明見 [README.md](README.md)。

## 規則

- **每一步都記進 [docs/開發紀錄.md](docs/開發紀錄.md)**（使用者 2026-11-26 要求）：時間線、決策、驗證、踩到的坑、使用者問的問題，每項附 `檔案:行號` 或 commit。
- **這是 public repo**：不能寫死私人網址、IP、帳號、email。commit 前跑一次：
  `grep -rn -I -E "ts\.net|192\.168|100\.100\." --exclude-dir=.git .`，要是 0 筆。
- commit 作者 email 只用 GitHub noreply（這個 repo 的 `git config user.email`），不要用公司或私人信箱。
- **只用 StudyDeck 現成的 API，不改 quizlet 後端**。真的要改後端，照 `../quizlet/CLAUDE.md`（會影響同步、每日補資料）。
- 服務帳戶金鑰只放 GitHub secret，絕對不進 git（`.gitignore` 擋 `*.json`）。
- commit 訊息用英文。
- 發新版：改 `src/manifest.json` 的 version → commit → `git tag v<version>` → push 標籤（[docs/上架與自動發布.md](docs/上架與自動發布.md)）。

## 檢查

```bash
for f in src/*.js; do node --input-type=module --check < "$f" || node --check "$f"; done
node --check scripts/publish.mjs
python3 scripts/pack.py
```

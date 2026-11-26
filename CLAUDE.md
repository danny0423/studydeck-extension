# StudyDeck 單字收集（Chrome extension）

配合 StudyDeck 網站（`../quizlet`）使用的 Chrome 擴充功能。說明見 [README.md](README.md)。

## 規則

- **每一步都記進 [docs/開發紀錄.md](docs/開發紀錄.md)**（使用者 2026-11-26 要求）：時間線、決策、驗證、踩到的坑、使用者問的問題，每項附 `檔案:行號` 或 commit。
- **這是 public repo**：不能寫死私人網址、IP、帳號、email。commit 前跑一次：
  `grep -rn -I -E "ts\.net|192\.168|100\.100\." --exclude-dir=.git .`，要是 0 筆。
- commit 作者 email 只用 GitHub noreply（這個 repo 的 `git config user.email`），不要用公司或私人信箱。
- **這裡只改 extension**。需要 StudyDeck 新 API 時，交給 quizlet 那邊做（照 `../quizlet/CLAUDE.md`，會影響同步、每日補資料）；例：2026-11-26 的待學習分類。
- 新 API 要向下相容：舊版 extension、還沒部署新功能的 StudyDeck（例如 AWS 版，商店審核員用它測）都要照樣能用。
- 服務帳戶金鑰只放 GitHub secret，絕對不進 git（`.gitignore` 擋 `*.json`）。
- commit 訊息用英文。
- 發新版：改 `src/manifest.json` 的 version → commit → `git tag v<version>` → push 標籤（[docs/上架與自動發布.md](docs/上架與自動發布.md)）。

## 檢查

```bash
for f in src/*.js; do node --input-type=module --check < "$f" || node --check "$f"; done
node --check scripts/publish.mjs
node tests/background-sim.mjs   # 右鍵加字流程的模擬測試（假的 Chrome 和 StudyDeck）
python3 scripts/pack.py
```

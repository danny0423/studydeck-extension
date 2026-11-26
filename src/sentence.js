// 這個檔會被注入到網頁裡執行（跟 grab.js 一起），所以：
// - 不能用 import／export
// - 最外層只能放 function，不能放 const／let（同一頁重複注入會報「已經宣告過」）

// 從一整段文字裡，切出選取範圍（start 起、長度 length）所在的那一句
function studydeckCutSentence(text, start, length) {
  const MAX = 300; // 句子太長就只留選取前後各 120 字（後端上限 500）
  const isEnd = (i) => {
    const c = text[i];
    if ('。！？!?'.includes(c)) return true;
    // 英文句點後面要接空白或結尾才算句尾（避免 3.14、e.g. 被切開）
    if (c === '.') return i + 1 >= text.length || /\s/.test(text[i + 1]);
    return false;
  };
  let from = start;
  while (from > 0 && !isEnd(from - 1)) from -= 1;
  let to = start + length;
  while (to < text.length && !isEnd(to)) to += 1;
  if (to < text.length) to += 1; // 把句尾的標點也帶進來
  if (to - from > MAX) {
    from = Math.max(from, start - 120);
    to = Math.min(to, start + length + 120);
  }
  return text.slice(from, to).replace(/\s+/g, ' ').trim();
}

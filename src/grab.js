// 注入到網頁裡執行：抓「選的字」和「它所在的那一句」。
// 整個包在一個立即執行的函式裡，最後的值就是回傳結果（同一頁重複注入也不會出錯）。
// 需要先注入 sentence.js（studydeckCutSentence）。
(() => {
  const BLOCK = 'p, li, td, th, dd, dt, blockquote, h1, h2, h3, h4, h5, h6, figcaption, caption, pre, article, section, div';
  // rt／rp 是日文的注音假名（ruby），不跳過的話「食べる」會變成「食たべる」
  const SKIP = 'rt, rp, script, style, noscript, textarea';
  const clean = (s) => s.replace(/\s+/g, ' ').trim();
  const pageLang = document.documentElement.lang || '';

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  let el = range.commonAncestorContainer;
  if (el.nodeType !== Node.ELEMENT_NODE) el = el.parentElement;
  const block = (el && el.closest(BLOCK)) || document.body;

  // 把這一段的文字接起來（跳過注音），同時記下選取的起點、終點在第幾個字
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let text = '';
  let start = -1;
  let end = -1;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n === range.startContainer) start = text.length + range.startOffset;
    if (n === range.endContainer) end = text.length + range.endOffset;
    text += n.nodeValue;
  }

  // 起點或終點不在一般文字上（例如整段三連點選取）：改用選取的文字在段落裡找
  if (start < 0 || end < 0 || end <= start) {
    const picked = sel.toString();
    start = text.indexOf(picked);
    if (start < 0) return { word: clean(picked), sentence: '', pageLang };
    end = start + picked.length;
  }

  const word = clean(text.slice(start, end));
  const sentence = studydeckCutSentence(text, start, end - start);
  return { word, sentence: sentence.includes(word) ? sentence : '', pageLang };
})();

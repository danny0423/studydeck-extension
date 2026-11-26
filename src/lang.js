// 猜選的字是哪種語言。StudyDeck 只收這幾種：zh-TW、en-US、ja-JP、ko-KR、fr-FR、de-DE、es-ES
// （quizlet/backend/src/lib/validate.js 的 LANGUAGES）
const KANA = /[぀-ヿ]/; // 平假名、片假名
const HANGUL = /[가-힯]/;
const HAN = /[一-鿿]/; // 漢字
const BY_PAGE = { en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', ja: 'ja-JP', ko: 'ko-KR' };

export function detectLang(word, sentence, pageLang = '') {
  const page = pageLang.toLowerCase().slice(0, 2);
  if (KANA.test(word) || KANA.test(sentence)) return 'ja-JP';
  if (HANGUL.test(word)) return 'ko-KR';
  if (HAN.test(word)) return page === 'zh' ? 'zh-TW' : 'ja-JP';
  return BY_PAGE[page] || 'en-US';
}

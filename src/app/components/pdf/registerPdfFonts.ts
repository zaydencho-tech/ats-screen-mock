import { Font } from "@react-pdf/renderer";

const PRETENDARD_CDN =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static";

let registered = false;

/** Pretendard — 한글 PDF 폰트 (최초 1회 등록) */
export function registerPdfFonts(): void {
  if (registered) return;

  Font.register({
    family: "Pretendard",
    fonts: [
      { src: `${PRETENDARD_CDN}/Pretendard-Regular.otf`, fontWeight: 400 },
      { src: `${PRETENDARD_CDN}/Pretendard-Medium.otf`, fontWeight: 500 },
      { src: `${PRETENDARD_CDN}/Pretendard-SemiBold.otf`, fontWeight: 600 },
      { src: `${PRETENDARD_CDN}/Pretendard-Bold.otf`, fontWeight: 700 },
    ],
  });

  // CJK는 글자 단위 줄바꿈, 영문·숫자는 단어 유지
  Font.registerHyphenationCallback((word) => {
    if (/[\u3131-\uD79D]/.test(word)) {
      return [...word];
    }
    return [word];
  });

  registered = true;
}

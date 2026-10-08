/** 카카오(다음) 우편번호 서비스 — https://postcode.map.daum.net/guide */

const POSTCODE_SCRIPT_URL =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export interface DaumPostcodeResult {
  zonecode: string;
  address: string;
}

let scriptLoadPromise: Promise<void> | null = null;

export function loadDaumPostcodeScript(): Promise<void> {
  if (window.daum?.Postcode) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${POSTCODE_SCRIPT_URL}"]`,
    );

    if (existing) {
      if (window.daum?.Postcode) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("우편번호 스크립트 로드 실패")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = POSTCODE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("우편번호 스크립트 로드 실패"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function resolveDaumAddress(data: DaumPostcodeData): string {
  const base =
    data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

  if (!data.buildingName) {
    return base;
  }

  return base ? `${base} ${data.buildingName}` : data.buildingName;
}

/** 지정한 요소에 우편번호 검색 UI를 삽입 (레이어/모달용) */
export async function embedDaumPostcodeSearch(
  element: HTMLElement,
  options: {
    onComplete: (result: DaumPostcodeResult) => void;
    /** 검색창 초기 검색어 — embed({ q }) */
    query?: string;
  },
): Promise<void> {
  await loadDaumPostcodeScript();

  if (!window.daum?.Postcode) {
    throw new Error("우편번호 서비스를 초기화하지 못했습니다.");
  }

  element.replaceChildren();

  const query = options.query?.trim() ?? "";

  new window.daum.Postcode({
    oncomplete: (data) => {
      options.onComplete({
        zonecode: data.zonecode,
        address: resolveDaumAddress(data),
      });
    },
    width: "100%",
    height: "100%",
  }).embed(element, query ? { q: query } : undefined);
}

/** The original modal and oncomplete mapper are retained. Only the external hosted widget is replaced. */
export function installLocalPostcodeWidget() {
  (window as any).daum = {
    Postcode: class LocalPostcodeWidget {
      constructor(private options: { oncomplete: (data: any) => void }) {}
      embed(element: HTMLElement) {
        const container = document.createElement('div');
        container.dataset.atsWidget = 'postcode-mock';
        container.style.cssText = 'padding:20px;font-family:inherit;color:#172033;display:grid;gap:16px';
        const title = document.createElement('h3');
        title.textContent = '주소 검색 · Mock';
        title.style.cssText = 'font-size:16px;font-weight:700;margin:0';
        const explanation = document.createElement('p');
        explanation.textContent = '외부 주소 서비스 대신 아래 예시 주소를 선택합니다. 원본 지원서의 우편번호와 주소 필드에 반영됩니다.';
        explanation.style.cssText = 'font-size:13px;line-height:1.7;color:#64748b;margin:0';
        container.append(title, explanation);
        for (const [zonecode, address] of [['06200', '서울특별시 강남구 미리보기로 1'], ['13500', '경기도 성남시 미리보기로 2']]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = `[${zonecode}] ${address} · Mock 예시`;
          button.style.cssText = 'padding:16px;text-align:left;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;font:inherit;font-size:13px;cursor:pointer;line-height:1.7';
          button.addEventListener('click', () => this.options.oncomplete({ zonecode, userSelectedType: 'R', roadAddress: address, jibunAddress: address, buildingName: 'Mock 예시 주소' }));
          container.append(button);
        }
        element.replaceChildren(container);
      }
    },
  };
}

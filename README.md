# ATS 원본 화면 목업

ATS 실제 React 화면 5개를 추출한 독립 프로젝트입니다. 화면을 새로 그리지 않고, 원본 페이지와 공통 컴포넌트에 로컬 API 응답을 주입합니다. Arch 서버, 데이터베이스, ATS 백엔드 없이 실행합니다.

## 화면 선정

다양성, 핵심 채용 업무, 화면 복잡성을 기준으로 선정했습니다.

| 화면 | 주소 | 선정 이유 |
| --- | --- | --- |
| 채용 대시보드 | `/screens/dashboard` | KPI·차트·집계와 실행 이력 |
| 채용공고 관리 | `/screens/job-postings` | 공고 목록·등록·편집·지원자 조회 |
| 입사지원서 | `/screens/apply` | 지원자 관점의 동의·인증·학력·경력·자기소개 다단계 폼 |
| 면접 관리 v2 | `/screens/interviews` | 목록·지원서·평가의 다중 패널, 일정 조율과 분석 결과 |
| 처우 협의 | `/screens/offers` | 채용 후반의 연봉·입사일·복리후생 동적 폼과 지원서 연결 |

상단에서 화면과 **20개 상태 예시**를 선택합니다. 상태 주소를 복사하면 해당 폼·패널을 바로 열 수 있습니다. 예: `/screens/apply?state=form`, `/screens/offers?state=edit`.

`화면만 보기`는 탐색 도구 없이 원본 화면을 새 탭 전체 크기로 엽니다. 선택된 다섯 화면 사이의 원본 메뉴 이동도 동작합니다. 제외한 메뉴는 현재 화면을 유지하며 안내를 표시합니다.

## 실행

Node.js 22 이상이 필요합니다.

```sh
npm ci
npm run build
npm start
```

기본 주소는 `http://localhost:8003`입니다. 다른 포트는 `PORT=8010 npm start`로 지정합니다. `HOST` 기본값은 `0.0.0.0`입니다. `/healthz`로 서버 상태를 확인합니다. 소스를 변경하면 다시 빌드해야 합니다.

## 목업 동작 범위

- 원본 탭·필터·선택·폼·모달을 사용합니다. 공고 등록·수정·삭제·공개 상태, 지원서 입력·임시저장·제출, 처우 수정과 평가 저장은 로컬 응답을 사용합니다.
- 이름·지원서·평가·연봉·일정·분석 결과는 가상 데이터입니다. 인증도 이 화면 안에서만 사용하는 가상 세션입니다.
- 상태 예시를 선택하거나 초기화·새로고침하면 데이터는 예시값으로 돌아갑니다. 원본 화면 내부의 이동에서는 실행 중인 목업 데이터를 유지합니다.
- 실제 AI 실행, 메일 발송, 파일 업로드, 녹음과 PDF 내보내기는 포함하지 않습니다. 준비되지 않은 API 동작은 501 안내를 표시하며 실제 서버에 연결하지 않습니다. 관련 결과 화면은 상단 상태 예시에서 볼 수 있습니다.
- 입사지원서 주소 검색은 외부 서비스 대신 로컬 주소 선택을 사용하고 원본 입력 콜백을 호출합니다.

## 구성

| 위치 | 내용 |
| --- | --- |
| `src/app/` | 선택한 원본 화면과 필요한 컴포넌트·API·매퍼 |
| `src/app/routes.ts` | 선택 화면만 연결한 메모리 라우터 |
| `src/preview/fixtures.mjs` | API 목업과 세션 안에서의 데이터 변경 |
| `src/preview/scenarios.ts` | 특정 상태에 바로 진입하기 위한 데이터와 원본 상호작용 |
| `src/preview/bootstrap.ts` | 로컬 인증·통신 차단·상태 관찰·화면 이동 |
| `src/preview/manifest.json` | 5개 화면의 원본 정보와 상태 식별자 |
| `src/demo/screens.json` | 선정 이유, 탐색용 20개 상태 예시 |
| `src/demo/` | 화면·상태 선택과 전체 크기 iframe |
| `vite.config.mjs` | 원본 파일을 바꾸지 않는 상태·소스 위치 계측 |
| `server.mjs` | 빌드 산출물만 제공하는 독립 HTTP 서버 |

직접 렌더링 주소는 `/render/?route=원본경로&page=페이지ID&state=상태ID`입니다. 페이지·상태 ID는 manifest를 참조합니다. 같은 출처의 부모 창은 `ats-preview:ready`, `ats-preview:navigate`, `ats-preview:state`, `ats-preview:error`, `ats-preview:out-of-scope` 메시지로 상태를 확인할 수 있습니다. `window.__ATS_PREVIEW__.snapshot`에도 검증 정보가 있습니다.

## 면접전형 디자인 시스템 적용

면접전형에는 Fintora 기반의 Plus Jakarta Sans를 유지하고, Radius는 Atlassian/Jira 공식 토큰(컨트롤 6px·카드 8px·모달 12px)에 맞췄으며, Study Dashboard 레퍼런스의 블루 테마를 기준으로 #1B43F3 / #EEF1F5 / #F7F8FA / #FFFFFF 팔레트를 적용했습니다. 블루 채움은 주요 확정 작업에 집중하고 보조 작업·탐색·선택 상태는 중립색으로 구분합니다. `src/styles/interview-design.css`에서 CSS Variables와 컴포넌트 상태를 정의합니다. 지원자 목록·지원서·평가 섹션은 가용 폭에 따라 3열·2열·1열로 재배치하며 React 업무 로직은 유지합니다.  공통 컴포넌트는 면접전형 밖에서 이전 값으로 폴백합니다. 세부 토큰과 관찰값·추정값 구분은 `outputs/interview-design-system.md`를 참고하세요.

## 원본과 검증

원본은 `ats-f12-poc-main.zip`의 `itcen-ats-frontend`입니다. 최초 추출한 5개 페이지의 원본 SHA-256은 `source-provenance.json`에 기록되어 있습니다. 이후 면접전형 페이지에는 위에 설명한 스타일 변경을 적용했으므로 현재 파일은 원본과 바이트 단위로 동일하지 않습니다. 통신·라우팅·외부 위젯 등 실행 환경만 목업으로 교체했습니다. 의존 파일 목록은 `source-dependencies.json`에 기록했습니다. 이 폴더에 독립된 `package-lock.json`이 있으며 상위 프로젝트의 모듈·서버를 참조하지 않습니다.

```sh
npm test
```

Playwright로 모든 상태 예시와 화면 선택, 주소 복원, 초기화, 원본 메뉴 이동, 범위 밖 이동 차단을 확인합니다. Chromium은 `CHROMIUM_PATH`, `/usr/bin/chromium`, Playwright 설치 브라우저 순으로 사용합니다. 필요한 경우 `npx playwright install chromium`으로 설치합니다. 실행 결과와 대표 스크린샷은 `artifacts/`에 생성합니다.

## GitHub Pages 배포

저장소: https://github.com/zaydencho-tech/ats-screen-mock

`main` 브랜치에 커밋하면 `.github/workflows/pages.yml`에서 설치·빌드 후 GitHub Pages로 배포합니다. 저장소의 **Settings → Pages → Source**는 **GitHub Actions**를 사용합니다.

배포 주소: https://zaydencho-tech.github.io/ats-screen-mock/

`ATS_BASE_PATH`로 배포 경로를 지정하며 로컬 기본값은 `/`입니다. GitHub Actions에서는 Pages 설정의 경로를 사용합니다. 빌드 시 5개 `/screens/<화면>/`의 정적 진입점을 생성하므로 화면별 주소와 상태 쿼리를 공유하고 새로고침할 수 있습니다. 실제 백엔드 없이 가상 데이터로 실행합니다.

```sh
ATS_BASE_PATH=/ats-screen-mock/ npm run build:pages
```

최근 디자인 시스템은 대시보드·채용공고·면접전형·처우협의에 적용되어 있습니다. 기준은 `outputs/interview-design-system.md`이며, 임시 작업·백업·스크린샷·의존성·빌드 결과는 Git 업로드에서 제외합니다.

# Project Memory & Guidelines: 2026 Biseul Film Festival Web

이 문서는 2026 비슬영화제 모바일 웹 프로그램북 프로젝트의 지속적인 작업 기억(Persistent Memory) 및 개발 지침입니다. 에이전트는 새로운 대화 세션에서도 이 규칙을 상시 인지하고 작업을 수행합니다.

## 1. 프로젝트 기본 사항
- **구조**: 정적 HTML/CSS/JS (No-build, 순수 프론트엔드 환경)
- **메인 진입점**: `index.html`
- **데이터 소스**: `assets/data/` (영화 24편 정보, 섹션 데이터, 한/영 번역)
- **최신 작업 요약 문서**: `CONVERSATION_SUMMARY.md`

## 2. 데이터 규격 및 제약사항
1. **JSON 다국어 구조 필수**:
   - 모든 영화 JSON의 텍스트 필드(`title`, `director`, `writer`, `theme`, `session`, `logline`, `synopsis` 및 `cast` 배열 항목)는 항상 `{"ko": "...", "en": "..."}` 형태를 유지해야 합니다.
2. **영자막 필드 (`is_eng`)**:
   - 모든 상영작 JSON은 `"is_eng": true | false` 필드를 누락 없이 가지고 있어야 합니다.
   - 영자막 상영작 4편: `film_001` (바다 건너의 불빛), `film_002` (카덴차), `film_014` (안개), `film_017` (사별)
3. **배역/출연진 (`cast`) 표기**:
   - `cast` 배열은 각 배우마다 별도 객체 `{ "name": { "ko": "...", "en": "..." }, "role": { "ko": "배역명", "en": "Role" } }`로 작성해야 하며, `main.js`의 `renderCredits()`에서 `{role}({name})` 형태로 자동 조합되므로 role에 배우 이름을 중복 삽입하지 않습니다.
4. **러닝타임 형식**:
   - `"mm:ss"` (예: `"36:22"`) 형식을 준수합니다.

## 3. UI 및 렌더링 규칙
- **낭만 보관함 탭(`favs`)**:
  - `showEunmakPanel`은 `currentTab === 'catalog'`일 때만 렌더링되도록 유지합니다 (보관함 탭에서는 미노출).
- **공포 영화 시리즈 (`film_011`)**:
  - 3개 옴니버스 에피소드는 `assets/js/episodes.js`와 `assets/css/episodes.css`를 통해 개별 박스로 독립 렌더링됩니다.
- **스틸컷 관리**:
  - 스틸컷은 `assets/img/stills/{film.folder}/still_{1~3}.jpg`를 기본 경로로 사용합니다. 원본을 보존할 때는 `still_{N}_original.*` 네이밍을 사용하여 `util.js`의 `findStills()`와 충돌하지 않도록 합니다.

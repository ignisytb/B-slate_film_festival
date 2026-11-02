# 2026 비슬영화제 「낭만 ;」 웹 프로그램북

DGIST 영화제작동아리 B_SLATE 의 2026 비슬영화제 상영작 소개·상영시간표 사이트입니다.
빌드 도구나 서버 없이 HTML, CSS, JavaScript 와 JSON 데이터 파일만으로 동작하며 GitHub Pages 로 배포합니다.

## 폴더 구조

```text
index.html                  페이지 뼈대
assets/
├── css/main.css            스타일
├── js/
│   ├── util.js             경로·표기·저장 같은 공용 함수
│   └── main.js             화면 그리기와 페이지 동작
├── data/
│   ├── film_index.json     영화 id ↔ 파일·폴더 이름 목록 (상영 순서)
│   ├── films/<이름>.json   영화별 정보
│   └── section.json        색 섹션 설명
├── img/
│   ├── logo/               비슬레이트 로고
│   ├── posters/            영화제 메인·서브·티저 포스터
│   │   └── film/<폴더>/    영화별 포스터 (poster.jpg 또는 poster.png)
│   └── stills/<폴더>/      영화별 스틸컷 (still_1.jpg, still_2.png, ...)
└── legacy/                 이전 버전의 CSV·시놉시스 원본 (참고용)
```

## 로컬에서 실행

데이터를 `fetch` 로 읽기 때문에 `index.html` 을 더블클릭해서 열면 동작하지 않습니다. 저장소 폴더에서 로컬 서버를 띄워 주세요.

```bash
python -m http.server
```

브라우저에서 http://localhost:8000 으로 접속합니다. VS Code 의 Live Server 확장을 써도 됩니다.

## 상영작 정보 수정 (`assets/data/films/`)

영화 한 편이 파일 하나입니다. 상영 순서대로 `film_001` 부터 번호를 붙였고, 데이터 파일·포스터 폴더·스틸컷 폴더 이름은 모두 `film_001-바다 건너의 불빛` 처럼 같은 이름을 씁니다. 이 이름은 `assets/data/film_index.json` 에 영화마다 한 줄씩 적혀 있고, 페이지는 이 목록을 따라 영화 파일을 읽습니다.

**한 번 정한 `id` 와 이름은 바꾸지 않습니다.** 즐겨찾기, 공유 링크(`#/film/001`), 이미지 폴더가 모두 이 값을 쓰기 때문입니다. 영화를 추가할 때는 `films/` 에 파일을 만들고 `film_index.json` 에도 `{ "id": ..., "folder": ... }` 를 추가합니다.

각 영화 파일의 항목은 다음과 같습니다.

| 항목 | 설명 | 예시 |
|---|---|---|
| `id` | 영화 고유 번호 | `"film_001"` |
| `title`, `director`, `writer` | 제목, 감독, 각본 | `{ "ko": "바다 건너의 불빛", "en": "Lights Across the Sea" }` |
| `year` | 제작 연도 (모르면 `null`) | `2026` |
| `section` | 색 섹션 id (`section.json` 의 `id`) | `"orange"` |
| `session`, `theme` | 상영 세션 이름, 작품 테마 | `{ "ko": "...", "en": "..." }` |
| `is_opening`, `is_closing` | 개막작·폐막작 여부 | `true` / `false` |
| `running_time` | 러닝타임 (미정이면 `null`) | `"23:07"` |
| `screening` | 상영 정보: 일차, 시작·끝 시각, 1부·2부, 상영관 안 순서(단독 상영이면 `null`), 상영관 | `{ "day": 1, "start": "18:30", "end": "20:00", "part": 1, "order": null, "hall": {...} }` |
| `is_gv` | 관객과의 대화 진행 여부 | `true` |
| `cast` | 출연과 배역 | `[{ "name": {...}, "role": {...} }]` |
| `trailer_url` | 예고편 링크 (없으면 빈칸) | `""` |
| `logline`, `synopsis` | 한 줄 소개, 시놉시스 | `{ "ko": "...", "en": "..." }` |

글이 들어가는 항목은 모두 `{ "ko": ..., "en": ... }` 형태입니다. 영어가 아직 없으면 `"en": ""` 으로 둡니다.

색 섹션의 이름·설명·키워드·색상은 `assets/data/section.json` 에서 고칩니다.

## 포스터·스틸컷 넣기

영화마다 `assets/img/posters/film/` 과 `assets/img/stills/` 아래에 `film_001-바다 건너의 불빛` 같은 폴더가 있습니다.

- 포스터: 해당 폴더에 `poster.jpg` 또는 `poster.png` 로 넣습니다. 따로 등록할 필요 없이 바로 표시됩니다.
- 스틸컷: 해당 폴더에 `still_1`, `still_2`, `still_3` ... 순서로 `.jpg` 또는 `.png` 파일을 넣습니다. 페이지가 1번부터 차례로 찾다가 처음 없는 번호에서 멈추므로 **번호를 건너뛰지 않습니다.** (정적 사이트는 폴더 안 파일 목록을 읽을 수 없어서 이름 규칙으로 찾습니다.)
- 이미지가 없으면 스틸컷 → 포스터 → 제목 카드 순서로 대신 표시됩니다.
- 빈 폴더의 `.gitkeep` 은 git 에 빈 폴더를 올리기 위한 파일이라, 이미지를 넣은 뒤 지워도 됩니다.

## 페이지 주소

한 페이지 안에서 주소의 `#` 뒷부분으로 화면을 바꿉니다. 영화 상세 페이지는 `#/film/001` 처럼 `id` 의 번호 부분을 씁니다.

## 배포 (GitHub Pages)

1. 저장소 **Settings** → **Pages**
2. **Build and deployment** 의 Branch 를 `main`, 폴더를 `/ (root)` 로 지정하고 **Save**
3. 1~2분 뒤 `https://<계정>.github.io/<저장소 이름>/` 에서 열립니다

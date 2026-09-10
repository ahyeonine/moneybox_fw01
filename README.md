# MoneyBox · 외국인 환전예약 프로토타입 (FX Reservation)

외국인 고객이 온라인으로 환전을 **예약(무결제)** 하고, 지정 지점을 방문해 **신분증 확인 후 현장 결제·수령**하는 서비스의 클릭 가능한 프로토타입입니다. 백엔드 없이 목데이터 + 프론트 상태로 동작하며, GitHub Pages로 배포됩니다.

- **배포 주소**: https://ahyeonine.github.io/moneybox_fw01/
- **스택**: React 18 + Vite 5 + React Router 6(HashRouter) · 지도 Leaflet(OSM) · 문서 렌더 marked/mermaid
- **다국어**: 한국어 / 영어 구현(ko/en). 정책상 지원 언어는 한·영·중(간체·번체)·일 — 키 구조는 확장 대비 유지
- **결제/회원**: 무결제 예약 + 현장 전액결제 · 로그인/회원가입 없이 예약 가능 · 이메일 OTP는 "수신 가능한 주소인지" 확인용(본인인증 아님) · 수령 시 지점 신분증 대조는 기존 POS 흐름

---

## 실행 방법

```bash
npm install
npm run dev                 # 개발 서버 (http://localhost:5173)
# 또는
npm run build && npm run preview
```

> 개발 서버(`npm run dev`)에서는 base 경로 없이 `http://localhost:5173/` 로 뜹니다.
> `npm run preview`는 배포와 동일하게 `/moneybox_fw01/` 하위 경로로 서비스됩니다.

---

## 화면(서피스) 구성

상단 탭바로 서로 다른 사용자용 시스템을 전환합니다(실제로는 별도 시스템, 데모 편의상 한 앱에서 탭 전환).

| 서피스 / 경로 | 대상 | 설명 |
|---|---|---|
| **외국인 웹사이트 V1** `/site` | 고객 | 지점수령예약. 홈 → 신청(STEP A 지점선택 → STEP B 지점상세+금액 → 정보 → 확인 → 동의 → 완료). **원화 살 때(외화→원화)만** 지원 |
| ↳ `/site/lookup` | 고객 | 예약조회(예약번호+이메일) → 취소/변경 |
| ↳ `/site/about` · `/site/esim` · `/site/branches` · `/site/kiosks` | 고객 | 회사 소개 / eSIM 더미 / 지점·키오스크 안내 |
| **외국인 사이트 2안 V2** `/site2` | 고객 | WOWPASS 참고 대안 플로우: **금액 입력 → 호텔/역 검색·"찾아드릴게요"로 지점 선택 → 예약**(실제 예약 플로우로 연결). Leaflet 실지도 + Nominatim 검색 + 현위치 |
| **CEMS (지점 어드민)** `/cems` | 지점 운영자 | 각 지점이 로그인해 쓰는 어드민. 예약관리 + 환율관리 + 한도관리(통화별 최소·단위·최대, 상한 USD 9,999) |
| **POS** `/pos` | 지점 직원 | 예약 검색 → 신분증 대조 → 거래완료(베스트레이트 정산 시뮬레이션) |
| **이메일** `/email` | 운영 | 발송 이메일(예약확인·리마인더·OTP 등) 이력·미리보기 |
| **기획문서** `/docs` | 내부 | `docs-plan/` 문서 뷰어(IA·구조도·플로우·API·데이터모델·상태도·정책) |

> CEMS는 **지점용 어드민**입니다. 한도(최소/단위/최대)·환율은 각 지점이 자기 CEMS에서 설정하며,
> 프로토타입은 지점 계정 분리를 시뮬레이션하지 않으므로 **로그인 지점 1곳**을 대표해 보여줍니다.

---

## 확정 정책 요약

전문은 `/docs` → **07_정책.md** 참고. 프로토타입 동작도 아래에 맞춰 정렬돼 있습니다.

- **거래 방향**: 원화 살 때(외화→원화, 매입)만. 매각 미지원(방향 토글 미노출)
- **환율**: 전 고객 동일 단일 환율. "신청하기" 클릭 시점에 픽스. 적용환율 = 지점이 CEMS에서 설정하는 외국인 웹사이트 매입환율
- **베스트레이트 보장**: 정산 시 예약환율 vs 오늘환율 중 고객에게 유리한 쪽 적용
- **한도(지점이 CEMS에서 설정)**: 최소 = 기본 USD 100 상당액(통화별 환산) · 건당 최대 = 지점 설정(상한 USD 9,999 상당액) · 신청단위 = 지점 설정
- **수령/리드타임**: 준비일수 제한 없음(예약일 당일부터) · 수령 범위 예약일 ~ 최대 2주(14일)
- **취소**: 컷오프 없음(수령기한 경과 전까지 취소 가능)
- **리마인더 응답**: "방문 안 함" → 즉시 취소, "방문 예정" → 유지(+재고 차감), 무응답 → 수령기한 대기 후 자동취소
- **노쇼**: 신규예약 차단 없음(안내 문구만)
- **회원**: 예약에는 불필요. 선택 회원가입은 환율보장 쿠폰용(이름·이메일 인증)

---

## 데모용 시드 데이터

| 예약번호 | 이메일 | 상태 |
|---|---|---|
| `RSV-20260728-0001` | john@example.com | 예약(BOOKED) |
| `RSV-20260728-0002` | yuki@example.com | 예약(BOOKED) |
| `RSV-20260725-0005` | david@example.com | 완료(COMPLETED) |
| `RSV-20260724-0006` | akira@example.com | 취소(CANCELLED) |

> 기준일(오늘)은 `2026-07-30`으로 시뮬레이션됩니다. 어드민 상단 SimBar의 "하루 넘기기 / 자동취소 실행"으로
> 수령기한 경과 → 자동취소 흐름을 확인할 수 있습니다(실제 스케줄러 없음).

---

## 프로젝트 구조

```
src/
├─ main.jsx / App.jsx           진입점 · 라우팅(HashRouter)
├─ i18n/strings.js              다국어(ko/en) 사전 + useI18n()
├─ store/                       전역 상태(Context)
│   ├─ ReservationContext       예약 상태 + 시뮬레이션 기준일 + countNoShow
│   ├─ SettingsContext          지점 한도(최소·단위·최대) 설정 상태
│   ├─ RatesContext · EmailContext · BookingContext
├─ data/                        목데이터(branches · rates · kiosks · seedReservations · docRefs)
├─ lib/                         검증 · 날짜/시간슬롯 · 포맷 · 예약번호 유틸
├─ components/                  RootLayout · TopTabs · CustomerSite · Modal · SimBar · DevNote 등
└─ pages/
   ├─ Home · BookingFlow · LookupPage · AboutPage · Site2 …    (고객)
   ├─ cems/                     ForeignReservationAdmin · RateManagement · LimitManagement …
   ├─ pos/                      PosHome · PosReservationSearch · PosTransaction …
   ├─ EmailAdmin.jsx            이메일 이력
   └─ DocsViewer.jsx            기획문서 뷰어(docs-plan/)

docs-plan/                      기획문서(뷰어에서 렌더): 01_IA · 02_구조도 · 03_플로우 · 04_API · 05_데이터모델 · 06_상태도 · 07_정책
```

- 화면 ↔ 기획문서 연결은 `src/data/docRefs.js`(양방향)와 화면 내 `DevNote`의 "자세히:" 링크로 탐색합니다.

---

## 배포 (GitHub Pages)

- `.github/workflows/deploy.yml`가 **main 브랜치 push** 시 `npm install → npm run build → Pages 배포`를 자동 실행합니다.
- Vite `base`는 `'/moneybox_fw01/'` 로 고정(레포명과 일치). GitHub Pages 하위 경로 배포용입니다.

### 다른 계정에서 이어받아 쓰기

이 프로토타입을 **본인(또는 다른) GitHub 계정**에서 그대로 운영하려면:

1. **레포 복제**: 이 레포를 새 계정으로 Fork 하거나, 새 레포를 만들고 코드를 push 합니다.
   ```bash
   git clone https://github.com/ahyeonine/moneybox_fw01.git
   cd moneybox_fw01
   git remote set-url origin https://github.com/<새계정>/<새레포명>.git
   git push -u origin main
   ```
2. **GitHub Pages 활성화**: 새 레포 → Settings → Pages → **Source: GitHub Actions** 선택.
   push 되면 `Deploy to GitHub Pages` 워크플로가 돌고, 완료 후 `https://<새계정>.github.io/<새레포명>/` 로 열립니다.
3. **레포명이 다르면 base 경로 변경**: `vite.config.js`의 `base`를 `'/<새레포명>/'` 로 맞춥니다.
   레포명을 그대로 `moneybox_fw01`로 쓰면 수정할 필요 없습니다.
   ```js
   // vite.config.js
   export default defineConfig({ base: '/<새레포명>/', plugins: [react()] })
   ```
   > 사용자·조직 페이지(`<계정>.github.io` 레포)로 배포하는 경우엔 `base: '/'` 로 둡니다.
4. **커스텀 도메인(선택)**: Pages → Custom domain 설정 시에도 base는 `'/'`.

> 코드에 API 키·비밀값은 없습니다(전부 목데이터·keyless). 지도는 OpenStreetMap 타일 + Nominatim 지오코딩을 키 없이 사용합니다.

---

프로토타입 (mock data, no backend). 정책 수치는 `docs-plan/07_정책.md` 기준으로 확정·반영돼 있습니다.

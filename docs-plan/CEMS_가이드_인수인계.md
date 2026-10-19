# CEMS 지점 운영 가이드 — 작업 인수인계

새 Claude Code 세션에서 이 작업을 이어 할 때 먼저 읽는 문서예요.
새 세션에 "docs-plan/CEMS_가이드_인수인계.md 읽고 CEMS 가이드 작업 이어서 해줘"라고 말하면 돼요.

## 어디에 있나
- 브랜치: `claude/cems-guide-work-o64goc` (`claude/magical-mccarthy-ly947s`에서 이어 받음. main에는 아직 머지 안 됨, PR 없음)
- 가이드 본체: `public/branch-guide/`
  - `index.html` — 화면 틀(렌더러·CSS·검색·라우팅 `#/slug`, `#/slug/anchor`)
  - `content.js` — 모든 내용(`window.GUIDE`). 페이지 추가·수정은 거의 여기서만 함
  - `img/` — 개인정보 가림 처리한 CEMS 캡처
- `public/branch-guide.html` — `branch-guide/`로 리다이렉트

## content.js 구조
- `nav`: 탭 그룹(`tab`, `desc`, `color`)과 페이지 slug 순서
- `pages[slug]`: `title`, `lead`, `blocks`, `related`, `pending`
  - `pending: true` → "준비 중" 페이지. 캡처를 받으면 `blocks`를 채우고 `pending` 삭제
- `briefs[slug]`: 첫 화면 "기능 한눈에 보기"에 나오는 메뉴별 한 줄 설명
- `scenarios`: 상황별 가이드 카드 `{group, items:[{id, title, path:[slug], steps:[html]}]}`
- 블록 종류: HTML 문자열, `figure`(src, caption, narrow, marks[{box:[x%,y%,w%,h%], title, desc}]),
  `callout`(tip/warn/danger), `cards`, `table`, `steps`, `checklist`, `services`,
  `blank`(사용자 설명 필요 자리), `scenario-index`, `scenarios`

## 작업 규칙 (사용자 요청)
- 담당자 이름·연락처는 넣지 않음
- 노션 매뉴얼과 실제 화면이 다르면 추측하지 말고 `blank`로 비워 두고 사용자에게 물어봄
- 저장소가 공개라서 캡처의 고객 이름·전화·계좌·실명번호·IP는 모자이크, 신분증 이미지는 완전히 가림
- 하단 오버레이(평환 버튼, 채팅 아이콘, Windows 워터마크)는 잘라냄
- 노션 링크(URL)는 저장소에 넣지 않음. 노션 내용은 참고해서 가이드 본문으로 옮겨 씀
- 노션 이미지는 쓰지 않음(옛 화면일 수 있음). 사용자가 보낸 캡처만 사용
- PR은 사용자가 요청할 때만

## 확정된 업무 사실 (사용자 확인 완료)
- 진행상태: 입금대기 / 입금완료(입금된 건 전체, 이후 단계 무관) / 입금취소 / 수령대기(표에서는 고객수령대기) / 처리완료 / 예약금반환
- 처리완료 = POS에서 예약을 정상적으로 불러와 거래 진행해 종결 (POS 거래 끝나면 자동)
- 예약금반환 = CEMS 환전예약정보 창의 처리완료 버튼으로 예약금 환불만 진행해 종결.
  자동 환불 아님. POS 필요 없음. 계수 후 고객에게 직접 전달
- POS를 못 쓸 때: 처리완료 → 외환등록으로 거래 등록
- 낙전: 수령 예정일로부터 3일 지나도 미수령
- 입력방식 앞 빨간 ■ = 신분증 스캔 패스
- 예약금 3%
- 실현수익 = 매각수량×매각환율 − 매각수량×평균환율
- 외환시재 = 직전 + 매입 − 매각
- 평환 계산기 실현손익 = 매각수량 × (매각환율 − 현재 평환), 매각해도 평환은 변동 없음
- 거래번호 영문자: P 고객거래(POS·외환등록) / R 환전예약 / O 온라인환전 / K 무인환전기 / M 설정 B2B.
  지점·본사 간 거래도 B2B로 잡지 않으면 P
- B2B: 1단계 매출처 → 2단계 거래량 → 3단계 매입처. 1단계 **매출처**에서 지점을 고르면 보유 수량을 불러옴
  (노션의 '매입처' 표기는 틀림). 노션의 은행계좌관리·본점매매는 현재 설정 메뉴에 없음

## 남은 일
1. 머니 24h 6개 페이지 작성 완료. 남은 빈칸(빨간 줄·초기화, 무인기 마감 순서, SMS 설정수량, 준비금설정 용도)은
   사내 노션 무인환전기 매뉴얼 내용을 사용자에게 받아 가이드 본문으로 채움. `m24-reserve` 캡처는 아직 없음.
2. `set-b2b-sell`(B2B 매각 요청), `set-hours`(영업시간) 캡처 받아 채우기 (B2B 화면 캡처는 반영 완료)
   평균환율 계산기(평환): layout 페이지에 화면·결과 설명 완료 (USD 매각 캡처, 매각 대금 행 포함. 매입 결과 화면은 캡처 없음)
3. 빈칸: 입금관리 사용 여부(online-deposit, 사용자가 보류), 기간별 매출조회 사용법(rsv-sales)
4. 공개 범위(공개/비공개)와 main 머지 시점 결정

## 확인 방법
```
npm run build && cp -r public/branch-guide/* dist/branch-guide/ && npx vite preview --port 4173
# http://localhost:4173/moneybox_fw01/branch-guide/#/home  (vite base가 /moneybox_fw01/)
```
Playwright로 32개 페이지 전부 열어 콘솔 에러가 없는지 확인하고 스크린샷으로 레이아웃 검토.

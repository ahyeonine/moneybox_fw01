/*
 * CEMS 지점 운영 가이드 — 콘텐츠
 * ------------------------------------------------------------
 * 화면(틀)은 index.html, 글은 이 파일에서만 고칩니다.
 *
 * nav     : 좌측 메뉴 그룹과 순서 (이 순서대로 이전/다음이 이어짐)
 *           tab: CEMS 상단 탭 이름(있으면 서비스 그룹으로 표시), color: 그룹 색
 * pages   : slug → { title, lead, blocks, related }
 *           pending: true 이면 '준비 중' 페이지로 표시 (캡처를 받으면 blocks를 채우고 pending 제거)
 *   { type: 'services' } : 가이드 소개용 — 상단 탭별 메뉴 현황 카드 (nav에서 자동 생성)
 * blocks  : HTML 문자열, 또는 아래 타입 객체
 *   { type: 'figure', src, caption, marks: [{ box: [x%, y%, w%, h%], title, desc }] }
 *   { type: 'callout', tone: 'tip'|'warn'|'danger', html }
 *   { type: 'cards', items: [{ to, title, desc }] }
 *   { type: 'table', head: [...], rows: [[...], ...] }
 *   { type: 'steps', items: [[제목, 설명], ...] }
 *   { type: 'checklist', items: [문구 | [문구, 보조설명], ...] }
 * box 좌표는 스크린샷 기준 % (왼쪽, 위, 너비, 높이).
 *
 * 스크린샷(img/)은 공개 저장소에 올라가므로 고객 이름·연락처·접속 IP는 반드시 가린 뒤 넣는다.
 */
window.GUIDE = {
  title: 'CEMS 지점 운영 가이드',
  footer: '2026-10-06 캡처 화면 기준 · 고객 개인정보는 가림 처리했어요 · 화면이 바뀌면 이 가이드도 함께 업데이트돼요.',
  alias: { status: 'home', cems: 'exchange-request', pos: 'home' },

  nav: [
    { group: '시작하기', pages: ['home', 'layout'] },
    { group: '머니 익스체인지', tab: true, desc: '유인지점 창구', color: '#1170ff',
      pages: ['exchange-request', 'ex-rate', 'ex-cashflow', 'ex-closing', 'ex-daily'] },
    { group: '머니 24h', tab: true, desc: '무인환전기', color: '#00a37a',
      pages: ['m24-request', 'm24-rate', 'm24-closing', 'm24-daily', 'm24-cash', 'm24-reserve'] },
    { group: '환전예약', tab: true, desc: '예약 고객', color: '#7a4dff',
      pages: ['reservation', 'rsv-vaccount', 'rsv-rate', 'rsv-sales', 'rsv-holiday'] },
    { group: '온라인환전', tab: true, desc: '온라인 신청 고객', color: '#ff7a1a',
      pages: ['online-deposit', 'onl-pickup', 'onl-refund', 'onl-receivable', 'onl-rate'] },
    { group: '설정', tab: true, desc: '공통 설정', color: '#5b6b85',
      pages: ['rate', 'set-b2b', 'set-b2b-sell', 'set-hours', 'set-basic', 'set-notice'] },
    { group: '참고', pages: ['terms'] },
  ],

  pages: {
    /* ───────────── 시작하기 ───────────── */
    home: {
      title: '가이드 소개',
      lead: '지점에서 쓰는 CEMS(환전 관리시스템)의 화면과 버튼을 상단 탭 · 좌측 메뉴 순서 그대로 정리했어요.',
      blocks: [
        '<h2>서비스별 가이드</h2>',
        '<p class="muted">CEMS 상단 탭 다섯 개와 그 아래 좌측 메뉴를 그대로 옮겼어요. 메뉴를 누르면 해당 화면 설명으로 이동해요.</p>',
        { type: 'services' },
        '<h2>처음이라면 여기부터</h2>',
        { type: 'steps', items: [
          ['<a href="#/layout">화면 구성 살펴보기</a>', '상단 탭, 지점 선택, 좌측 메뉴가 어디 있는지부터 확인하세요.'],
          ['<a href="#/terms">표기·용어 정리</a>', '매입·매각, 입력방식, 거래번호 읽는 법을 알아두세요.'],
          ['<a href="#/exchange-request">환전신청관리</a>', '가장 자주 여는 화면 — 우리 지점 환전 거래 원장이에요.'],
        ] },
        { type: 'callout', tone: 'tip', html: '<p><b>화면 위 주황색 번호</b>는 아래 설명 번호와 짝이에요. 설명에 마우스를 올리면 화면 위치가 강조되고, 화면을 누르면 크게 보면서 번호별 설명을 볼 수 있어요.</p>' },
        '<h2>이 가이드의 기준</h2>',
        '<ul>' +
          '<li>2026년 10월 6일 캡처한 지점 CEMS 화면 기준이에요. 화면은 업데이트에 따라 조금 달라질 수 있어요.</li>' +
          '<li>금액은 모두 원(KRW) 기준이고, 외화는 통화 코드(USD, JPY…)와 함께 따로 표기해요.</li>' +
          '<li>캡처 속 고객 이름·연락처·접속 정보는 가림 처리했어요.</li>' +
          '<li>‘준비 중’ 표시가 있는 메뉴는 화면 설명을 정리하고 있어요.</li>' +
        '</ul>',
      ],
    },

    layout: {
      title: '화면 구성 살펴보기',
      lead: 'CEMS는 상단 탭으로 서비스를 고르고, 지점(또는 무인기)을 선택한 뒤 좌측 메뉴에서 화면을 여는 구조예요.',
      blocks: [
        { type: 'figure', src: 'img/cems-exchange-request.png', caption: 'CEMS 기본 화면 (머니 익스체인지 › 환전신청관리)', marks: [
          { box: [0.0, 12.46, 53.34, 10.72], title: '상단 탭', desc: '<b>머니 익스체인지 · 머니 24h · 환전예약 · 온라인환전 · 설정</b> 다섯 가지 서비스로 나뉘어요. 지금 보고 있는 탭은 진한 남색이에요.' },
          { box: [0.94, 25.51, 14.41, 8.7], title: '지점 · 무인기 선택', desc: '어느 지점(또는 무인환전기)의 데이터를 볼지 고르는 곳이에요. 누르면 목록이 열려요.' },
          { box: [80.9, 25.8, 18.37, 8.12], title: '기본 지점', desc: '로그인하면 처음 열리는 지점이에요. <span class="btnlabel">변경</span>으로 바꿀 수 있어요.' },
          { box: [85.07, 0.87, 12.21, 6.09], title: '계정 전환 · 로그아웃', desc: '다른 계정으로 바꾸거나 로그아웃해요. 아래 작은 글씨는 접속 시각과 IP예요.' },
          { box: [0.94, 42.17, 13.26, 51.59], title: '좌측 메뉴', desc: '상단 탭에 따라 메뉴가 바뀌어요. 지금 열린 메뉴는 파란색이에요.' },
        ] },
        '<h2>탭별 좌측 메뉴</h2>',
        { type: 'table', head: ['상단 탭', '대상', '좌측 메뉴'], rows: [
          ['머니 익스체인지', '유인지점 창구', '<a href="#/exchange-request">환전신청관리</a> · <a href="#/ex-rate">환전율관리</a> · <a href="#/ex-cashflow">Cash Flow</a> · <a href="#/ex-closing">시재관리·마감</a> · <a href="#/ex-daily">일자별 마감조회</a>'],
          ['머니 24h', '무인환전기', '<a href="#/m24-request">환전신청관리</a> · <a href="#/m24-rate">환전율관리</a> · <a href="#/m24-closing">시재관리·마감</a> · <a href="#/m24-daily">일자별 마감조회</a> · <a href="#/m24-cash">시재금현황</a> · <a href="#/m24-reserve">준비금설정</a>'],
          ['환전예약', '예약 고객', '<a href="#/reservation">환전예약관리</a> · <a href="#/rsv-vaccount">가상계좌입금조회</a> · <a href="#/rsv-rate">환전율관리</a> · <a href="#/rsv-sales">기간별 매출조회</a> · <a href="#/rsv-holiday">휴일관리</a>'],
          ['온라인환전', '온라인 신청 고객', '<a href="#/online-deposit">입금관리</a> · <a href="#/onl-pickup">수령관리</a> · <a href="#/onl-refund">취소환불관리</a> · <a href="#/onl-receivable">미수금 조회</a> · <a href="#/onl-rate">환전율관리</a>'],
          ['설정', '공통', '<a href="#/rate">환전율관리</a> · <a href="#/set-b2b">B2B</a> · <a href="#/set-b2b-sell">B2B 매각 요청</a> · <a href="#/set-hours">영업시간</a> · <a href="#/set-basic">기초설정</a> · <a href="#/set-notice">공지사항</a>'],
        ] },
        { type: 'callout', tone: 'warn', html: '<p><b>지점 선택을 먼저 확인하세요.</b> 같은 화면이라도 선택한 지점·무인기에 따라 보이는 거래가 달라요.</p>' },
      ],
      related: ['exchange-request', 'terms'],
    },

    /* ───────────── 머니 익스체인지 ───────────── */
    'exchange-request': {
      title: '환전신청관리',
      lead: '선택한 지점에서 발생한 환전 거래 원장을 조회하고, 창구에서 처리한 건을 수기로 등록하는 화면이에요.',
      blocks: [
        { type: 'figure', src: 'img/cems-exchange-request.png', caption: '머니 익스체인지 › 환전신청관리', marks: [
          { box: [15.81, 50.72, 70.93, 6.38], title: '조회 조건 (1줄)', desc: '등록기간(시작~종료), 통화, 환전구분, 입력방식, 신분증확인, 거래구분으로 거래를 좁혀요. 등록기간 기본값은 오늘이에요.' },
          { box: [15.81, 59.28, 48.38, 6.67], title: '조회 조건 (2줄) + 검색', desc: '고객명, POS, 국적, 거래번호로 특정 거래를 찾아요. 조건을 넣고 <span class="btnlabel">검색</span>을 눌러주세요.' },
          { box: [81.63, 68.12, 16.08, 7.25], title: '외환등록 · 상품권등록', desc: '창구에서 처리한 거래를 <b>수기로 등록</b>하는 버튼이에요.' },
          { box: [16.08, 81.59, 81.63, 18.41], title: '거래 원장 표', desc: '조회된 거래가 최근 순으로 보여요. 위에 <b>총 N건</b>이 함께 나와요. 고객명을 누르면 상세를 볼 수 있어요.' },
        ] },
        '<h2>표 컬럼 읽는 법</h2>',
        { type: 'table', head: ['컬럼', '설명'], rows: [
          ['입력방식', '거래가 어떻게 들어왔는지 — <b>예약</b>, <b>POS 자동</b>, <b>POS 수동</b> 등 (<a href="#/terms">표기 정리</a>)'],
          ['등록일자', '등록 일시와 그 아래 <b>거래번호</b>'],
          ['환전고객명', '고객명(일부 가림). 누르면 상세'],
          ['신분증확인', '<b>Y</b> 확인함 / <b>N</b> 확인 안 함'],
          ['실명구분 · 실명번호', '주민등록증, 여권, 해당없음 등 / 번호는 일부 가림'],
          ['국적부호', 'KR, TW, JP 같은 국가 코드'],
          ['환전구분', '<span class="badge b-red">매입</span> 고객이 외화를 팖 · <span class="badge b-blue">매각</span> 고객이 외화를 삼'],
          ['결제', '현금, 가상계좌 등'],
          ['통화 · 거래금액', '외화 통화와 금액'],
          ['환율 · 원화금액', '적용 환율과 원화 환산 금액. 원화금액 헤더의 화살표로 정렬해요'],
          ['POS', '거래를 처리한 POS 번호'],
        ] },
      ],
      related: ['m24-request', 'terms'],
    },

    /* ───────────── 머니 24h ───────────── */
    'm24-request': {
      title: '환전신청관리',
      lead: '머니 24h 탭에서는 무인환전기를 골라 그 기기에서 일어난 거래를 봐요. 화면 구성은 지점 환전신청관리와 같아요.',
      blocks: [
        { type: 'figure', src: 'img/cems-24h-request.png', caption: '머니 24h › 환전신청관리', marks: [
          { box: [10.45, 11.03, 10.77, 9.49], title: '머니 24h 탭', desc: '무인환전기 전용 탭이에요.' },
          { box: [0.69, 22.56, 13.19, 7.69], title: '무인환전기 선택', desc: '조회할 무인기를 골라요(예: 홍대지점 무인환전기).' },
          { box: [0.69, 37.31, 13.4, 54.62], title: '무인기 전용 메뉴', desc: '지점 메뉴에 더해 <b>시재금현황</b>, <b>준비금설정</b>이 있어요. 대신 Cash Flow는 없어요.' },
          { box: [19.42, 72.18, 4.54, 27.82], title: '입력방식 = 키오스크', desc: '무인기 거래는 입력방식이 <b>키오스크</b>로 자동 기록돼요.' },
        ] },
        { type: 'callout', tone: 'tip', html: '<p>조회 조건, 표 컬럼, 외환등록·상품권등록 버튼은 <a href="#/exchange-request">지점 환전신청관리</a>와 같아요.</p>' },
      ],
      related: ['exchange-request', 'layout'],
    },

    /* ───────────── 환전예약 ───────────── */
    reservation: {
      title: '환전예약관리',
      lead: '고객이 예약한 환전 건의 진행·입금·수령 상태를 한 화면에서 확인해요.',
      blocks: [
        { type: 'figure', src: 'img/cems-reservation.png', caption: '환전예약 › 환전예약관리', marks: [
          { box: [15.73, 43.44, 77.04, 5.48], title: '기간 조건', desc: '<b>신청기간</b>(기본값 오늘), <b>입금기간</b>, <b>처리기간</b>, <b>수령기간</b> 중 필요한 기준으로 날짜를 넣어요.' },
          { box: [15.73, 50.7, 33.03, 5.86], title: '진행상태 · 환전유형 · 통화', desc: '진행상태 옆 ⓘ 아이콘에서 상태 설명을 볼 수 있어요. 환전유형은 매입/매각이에요.' },
          { box: [49.08, 50.7, 22.9, 5.86], title: '검색어', desc: '<b>거래번호, 예약자명, 연락처</b> 중 하나로 찾아요. 앞의 선택상자에서 검색 기준을 고를 수 있어요.' },
          { box: [72.3, 50.7, 11.82, 5.86], title: '낙전여부', desc: '옆의 ⓘ 아이콘에서 설명을 볼 수 있어요.' },
          { box: [84.59, 50.7, 4.27, 5.86], title: '검색', desc: '조건을 넣고 눌러요.' },
          { box: [19.0, 63.69, 6.7, 36.31], title: '거래번호', desc: '파란 링크를 누르면 예약 상세가 열려요.' },
          { box: [25.54, 63.69, 12.03, 36.31], title: '진행상태 · 입금상태', desc: '예: <b>고객수령대기</b>(아직 안 찾아감) / <b>처리완료</b>(수령 끝), <b>입금완료</b>.' },
          { box: [70.08, 63.69, 28.39, 36.31], title: '적용환율 · 거래금액 · 수령금액 · 예약금', desc: '수령금액은 고객에게 지급(또는 고객이 지급)할 원화 금액이에요.' },
        ] },
        '<h2>표 컬럼</h2>',
        { type: 'table', head: ['컬럼', '설명'], rows: [
          ['거래번호', '<code>2610-R…</code> 형식. 누르면 상세'],
          ['진행상태', '고객수령대기, 처리완료 등'],
          ['입금상태', '입금완료 등'],
          ['수령일시', '고객이 지점에 오기로 한 날짜·시각'],
          ['예약자명 · 휴대전화 · 국적', '예약 고객 정보'],
          ['환전유형 · 통화', '<span class="badge b-red">매입</span> / <span class="badge b-blue">매각</span>, 통화 코드'],
          ['적용환율 · 거래금액 · 수령금액', '외화 금액과 원화 환산 금액'],
          ['예약금', '예약 시 받은 금액'],
        ] },
        { type: 'callout', tone: 'tip', html: '<p>오늘 찾으러 올 고객을 보려면 <b>수령기간</b>을 오늘로 넣고, 진행상태를 <b>고객수령대기</b>로 좁혀서 검색하세요.</p>' },
      ],
      related: ['online-deposit', 'terms'],
    },

    /* ───────────── 온라인환전 ───────────── */
    'online-deposit': {
      title: '입금관리',
      lead: '온라인으로 환전을 신청한 고객의 입금과 수령 진행 상황을 확인하는 화면이에요.',
      blocks: [
        { type: 'figure', src: 'img/cems-online-deposit.png', caption: '온라인환전 › 입금관리', marks: [
          { box: [0.95, 37.05, 13.36, 45.51], title: '온라인환전 메뉴', desc: '<b>입금관리 · 수령관리 · 취소환불관리 · 미수금 조회 · 환전율관리</b>로 나뉘어요.' },
          { box: [15.94, 44.36, 74.12, 5.9], title: '조회 조건', desc: '신청기간(기본 최근 1주일), 환전구분, 본지점, 수령상태와 <b>거래번호 또는 이름</b>으로 찾아요.' },
          { box: [90.37, 44.36, 7.31, 5.9], title: '초기화 · 검색', desc: '<span class="btnlabel">초기화</span>는 조건을 처음 값으로 되돌려요.' },
          { box: [59.76, 57.44, 25.2, 42.56], title: '입금액 · 입금상태 · 입금일시', desc: '입금액은 <b>이체수수료 포함</b> 금액이에요. 입금이 확인되면 입금완료와 입금 시각이 찍혀요.' },
          { box: [84.8, 57.44, 6.31, 42.56], title: '수령상태', desc: '<b>환전중</b>(아직 수령 전) / <b>수령완료</b>.' },
          { box: [90.95, 57.44, 7.52, 42.56], title: '수익금', desc: '거래별 수익금이에요.' },
        ] },
        '<h2>표 컬럼</h2>',
        { type: 'table', head: ['컬럼', '설명'], rows: [
          ['거래번호', '<code>2610-O…</code> 형식'],
          ['신청일시 · 이름', '온라인 신청 시각과 고객명'],
          ['환전구분 · 통화 · 환율', '매입/매각, 통화, 적용 환율'],
          ['입금액 (이체수수료 포함)', '고객이 보낸 원화 금액'],
          ['입금상태 · 입금일시', '입금완료 여부와 시각'],
          ['수령상태', '환전중 / 수령완료'],
          ['수익금', '거래별 수익금'],
        ] },
      ],
      related: ['reservation', 'rate'],
    },

    /* ───────────── 설정 ───────────── */
    rate: {
      title: '환전율관리',
      lead: '통화별 오늘 환율(사실 때 · 기준환율 · 파실 때)과 지점·무인기별 외화 보유 현황을 보는 화면이에요.',
      blocks: [
        { type: 'figure', src: 'img/cems-rate.png', caption: '설정 › 환전율관리', marks: [
          { box: [42.67, 10.89, 10.64, 9.24], title: '설정 탭', desc: '상단 <b>설정</b> 탭에서 열어요.' },
          { box: [0.94, 24.68, 13.25, 54.05], title: '설정 메뉴', desc: '<b>환전율관리 · B2B · B2B 매각 요청 · 영업시간 · 기초설정 · 공지사항</b>이 있어요.' },
          { box: [16.07, 30.13, 78.61, 10.38], title: '통화 탭', desc: 'USD, JPY, CNY, EUR… 와 <b>상품권</b>까지 통화를 골라요.' },
          { box: [16.07, 41.27, 81.59, 6.84], title: '사실 때 · 기준환율 · 파실 때', desc: '고객이 외화를 <b>살 때</b>(매각)와 <b>팔 때</b>(매입) 적용하는 환율, 그리고 기준환율이에요.' },
          { box: [16.07, 49.49, 81.59, 50.51], title: '지점별 보유 현황', desc: '지점과 무인환전기별로 <b>보유량</b>, <b>평균환율</b>, <b>원화금액</b>(보유량 × 평균환율)이 보여요.' },
        ] },
        { type: 'callout', tone: 'tip', html: '<p>다른 지점에 외화가 넉넉한지 확인할 때 이 표를 보면 돼요.</p>' },
      ],
      related: ['exchange-request', 'online-deposit'],
    },

    /* ───────────── 준비 중 (캡처 받으면 채움) ───────────── */
    'ex-rate': { title: '환전율관리', lead: '머니 익스체인지(유인지점)의 환전율관리 화면이에요.', pending: true, blocks: [] },
    'ex-cashflow': { title: 'Cash Flow', lead: '지점의 현금 흐름을 보는 화면이에요.', pending: true, blocks: [] },
    'ex-closing': { title: '시재관리·마감', lead: '지점 시재를 관리하고 마감하는 화면이에요.', pending: true, blocks: [] },
    'ex-daily': { title: '일자별 마감조회', lead: '지난 마감 내역을 날짜별로 조회하는 화면이에요.', pending: true, blocks: [] },
    'm24-rate': { title: '환전율관리', lead: '무인환전기의 환전율관리 화면이에요.', pending: true, blocks: [] },
    'm24-closing': { title: '시재관리·마감', lead: '무인환전기 시재를 관리하고 마감하는 화면이에요.', pending: true, blocks: [] },
    'm24-daily': { title: '일자별 마감조회', lead: '무인환전기 마감 내역을 날짜별로 조회하는 화면이에요.', pending: true, blocks: [] },
    'm24-cash': { title: '시재금현황', lead: '무인환전기의 시재금 현황을 보는 화면이에요.', pending: true, blocks: [] },
    'm24-reserve': { title: '준비금설정', lead: '무인환전기 준비금을 설정하는 화면이에요.', pending: true, blocks: [] },
    'rsv-vaccount': { title: '가상계좌입금조회', lead: '환전예약 가상계좌 입금 내역을 조회하는 화면이에요.', pending: true, blocks: [] },
    'rsv-rate': { title: '환전율관리', lead: '환전예약에 적용하는 환전율관리 화면이에요.', pending: true, blocks: [] },
    'rsv-sales': { title: '기간별 매출조회', lead: '환전예약 매출을 기간별로 조회하는 화면이에요.', pending: true, blocks: [] },
    'rsv-holiday': { title: '휴일관리', lead: '환전예약 휴일을 관리하는 화면이에요.', pending: true, blocks: [] },
    'onl-pickup': { title: '수령관리', lead: '온라인환전 고객의 수령을 처리하는 화면이에요.', pending: true, blocks: [] },
    'onl-refund': { title: '취소환불관리', lead: '온라인환전 취소·환불을 처리하는 화면이에요.', pending: true, blocks: [] },
    'onl-receivable': { title: '미수금 조회', lead: '온라인환전 미수금을 조회하는 화면이에요.', pending: true, blocks: [] },
    'onl-rate': { title: '환전율관리', lead: '온라인환전에 적용하는 환전율관리 화면이에요.', pending: true, blocks: [] },
    'set-b2b': { title: 'B2B', lead: 'B2B 거래 관련 설정 화면이에요.', pending: true, blocks: [] },
    'set-b2b-sell': { title: 'B2B 매각 요청', lead: 'B2B 매각을 요청하는 화면이에요.', pending: true, blocks: [] },
    'set-hours': { title: '영업시간', lead: '지점 영업시간을 설정하는 화면이에요.', pending: true, blocks: [] },
    'set-basic': { title: '기초설정', lead: '지점 기초 정보를 설정하는 화면이에요.', pending: true, blocks: [] },
    'set-notice': { title: '공지사항', lead: '본사 공지사항을 확인하는 화면이에요.', pending: true, blocks: [] },

    /* ───────────── 참고 ───────────── */
    terms: {
      title: '표기·용어 정리',
      lead: 'CEMS 표에 자주 나오는 표기를 모았어요.',
      blocks: [
        '<h2>환전구분</h2>',
        { type: 'table', head: ['표기', '뜻', '적용 환율'], rows: [
          ['<span class="badge b-red">매입</span>', '머니박스가 외화를 사들임 = <b>고객이 외화를 팖</b>', '파실 때'],
          ['<span class="badge b-blue">매각</span>', '머니박스가 외화를 팖 = <b>고객이 외화를 삼</b>', '사실 때'],
        ] },
        '<h2>입력방식</h2>',
        { type: 'table', head: ['표기', '뜻'], rows: [
          ['예약', '환전예약으로 들어온 거래'],
          ['POS 자동', 'POS에서 처리해 자동으로 기록된 거래'],
          ['POS 수동', 'POS에서 수동으로 입력한 거래'],
          ['키오스크', '무인환전기(머니 24h) 거래'],
        ] },
        '<h2>거래번호</h2>',
        '<p>거래번호는 <code>연월(YYMM)-영문 1자 + 숫자</code> 형식이에요. 영문자로 어디서 들어온 거래인지 알 수 있어요.</p>',
        { type: 'table', head: ['예시', '영문자', '거래 경로'], rows: [
          ['<code>2610-R3835829</code>', 'R', '환전예약'],
          ['<code>2610-P0932833</code>', 'P', 'POS'],
          ['<code>2610-K0218607</code>', 'K', '키오스크(무인환전기)'],
          ['<code>2610-O3564371</code>', 'O', '온라인환전'],
        ] },
        '<h2>기타</h2>',
        { type: 'table', head: ['표기', '뜻'], rows: [
          ['신분증확인 Y / N', '신분증을 확인함 / 확인 안 함'],
          ['실명구분', '주민등록증, 여권, 해당없음 등 실명 확인에 쓴 서류'],
          ['국적부호', 'KR(한국), TW(대만), JP(일본) 같은 국가 코드'],
          ['결제', '현금, 가상계좌 등 결제 수단'],
        ] },
      ],
      related: ['exchange-request', 'reservation'],
    },
  },
};

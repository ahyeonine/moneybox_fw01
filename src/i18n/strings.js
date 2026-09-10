// 다국어 문자열 (한국어 / 영어 2개 언어)
// 프로토타입 요구사항: 한국어 + 영어만 구현.
// 실제 서비스는 영어(기본)/중국어(간·번체)/일본어 확장 예정 → 키 구조 그대로 확장.

export const STRINGS = {
  // 공통
  'nav.lookup': { ko: '예약 조회', en: 'My Reservation' },
  'common.next': { ko: '다음', en: 'Next' },
  'common.prev': { ko: '이전', en: 'Back' },
  'common.cancel': { ko: '취소', en: 'Cancel' },
  'common.close': { ko: '닫기', en: 'Close' },
  'common.save': { ko: '저장', en: 'Save' },
  'common.search': { ko: '조회', en: 'Search' },
  'common.branch': { ko: '지점', en: 'Branch' },
  'common.currency': { ko: '통화', en: 'Currency' },
  'common.foreignAmount': { ko: '외화 금액', en: 'Foreign amount' },
  'common.krwAmount': { ko: '원화 금액', en: 'KRW amount' },
  'common.rate': { ko: '적용 환율', en: 'Rate' },
  'common.pickupDate': { ko: '수령 예정일', en: 'Pickup date' },
  'common.name': { ko: '예약자명 (여권 영문명)', en: 'Name (as in passport)' },
  'common.email': { ko: '이메일', en: 'Email' },
  'common.reservationNo': { ko: '예약번호', en: 'Reservation No.' },
  // 상태값
  'status.BOOKED': { ko: '예약', en: 'Booked' },
  'status.COMPLETED': { ko: '완료', en: 'Completed' },
  'status.CANCELLED': { ko: '취소', en: 'Cancelled' },

  // 예약 플로우 스텝 라벨
  'book.step3.limit': { ko: '한도', en: 'Limit' },
  'book.step5.title': { ko: '예약자 정보를 입력하세요', en: 'Enter your details' },
  'book.step5.namehint': { ko: '여권 영문 표기와 동일하게 입력', en: 'Match your passport exactly' },
  'book.otp.send': { ko: '인증번호 받기', en: 'Send code' },
  'book.otp.resend': { ko: '재발송', en: 'Resend' },
  'book.otp.verify': { ko: '확인', en: 'Verify' },
  'book.otp.placeholder': { ko: '6자리 숫자', en: '6-digit code' },
  'book.otp.demoPrefix': { ko: '(데모) 인증번호:', en: '(demo) code:' },
  'book.otp.verified': { ko: '이메일 인증 완료', en: 'Email verified' },
  'book.otp.badge': { ko: '인증완료', en: 'Verified' },
  'book.otp.expired': { ko: '코드가 만료됐어요, 재발송해주세요.', en: 'Code expired. Please resend.' },
  'book.otp.expiredShort': { ko: '만료됨', en: 'Expired' },
  'book.otp.wrong': { ko: '인증번호가 일치하지 않습니다.', en: "Code doesn't match." },
  'book.otp.locked': {
    ko: '틀린 횟수(5회)를 초과해 코드가 무효화됐어요. 재발송해주세요.',
    en: 'Too many wrong attempts (5). Code voided — please resend.',
  },
  'book.otp.needVerify': {
    ko: '다음 단계로 진행하려면 이메일 인증을 완료해 주세요.',
    en: 'Please verify your email to continue.',
  },
  'book.step6.title': { ko: '아래 내용으로 예약합니다', en: 'Review your reservation' },
  'book.step6.ratefixed': { ko: '예약 시 확정된 환율', en: 'Rate fixed at booking' },
  'book.step7.title': { ko: '안내 및 동의', en: 'Notices & consent' },
  'book.step7.noshow.t': { ko: '노쇼 안내', en: 'No-show notice' },
  'book.step7.noshow.d': {
    ko: '방문이 어려우실 경우 예약 조회에서 미리 취소해 주세요. 수령 예정일이 지나도록 방문하지 않으실 경우 예약이 자동으로 취소되며, 반복될 경우 서비스 이용에 제한이 있을 수 있습니다.',
    en: 'If you cannot visit, please cancel in advance in My Reservation. If you do not visit by the pickup date, your reservation is auto-cancelled, and repeated no-shows may restrict your use of the service.',
  },
  'book.step7.bestrate.t': { ko: '베스트레이트 보장', en: 'Best-rate guarantee' },
  'book.step7.bestrate.d': {
    ko: '현재 환율이 가장 유리해요. 혹시 방문하시는 날 환율이 더 좋아지면, 그날의 환율로 적용해드립니다.',
    en: "The current rate is the most favorable. If the rate improves by the day you visit, we'll apply that day's better rate.",
  },
  'book.step7.privacy.t': { ko: '개인정보 수집·이용 동의', en: 'Personal data consent' },
  'book.step7.privacy.d': {
    ko: '예약 처리 목적으로 예약자명·이메일을 수집하며, 예약 완료 후 관련 법령에 따라 보관 후 파기합니다.',
    en: 'We collect your name and email to process this reservation, stored and deleted per applicable law.',
  },
  'book.step7.agreeAll': { ko: '위 내용에 모두 동의합니다', en: 'I agree to all of the above' },
  'book.step7.more': { ko: '자세히보기', en: 'View details' },
  'book.step7.less': { ko: '접기', en: 'Collapse' },
  // 약관 전문 (프로토타입 더미 텍스트)
  'book.step7.noshow.full': {
    ko: '[노쇼정책 안내]\n1. 예약하신 외화(원화)는 수령 예정일까지 지점에서 준비됩니다.\n2. 방문이 어려우실 경우 수령 예정일 전에 미리 취소해 주세요.\n3. 수령 예정일이 지나도록 방문하지 않으실 경우 예약은 자동으로 취소되며, 반복적인 노쇼(미방문)가 확인될 경우 서비스 이용이 제한될 수 있습니다.\n4. 예약 시 확정된 환율은 취소 시 소멸되며, 재예약 시 재예약 시점의 환율이 적용됩니다.',
    en: '[No-show policy]\n1. Your reserved currency is prepared at the branch until the pickup date.\n2. If you cannot visit, please cancel before the pickup date.\n3. If you do not visit by the pickup date, your reservation is auto-cancelled, and repeated no-shows may restrict your use of the service.\n4. The rate fixed at booking is void on cancellation; a re-reservation uses the rate at that time.',
  },
  'book.step7.privacy.full': {
    ko: '[개인정보 수집·이용 동의]\n1. 수집 항목: 예약자명, 이메일\n2. 수집 목적: 예약 확인 및 안내 알림 발송\n3. 보유 기간: 거래 완료 후 1년',
    en: '[Personal data collection & use]\n1. Items: name, email\n2. Purpose: reservation confirmation and notifications\n3. Retention: 1 year after transaction completion',
  },
  // 이용약관 동의 (필수)
  'book.step7.terms.t': { ko: '[필수] 이용약관 동의', en: '[Required] Terms of service' },
  'book.step7.terms.d': {
    ko: '환전 예약 서비스 이용약관에 동의합니다.',
    en: 'I agree to the terms of service for the exchange reservation.',
  },
  'book.step7.terms.full': {
    ko: '[이용약관]\n1. 본 서비스는 온라인 무결제 환전 예약과 지점 현장 수령을 제공합니다.\n2. 예약 시 확정된 환율은 취소 시 소멸되며, 재예약 시 재예약 시점의 환율이 적용됩니다.\n3. 수령 시 본인 확인을 위해 신분증(여권)을 지참해야 합니다.\n4. 회사는 천재지변·지점 사정 등 부득이한 경우 예약을 취소할 수 있으며, 이 경우 즉시 안내합니다.',
    en: '[Terms of service]\n1. This service provides online no-payment exchange reservations with in-branch pickup.\n2. The rate fixed at booking is void on cancellation; a re-reservation uses the rate at that time.\n3. You must bring a valid ID (passport) for identity verification at pickup.\n4. The company may cancel a reservation in unavoidable cases (natural disaster, branch circumstances) and will notify you immediately.',
  },
  // 제3자 제공 동의 (필수)
  'book.step7.thirdparty.t': { ko: '[필수] 개인정보 제3자 제공 동의', en: '[Required] Third-party data sharing' },
  'book.step7.thirdparty.d': {
    ko: '예약 수령 지점 운영사에 예약자명·이메일·예약정보를 제공하는 데 동의합니다.',
    en: 'I agree to share my name, email, and reservation details with the pickup branch operator.',
  },
  'book.step7.thirdparty.full': {
    ko: '[개인정보 제3자 제공 동의]\n1. 제공받는 자: 수령 지점 운영사\n2. 제공 항목: 예약자명, 이메일, 예약정보(통화·금액·수령일)\n3. 제공 목적: 지점 현장 수령·거래 처리\n4. 보유·이용 기간: 거래 완료 후 관련 법령에 따라 보관 후 파기',
    en: '[Third-party data sharing]\n1. Recipient: the pickup branch operator\n2. Items: name, email, reservation details (currency, amount, pickup date)\n3. Purpose: in-branch pickup and transaction processing\n4. Retention: stored and deleted per applicable law after transaction completion',
  },
  // 수령 시 신분증(여권) 지참 안내
  'book.idnotice': {
    ko: '🪪 수령 시 본인 확인을 위해 신분증(여권)을 꼭 지참해 주세요.',
    en: '🪪 Please bring a valid ID (passport) for identity verification at pickup.',
  },
  'book.step8.title': { ko: '예약이 완료되었습니다', en: 'Reservation complete' },
  'book.step8.sub': {
    ko: '아래 예약번호로 조회·변경·취소할 수 있습니다. 확인 이메일이 발송되었습니다(시뮬레이션).',
    en: 'Use the number below to view, change, or cancel. A confirmation email was sent (simulated).',
  },
  'book.step8.gotoLookup': { ko: '예약 조회로 이동', en: 'Go to My Reservation' },
  'book.step8.newBooking': { ko: '새 예약하기', en: 'New reservation' },

  // 에러
  'err.amount.EMPTY': { ko: '금액을 입력하세요.', en: 'Please enter an amount.' },
  'err.amount.BELOW_MIN': { ko: '최소 금액 미만입니다.', en: 'Below the minimum amount.' },
  'err.amount.ABOVE_MAX': { ko: '최대 한도를 초과했습니다.', en: 'Exceeds the maximum limit.' },
  'err.email': { ko: '이메일 형식이 올바르지 않습니다.', en: 'Invalid email format.' },
  'err.name': { ko: '영문 이름을 정확히 입력하세요.', en: 'Enter a valid English name.' },
  'err.soldout.t': { ko: '예약이 불가합니다', en: 'Not available' },
  'err.soldout.d': {
    ko: '해당 지점·통화·기간에 재고가 소진되었습니다. 다른 조건으로 다시 시도해 주세요.',
    en: 'Stock is sold out for this branch/currency/date. Please try different options.',
  },
  'err.soldout.restart': { ko: '처음부터 다시', en: 'Start over' },
  'err.noshowBlocked': {
    ko: '반복된 노쇼로 인해 서비스 이용이 제한되었습니다',
    en: 'Your access is restricted due to repeated no-shows',
  },

  // 예약조회
  'lookup.title': { ko: '신청내역조회', en: 'My reservations' },
  'lookup.sub': { ko: '이름과 이메일로 신청내역을 조회하세요.', en: 'Look up your reservations with your name and email.' },
  'lookup.notfound': {
    ko: '일치하는 예약을 찾을 수 없습니다. 예약번호와 이메일을 확인하세요.',
    en: 'No matching reservation. Check your number and email.',
  },
  'lookup.detail': { ko: '예약 상세', en: 'Reservation details' },
  'lookup.listTitle': { ko: '조회 결과', en: 'Results' },
  'lookup.backToList': { ko: '목록으로', en: 'Back to list' },
  'lookup.confirmVisit': { ko: '방문 예정 확인 (리마인더 응답)', en: 'Confirm visit (reminder)' },
  'lookup.visitConfirmed.msg': {
    ko: '방문 예정이 확인되었습니다. 가용 시재가 배정(예약시재 반영)되었습니다.',
    en: 'Your visit is confirmed. Stock has been allocated for your reservation.',
  },
  'lookup.visitSoldOut.msg': {
    ko: '다른 고객이 이미 확정하여 재고가 소진되었습니다.',
    en: 'Another customer already confirmed and the stock is sold out.',
  },
  'lookup.visitConfirmedNote': {
    ko: '방문 예정이 확인된 예약입니다. (가용 시재 배정 완료)',
    en: 'Visit confirmed — stock allocated.',
  },
  'lookup.cancelBtn': { ko: '예약 취소', en: 'Cancel reservation' },
  'lookup.changeBtn': { ko: '예약 변경', en: 'Change reservation' },
  'lookup.cancelConfirm.t': { ko: '예약을 취소할까요?', en: 'Cancel this reservation?' },
  'lookup.cancelConfirm.d': {
    ko: '취소 후에는 되돌릴 수 없습니다. 지점 방문 없이 예약이 취소됩니다.',
    en: 'This cannot be undone. The reservation will be cancelled.',
  },
  'lookup.cancelled.msg': { ko: '예약이 취소되었습니다.', en: 'Your reservation has been cancelled.' },
  'lookup.onlyBookedEditable': {
    ko: '예약 상태에서만 취소·변경할 수 있습니다.',
    en: 'Only "Booked" reservations can be changed or cancelled.',
  },
  'lookup.change.title': { ko: '예약 변경', en: 'Change reservation' },
  'lookup.change.saved': { ko: '변경사항이 저장되었습니다.', en: 'Your changes have been saved.' },

  // 운영자
  'op.tx.title': { ko: '거래 처리', en: 'Process transaction' },
  'op.tx.sub': { ko: '예약번호로 조회 후 신분증 대조·거래완료를 처리하세요.', en: 'Look up by number, verify ID, then complete.' },
  'op.tx.lookupPlaceholder': { ko: '예약번호 입력 (예: RSV-20260728-0001)', en: 'Enter reservation no.' },
  'op.tx.idcheck': { ko: '신분증 대조 완료 (현장 OCR 시뮬레이션)', en: 'ID verified (on-site OCR, simulated)' },
  'op.tx.complete': { ko: '거래완료 처리', en: 'Complete transaction' },
  'op.tx.completed.msg': { ko: '거래가 완료 처리되었습니다.', en: 'Transaction completed.' },
  'op.tx.branchCancel': { ko: '지점 예약 취소', en: 'Cancel (branch)' },
  'op.tx.branchCancelled': {
    ko: '지점 취소 처리되었습니다. 고객에게 취소 안내 이메일이 발송되었습니다.',
    en: 'Cancelled by branch. A cancellation email was sent to the customer.',
  },
  'op.tx.needId': { ko: '먼저 신분증 대조를 완료하세요.', en: 'Verify ID first.' },
  'op.tx.notBooked': { ko: '예약 상태가 아니어서 처리할 수 없습니다.', en: 'Not in Booked state — cannot process.' },
  // 베스트레이트 정산(POS 거래처리)
  'op.tx.bestRate.title': { ko: '베스트레이트 정산', en: 'Best-rate settlement' },
  'op.tx.bestRate.reserved': { ko: '예약환율', en: 'Reserved rate' },
  'op.tx.bestRate.today': { ko: '오늘환율(기준)', en: "Today's rate (base)" },
  'op.tx.bestRate.applied': { ko: '적용환율(유리한 쪽)', en: 'Applied rate (best)' },
  'op.tx.bestRate.appliedKrw': { ko: '최종 원화금액', en: 'Final KRW amount' },
  'op.tx.bestRate.improved': {
    ko: '방문일 환율이 더 유리해져 오늘환율로 적용됩니다.',
    en: "Today's rate is more favorable — it will be applied.",
  },
  'op.tx.bestRate.same': {
    ko: '예약환율이 여전히 가장 유리하여 예약환율로 적용됩니다.',
    en: 'The reserved rate is still the most favorable — it will be applied.',
  },

  // 시뮬레이션 도구
  'sim.title': { ko: '시뮬레이션', en: 'Simulation' },
  'sim.today': { ko: '기준일(오늘)', en: 'Today (simulated)' },
  'sim.advance': { ko: '하루 넘기기', en: 'Advance 1 day' },
  'sim.runAutoCancel': { ko: '자동취소 실행', en: 'Run auto-cancel' },
  'sim.sendReminder': { ko: '방문전일 리마인더 발송', en: 'Send day-before reminders' },
  'sim.reminderSent': { ko: '전일 리마인더 발송', en: 'Day-before reminders sent' },
  'sim.reset': { ko: '데이터 초기화', en: 'Reset data' },
  'sim.autoCancelled': { ko: '건이 자동취소되었습니다.', en: 'reservation(s) auto-cancelled.' },
  'sim.restored': { ko: '재고 복구', en: 'stock restored' },
  'sim.hint': {
    ko: '실제 스케줄러 대신, 기준일을 넘기고 자동취소를 실행해 볼 수 있습니다. (수령기한 경과 예약 → 자동취소, KST 자정 기준. 방문예정확인 건도 미방문 시 동일하게 자동취소되며 잡았던 재고는 복구됨)',
    en: 'Instead of a real scheduler, advance the date and run auto-cancel (overdue booked → cancelled at KST midnight; confirmed-but-no-visit is also auto-cancelled and its reserved stock is restored).',
  },

  // About / eSIM
  'about.title': { ko: '회사 소개', en: 'About us' },
  'about.same': {
    ko: '기존과 동일합니다. (회사소개서·광고문의 등 내용 삭제 → 디자인 참고)',
    en: 'Identical to the existing site. (Company profile, ad inquiries, etc. omitted — see design)',
  },
  // 주요 서비스
  // 서비스 특징
  // 운영 네트워크
  // 회사 정보 (실제 등록 정보)
  'esim.title': { ko: 'eSIM', en: 'eSIM' },
  'esim.body': {
    ko: 'eSIM은 외부 파트너 페이지에서 제공됩니다. (프로토타입에서는 더미 외부 링크입니다.)',
    en: 'eSIM is provided by an external partner. (Dummy external link in this prototype.)',
  },
  'esim.link': { ko: '외부 eSIM 페이지 열기', en: 'Open external eSIM page' },

  // ── 최상위 3개 탭 ──
  'top.site': { ko: '외국인 웹사이트', en: 'Customer Website' },
  'top.cems': { ko: 'CEMS (어드민)', en: 'CEMS (Admin)' },
  'top.pos': { ko: 'POS', en: 'POS' },
  'top.hint': {
    ko: '데모 편의를 위한 화면 전환 탭입니다. 실제로는 서로 다른 사용자가 사용하는 별도 시스템입니다.',
    en: 'Demo switcher between screens. In production these are separate systems for different users.',
  },

  // ── 외국인 웹사이트 헤더/네비 ──
  'site.nav.branch': { ko: '지점 수령', en: 'Branch Pickup' },
  'site.nav.kiosk': { ko: '키오스크', en: 'Kiosks' },
  'site.nav.branches': { ko: '지점', en: 'Branches' },
  'site.nav.company': { ko: '회사', en: 'Company' },
  'site.nav.contact': { ko: '문의', en: 'Contact' },
  'site.nav.service.note': {
    ko: '→ eSIM 등 부가서비스 외부 사이트로 이동 (프로토타입: 실제 이동 없음)',
    en: '→ Goes to the external add-on services site (eSIM). Prototype: no actual navigation.',
  },
  'site.nav.contact.note': {
    ko: '→ 채널톡 상담으로 이동 (프로토타입: 실제 이동 없음)',
    en: '→ Goes to Channel Talk support. Prototype: no actual navigation.',
  },
  'site.nav.lookup': { ko: '신청내역조회', en: 'My Reservations' },
  // 그룹형 네비게이션
  'site.nav.group.service': { ko: '부가서비스', en: 'Add-on services' },
  'site.nav.group.location': { ko: '위치', en: 'Locations' },
  'site.nav.exchange': { ko: '환전', en: 'Exchange' },
  'site.nav.menu': { ko: '메뉴', en: 'Menu' },
  'site.nav.esim': { ko: 'eSIM', en: 'eSIM' },
  'site.nav.about': { ko: '회사 소개·문의', en: 'About & Contact' },

  // ── 위치 찾기 공용(키오스크/지점) ──
  'loc.chipAll': { ko: '전체', en: 'All' },
  'loc.region': { ko: '지역', en: 'Region' },
  'loc.map': { ko: '지도', en: 'Map' },
  'loc.empty': { ko: '검색 결과가 없어요. 다른 검색어로 찾아보세요.', en: 'No results. Try a different search.' },
  'loc.geo.locating': { ko: '현재 위치를 확인하는 중이에요…', en: 'Finding your location…' },
  'loc.geo.unavailable': { ko: '위치 정보를 사용할 수 없어요. 아래 목록에서 직접 찾아보세요.', en: 'Location is not available. Please browse the list below.' },
  'loc.geo.denied': { ko: '위치 정보를 사용할 수 없어요. 아래 목록에서 직접 찾아보세요.', en: 'Location is unavailable. Please browse the list below.' },

  // ── 키오스크 페이지 ──
  'kiosks.title': { ko: '가까운 키오스크 찾기', en: 'Find a nearby kiosk' },
  'kiosks.lead': { ko: '24시간 운영되는 무인 환전기에서 환전하고 카드를 발급받으세요.', en: 'Exchange money and get a card at a 24-hour self-service kiosk.' },
  'kiosks.search': { ko: '지역·역명으로 검색 (예: 서울역, 강남)', en: 'Search by area or station (e.g., Seoul Station, Gangnam)' },
  'kiosks.nearest': { ko: '가까운 키오스크 찾기', en: 'Find nearest kiosk' },

  // ── 지점 페이지 ──
  'branches.title': { ko: '지점 찾기', en: 'Find a branch' },
  'branches.lead': { ko: '직원이 상주하는 오프라인 지점 정보예요. 지점을 고르고 바로 환전을 예약하세요.', en: 'Staffed offline branches. Pick one and reserve your exchange right away.' },
  'branches.search': { ko: '지역·지점명으로 검색 (예: 명동, 부산)', en: 'Search by area or branch (e.g., Myeongdong, Busan)' },
  'branches.reserve': { ko: '환전 예약하기', en: 'Reserve exchange' },

  // ── 문의 페이지 ──
  'site.lang': { ko: '언어', en: 'Language' },
  // ── 진행 단계(재구성) ──
  'wz.branch': { ko: '지점 선택', en: 'Branch' },
  'wz.apply': { ko: '환전 신청', en: 'Apply' },
  'wz.info': { ko: '예약자 정보', en: 'Details' },
  'wz.review': { ko: '최종 확인', en: 'Review' },
  'wz.consent': { ko: '정책 동의', en: 'Consent' },
  'wz.done': { ko: '예약 완료', en: 'Done' },

  // ── STEP A: 지점 선택 ──
  'stepA.title': { ko: '수령하실 지점을 선택하세요', en: 'Choose a pickup branch' },
  'stepA.listTitle': { ko: '지점 목록', en: 'Branches' },
  'stepA.mapTitle': { ko: '지도', en: 'Map' },
  'stepA.mapDummy': { ko: '데모용 지도 (실제 지도 API 미연동)', en: 'Demo map (no real map API)' },
  'stepA.open': { ko: '영업중', en: 'Open' },
  'stepA.select': { ko: '이 지점 선택', en: 'Select' },

  // ── STEP B: 지점 상세 + 신청 ──
  'stepB.reviews': { ko: '개의 후기', en: 'reviews' },
  'stepB.openUntil': { ko: '영업중 · {time}에 영업 종료', en: 'Open · closes at {time}' },
  'stepB.copy': { ko: '복사하기', en: 'Copy' },
  'stepB.copied': { ko: '복사됨', en: 'Copied' },
  'stepB.liveRate': { ko: '기준환율', en: 'Base rate' },
  'stepB.buyTab': { ko: '외화 살 때', en: 'You buy' },
  'stepB.sellTab': { ko: '외화 팔 때', en: 'You sell' },
  'stepB.allRates': { ko: '전체 환율 보기', en: 'View all rates' },
  'stepB.allRatesTitle': { ko: '전체 환율', en: 'All rates' },
  'stepB.bankCompare': { ko: '은행 환율 비교', en: 'Bank rate comparison' },
  'stepB.bankBuy': { ko: '살 때', en: 'Buy' },
  'stepB.vsBank': { ko: '은행보다 유리', en: 'better than bank' },
  'stepB.applyCardTitle': { ko: '환전 신청', en: 'Apply' },
  'stepB.sellFx': { ko: '원화구매', en: 'Buy KRW' },
  'stepB.sellFxHint': { ko: '원화를 사고 외화로 결제합니다', en: 'Buy KRW, pay in foreign currency' },
  // 금액 최소/최대/단위 안내 + 자동보정 안내
  'stepB.min': { ko: '최소', en: 'Min' },
  'stepB.max': { ko: '최대', en: 'Max' },
  'stepB.unitSuffix': { ko: '단위', en: 'unit' },
  'stepB.adj.MAX': { ko: '최대 금액으로 조정되었습니다', en: 'Adjusted to the maximum amount' },
  'stepB.adj.MIN': { ko: '최소 금액으로 조정되었습니다', en: 'Adjusted to the minimum amount' },
  'stepB.adj.UNIT': { ko: '입력 단위에 맞게 조정되었습니다', en: 'Adjusted to the input unit' },
  'stepB.dateTime': { ko: '수령 날짜 및 시간', en: 'Pickup date & time' },
  'stepB.time': { ko: '시간', en: 'Time' },
  'stepB.amountTitle': { ko: '환전 금액', en: 'Amount' },
  'stepB.apply': { ko: '신청하기', en: 'Apply' },
  'book.complete': { ko: '예약 완료하기', en: 'Complete reservation' },
  'stepB.liveRateLabel': { ko: '기준환율', en: 'Base rate' },
  'stepB.liveRateHint': {
    ko: '환율은 2분마다 자동 갱신됩니다. "신청하기" 클릭 시점의 환율로 확정됩니다.',
    en: 'Rates auto-refresh every 2 minutes. Locked when you tap "Apply".',
  },
  'stepB.rateNote': {
    ko: '표시 환율(기준환율)은 2분 주기로 자동 갱신되며, "신청하기" 클릭 시점의 환율로 확정됩니다.',
    en: 'The displayed base rate auto-refreshes every 2 min and is locked when you tap "Apply".',
  },
  // ── 랜딩 홈 (외국인 웹사이트 첫 화면). 공항수령 없음 ──
  'home.hero.title': { ko: '가장 빠른 환전의 시작\n머니박스', en: 'The fastest way to exchange\nMoneyBox' },
  // 히어로 순환 타이포 (국가/통화가 카드 넘기듯 바뀜)
  'home.hero.pre': { ko: '가장 좋은 환율로', en: 'The best rate for' },
  'home.cyc.usd': { ko: '미국 달러', en: 'US Dollars' },
  'home.cyc.jpy': { ko: '일본 엔', en: 'Japanese Yen' },
  'home.cyc.cny': { ko: '중국 위안', en: 'Chinese Yuan' },
  'home.cyc.eur': { ko: '유로', en: 'Euros' },
  'home.cyc.twd': { ko: '대만 달러', en: 'Taiwan Dollars' },
  'home.cyc.hkd': { ko: '홍콩 달러', en: 'Hong Kong Dollars' },
  'home.hero.sub': {
    ko: '한국을 방문하는 외국인을 위한 가장 쉬운 환전 서비스.',
    en: 'The easiest currency exchange for visitors to Korea.',
  },
  'home.hero.cta': { ko: '환전 예약하기', en: 'Reserve your exchange' },
  'home.card2.t': { ko: '베스트레이트 보장', en: 'Best-rate guarantee' },
  'home.card2.d': {
    ko: '예약 시점 환율 고정 · 방문일에 더 좋아지면 그날 환율 적용',
    en: 'Rate locked at booking — get the better rate if it improves by your visit',
  },
  'home.cmp.title': { ko: '이만큼 더 받아요', en: 'Get more won for your money' },
  'home.cmp.sub': {
    ko: '같은 금액을 바꿔도 머니박스가 더 많이 드려요',
    en: 'Same amount exchanged — MoneyBox pays out more',
  },
  'home.cmp.mb': { ko: '머니박스', en: 'MoneyBox' },
  'home.cmp.best': { ko: '가장 많이 받아요', en: 'You get the most' },
  'home.cmp.bank': { ko: '은행', en: 'Bank' },
  'home.cmp.kiosk': { ko: '무인 환전기', en: 'Kiosk' },
  'home.cmp.airport': { ko: '공항', en: 'Airport' },
  'home.cmp.less': { ko: '적게 받아요', en: 'less' },
  'home.cmp.note': {
    ko: '※ 예시입니다 (실제 환율·수치 아님)',
    en: '* Example only (not actual rates)',
  },
  'home.trust.rating': { ko: 'Google 평점 · 15,000+ 리뷰', en: 'Google rating · 15,000+ reviews' },
  'home.trust.visitors': { ko: '연간 방문객', en: 'Visitors / year' },
  'home.trust.branches': { ko: '전국 지점', en: 'Branches nationwide' },
  'home.card.branch.t': { ko: '지점에서 수령하기', en: 'Pick up at a branch' },
  'home.card.branch.d': {
    ko: '원하는 금액을 예약 시점 환율로 미리 예약하고, 지점에서 편하게 수령하세요.',
    en: 'Reserve the amount you want at the current rate and pick it up easily at a branch.',
  },
  'home.card.branch.cta': { ko: '신청하기', en: 'Reserve' },
  'home.card.esim.t': { ko: 'eSIM 구매하기', en: 'Buy an eSIM' },
  'home.card.esim.d': {
    ko: '여행 준비 필수템',
    en: 'A travel must-have',
  },
  'home.card.esim.cta': { ko: '구매하기', en: 'Buy' },
  'home.rate.label': { ko: '기준환율', en: 'Base rate' },
  'home.rate.same': {
    ko: '아래 페이지는 기존 페이지와 동일합니다. (공항수령 제외 → 디자인 참고)',
    en: 'The page below is identical to the existing site. (Airport pickup excluded — see design)',
  },

  // 홈 하단 랜딩 섹션 (외국인 대상 — 임시 콘텐츠)
  // How it works (3단계)
  'home.how.title': { ko: '이용 방법', en: 'How it works' },
  'home.how.sub': {
    ko: '온라인으로 예약하고, 지점에서 현금으로 받으세요. 결제는 수령할 때만.',
    en: 'Reserve online, pick up cash at a branch. You only pay in person.',
  },
  'home.how.s1t': { ko: '온라인 예약', en: 'Reserve online' },
  'home.how.s1d': {
    ko: '통화·금액·수령일을 고르고 예약하세요. 결제·회원가입 없이 1분이면 끝나요.',
    en: 'Pick currency, amount, and date. No payment, no sign-up — done in a minute.',
  },
  'home.how.s2t': { ko: '지점 방문', en: 'Visit a branch' },
  'home.how.s2d': {
    ko: '여권만 가지고 예약한 지점을 방문하세요. 명동·홍대·강남·공항 등 40+ 지점.',
    en: 'Bring your passport to the branch you chose. 40+ spots incl. Myeongdong, Hongdae, Gangnam, airports.',
  },
  'home.how.s3t': { ko: '현장 수령', en: 'Pick up cash' },
  'home.how.s3d': {
    ko: '예약 시 확정된 환율로 현금을 받아요. 방문일에 환율이 더 좋아지면 그날 환율 적용.',
    en: 'Get cash at the rate locked when you booked — or the better rate if it improves by your visit.',
  },
  // Why MoneyBox (혜택 4)
  'home.why.title': { ko: '왜 머니박스인가요?', en: 'Why MoneyBox?' },
  'home.why.1t': { ko: '베스트레이트 보장', en: 'Best-rate guarantee' },
  'home.why.1d': {
    ko: '은행·공항·무인 환전기보다 유리한 환율. 방문일에 더 좋아지면 그날 환율로 드려요.',
    en: 'Better than banks, airports, and kiosks. If it improves by your visit, you get that rate.',
  },
  'home.why.2t': { ko: '온라인 결제 없음', en: 'No online payment' },
  'home.why.2d': {
    ko: '카드 정보를 넣지 않아요. 예약만 하고, 수령할 때 현금으로 결제해요.',
    en: 'No card details needed. Just reserve, then pay in cash when you pick up.',
  },
  'home.why.3t': { ko: '여권만, 1분', en: 'Passport only, 1 min' },
  'home.why.3d': {
    ko: '복잡한 가입 없이 여권만 있으면 돼요. 예약·수령 모두 빠르게.',
    en: 'No complicated sign-up — just your passport. Fast to book, fast to collect.',
  },
  'home.why.4t': { ko: '전국 40+ 지점·다국어', en: '40+ branches · multilingual' },
  'home.why.4d': {
    ko: '주요 관광지와 공항 곳곳에 있어요. 영어·중국어·일본어 응대.',
    en: 'Across major tourist areas and airports. English, Chinese, and Japanese support.',
  },
  // Popular locations
  'home.loc.title': { ko: '인기 지점', en: 'Popular locations' },
  'home.loc.sub': {
    ko: '가까운 지점을 찾아 바로 예약하세요.',
    en: 'Find a branch near you and reserve in seconds.',
  },
  'home.loc.myeongdong': { ko: '명동', en: 'Myeongdong' },
  'home.loc.hongdae': { ko: '홍대', en: 'Hongdae' },
  'home.loc.gangnam': { ko: '강남', en: 'Gangnam' },
  'home.loc.airport': { ko: '인천공항', en: 'Incheon Airport' },
  'home.loc.cta': { ko: '전체 지점 보기', en: 'See all branches' },
  // FAQ
  'home.faq.title': { ko: '자주 묻는 질문', en: 'FAQ' },
  'home.faq.q1': { ko: '온라인으로 결제해야 하나요?', en: 'Do I need to pay online?' },
  'home.faq.a1': {
    ko: '아니요. 결제 없이 예약만 하고, 지점에서 받을 때 현금으로 결제해요.',
    en: 'No. You reserve with no payment and pay in cash when you pick up at the branch.',
  },
  'home.faq.q2': { ko: '무엇을 가져가야 하나요?', en: 'What should I bring?' },
  'home.faq.a2': {
    ko: '여권만 지참하시면 됩니다. 본인 확인용으로 사용돼요.',
    en: 'Just your passport — used for identity verification at pickup.',
  },
  'home.faq.q3': { ko: '어떤 통화를 바꿀 수 있나요?', en: 'Which currencies can I exchange?' },
  'home.faq.a3': {
    ko: 'USD·JPY·CNY·EUR·TWD·HKD 등 주요 통화를 지원해요. 위의 실시간 기준환율에서 확인하세요.',
    en: 'USD, JPY, CNY, EUR, TWD, HKD and more — check the live base rates above.',
  },
  'home.faq.q4': { ko: '예약을 취소할 수 있나요?', en: 'Can I cancel?' },
  'home.faq.a4': {
    ko: '네, 수령일 전이라면 "예약 조회"에서 언제든 취소할 수 있어요.',
    en: 'Yes — anytime before your pickup date, from "My Reservation".',
  },
  // 하단 CTA 밴드
  'home.cta.title': { ko: '가장 좋은 환율로 준비하세요', en: 'Get ready at the best rate' },
  'home.cta.sub': {
    ko: '1분이면 환전 예약 완료. 결제는 지점에서 현금으로.',
    en: 'Reserve your exchange in a minute. Pay in cash at the branch.',
  },
  'home.cta.btn': { ko: '환전 예약하기', en: 'Reserve your exchange' },

  // 회사 소개 (외국인 대상 — 임시 콘텐츠)
  'about.lead': {
    ko: '머니박스는 한국을 방문하는 외국인을 위한 국내 최대 환전 플랫폼입니다. 전국 유인지점과 24시간 무인환전기로, 더 쉽고 더 유리한 외환거래 경험을 제공합니다.',
    en: 'MoneyBox is Korea’s largest currency-exchange platform for international visitors — with staffed branches nationwide and 24-hour self-service machines for an easier, more rewarding exchange.',
  },
  'about.mission.t': { ko: '우리의 미션', en: 'Our mission' },
  'about.mission.d': {
    ko: '기분 좋은 외환거래 경험의 시작. 환전을 넘어 외국인의 금융 문제를 해결하는 파트너가 되겠습니다.',
    en: 'The start of a pleasant foreign-exchange experience — and, beyond exchange, a partner that solves visitors’ financial needs in Korea.',
  },
  'about.stats.tx': { ko: '누적 환전액', en: 'Exchanged to date' },
  'about.stats.visitors': { ko: '연간 방문객', en: 'Visitors / year' },
  'about.stats.rating': { ko: 'Google 평점', en: 'Google rating' },
  'about.stats.branches': { ko: '전국 지점', en: 'Branches nationwide' },
  'about.do.title': { ko: '우리가 하는 일', en: 'What we do' },
  'about.do.1t': { ko: '지점 환전 예약', en: 'Branch exchange' },
  'about.do.1d': {
    ko: '온라인으로 예약하고 지점에서 현금으로 받는 무결제 환전 예약 서비스.',
    en: 'Reserve online with no payment and pick up cash in person at a branch.',
  },
  'about.do.2t': { ko: '머니24h 무인환전기', en: 'MONEY24h self-service' },
  'about.do.2d': {
    ko: '24시간 무인 환전과 교통카드 충전·택스리펀드까지 한 곳에서.',
    en: '24-hour self-service exchange, transit-card top-up, and tax refund in one place.',
  },
  'about.do.3t': { ko: '여행 부가서비스', en: 'Travel add-ons' },
  'about.do.3d': {
    ko: 'eSIM·선불 교통카드 등 한국 여행에 필요한 부가서비스를 함께 제공.',
    en: 'eSIM, prepaid transit cards, and other essentials for your trip to Korea.',
  },
  'about.contact.title': { ko: '문의', en: 'Contact' },
  'about.contact.d': {
    ko: '제휴·광고·기타 문의는 아래로 연락 주세요. (프로토타입 더미 정보)',
    en: 'For partnerships, advertising, or other inquiries, reach us below. (Prototype placeholder info.)',
  },
  'about.note': {
    ko: '※ 임시 페이지입니다 — 외국인 대상 서비스 참고로 구성한 프로토타입 콘텐츠',
    en: '* Temporary page — prototype content modeled on services for visitors to Korea',
  },
  // 회사 소개 — 당근 about 페이지풍(큰 서술형 문장·스토리텔링)
  'about.hero.t': {
    ko: '한국에서의 환전,\n기분 좋게.',
    en: 'Exchanging money in Korea,\nmade to feel good.',
  },
  'about.hero.d': {
    ko: '낯선 나라에서의 첫 걸음이 환전이라면, 그 경험이 즐거워야 한다고 믿어요. 머니박스는 한국을 찾는 모두에게 더 쉽고, 더 유리하고, 더 안심되는 환전을 만듭니다.',
    en: 'If your first step in a new country is exchanging money, we believe that moment should feel good. MoneyBox makes it easier, more rewarding, and more reassuring for everyone visiting Korea.',
  },
  'about.story.t': { ko: '왜 시작했나요?', en: 'Why we started' },
  'about.story.d': {
    ko: '공항과 은행의 환율은 복잡하고 불리했어요. 우리는 “환전을 넘어 외국인의 금융 문제를 해결하자”는 마음으로, 온라인 예약과 전국 지점·무인환전기를 잇는 새로운 방식을 만들었습니다.',
    en: 'Airport and bank rates were confusing and unfavorable. With the belief of “going beyond exchange to solve visitors’ financial needs,” we built a new way — online reservations connected to branches and self-service machines nationwide.',
  },
  'about.statlead': {
    ko: '숫자로 보는 머니박스',
    en: 'MoneyBox in numbers',
  },
  'about.values.title': { ko: '우리가 지키는 것', en: 'What we stand for' },
  'about.v1.t': { ko: '환대', en: 'Hospitality' },
  'about.v1.d': {
    ko: '모국어로 편하게. 영어·중국어·일본어로 응대하고, 처음 오신 분도 헤매지 않게 안내해요.',
    en: 'Comfort in your language. We serve in English, Chinese, and Japanese, guiding first-timers every step.',
  },
  'about.v2.t': { ko: '신뢰', en: 'Trust' },
  'about.v2.d': {
    ko: '예약 시 확정된 환율을 지키고, 방문일에 더 좋아지면 그날 환율로. Google 평점 4.97로 증명해요.',
    en: 'We honor the rate locked at booking — and give you the better one if it improves. Proven by a 4.97 Google rating.',
  },
  'about.v3.t': { ko: '편의', en: 'Convenience' },
  'about.v3.d': {
    ko: '결제·회원가입 없이 1분 예약. 명동·홍대·강남·공항 등 전국 40+ 곳에서 받아요.',
    en: 'One-minute booking, no payment or sign-up. Pick up at 40+ spots incl. Myeongdong, Hongdae, Gangnam, airports.',
  },

  // 쿠폰 팝업 (예약 진입 시) — 베스트레이트 보장
  'coupon.badge': { ko: '웰컴 혜택', en: 'Welcome perk' },
  'coupon.title': { ko: '환율 최저가 보장', en: 'Best-rate guarantee' },
  'coupon.body': {
    ko: '지금 예약해도 손해 없어요. 방문하시는 날 환율이 더 좋아지면, 그날의 더 좋은 환율로 드려요.',
    en: 'No risk in booking now. If the rate improves by the day you visit, you get that better rate.',
  },
  'coupon.sub': {
    ko: '언제 오시든, 예약 시점보다 불리하지 않아요.',
    en: 'Whenever you come, never worse than the rate at booking.',
  },
  'coupon.foot': { ko: 'MoneyBox Best-Rate Guarantee', en: 'MoneyBox Best-Rate Guarantee' },
  'coupon.cta': { ko: '환전 예약 시작하기', en: 'Start reserving' },
  'coupon.note': { ko: '※ 프로토타입 안내 (예시)', en: '* Prototype notice (example)' },

  // 푸터
  'footer.company': { ko: '(주) 머니박스', en: 'MoneyBox Inc.' },
  'footer.addr': { ko: '서울특별시 ○○구 ○○로 000 (프로토타입 더미 주소)', en: 'Seoul, Korea (placeholder address)' },
  'footer.tel': { ko: 'Tel. 00-0000-0000 (더미)', en: 'Tel. 00-0000-0000 (dummy)' },
  'footer.email': { ko: 'help@moneybox.example', en: 'help@moneybox.example' },
  'footer.col.service': { ko: '서비스', en: 'Service' },
  'footer.col.company': { ko: '회사', en: 'Company' },
  'footer.terms': { ko: '이용약관', en: 'Terms' },
  'footer.privacy': { ko: '개인정보처리방침', en: 'Privacy' },
}

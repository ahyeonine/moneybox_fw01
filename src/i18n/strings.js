// 다국어 문자열 (한국어 / 영어 2개 언어)
// 프로토타입 요구사항: 한국어 + 영어만 구현.
// 실제 서비스는 영어(기본)/중국어(간·번체)/일본어 확장 예정 → 키 구조 그대로 확장.

export const STRINGS = {
  // 공통
  'app.name': { ko: 'MoneyBox 환전예약', en: 'MoneyBox FX Reservation' },
  'app.tagline': {
    ko: '온라인 예약, 지점 방문 수령. 결제는 지점에서.',
    en: 'Reserve online, pick up at a branch. Pay in person.',
  },
  'nav.home': { ko: '홈', en: 'Home' },
  'nav.book': { ko: '환전 예약', en: 'Reserve' },
  'nav.lookup': { ko: '예약 조회', en: 'My Reservation' },
  'nav.esim': { ko: 'eSIM', en: 'eSIM' },
  'nav.about': { ko: '회사소개', en: 'About' },
  'nav.operator': { ko: '지점 운영자', en: 'Operator' },
  'common.next': { ko: '다음', en: 'Next' },
  'common.prev': { ko: '이전', en: 'Back' },
  'common.cancel': { ko: '취소', en: 'Cancel' },
  'common.confirm': { ko: '확인', en: 'Confirm' },
  'common.close': { ko: '닫기', en: 'Close' },
  'common.save': { ko: '저장', en: 'Save' },
  'common.search': { ko: '조회', en: 'Search' },
  'common.required': { ko: '필수', en: 'Required' },
  'common.branch': { ko: '지점', en: 'Branch' },
  'common.currency': { ko: '통화', en: 'Currency' },
  'common.amount': { ko: '금액', en: 'Amount' },
  'common.foreignAmount': { ko: '외화 금액', en: 'Foreign amount' },
  'common.krwAmount': { ko: '원화 금액', en: 'KRW amount' },
  'common.rate': { ko: '적용 환율', en: 'Rate' },
  'common.pickupDate': { ko: '수령 예정일', en: 'Pickup date' },
  'common.name': { ko: '예약자명 (여권 영문명)', en: 'Name (as in passport)' },
  'common.email': { ko: '이메일', en: 'Email' },
  'common.reservationNo': { ko: '예약번호', en: 'Reservation No.' },
  'common.status': { ko: '상태', en: 'Status' },
  'common.txType': { ko: '환전구분', en: 'Type' },
  'common.createdAt': { ko: '신청일시', en: 'Created' },
  'common.processedAt': { ko: '처리일시', en: 'Processed' },

  // 상태값
  'status.BOOKED': { ko: '예약', en: 'Booked' },
  'status.COMPLETED': { ko: '완료', en: 'Completed' },
  'status.CANCELLED': { ko: '취소', en: 'Cancelled' },
  // 내부 데이터값 표기 (직원용 · CEMS/POS). 절대 고객 라벨로 바꾸지 말 것.
  'tx.SELL': { ko: '매출 (외화 수령)', en: 'Sell (customer buys FX)' },
  'tx.BUY': { ko: '매입 (외화 판매)', en: 'Buy (customer sells FX)' },
  'tx.SELL.short': { ko: '매출', en: 'Sell' },
  'tx.BUY.short': { ko: '매입', en: 'Buy' },
  // 고객용 라벨 (외국인 웹사이트). "내가 뭘 사는가" 관점으로 통일.
  //  txc.SELL = 매출(내부값) = 외화 구매 / txc.BUY = 매입(내부값) = 원화 구매
  'txc.SELL': { ko: '외화구매', en: 'Buy FX' },
  'txc.BUY': { ko: '원화구매', en: 'Buy KRW' },

  // 홈
  'home.hero.title': { ko: '환율 걱정 없이,\n미리 예약하고 지점에서 받으세요', en: 'Lock your rate now,\npick up cash at a branch' },
  'home.hero.sub': {
    ko: '온라인 결제 없이 예약만. 방문 시 신분증 확인 후 현장에서 결제·수령합니다.',
    en: 'No online payment — just reserve. Verify your ID and pay at the branch on pickup.',
  },
  'home.cta.book': { ko: '환전 예약 시작', en: 'Start a reservation' },
  'home.cta.lookup': { ko: '예약 조회 / 변경', en: 'Find / change reservation' },
  'home.feature.1.t': { ko: '예약 시 환율 픽스', en: 'Rate locked at booking' },
  'home.feature.1.d': { ko: '"신청하기" 클릭 시점의 환율로 고정됩니다.', en: 'Your rate is fixed when you tap "Reserve".' },
  'home.feature.2.t': { ko: '무결제 예약', en: 'No prepayment' },
  'home.feature.2.d': { ko: '지점에서 전액 현장 결제합니다.', en: 'Pay the full amount in person.' },
  'home.feature.3.t': { ko: '지점 수령', en: 'Branch pickup' },
  'home.feature.3.d': { ko: '지정 지점에서 신분증 확인 후 수령.', en: 'Pick up after ID check at your branch.' },

  // 예약 플로우 스텝 라벨
  'step.1': { ko: '지점 선택', en: 'Branch' },
  'step.2': { ko: '통화 선택', en: 'Currency' },
  'step.3': { ko: '금액 입력', en: 'Amount' },
  'step.4': { ko: '수령일 선택', en: 'Date' },
  'step.5': { ko: '예약자 정보', en: 'Details' },
  'step.6': { ko: '최종 확인', en: 'Review' },
  'step.7': { ko: '정책 동의', en: 'Consent' },
  'step.8': { ko: '예약 완료', en: 'Done' },

  'book.step1.title': { ko: '수령하실 지점을 선택하세요', en: 'Choose a pickup branch' },
  'book.step2.title': { ko: '환전 구분과 통화를 선택하세요', en: 'Choose type and currency' },
  'book.step2.txlabel': { ko: '환전 구분', en: 'Transaction type' },
  'book.step2.currencylabel': { ko: '통화', en: 'Currency' },
  'book.step2.noCurrency': { ko: '이 지점은 취급 통화가 없습니다.', en: 'No currencies available at this branch.' },
  'book.step3.title': { ko: '환전 금액을 입력하세요', en: 'Enter the amount' },
  'book.step3.limit': { ko: '한도', en: 'Limit' },
  'book.step3.est': { ko: '예상 원화', en: 'Estimated KRW' },
  'book.step4.title': { ko: '수령 예정일을 선택하세요', en: 'Choose a pickup date' },
  'book.step4.help': {
    ko: '리드타임 이후 ~ 최대 2주(14일) 이내 날짜만 선택 가능합니다.',
    en: 'Only dates after the lead time and within 2 weeks (14 days) can be selected.',
  },
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
  'lookup.title': { ko: '예약 조회', en: 'Find my reservation' },
  'lookup.sub': { ko: '예약번호와 이메일로 조회하세요.', en: 'Look up with your reservation number and email.' },
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
  'op.title': { ko: '지점 운영자 콘솔', en: 'Branch Operator Console' },
  'op.tab.prep': { ko: '신규예약 리스트 (시재 준비)', en: 'New reservations (cash prep)' },
  'op.tab.tx': { ko: '거래 처리', en: 'Process transaction' },
  'op.prep.title': { ko: '신규예약 리스트', en: 'New reservations' },
  'op.prep.sub': {
    ko: '방문 예정 고객의 통화·금액·환전구분을 미리 확인해 시재를 준비하세요.',
    en: 'Prepare cash based on upcoming customers’ currency, amount, and type.',
  },
  'op.prep.filter.from': { ko: '수령일 시작', en: 'Pickup from' },
  'op.prep.filter.to': { ko: '수령일 종료', en: 'Pickup to' },
  'op.prep.filter.status': { ko: '상태', en: 'Status' },
  'op.prep.filter.all': { ko: '전체', en: 'All' },
  'op.prep.showHidden': {
    ko: '리마인더 무응답(전일까지) 숨김 항목도 표시',
    en: 'Also show reminder no-response (hidden) items',
  },
  'op.prep.reminder': { ko: '리마인더', en: 'Reminder' },
  'op.prep.empty': { ko: '조건에 맞는 예약이 없습니다.', en: 'No reservations match.' },
  'op.prep.summary.sell': { ko: '매출 준비 (외화)', en: 'Sell prep (FX)' },
  'op.prep.summary.buy': { ko: '매입 준비 (원화)', en: 'Buy prep (KRW)' },
  'reminder.CONFIRMED': { ko: '방문확인', en: 'Confirmed' },
  'reminder.NO_RESPONSE': { ko: '무응답', en: 'No response' },
  'reminder.NONE': { ko: '발송전', en: 'Not sent' },

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

  // 시뮬레이션 도구
  'sim.title': { ko: '시뮬레이션', en: 'Simulation' },
  'sim.today': { ko: '기준일(오늘)', en: 'Today (simulated)' },
  'sim.advance': { ko: '하루 넘기기', en: 'Advance 1 day' },
  'sim.runAutoCancel': { ko: '자동취소 실행', en: 'Run auto-cancel' },
  'sim.sendReminder': { ko: '방문전일 리마인더 발송', en: 'Send day-before reminders' },
  'sim.reminderSent': { ko: '리마인더 발송', en: 'Reminders sent' },
  'sim.reset': { ko: '데이터 초기화', en: 'Reset data' },
  'sim.autoCancelled': { ko: '건이 자동취소되었습니다.', en: 'reservation(s) auto-cancelled.' },
  'sim.restored': { ko: '재고 복구', en: 'stock restored' },
  'sim.hint': {
    ko: '실제 스케줄러 대신, 기준일을 넘기고 자동취소를 실행해 볼 수 있습니다. (수령기한 경과 예약 → 자동취소, KST 자정 기준. 방문예정확인 건도 미방문 시 동일하게 자동취소되며 잡았던 재고는 복구됨)',
    en: 'Instead of a real scheduler, advance the date and run auto-cancel (overdue booked → cancelled at KST midnight; confirmed-but-no-visit is also auto-cancelled and its reserved stock is restored).',
  },

  // About / eSIM
  'about.title': { ko: '회사소개', en: 'About us' },
  'about.body': {
    ko: 'MoneyBox는 외국인 여행객을 위한 환전 예약 서비스입니다. (본 화면은 프로토타입용 더미 텍스트입니다.)',
    en: 'MoneyBox is an FX reservation service for international travelers. (Placeholder text for the prototype.)',
  },
  'esim.title': { ko: 'eSIM', en: 'eSIM' },
  'esim.body': {
    ko: 'eSIM은 외부 파트너 페이지에서 제공됩니다. (프로토타입에서는 더미 외부 링크입니다.)',
    en: 'eSIM is provided by an external partner. (Dummy external link in this prototype.)',
  },
  'esim.link': { ko: '외부 eSIM 페이지 열기', en: 'Open external eSIM page' },
  'prepaid.title': { ko: '선불카드', en: 'Prepaid card' },
  'prepaid.lead': {
    ko: '원하는 금액을 미리 충전해서 쓸 수 있어요.',
    en: 'Top it up in advance with any amount and use it right away.',
  },
  'prepaid.point1': {
    ko: '한국 도착 즉시 사용 가능',
    en: 'Ready to use as soon as you arrive in Korea',
  },
  'prepaid.point2': {
    ko: '지하철·버스 교통카드로도 사용',
    en: 'Works as a subway & bus transit card',
  },
  'prepaid.point3': {
    ko: '원하는 금액만큼 미리 충전',
    en: 'Top up in advance with any amount',
  },
  'prepaid.soon': {
    ko: '선불카드 서비스는 준비 중이에요. 곧 만나보실 수 있어요.',
    en: 'The prepaid card service is coming soon.',
  },
  'prepaid.back': { ko: '홈으로 돌아가기', en: 'Back to home' },

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
  'site.nav.airport': { ko: '공항 수령', en: 'Airport Pickup' },
  'site.nav.esim': { ko: 'eSIM', en: 'eSIM' },
  'site.nav.about': { ko: '회사 소개·문의', en: 'About & Contact' },
  'site.lang': { ko: '언어', en: 'Language' },
  'airport.title': { ko: '공항 수령', en: 'Airport Pickup' },
  'airport.body': {
    ko: '현재 운영하지 않는 서비스입니다. 지점 수령을 이용해 주세요.',
    en: 'This service is not currently operating. Please use Branch Pickup.',
  },
  'airport.goBranch': { ko: '지점 수령으로 이동', en: 'Go to Branch Pickup' },

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
  'stepB.buyFx': { ko: '외화구매', en: 'Buy FX' },
  'stepB.sellFx': { ko: '원화구매', en: 'Buy KRW' },
  'stepB.buyFxHint': { ko: '외화를 사고 원화로 결제합니다', en: 'Buy foreign currency, pay in KRW' },
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
  'stepB.maxHint': { ko: '신청 가능 금액', en: 'Available amount' },
  'stepB.unitHint': { ko: '입력 단위', en: 'Input unit' },
  'stepB.estKrw': { ko: '예상 원화 금액', en: 'Estimated KRW' },
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
  'common.pickupTime': { ko: '수령 시간', en: 'Pickup time' },

  // ── 랜딩 홈 (외국인 웹사이트 첫 화면). 공항수령 없음 ──
  'home.hero.title': { ko: '가장 빠른 환전의 시작\n머니박스', en: 'The fastest way to exchange\nMoneyBox' },
  'home.hero.sub': {
    ko: '환전부터 eSIM까지, 머니박스로 간편하게 시작하세요.',
    en: 'From FX to eSIM — start simply with MoneyBox.',
  },
  'home.card.branch.t': { ko: '지점에서 수령하기', en: 'Pick up at a branch' },
  'home.card.branch.d': {
    ko: '원하는 금액을 예약 시점 환율로 미리 예약하고, 지점에서 편하게 수령하세요.',
    en: 'Reserve the amount you want at the current rate and pick it up easily at a branch.',
  },
  'home.card.branch.cta': { ko: '신청하기', en: 'Reserve' },
  'home.card.prepaid.t': { ko: '선불카드 구매하기', en: 'Buy a prepaid card' },
  'home.card.prepaid.d': {
    ko: '원하는 금액을 미리 충전해서 쓸 수 있어요.',
    en: 'Top it up in advance with any amount and use it right away.',
  },
  'home.card.prepaid.cta': { ko: '자세히 보기', en: 'Learn more' },
  'home.card.esim.t': { ko: 'eSIM 구매하기', en: 'Buy an eSIM' },
  'home.card.esim.d': {
    ko: '여행 준비 필수템',
    en: 'A travel must-have',
  },
  'home.card.esim.cta': { ko: '구매하기', en: 'Buy' },
  'home.rate.label': { ko: '기준환율', en: 'Base rate' },

  'home.svc.title': { ko: '어떤 서비스를 이용할 수 있나요?', en: 'What can you use?' },
  'home.svc.tab.branch': { ko: '지점 수령', en: 'Branch pickup' },
  'home.svc.tab.esim': { ko: 'eSIM 서비스', en: 'eSIM service' },
  'home.svc.branch.cap': { ko: '온라인으로 예약하고, 지점에서 바로 수령', en: 'Reserve online, pick up at the branch' },
  'home.svc.branch.sub': {
    ko: '번거로운 절차 없이 폰 안에서 예약 완료, 방문해서 신분증 확인 후 수령하세요.',
    en: 'Book on your phone with no hassle — verify ID at the branch and collect.',
  },
  'home.svc.esim.cap': { ko: '여행 전 미리 준비하는 eSIM', en: 'Prepare your eSIM before the trip' },
  'home.svc.esim.sub': {
    ko: '도착 즉시 데이터 사용, 유심 교체 없이 간편하게.',
    en: 'Use data on arrival — no SIM swap needed.',
  },

  'home.stats.title': {
    ko: '이미 180만+명의 고객이 머니박스로\n간편한 시작을 함께하고 있어요.',
    en: '1.8M+ customers already start\nsimply with MoneyBox.',
  },
  'home.stats.customers.l': { ko: '누적 이용 고객 수', en: 'Total customers' },
  'home.stats.customers.v': { ko: '180만+', en: '1.8M+' },
  'home.stats.time.l': { ko: '평균 수령 소요 시간', en: 'Avg. pickup time' },
  'home.stats.time.v': { ko: '10초 이내', en: 'Under 10s' },
  'home.stats.sat.l': { ko: '이용 만족도', en: 'Satisfaction' },
  'home.stats.sat.v': { ko: '97% 이상', en: '97%+' },
  'home.stats.note': { ko: '2025년 기준 · 목데이터', en: 'As of 2025 · mock data' },

  'home.map.title': { ko: '전국 어디서든 머니박스를 만날 수 있어요.', en: 'Find MoneyBox anywhere nationwide.' },
  'home.map.sub': {
    ko: '전국 지점과 무인환전기에서 간편하게 이용해 보세요.',
    en: 'Use our branches and self-service kiosks across the country.',
  },
  'home.map.branch.l': { ko: '지점 수', en: 'Branches' },
  'home.map.branch.v': { ko: '40개+', en: '40+' },
  'home.map.branch.cta': { ko: '예약 가능한 지점 찾기', en: 'Find a branch' },
  'home.map.kiosk.l': { ko: '무인기 수', en: 'Kiosks' },
  'home.map.kiosk.v': { ko: '120개+', en: '120+' },
  'home.map.kiosk.cta': { ko: '가까운 무인기 찾기', en: 'Find a kiosk' },

  'home.help.title': { ko: '도움이 필요하신가요?', en: 'Need help?' },
  'home.help.email': { ko: '이메일로 문의하기', en: 'Email us' },
  'home.help.call': { ko: '전화 상담받기', en: 'Call us' },

  'home.biz.title': { ko: '제휴 및 투자 관련 문의가 있으신가요?', en: 'Partnership or investment inquiries?' },
  'home.biz.sub': {
    ko: '머니박스의 제휴·투자·지점 개설 등 비즈니스 문의를 남겨주세요.',
    en: 'Reach out about partnerships, investment, or opening a branch.',
  },
  'home.biz.cta': { ko: '문의하기', en: 'Contact us' },

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

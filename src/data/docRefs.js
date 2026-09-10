// 화면(메모) ↔ 기획문서 연결 레지스트리 (양방향 탐색용)
//  - 메모 → 문서: 각 화면 메모의 "자세히: <파일>" 링크 (/docs?doc=...)
//  - 문서 → 메모: 아래 매핑을 역참조해 기획문서 뷰어에서 "관련 화면"으로 이동
//  - 한 화면에 여러 문서를 연결할 수 있다(docs 배열).
// 기획문서는 IA·구조도·플로우·API·데이터모델·상태도로 슬림화됨.
const D = {
  overview: '00_서비스개요.md',
  ia: '01_IA.md',
  flow: '03_플로우.mermaid',
  api: '04_API.md',
  data: '05_데이터모델.md',
  state: '06_상태도.mermaid',
  policy: '07_정책.md',
}

const DOC_REFS = [
  { route: '/site', screen: '외국인 웹사이트 V1 · 홈', docs: [D.overview, D.ia] },
  { route: '/site/book', screen: '외국인 웹사이트 V1 · 신청(STEP A~완료)', docs: [D.flow, D.data, D.policy] },
  { route: '/site/lookup', screen: '외국인 웹사이트 V1 · 예약조회', docs: [D.flow, D.state, D.policy] },
  { route: '/site2', screen: '외국인 사이트 2안 · 금액→지점선택', docs: [D.overview, D.ia, D.flow] },
  { route: '/cems/reservations', screen: 'CEMS · 외국인 환전예약관리', docs: [D.ia, D.data] },
  { route: '/cems/settings/rates', screen: 'CEMS · 환율관리', docs: [D.ia, D.policy] },
  { route: '/cems/settings/limits', screen: 'CEMS · 한도관리', docs: [D.data, D.policy] },
  { route: '/pos', screen: 'POS · 홈', docs: [D.ia] },
  { route: '/pos/reservation', screen: 'POS · 환전예약 검색/결과', docs: [D.flow] },
  { route: '/pos/transaction', screen: 'POS · 거래처리', docs: [D.state, D.policy] },
  { route: '/email', screen: '이메일 관리', docs: [D.ia] },
]

// 특정 기획문서를 참고하는 화면 목록 (문서 → 메모 역참조)
export function screensForDoc(filename) {
  return DOC_REFS.filter((r) => r.docs.includes(filename))
}

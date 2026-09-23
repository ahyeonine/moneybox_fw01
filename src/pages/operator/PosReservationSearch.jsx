import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReservations } from '../../store/ReservationContext.jsx'
import { CURRENCY_META } from '../../data/rates.js'
import { formatDate, formatNumber } from '../../lib/format.js'
import { StatusBadge } from '../../components/Badges.jsx'
import DevNote from '../../components/DevNote.jsx'

// 두 문자열 편집거리(간단 Levenshtein) — 이름 오입력(오타) 유사 매칭용.
function editDistance(a = '', b = '') {
  a = a.toUpperCase()
  b = b.toUpperCase()
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// 한글 이름 여부 — 국내예약(한국인) / 해외예약(외국인) 목록 구분용.
const isKoreanName = (n = '') => /[가-힣]/.test(n)

export const POS_RESV_NOTES = [
  '현재(1차)는 예약 목록 조회 중심 — 국내예약(기본)/해외예약 토글로 목록에서 예약을 선택해 거래처리',
  '⚠ 신분증 스캔(자동 매칭)은 우선순위에서 밀림 — 지점 확인 후 고도화 단계에 도입 예정(현재 화면은 미리보기만)',
  '목록 구분: 국내예약=한국인(한글 이름), 해외예약=외국인(영문 이름)',
  '회원 우대 대상 예약은 목록에 🏅 회원 우대 배지로 표시 — 수령 시 현장에서 우대',
  '신분증 대조 자체는 수령 시점에 지점에서 육안 확인(온라인 사전 수집 없음) — 스캔 자동화가 고도화 대상',
  '거래진행은 기존 거래처리 화면으로 연결(프로토타입은 플레이스홀더)',
  '자세히: 01_IA.md',
]

// 화면 A · POS 환전예약 → 국내/해외 · 두 탭 모두 신분증 스캔 우선(국내는 건너뛰기 → 목록)
export default function PosReservationSearch() {
  const nav = useNavigate()
  const { reservations } = useReservations()

  const [tab, setTab] = useState('domestic') // 'domestic'(국내) | 'foreign'(해외)
  const [scanning, setScanning] = useState(false) // 인식 중 애니메이션
  const [scanned, setScanned] = useState(null) // { name, birthDate }
  // 현재(1차)는 예약 목록 조회가 기본. 신분증 스캔은 고도화 예정(지점 확인 후) — 미리보기로만 진입.
  const [skipped, setSkipped] = useState(true)

  // 데모 신분증 — 탭별 신원. 국내는 한국인(한글 이름), 해외는 외국인(영문 이름).
  //  · 해외(JOHN SMITH): 일치 예약 다수 + 생년월일 동일한 오타 이름 'JON SMITH'가 유사로 잡힘
  //  · 국내(홍길동): 한글 이름 예약과 일치
  const DEMO_IDS = {
    domestic: { name: '홍길동', birthDate: '1985-05-16' },
    foreign: { name: 'JOHN SMITH', birthDate: '1986-04-12' },
  }

  // 탭 전환 시 스캔/건너뛰기 상태 초기화
  function selectTab(next) {
    setTab(next)
    setScanned(null)
    setScanning(false)
    setSkipped(false)
  }

  // 스캔 시뮬레이션: 잠깐 인식 중 → 신분증 정보 인식 완료 (현재 탭의 데모 신원)
  function runScan() {
    setScanning(true)
    const id = DEMO_IDS[tab]
    setTimeout(() => {
      setScanning(false)
      setScanned(id)
    }, 1400)
  }

  function resetScan() {
    setScanned(null)
    setScanning(false)
  }

  // 스캔 결과와 대조: 정확 일치(이름+생년월일) / 유사(오입력 의심: 생년월일 동일 + 이름 오타)
  const exactMatches = scanned
    ? reservations.filter((r) => r.customerName === scanned.name && r.birthDate === scanned.birthDate)
    : []
  const similarMatches = scanned
    ? reservations.filter(
        (r) =>
          r.birthDate === scanned.birthDate &&
          r.customerName !== scanned.name &&
          editDistance(r.customerName, scanned.name) <= 2
      )
    : []

  function proceed() {
    nav('/pos/reservation/flow')
  }

  // 건너뛰기 목록: 국내=한국인(한글 이름), 해외=외국인(영문 이름)
  const skipList = reservations.filter((r) =>
    tab === 'domestic' ? isKoreanName(r.customerName) : !isKoreanName(r.customerName)
  )

  return (
    <div className="pos-resv">
      <DevNote items={POS_RESV_NOTES} />
      <header className="pos-resv-head">
        <div className="prh-title">
          <span className="prh-icon">📋</span>
          <h1>환전예약</h1>
        </div>
        <div className="prh-actions">
          <button className="cems-btn" onClick={() => nav('/pos')}>
            홈
          </button>
        </div>
      </header>

      {/* 국내예약(기본) / 해외예약 토글 */}
      <div className="visit-toggle pos-resv-tab" role="group" aria-label="예약 구분">
        <button
          type="button"
          className={tab === 'domestic' ? 'active' : ''}
          onClick={() => selectTab('domestic')}
        >
          국내예약
        </button>
        <button
          type="button"
          className={tab === 'foreign' ? 'active' : ''}
          onClick={() => selectTab('foreign')}
        >
          해외예약
        </button>
      </div>

      <div className="pos-scan" style={{ marginTop: 16 }}>
        <div className="card scan-panel">
          {skipped ? (
            /* 건너뛰기 → 예약 목록 (국내=한국인 / 해외=외국인) */
            <>
              <h3 className="scan-h">📋 예약 목록 ({skipList.length})</h3>
              <p className="muted">예약을 선택하면 기존 거래처리 화면으로 이동합니다. (현재 1차 운영 방식)</p>
              <div className="scan-matches">
                {skipList.length === 0 && (
                  <div className="notice" style={{ marginTop: 6 }}>예약이 없습니다.</div>
                )}
                {skipList.map((m) => (
                  <button key={m.reservationNo} type="button" className="scan-match" onClick={proceed}>
                    <span className="sm-no">
                      {m.reservationNo}
                      <span className="sm-name">
                        {m.customerName}
                        {m.coupon && <span className="sm-member">🏅 회원 우대</span>}
                      </span>
                    </span>
                    <span className="sm-cur">
                      {CURRENCY_META[m.currency]?.flag} {formatNumber(m.foreignAmount)} {m.currency}
                    </span>
                    <span className="sm-date">{formatDate(m.pickupDate, 'ko')}</span>
                    <StatusBadge status={m.status} />
                  </button>
                ))}
              </div>
              <button type="button" className="btn ghost block" onClick={() => setSkipped(false)}>
                🪪 신분증 스캔 미리보기 (고도화 예정)
              </button>
              <div className="tiny scan-demo-note">
                신분증 스캔 자동 매칭은 지점 확인 후 고도화 단계에 도입 예정입니다.
              </div>
            </>
          ) : !scanned ? (
            /* 신분증 스캔 화면 (고도화 예정 · 미리보기) */
            <>
              <div className="notice" style={{ marginBottom: 10 }}>
                ⚠ <b>고도화 예정</b> — 신분증 스캔 자동 매칭은 지점 확인 후 고도화 단계에 도입됩니다. 아래는 미리보기입니다. (현재 1차는 예약 목록 조회로 진행)
              </div>
              <h3 className="scan-h">🪪 신분증 스캔 <span className="tiny">(고도화 예정)</span></h3>
              <p className="muted">
                {tab === 'domestic'
                  ? '신분증을 스캔해 예약자 본인을 확인합니다. (도입 시)'
                  : '여권/신분증을 스캔하면 이름·생년월일이 일치하거나 유사한 예약을 조회합니다. (도입 시)'}
              </p>
              <div className={`scan-frame${scanning ? ' scanning' : ''}`}>
                <div className="scan-frame-corner tl" />
                <div className="scan-frame-corner tr" />
                <div className="scan-frame-corner bl" />
                <div className="scan-frame-corner br" />
                {scanning && <div className="scan-line" />}
                <div className="scan-frame-body">
                  <div className="scan-frame-icon">{scanning ? '🔎' : '🪪'}</div>
                  <div className="scan-frame-text">
                    {scanning ? '신분증 인식 중…' : '신분증을 스캔해주세요'}
                  </div>
                  <div className="scan-frame-sub">
                    {scanning ? '잠시만 기다려주세요' : '여권 또는 신분증을 스캐너 위에 올려주세요'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn primary scan-go-btn"
                onClick={runScan}
                disabled={scanning}
              >
                {scanning ? '인식 중…' : '📷 신분증 스캔'}
              </button>
              <div className="tiny scan-demo-note">데모: 버튼을 누르면 샘플 신분증으로 스캔됩니다 (고도화 도입 시 동작)</div>
              <button
                type="button"
                className="btn ghost block scan-skip-btn"
                onClick={() => setSkipped(true)}
                disabled={scanning}
              >
                ‹ 예약 목록으로 (현재 운영)
              </button>
            </>
          ) : (
            /* 스캔 완료 → 일치/유사 예약 조회 (국내·해외 공통) */
            <>
              <div className="scan-result">
                <span>
                  ✅ 인식 완료 · 🪪 <b>{scanned.name}</b> · {scanned.birthDate}
                </span>
                <button type="button" className="btn ghost sm" onClick={resetScan}>
                  다시 스캔
                </button>
              </div>

              {exactMatches.length === 0 && similarMatches.length === 0 && (
                <div className="notice danger" style={{ marginTop: 10 }}>
                  이름·생년월일이 일치하거나 유사한 예약이 없습니다.
                </div>
              )}

              {exactMatches.length > 0 && (
                <div className="scan-matches">
                  <div className="tiny">일치 예약 ({exactMatches.length})</div>
                  {exactMatches.map((m) => (
                    <button key={m.reservationNo} type="button" className="scan-match" onClick={proceed}>
                      <span className="sm-no">
                        {m.reservationNo}
                        <span className="sm-name">
                          {m.customerName}
                          {m.coupon && <span className="sm-member">🏅 회원 우대</span>}
                        </span>
                      </span>
                      <span className="sm-cur">
                        {CURRENCY_META[m.currency]?.flag} {formatNumber(m.foreignAmount)} {m.currency}
                      </span>
                      <span className="sm-date">{formatDate(m.pickupDate, 'ko')}</span>
                      <StatusBadge status={m.status} />
                    </button>
                  ))}
                </div>
              )}

              {similarMatches.length > 0 && (
                <div className="scan-matches">
                  <div className="tiny scan-similar-label">
                    ⚠️ 유사 (오입력 의심) ({similarMatches.length})
                  </div>
                  {similarMatches.map((m) => (
                    <button
                      key={m.reservationNo}
                      type="button"
                      className="scan-match similar"
                      onClick={proceed}
                    >
                      <span className="sm-no">
                        {m.reservationNo}
                        <span className="sm-typo">{m.customerName}</span>
                        {m.coupon && <span className="sm-member">🏅 회원 우대</span>}
                      </span>
                      <span className="sm-cur">
                        {CURRENCY_META[m.currency]?.flag} {formatNumber(m.foreignAmount)} {m.currency}
                      </span>
                      <span className="sm-date">{formatDate(m.pickupDate, 'ko')}</span>
                      <StatusBadge status={m.status} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

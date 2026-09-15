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

export const POS_RESV_NOTES = [
  '환전예약 = 국내예약(기본) / 해외예약 토글 — 두 탭 모두 신분증 스캔이 먼저',
  '국내예약: 신분증 스캔 또는 하단 "건너뛰기" → 전체 예약 목록 → 선택 시 기존 거래처리 화면',
  '해외예약: 스캔 → 이름·생년월일이 일치(공통값)하거나 유사(오입력 의심)한 예약을 조회 → 선택 시 거래처리',
  '유사 매칭: 생년월일이 같고 이름 편집거리 ≤ 2 (여권 스캔 오인식/카운터 오입력 대비)',
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
  const [skipped, setSkipped] = useState(false) // 국내예약: 스캔 건너뛰고 전체 목록 보기

  // 데모 신분증 1개 — 일치/유사 매칭을 모두 보여줄 수 있는 신원으로 고정.
  // (일치 예약 다수 + 생년월일 동일한 오타 이름 'JON SMITH' 예약이 유사로 잡힘)
  const DEMO_ID = { name: 'JOHN SMITH', birthDate: '1986-04-12' }

  // 탭 전환 시 스캔/건너뛰기 상태 초기화
  function selectTab(next) {
    setTab(next)
    setScanned(null)
    setScanning(false)
    setSkipped(false)
  }

  // 스캔 시뮬레이션: 잠깐 인식 중 → 신분증 정보 인식 완료
  function runScan() {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setScanned(DEMO_ID)
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
          {tab === 'domestic' && skipped ? (
            /* 건너뛰기 → 전체 예약 목록 */
            <>
              <h3 className="scan-h">📋 예약 목록</h3>
              <p className="muted">예약을 선택하면 기존 거래처리 화면으로 이동합니다.</p>
              <div className="scan-matches">
                {reservations.map((m) => (
                  <button key={m.reservationNo} type="button" className="scan-match" onClick={proceed}>
                    <span className="sm-no">
                      {m.reservationNo}
                      <span className="sm-name">{m.customerName}</span>
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
                ‹ 신분증 스캔으로
              </button>
            </>
          ) : !scanned ? (
            /* 신분증 스캔 화면 (국내·해외 공통) */
            <>
              <h3 className="scan-h">🪪 신분증 스캔</h3>
              <p className="muted">
                {tab === 'domestic'
                  ? '신분증을 스캔해 예약자 본인을 확인합니다. 스캔 없이 진행하려면 건너뛰기를 누르세요.'
                  : '여권/신분증을 스캔하면 이름·생년월일이 일치하거나 유사한 예약을 조회합니다.'}
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
              <div className="tiny scan-demo-note">데모: 버튼을 누르면 샘플 신분증으로 스캔됩니다</div>
              {tab === 'domestic' && (
                <button
                  type="button"
                  className="btn ghost block scan-skip-btn"
                  onClick={() => setSkipped(true)}
                  disabled={scanning}
                >
                  건너뛰기
                </button>
              )}
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
                      <span className="sm-no">{m.reservationNo}</span>
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

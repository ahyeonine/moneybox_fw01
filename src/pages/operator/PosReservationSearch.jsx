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
  '환전예약 = 국내예약(기본) / 해외예약 토글. 국내예약은 기존 POS 화면(플레이스홀더)',
  '해외예약: 신분증 스캔 → 스캔된 이름·생년월일과 일치(공통값)하거나 유사(오입력 의심)한 예약을 조회',
  '유사 매칭: 생년월일이 같고 이름 편집거리 ≤ 2 (여권 스캔 오인식/카운터 오입력 대비)',
  '거래진행은 기존 거래처리 화면으로 연결(프로토타입은 플레이스홀더)',
  '자세히: 01_IA.md',
]

// 화면 A · POS 환전예약 → 국내/해외 · 해외는 신분증 스캔으로 예약 조회
export default function PosReservationSearch() {
  const nav = useNavigate()
  const { reservations } = useReservations()

  const [tab, setTab] = useState('domestic') // 'domestic'(국내) | 'foreign'(해외)
  const [scanned, setScanned] = useState(null) // { name, birthDate }

  // 신분증 스캔 데모용 신원 목록 (이름+생년월일 중복 제거)
  const demoIds = []
  {
    const seen = new Set()
    for (const r of reservations) {
      if (!r.birthDate) continue
      const k = `${r.customerName}|${r.birthDate}`
      if (seen.has(k)) continue
      seen.add(k)
      demoIds.push({ name: r.customerName, birthDate: r.birthDate })
    }
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
          onClick={() => setTab('domestic')}
        >
          국내예약
        </button>
        <button
          type="button"
          className={tab === 'foreign' ? 'active' : ''}
          onClick={() => setTab('foreign')}
        >
          해외예약
        </button>
      </div>

      {tab === 'domestic' ? (
        <div className="fxflow-placeholder" style={{ marginTop: 16 }}>
          <div className="fxflow-text">기존 화면 (국내예약)</div>
        </div>
      ) : (
        <div className="pos-scan" style={{ marginTop: 16 }}>
          <div className="card scan-panel">
            <h3 className="scan-h">🪪 신분증 스캔</h3>
            <p className="muted">
              여권/신분증을 스캔하면 이름·생년월일이 일치하거나 유사한 예약을 조회합니다.
            </p>
            {!scanned ? (
              <>
                <div className="tiny scan-demo-label">데모: 스캔할 신분증 선택</div>
                <div className="scan-demo-list">
                  {demoIds.map((id) => (
                    <button
                      key={`${id.name}|${id.birthDate}`}
                      type="button"
                      className="scan-demo-btn"
                      onClick={() => setScanned(id)}
                    >
                      📷 {id.name} · {id.birthDate}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="scan-result">
                  <span>
                    🪪 <b>{scanned.name}</b> · {scanned.birthDate}
                  </span>
                  <button type="button" className="btn ghost sm" onClick={() => setScanned(null)}>
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
      )}
    </div>
  )
}

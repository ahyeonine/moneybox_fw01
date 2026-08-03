import { useState, useEffect } from 'react'
import { BRANCHES } from '../../data/branches.js'
import { CURRENCY_ORDER, CURRENCY_META, getRate } from '../../data/rates.js'
import { useSettings } from '../../store/SettingsContext.jsx'
import { formatNumber } from '../../lib/format.js'
import DevNote from '../../components/DevNote.jsx'

// 화면 3 (신규) · 설정 → 외국인서비스 한도관리
// [최소금액][최대금액] 토글로 전환 (기본 최소금액)
//  - 최소금액: 통화별 최소 환전금액 (전체 지점 공통)
//  - 최대금액: 지점별 건당 최대 환전금액 (원화 기준 일괄입력 → 통화별 상한 자동계산)

export default function LimitManagement() {
  const { minAmounts, saveMinAmounts, getBranchMax, saveBranchMax } = useSettings()
  const [tab, setTab] = useState('min') // 'min' | 'max' (기본 최소금액)

  /* ── 최소금액 ── */
  const [minTable, setMinTable] = useState(() => ({ ...minAmounts }))
  const [minSaved, setMinSaved] = useState(false)

  function saveMins() {
    const cleaned = {}
    for (const c of CURRENCY_ORDER) cleaned[c] = Number(minTable[c]) || 0
    saveMinAmounts(cleaned)
    setMinSaved(true)
    setTimeout(() => setMinSaved(false), 1500)
  }

  /* ── 최대금액 ── */
  const [branchId, setBranchId] = useState(BRANCHES[0].id)
  const [maxTable, setMaxTable] = useState({})
  const [bulkKrw, setBulkKrw] = useState('')
  const [maxSaved, setMaxSaved] = useState(false)

  // 지점 변경 시 저장된 값 로드 (없으면 빈 값)
  useEffect(() => {
    setMaxTable({ ...getBranchMax(branchId) })
    setBulkKrw('')
  }, [branchId, getBranchMax])

  // 원화(KRW) 기준 금액 → 전체 통화 상한 자동계산 (로드환율)
  function applyBulk() {
    const krw = Number(bulkKrw)
    if (!krw) return
    const next = {}
    for (const c of CURRENCY_ORDER) {
      const rate = getRate(c)
      if (!rate) continue
      // 통화별 상한 = 원화금액 / 해당통화 환율. 자릿수에 맞춰 반올림.
      next[c] = roundNice(krw / rate)
    }
    setMaxTable(next)
  }

  function saveMaxes() {
    const cleaned = {}
    for (const c of CURRENCY_ORDER) {
      const v = Number(maxTable[c])
      if (v) cleaned[c] = v
    }
    saveBranchMax(branchId, cleaned)
    setMaxSaved(true)
    setTimeout(() => setMaxSaved(false), 1500)
  }

  return (
    <div>
      <DevNote
        items={[
          '최소금액: 통화별, 전체 지점 공통',
          '최대금액(하드리밋): 지점별로 다르게, 원화(KRW) 기준 1개 입력하면 로드환율로 전체 통화 자동 환산되는 방식',
          '⚠️ 이 최대금액 하드리밋은 애초 정책회의에서 "최대금액 제한 없음"으로 확정됐던 것과 상충하는 부분이라 정책 재확인이 필요한 상태',
        ]}
      />
      <h1 className="cems-h1">외국인서비스 한도관리</h1>

      {/* 최소금액 / 최대금액 토글 */}
      <div className="cems-panel">
        <div className="visit-toggle limit-tab">
          <button className={tab === 'min' ? 'active' : ''} onClick={() => setTab('min')}>
            최소금액
          </button>
          <button className={tab === 'max' ? 'active' : ''} onClick={() => setTab('max')}>
            최대금액
          </button>
        </div>
      </div>

      {/* 최소금액 */}
      {tab === 'min' && (
        <div className="cems-panel">
          <div className="panel-head">
            <h2 className="cems-h2">통화별 최소 환전금액 <span className="tiny">(전체 지점 공통)</span></h2>
            <div>
              {minSaved && <span className="saved-flash">저장됨</span>}
              <button className="cems-btn primary" onClick={saveMins}>
                전체 저장
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="cems-table limit-table">
              <thead>
                <tr>
                  <th>통화</th>
                  <th className="num">최소금액</th>
                </tr>
              </thead>
              <tbody>
                {CURRENCY_ORDER.map((c) => (
                  <tr key={c}>
                    <td>
                      {CURRENCY_META[c]?.flag} {c} · {CURRENCY_META[c]?.label.ko}
                    </td>
                    <td className="num">
                      <input
                        type="number"
                        value={minTable[c] ?? ''}
                        onChange={(e) => setMinTable((t) => ({ ...t, [c]: e.target.value }))}
                        className="cell-input"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tiny" style={{ marginTop: 8 }}>
            ※ 최대금액은 지점별 리스크 상한으로 "최대금액" 탭에서 관리합니다.
          </div>
        </div>
      )}

      {/* 최대금액 */}
      {tab === 'max' && (
        <div className="cems-panel">
          <div className="panel-head">
            <h2 className="cems-h2">지점별 건당 최대 환전금액 <span className="tiny">(환율 리스크 상한)</span></h2>
            <div>
              {maxSaved && <span className="saved-flash">저장됨</span>}
              <button className="cems-btn primary" onClick={saveMaxes}>
                지점 저장
              </button>
            </div>
          </div>

          <div className="limit-controls">
            <label>
              <span>지점 선택</span>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name.ko}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>최대 환전 가능 금액(원화 기준)</span>
              <div className="range">
                <input
                  type="number"
                  value={bulkKrw}
                  onChange={(e) => setBulkKrw(e.target.value)}
                  placeholder="예: 5000000"
                />
                <span className="unit">원</span>
                <button className="cems-btn" onClick={applyBulk} disabled={!bulkKrw}>
                  전체 통화에 일괄 적용
                </button>
              </div>
            </label>
          </div>

          <div className="table-wrap">
            <table className="cems-table limit-table">
              <thead>
                <tr>
                  <th>통화</th>
                  <th className="num">자동계산된 최대금액</th>
                  <th className="num">개별수정</th>
                </tr>
              </thead>
              <tbody>
                {CURRENCY_ORDER.map((c) => (
                  <tr key={c}>
                    <td>
                      {CURRENCY_META[c]?.flag} {c}
                    </td>
                    <td className="num auto-cell">
                      {maxTable[c] != null && maxTable[c] !== '' ? formatNumber(maxTable[c]) : '-'}
                    </td>
                    <td className="num">
                      <input
                        type="number"
                        value={maxTable[c] ?? ''}
                        onChange={(e) => setMaxTable((t) => ({ ...t, [c]: e.target.value }))}
                        className="cell-input"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tiny" style={{ marginTop: 8 }}>
            ※ 원화 금액을 입력·적용하면 로드환율로 통화별 상한이 자동계산됩니다. 지점을 바꾸면 저장된 값을
            불러오고(없으면 빈 값), 이후 개별 통화만 따로 수정할 수 있습니다. 저장/적용은 화면 상태에만
            반영되며 새로고침 시 초기화됩니다.
          </div>
        </div>
      )}
    </div>
  )
}

// 금액 자릿수에 맞춰 보기 좋게 반올림
function roundNice(n) {
  if (n >= 1000000) return Math.round(n / 10000) * 10000
  if (n >= 100000) return Math.round(n / 1000) * 1000
  if (n >= 1000) return Math.round(n / 100) * 100
  if (n >= 100) return Math.round(n / 10) * 10
  return Math.round(n)
}

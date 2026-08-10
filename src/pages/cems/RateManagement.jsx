import { useState, useEffect } from 'react'
import { CURRENCY_ORDER, CURRENCY_META } from '../../data/rates.js'
import { useRates } from '../../store/RatesContext.jsx'
import { useSettings } from '../../store/SettingsContext.jsx'
import { formatNumber, formatKrw } from '../../lib/format.js'
import DevNote from '../../components/DevNote.jsx'

// 화면 2 · 설정 → 환전율관리 (레퍼런스 재현, 대부분 읽기전용 데모)
// 상단 통화 선택 / 사실때·기준·파실때 / 보유량 요약 / 채널별 환율 테이블.
// 채널 행 중 "외국인 웹사이트"(구 신논현 무인환전기)만 수동/자동(%) 입력 UI 동작.

const round = (n) => Math.round(n * 100) / 100

// 채널 목록. 적용처는 특정 지점명 노출 없이 일반 명칭 사용.
//  - '지점'          : 기존 "강남 신논현 환전" → 일반 명칭으로 변경
//  - '외국인 웹사이트' : 기존 "신논현 무인환전기" 자리에 새로 추가된 행
//  - '환전예약' / '온라인환전' : 그대로 유지
// 외국인 웹사이트 채널은 매입(원화구매)만 영구 지원 → 매각 값 자체가 없음(saleNA).
const CHANNELS = [
  { key: 'branch', name: '지점', flags: { hide: false, apply: true, exSell: false, sameDayBlock: false } },
  { key: 'foreign', name: '외국인 웹사이트', flags: { hide: false, apply: true, exSell: false, sameDayBlock: false }, saleNA: true },
  { key: 'reservation', name: '환전예약', flags: { hide: false, apply: true, exSell: false, sameDayBlock: true } },
  { key: 'online', name: '온라인환전', flags: { hide: true, apply: false, exSell: true, sameDayBlock: false } },
]

// 채널×사이드(매각/매입) 환율 설정 기본값. mode: 'auto'(%) | 'manual'(직접 환율값)
function initRows() {
  const o = {}
  for (const ch of CHANNELS) {
    o[ch.key] = {
      sale: { mode: 'auto', value: '1.75' }, // 고객 외화구매시(매각)
      purchase: { mode: 'auto', value: '1.75' }, // 고객 외화판매시(매입)
    }
  }
  return o
}

// 보유량 요약 — 지점명 익명화(카테고리 명칭). 특정 지점 이름 노출 금지.
const HOLDINGS = [
  { name: '지점', hold: 12000 },
  { name: '무인기', hold: 8500 },
]

// 채널 행의 매각/매입 환율 설정 셀 (수동=직접 환율값 입력 / 자동=% 입력)
function RateCell({ cell, name, onChange }) {
  return (
    <div className="ratemode">
      <label>
        <input
          type="radio"
          name={name}
          checked={cell.mode === 'manual'}
          onChange={() => onChange({ mode: 'manual' })}
        />
        수동
      </label>
      <label>
        <input
          type="radio"
          name={name}
          checked={cell.mode === 'auto'}
          onChange={() => onChange({ mode: 'auto' })}
        />
        자동(%)
      </label>
      <input
        type="number"
        step={cell.mode === 'auto' ? '0.1' : '1'}
        value={cell.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="ratemode-input"
      />
      <span className="tiny">{cell.mode === 'auto' ? '%' : 'KRW'}</span>
    </div>
  )
}

// "외국인 웹사이트" 채널 환율 제어 — 공유 상태(RatesContext)에 직접 반영.
//  · 직접 입력(KRW) → setWebRate → STEP B 신청화면 환율에 실시간 반영(수동 고정)
//  · "자동" → 오버라이드 해제 → 2분 주기 자동 변동 기준환율로 복귀
function WebRateControl({ currency }) {
  const { getRate, webOverride, setWebRate } = useRates()
  const [val, setVal] = useState('')
  useEffect(() => setVal(''), [currency]) // 통화 전환 시 입력창 초기화
  const isManual = webOverride[currency] != null
  const eff = getRate(currency)
  return (
    <div className="webrate">
      <div className="tiny">
        현재 적용 <b>{formatNumber(eff)}</b> KRW{' '}
        <span className={isManual ? 'wr-manual' : 'wr-auto'}>
          {isManual ? '수동 고정' : '자동 변동'}
        </span>
      </div>
      <div className="webrate-edit">
        <input
          type="number"
          className="ratemode-input"
          placeholder="직접 입력(KRW)"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <button className="cems-btn" onClick={() => val && setWebRate(currency, val)} disabled={!val}>
          적용
        </button>
        {isManual && (
          <button
            className="cems-btn"
            onClick={() => {
              setWebRate(currency, '')
              setVal('')
            }}
          >
            자동
          </button>
        )}
      </div>
    </div>
  )
}

export default function RateManagement() {
  const { getRate, getDisplayRates } = useRates()
  const { isWebExcluded, toggleWebExcluded } = useSettings()
  const [currency, setCurrency] = useState('USD')
  const [rows, setRows] = useState(initRows) // 채널×사이드 환율 설정 (데모 상태)

  const base = getRate(currency) // 공유 상태(2분 자동 변동 + 외국인 웹사이트 수동값) 실시간 반영
  const dr = getDisplayRates(currency)

  const setCell = (chKey, side, patch) =>
    setRows((r) => ({ ...r, [chKey]: { ...r[chKey], [side]: { ...r[chKey][side], ...patch } } }))

  return (
    <div>
      <DevNote
        items={[
          '"외국인 웹사이트" 행이 새로 추가됨',
          '"외국인 웹사이트" 매입 환율을 직접 입력하면 외국인 웹사이트 신청화면(STEP B) 환율에 실시간 반영됨',
          '"외국인 웹사이트" 매각제외는 기본 체크+잠금(매각 미지원 확정). 매입제외는 선택된 통화 기준으로 체크 시 신청화면 통화선택에서 즉시 제외',
          '환율은 2분 주기로 자동 갱신됨 (관리자 수동 변경이 없어도 재계산)',
          '자세히: 05_어드민기능정의서.md',
        ]}
      />
      <h1 className="cems-h1">환전율관리</h1>

      {/* 통화 선택 — 18개 통화를 가로 버튼으로 나열, 클릭 시 활성 */}
      <div className="cems-panel">
        <div className="cur-chips" role="tablist" aria-label="통화 선택">
          {CURRENCY_ORDER.map((c) => (
            <button
              key={c}
              className={`cur-chip ${currency === c ? 'active' : ''}`}
              onClick={() => setCurrency(c)}
              aria-selected={currency === c}
            >
              {CURRENCY_META[c]?.flag} {c}
            </button>
          ))}
        </div>
      </div>

      {/* 선택 통화 요약 3숫자 */}
      <div className="cems-panel rate-top">
        <div className="rate-cur-title">
          {CURRENCY_META[currency]?.flag} {currency} · {CURRENCY_META[currency]?.label.ko}
        </div>
        <div className="rate-summary">
          <div className="rs buy">
            <div className="rs-l">사실 때</div>
            <div className="rs-v">{formatNumber(dr.buy)}</div>
          </div>
          <div className="rs base">
            <div className="rs-l">기준환율</div>
            <div className="rs-v">{formatNumber(dr.base)}</div>
          </div>
          <div className="rs sell">
            <div className="rs-l">파실 때</div>
            <div className="rs-v">{formatNumber(dr.sell)}</div>
          </div>
        </div>
      </div>

      {/* 보유량 요약 (더미) */}
      <div className="cems-panel">
        <h2 className="cems-h2">보유량 요약 ({currency})</h2>
        <div className="table-wrap">
          <table className="cems-table">
            <thead>
              <tr>
                <th>지점명</th>
                <th className="num">보유량</th>
                <th className="num">평균환율</th>
                <th className="num">원화금액</th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h, i) => {
                const avg = round(base * (0.995 + i * 0.003)) // 더미
                return (
                  <tr key={h.name}>
                    <td>{h.name}</td>
                    <td className="num">{formatNumber(h.hold)}</td>
                    <td className="num">{formatNumber(avg)}</td>
                    <td className="num">{formatKrw(Math.round(h.hold * avg))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 채널별 환율소환율 */}
      <div className="cems-panel">
        <h2 className="cems-h2">채널별 환율 ({currency})</h2>
        <div className="table-wrap">
          <table className="cems-table channel-table">
            <thead>
              <tr>
                <th>숨김</th>
                <th>적용여부</th>
                <th>매입제외</th>
                <th>매각제외</th>
                <th>당일수령불가</th>
                <th>적용처</th>
                <th className="num">기준율</th>
                <th>고객 외화구매시(매각)</th>
                <th>고객 외화판매시(매입)</th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map((ch) => (
                <tr key={ch.key}>
                  <td>
                    <input type="checkbox" defaultChecked={ch.flags.hide} disabled />
                  </td>
                  <td>
                    <input type="checkbox" defaultChecked={ch.flags.apply} disabled />
                  </td>
                  {/* 매입제외: 외국인 웹사이트만 통화별 상호작용 (체크 시 신청화면 통화선택에서 제외) */}
                  <td>
                    {ch.key === 'foreign' ? (
                      <input
                        type="checkbox"
                        checked={isWebExcluded(currency)}
                        onChange={() => toggleWebExcluded(currency)}
                        title={`${currency} 매입제외 — 체크 시 외국인 웹사이트 통화선택에서 제외`}
                      />
                    ) : (
                      <input type="checkbox" defaultChecked={false} disabled />
                    )}
                  </td>
                  {/* 매각제외: 외국인 웹사이트는 매각 미지원 확정 → 기본 체크 + 잠금(수정 불가) */}
                  <td>
                    {ch.key === 'foreign' ? (
                      <input
                        type="checkbox"
                        checked
                        disabled
                        title="외국인 웹사이트는 매각(외화구매) 미지원 — 항상 제외(잠금)"
                      />
                    ) : (
                      <input type="checkbox" defaultChecked={ch.flags.exSell} disabled />
                    )}
                  </td>
                  <td>
                    <input type="checkbox" defaultChecked={ch.flags.sameDayBlock} disabled />
                  </td>
                  <td className="ch-name">{ch.name}</td>
                  {/* 기준율: 읽기 전용 */}
                  <td className="num">{formatNumber(dr.base)}</td>
                  {/* 고객 외화구매시(매각): 외국인 웹사이트는 매입만 지원 → 해당없음(—) */}
                  <td>
                    {ch.saleNA ? (
                      <span className="cell-na" title="이 채널은 매각을 지원하지 않음">
                        —
                      </span>
                    ) : (
                      <RateCell
                        cell={rows[ch.key].sale}
                        name={`${ch.key}-sale`}
                        onChange={(p) => setCell(ch.key, 'sale', p)}
                      />
                    )}
                  </td>
                  {/* 고객 외화판매시(매입) — 외국인 웹사이트는 공유 환율(STEP B)과 직접 연동 */}
                  <td>
                    {ch.key === 'foreign' ? (
                      <WebRateControl currency={currency} />
                    ) : (
                      <RateCell
                        cell={rows[ch.key].purchase}
                        name={`${ch.key}-purchase`}
                        onChange={(p) => setCell(ch.key, 'purchase', p)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tiny" style={{ marginTop: 8 }}>
          ※ 기준율/사실때·파실때는 2분마다 자동 변동됩니다. 다른 채널의 매각/매입 수동·자동(%) 설정은 화면
          상태로만 반영되며, <b>"외국인 웹사이트" 매입 환율만 신청화면(STEP B)과 실시간 연동</b>됩니다(직접
          입력=수동 고정 / 자동=2분 주기 변동). 매각은 해당없음(—).
        </div>
      </div>
    </div>
  )
}

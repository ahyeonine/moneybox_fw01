import { useState } from 'react'
import { BRANCHES } from '../../data/branches.js'
import { CURRENCY_ORDER, CURRENCY_META, getRate, getDisplayRates } from '../../data/rates.js'
import { formatNumber, formatKrw } from '../../lib/format.js'

// 화면 2 · 설정 → 환전율관리 (레퍼런스 재현, 대부분 읽기전용 데모)
// 상단 통화 선택 / 사실때·기준·파실때 / 보유량 요약 / 채널별 환율 테이블.
// 채널 행 중 "외국인 웹사이트"(구 신논현 무인환전기)만 수동/자동(%) 입력 UI 동작.

const round = (n) => Math.round(n * 100) / 100

// 채널 목록 — "신논현 무인환전기" → "외국인 웹사이트" 로 이름만 변경
const CHANNELS = [
  { key: 'gangnam', name: '강남 신논현 환전', flags: { hide: false, apply: true, exSell: false, sameDayBlock: false } },
  { key: 'foreign', name: '외국인 웹사이트', flags: { hide: false, apply: true, exSell: false, sameDayBlock: false }, editable: true },
  { key: 'reservation', name: '환전예약', flags: { hide: false, apply: true, exSell: false, sameDayBlock: true } },
  { key: 'online', name: '온라인환전', flags: { hide: true, apply: false, exSell: true, sameDayBlock: false } },
]

export default function RateManagement() {
  const [currency, setCurrency] = useState('USD')
  const [webRow, setWebRow] = useState({ mode: 'auto', value: '1.5' }) // 외국인 웹사이트 환전소환율

  const base = getRate(currency)
  const dr = getDisplayRates(currency)
  // 4단계 표시용 티어 (더미)
  const sellHigh = round(base * 1.025) // 사실때(매도)
  const buy = dr.buy // 사실때
  const sell = dr.sell // 파실때
  const buyLow = round(base * 0.975) // 파실때(매입)

  return (
    <div>
      <h1 className="cems-h1">환전율관리</h1>

      {/* 통화 선택 + 요약 3숫자 */}
      <div className="cems-panel rate-top">
        <label className="rate-cur">
          <span>통화</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_META[c]?.flag} {c} · {CURRENCY_META[c]?.label.ko}
              </option>
            ))}
          </select>
        </label>
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
                <th>지점</th>
                <th className="num">보유량</th>
                <th className="num">평균환율</th>
                <th className="num">원화금액</th>
              </tr>
            </thead>
            <tbody>
              {BRANCHES.map((b, i) => {
                const hold = [12000, 8500, 30000, 5000][i] || 5000 // 더미
                const avg = round(base * (0.995 + i * 0.002))
                return (
                  <tr key={b.id}>
                    <td>{b.name.ko}</td>
                    <td className="num">{formatNumber(hold)}</td>
                    <td className="num">{formatNumber(avg)}</td>
                    <td className="num">{formatKrw(Math.round(hold * avg))}</td>
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
                <th>매각제외</th>
                <th>당일수령불가</th>
                <th>적용처</th>
                <th className="num">사실때(매도)</th>
                <th className="num">사실때</th>
                <th className="num">파실때</th>
                <th className="num">파실때(매입)</th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map((ch) => (
                <tr key={ch.key} className={ch.editable ? 'row-editable' : ''}>
                  <td>
                    <input type="checkbox" defaultChecked={ch.flags.hide} disabled />
                  </td>
                  <td>
                    <input type="checkbox" defaultChecked={ch.flags.apply} disabled />
                  </td>
                  <td>
                    <input type="checkbox" defaultChecked={ch.flags.exSell} disabled />
                  </td>
                  <td>
                    <input type="checkbox" defaultChecked={ch.flags.sameDayBlock} disabled />
                  </td>
                  <td className="ch-name">{ch.name}</td>
                  {ch.editable ? (
                    <td className="num ch-edit" colSpan={4}>
                      <div className="ratemode">
                        <label>
                          <input
                            type="radio"
                            name="webmode"
                            checked={webRow.mode === 'manual'}
                            onChange={() => setWebRow((r) => ({ ...r, mode: 'manual' }))}
                          />
                          수동
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="webmode"
                            checked={webRow.mode === 'auto'}
                            onChange={() => setWebRow((r) => ({ ...r, mode: 'auto' }))}
                          />
                          자동(%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={webRow.value}
                          onChange={(e) => setWebRow((r) => ({ ...r, value: e.target.value }))}
                          className="ratemode-input"
                        />
                        <span className="tiny">{webRow.mode === 'auto' ? '%' : 'KRW'}</span>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="num">{formatNumber(sellHigh)}</td>
                      <td className="num">{formatNumber(buy)}</td>
                      <td className="num">{formatNumber(sell)}</td>
                      <td className="num">{formatNumber(buyLow)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tiny" style={{ marginTop: 8 }}>
          ※ 읽기 전용 데모입니다. "외국인 웹사이트" 행의 수동/자동 입력만 화면 상태로 반영됩니다.
        </div>
      </div>
    </div>
  )
}

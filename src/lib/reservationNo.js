// 예약번호 생성: RSV-YYYYMMDD-#### (일자별 4자리 시퀀스)
// 프로토타입에서는 전역 예약 목록을 스캔해 당일 최대 시퀀스+1 로 발급한다.
// 실제 백엔드에서는 DB 시퀀스/유니크 제약으로 처리해야 함.

export function generateReservationNo(todayIso, existing = []) {
  const datePart = todayIso.replace(/-/g, '') // YYYYMMDD
  const prefix = `RSV-${datePart}-`
  let maxSeq = 0
  for (const r of existing) {
    if (r.reservationNo && r.reservationNo.startsWith(prefix)) {
      const seq = parseInt(r.reservationNo.slice(prefix.length), 10)
      if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq
    }
  }
  const next = String(maxSeq + 1).padStart(4, '0')
  return `${prefix}${next}`
}

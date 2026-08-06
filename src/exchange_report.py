"""매일 아침 환율 보고서 자동 발송 시스템.

영업일 08:30 KST(한국 장 시작 09:00 이전)에 Twelve Data에서 USD/KRW, JPY/KRW
일봉 OHLC(KST 기준)를 가져와 보고서를 만들고 Notion에 기록한다.
조회/기록 실패 시 Slackbot(Incoming Webhook)으로 알린다.

PRD: docs/PRD-daily-exchange-rate-report.md

서브커맨드
  run           : 오늘(영업일) 보고서를 생성해 Notion에 기록
  dry-run       : Notion/Slack 없이 콘솔에만 출력 (Twelve Data 키만 필요)
  setup-notion  : 대상 Notion 페이지 하위에 시계열 DB를 1회 생성하고 DB id 출력
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from dataclasses import dataclass
from datetime import date, datetime
from typing import Callable, Optional
from zoneinfo import ZoneInfo

import requests

KST = ZoneInfo("Asia/Seoul")
TWELVEDATA_BASE = "https://api.twelvedata.com"
NOTION_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"
SOURCE_LABEL = "Twelve Data"

# 대상 심볼 설정. multiplier 는 표시 단위 환산 계수.
#   JPY/KRW 는 1엔 기준으로 오므로 100엔 기준 표기를 위해 ×100.
SYMBOLS: list["SymbolConfig"] = []


@dataclass(frozen=True)
class SymbolConfig:
    symbol: str          # Twelve Data 심볼 (예: "USD/KRW")
    label: str           # 표기 라벨 (예: "JPY/KRW(100엔)")
    flag: str            # 국기 이모지
    multiplier: float    # 표시 단위 환산 계수


SYMBOLS = [
    SymbolConfig("USD/KRW", "USD/KRW", "🇺🇸", 1.0),
    SymbolConfig("JPY/KRW", "JPY/KRW(100엔)", "🇯🇵", 100.0),
]


@dataclass
class Candle:
    day: date
    open: float
    high: float
    low: float
    close: float


@dataclass
class SymbolReport:
    config: SymbolConfig
    base_day: date          # 직전 거래일(기준일)
    ohlc: Candle            # 표시 단위로 환산된 직전 거래일 일봉
    change: float           # 종가 전일 대비 등락액
    change_pct: float       # 등락률(%)


# --------------------------------------------------------------------------- #
# 순수 로직 (단위 테스트 대상)
# --------------------------------------------------------------------------- #
def parse_candles(values: list[dict]) -> list[Candle]:
    """Twelve Data time_series `values`(문자열 dict)를 Candle 리스트로 파싱."""
    out: list[Candle] = []
    for v in values:
        out.append(
            Candle(
                day=datetime.strptime(v["datetime"][:10], "%Y-%m-%d").date(),
                open=float(v["open"]),
                high=float(v["high"]),
                low=float(v["low"]),
                close=float(v["close"]),
            )
        )
    return out


def pick_completed_candles(
    candles: list[Candle], today: date
) -> tuple[Candle, Candle]:
    """오늘(진행 중) 캔들을 제외하고 완성된 직전/직전전 거래일 캔들을 고른다.

    Twelve Data 는 거래일 캔들만 반환하므로 주말·비거래일은 자연히 빠진다.
    """
    completed = sorted(
        (c for c in candles if c.day < today), key=lambda c: c.day, reverse=True
    )
    if len(completed) < 2:
        raise ValueError(
            f"완성된 거래일 캔들이 2개 미만입니다(확보 {len(completed)}개). "
            "outputsize 를 늘리거나 데이터 지연을 확인하세요."
        )
    return completed[0], completed[1]


def apply_multiplier(candle: Candle, multiplier: float) -> Candle:
    """표시 단위 환산(JPY 100엔 등)."""
    if multiplier == 1.0:
        return candle
    return Candle(
        day=candle.day,
        open=candle.open * multiplier,
        high=candle.high * multiplier,
        low=candle.low * multiplier,
        close=candle.close * multiplier,
    )


def compute_change(latest_close: float, prev_close: float) -> tuple[float, float]:
    """종가 등락액과 등락률(%)."""
    change = latest_close - prev_close
    pct = (change / prev_close * 100.0) if prev_close else 0.0
    return change, pct


def build_symbol_report(
    cfg: SymbolConfig, candles: list[Candle], today: date
) -> SymbolReport:
    latest, prev = pick_completed_candles(candles, today)
    latest_disp = apply_multiplier(latest, cfg.multiplier)
    prev_disp = apply_multiplier(prev, cfg.multiplier)
    change, pct = compute_change(latest_disp.close, prev_disp.close)
    return SymbolReport(
        config=cfg,
        base_day=latest_disp.day,
        ohlc=latest_disp,
        change=change,
        change_pct=pct,
    )


def _arrow(change: float) -> str:
    if change > 0:
        return "▲"
    if change < 0:
        return "▼"
    return "-"


def format_summary(reports: list[SymbolReport], send_dt: datetime) -> str:
    """Notion/콘솔용 가독형 요약 텍스트."""
    weekdays = ["월", "화", "수", "목", "금", "토", "일"]
    send_str = f"{send_dt:%Y-%m-%d}({weekdays[send_dt.weekday()]}) {send_dt:%H:%M} KST"
    base_day = reports[0].base_day if reports else send_dt.date()
    base_str = f"{base_day:%Y-%m-%d}({weekdays[base_day.weekday()]})"

    lines = [
        "📈 환율 보고서 | 발송 " + send_str,
        f"기준: {base_str} KST 일봉 · 직전 거래일 · 출처: {SOURCE_LABEL}",
        "─" * 32,
    ]
    for r in reports:
        o = r.ohlc
        lines.append(
            f"{r.config.flag} {r.config.label}   "
            f"종가 {o.close:,.2f}원   "
            f"{_arrow(r.change)} {abs(r.change):,.2f}  "
            f"({r.change_pct:+.2f}%)"
        )
        lines.append(
            f"   └ OHLC  시 {o.open:,.2f} · 고 {o.high:,.2f} · "
            f"저 {o.low:,.2f} · 종 {o.close:,.2f}"
        )
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# 외부 연동
# --------------------------------------------------------------------------- #
def _retry(fn: Callable, *, attempts: int = 3, base_delay: float = 2.0):
    """지수 백오프 재시도 (2s, 4s, ...). 마지막 예외를 전달."""
    last: Optional[Exception] = None
    for i in range(attempts):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 - 네트워크 계열 폭넓게 재시도
            last = exc
            if i < attempts - 1:
                time.sleep(base_delay * (2**i))
    assert last is not None
    raise last


def fetch_time_series(symbol: str, apikey: str, outputsize: int = 5) -> list[dict]:
    """Twelve Data time_series(1day, timezone=Asia/Seoul) 조회 → values 반환."""
    params = {
        "symbol": symbol,
        "interval": "1day",
        "timezone": "Asia/Seoul",
        "outputsize": outputsize,
        "apikey": apikey,
    }

    def _call() -> list[dict]:
        resp = requests.get(f"{TWELVEDATA_BASE}/time_series", params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        if data.get("status") == "error" or "values" not in data:
            raise RuntimeError(
                f"Twelve Data 오류({symbol}): {data.get('message', data)}"
            )
        # meta.exchange_timezone 정합 검증 (경고만, 치명 아님)
        tz = (data.get("meta") or {}).get("exchange_timezone")
        if tz and tz != "Asia/Seoul":
            print(f"[warn] {symbol} exchange_timezone={tz} (기대 Asia/Seoul)",
                  file=sys.stderr)
        return data["values"]

    return _retry(_call)


def is_korean_holiday(d: date, holiday_api_key: Optional[str]) -> bool:
    """공휴일 여부. 특일정보 API 우선, 실패/무키 시 holidays 라이브러리 폴백."""
    if holiday_api_key:
        try:
            return _holiday_via_api(d, holiday_api_key)
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] 특일정보 API 실패, 라이브러리 폴백: {exc}", file=sys.stderr)
    return _holiday_via_library(d)


def _holiday_via_api(d: date, api_key: str) -> bool:
    """공공데이터포털 특일정보(국경일+공휴일) API 조회."""
    url = (
        "https://apis.data.go.kr/B090041/openapi/service/"
        "SpcdeInfoService/getRestDeInfo"
    )
    params = {
        "serviceKey": api_key,
        "solYear": d.year,
        "solMonth": f"{d.month:02d}",
        "_type": "json",
        "numOfRows": 50,
    }
    resp = requests.get(url, params=params, timeout=20)
    resp.raise_for_status()
    body = (resp.json().get("response") or {}).get("body") or {}
    items = (body.get("items") or {}).get("item")
    if not items:
        return False
    if isinstance(items, dict):
        items = [items]
    target = int(f"{d.year}{d.month:02d}{d.day:02d}")
    return any(int(it.get("locdate")) == target for it in items)


def _holiday_via_library(d: date) -> bool:
    try:
        import holidays  # type: ignore
    except ImportError:
        print("[warn] holidays 라이브러리 미설치 — 공휴일 판정 생략", file=sys.stderr)
        return False
    return d in holidays.SouthKorea(years=d.year)


def is_business_day(d: date, holiday_api_key: Optional[str]) -> bool:
    """주말/공휴일이 아니면 영업일."""
    if d.weekday() >= 5:  # 토(5), 일(6)
        return False
    return not is_korean_holiday(d, holiday_api_key)


# --------------------------------------------------------------------------- #
# Notion
# --------------------------------------------------------------------------- #
def _notion_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


NOTION_DB_SCHEMA = {
    "제목": {"title": {}},
    "기준일": {"date": {}},
    "통화": {"select": {"options": [
        {"name": "USD/KRW"}, {"name": "JPY/KRW(100엔)"},
    ]}},
    "시가": {"number": {"format": "number"}},
    "고가": {"number": {"format": "number"}},
    "저가": {"number": {"format": "number"}},
    "종가": {"number": {"format": "number"}},
    "전일대비": {"number": {"format": "number"}},
    "등락률(%)": {"number": {"format": "number"}},
    "출처": {"rich_text": {}},
}


def create_notion_database(token: str, page_id: str) -> str:
    """대상 페이지 하위에 시계열 DB 생성 후 database_id 반환."""
    payload = {
        "parent": {"type": "page_id", "page_id": page_id},
        "title": [{"type": "text", "text": {"content": "환율 보고 (시계열)"}}],
        "properties": NOTION_DB_SCHEMA,
    }
    resp = requests.post(
        f"{NOTION_BASE}/databases", headers=_notion_headers(token), json=payload,
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["id"]


def append_notion_row(token: str, database_id: str, r: SymbolReport) -> None:
    o = r.ohlc
    props = {
        "제목": {"title": [{"text": {"content": f"{r.config.label} {r.base_day:%Y-%m-%d}"}}]},
        "기준일": {"date": {"start": r.base_day.isoformat()}},
        "통화": {"select": {"name": r.config.label}},
        "시가": {"number": round(o.open, 2)},
        "고가": {"number": round(o.high, 2)},
        "저가": {"number": round(o.low, 2)},
        "종가": {"number": round(o.close, 2)},
        "전일대비": {"number": round(r.change, 2)},
        "등락률(%)": {"number": round(r.change_pct, 2)},
        "출처": {"rich_text": [{"text": {"content": SOURCE_LABEL}}]},
    }
    payload = {"parent": {"database_id": database_id}, "properties": props}
    resp = requests.post(
        f"{NOTION_BASE}/pages", headers=_notion_headers(token), json=payload, timeout=20
    )
    resp.raise_for_status()


def append_notion_summary_block(token: str, page_id: str, summary: str) -> None:
    """대상 페이지에 가독형 요약 콜아웃 블록 추가."""
    children = [{
        "object": "block",
        "type": "callout",
        "callout": {
            "icon": {"type": "emoji", "emoji": "📈"},
            "rich_text": [{"type": "text", "text": {"content": summary}}],
        },
    }]
    resp = requests.patch(
        f"{NOTION_BASE}/blocks/{page_id}/children",
        headers=_notion_headers(token), json={"children": children}, timeout=20,
    )
    resp.raise_for_status()


# --------------------------------------------------------------------------- #
# Slack (실패 알림)
# --------------------------------------------------------------------------- #
def slack_alert(webhook_url: Optional[str], text: str) -> None:
    if not webhook_url:
        print(f"[alert-skip] SLACK_WEBHOOK_URL 없음: {text}", file=sys.stderr)
        return
    try:
        requests.post(webhook_url, json={"text": text}, timeout=15).raise_for_status()
    except Exception as exc:  # noqa: BLE001
        print(f"[alert-fail] Slack 알림 실패: {exc}", file=sys.stderr)


# --------------------------------------------------------------------------- #
# 오케스트레이션
# --------------------------------------------------------------------------- #
def collect_reports(apikey: str, today: date) -> tuple[list[SymbolReport], list[str]]:
    """심볼별 보고서 생성. (성공 리스트, 실패 심볼 사유) 반환 — 부분 실패 허용."""
    reports: list[SymbolReport] = []
    failures: list[str] = []
    for cfg in SYMBOLS:
        try:
            values = fetch_time_series(cfg.symbol, apikey)
            reports.append(build_symbol_report(cfg, parse_candles(values), today))
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{cfg.symbol}: {exc}")
    return reports, failures


def run(dry_run: bool = False) -> int:
    apikey = os.environ.get("TWELVEDATA_API_KEY")
    slack = os.environ.get("SLACK_WEBHOOK_URL")
    holiday_key = os.environ.get("HOLIDAY_API_KEY")

    if not apikey:
        print("TWELVEDATA_API_KEY 환경변수가 필요합니다.", file=sys.stderr)
        return 2

    now = datetime.now(KST)
    today = now.date()

    # 영업일 판정 (dry-run 은 강제 실행)
    if not dry_run and not is_business_day(today, holiday_key):
        print(f"{today} 는 영업일이 아니므로 미발송(스킵).")
        return 0

    reports, failures = collect_reports(apikey, today)

    if not reports:
        msg = "❗환율 조회 실패 — 수동 확인 필요\n" + "\n".join(failures)
        print(msg, file=sys.stderr)
        if not dry_run:
            slack_alert(slack, msg)
        return 1

    summary = format_summary(reports, now)
    print(summary)

    if dry_run:
        if failures:
            print("\n[부분 실패]\n" + "\n".join(failures), file=sys.stderr)
        return 0

    # Notion 기록
    token = os.environ.get("NOTION_TOKEN")
    db_id = os.environ.get("NOTION_DATABASE_ID")
    page_id = os.environ.get("NOTION_PAGE_ID")
    try:
        if not token or not db_id:
            raise RuntimeError("NOTION_TOKEN / NOTION_DATABASE_ID 환경변수 필요")
        for r in reports:
            append_notion_row(token, db_id, r)
        if page_id:
            append_notion_summary_block(token, page_id, summary)
    except Exception as exc:  # noqa: BLE001
        slack_alert(slack, f"❗Notion 기록 실패 — 수동 확인 필요\n{exc}")
        return 1

    # 부분 실패 경고
    if failures:
        slack_alert(slack, "⚠️ 환율 일부 조회 실패(나머지는 기록됨)\n" + "\n".join(failures))

    print("Notion 기록 완료.")
    return 0


def setup_notion() -> int:
    token = os.environ.get("NOTION_TOKEN")
    page_id = os.environ.get("NOTION_PAGE_ID")
    if not token or not page_id:
        print("NOTION_TOKEN, NOTION_PAGE_ID 환경변수가 필요합니다.", file=sys.stderr)
        return 2
    db_id = create_notion_database(token, page_id)
    print("생성된 데이터베이스 id:", db_id)
    print("→ 이 값을 NOTION_DATABASE_ID 시크릿으로 등록하세요.")
    return 0


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="매일 아침 환율 보고서")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("run", help="영업일 보고서 생성 후 Notion 기록")
    sub.add_parser("dry-run", help="Notion/Slack 없이 콘솔 출력")
    sub.add_parser("setup-notion", help="대상 페이지 하위에 DB 1회 생성")
    args = parser.parse_args(argv)

    if args.cmd == "run":
        return run(dry_run=False)
    if args.cmd == "dry-run":
        return run(dry_run=True)
    if args.cmd == "setup-notion":
        return setup_notion()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

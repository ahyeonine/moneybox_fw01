"""순수 로직 단위 테스트 (네트워크 불필요).

실행: python -m pytest -q
"""
from __future__ import annotations

import sys
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import exchange_report as er  # noqa: E402


def _values():
    # Twelve Data 는 최신순으로 반환. 2026-08-06(오늘, 진행중) 포함.
    return [
        {"datetime": "2026-08-06", "open": "1372.5", "high": "1375.0",
         "low": "1371.0", "close": "1373.0"},
        {"datetime": "2026-08-05", "open": "1368.3", "high": "1374.1",
         "low": "1367.9", "close": "1372.5"},
        {"datetime": "2026-08-04", "open": "1360.0", "high": "1369.0",
         "low": "1359.0", "close": "1368.3"},
    ]


def test_pick_excludes_today_and_picks_completed():
    candles = er.parse_candles(_values())
    latest, prev = er.pick_completed_candles(candles, date(2026, 8, 6))
    assert latest.day == date(2026, 8, 5)   # 오늘(8/6) 제외
    assert prev.day == date(2026, 8, 4)


def test_pick_raises_when_insufficient():
    candles = er.parse_candles(_values()[:1])  # 8/6 하나뿐 → 완성 0개
    try:
        er.pick_completed_candles(candles, date(2026, 8, 6))
        assert False, "예외가 발생해야 함"
    except ValueError:
        pass


def test_jpy_multiplier_x100():
    c = er.Candle(date(2026, 8, 5), 9.31, 9.34, 9.30, 9.32)
    out = er.apply_multiplier(c, 100.0)
    assert round(out.close, 2) == 932.0
    assert round(out.high, 2) == 934.0


def test_usd_multiplier_noop():
    c = er.Candle(date(2026, 8, 5), 1368.3, 1374.1, 1367.9, 1372.5)
    assert er.apply_multiplier(c, 1.0) is c


def test_compute_change():
    change, pct = er.compute_change(1372.5, 1368.3)
    assert round(change, 2) == 4.20
    assert round(pct, 2) == 0.31


def test_compute_change_zero_prev():
    change, pct = er.compute_change(10.0, 0.0)
    assert pct == 0.0


def test_build_symbol_report_usd():
    cfg = er.SymbolConfig("USD/KRW", "USD/KRW", "🇺🇸", 1.0)
    rep = er.build_symbol_report(cfg, er.parse_candles(_values()), date(2026, 8, 6))
    assert rep.base_day == date(2026, 8, 5)
    assert round(rep.ohlc.close, 2) == 1372.5
    assert round(rep.change, 2) == 4.20
    assert round(rep.change_pct, 2) == 0.31


def test_arrow():
    assert er._arrow(1.0) == "▲"
    assert er._arrow(-1.0) == "▼"
    assert er._arrow(0.0) == "-"


def test_format_summary_contains_key_fields():
    cfg = er.SymbolConfig("USD/KRW", "USD/KRW", "🇺🇸", 1.0)
    rep = er.build_symbol_report(cfg, er.parse_candles(_values()), date(2026, 8, 6))
    send = datetime(2026, 8, 6, 8, 30, tzinfo=ZoneInfo("Asia/Seoul"))
    text = er.format_summary([rep], send)
    assert "환율 보고서" in text
    assert "USD/KRW" in text
    assert "1,372.50" in text
    assert "+0.31%" in text
    assert "직전 거래일" in text


def test_is_business_day_weekend():
    # 2026-08-08 은 토요일
    assert er.is_business_day(date(2026, 8, 8), None) is False
    # 2026-08-06 은 목요일(공휴일 아님, 라이브러리 폴백)
    assert er.is_business_day(date(2026, 8, 6), None) is True

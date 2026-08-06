# moneybox_fw01 — 매일 아침 환율 보고서

영업일 **08:30 KST**(한국 장 시작 09:00 이전)에 **USD/KRW · JPY/KRW** 일봉 OHLC를
[Twelve Data](https://twelvedata.com)에서 가져와 보고서를 만들고 **Notion**에 기록한다.
조회/기록 실패 시 **Slackbot**으로 알린다.

- 상세 스펙: [`docs/PRD-daily-exchange-rate-report.md`](docs/PRD-daily-exchange-rate-report.md)
- 일봉은 `timezone=Asia/Seoul` 기준(한국 자정 마감) → 08:30에 직전 거래일 완성 일봉 사용

## 구조
```
src/exchange_report.py                  # 수집·보고서·Notion·Slack 로직 (CLI)
tests/test_exchange_report.py           # 순수 로직 단위 테스트
.github/workflows/daily-exchange-report.yml  # 매일 08:30 KST 스케줄 (GitHub Actions)
.env.example                            # 필요한 환경변수 목록
```

## 사용법
```bash
pip install -r requirements.txt

# 1) 키 없이 로직/포맷만 확인은 불가(데이터 필요). 키 준비 후:
export TWELVEDATA_API_KEY=...

# 2) Notion/Slack 없이 콘솔에만 출력 (Twelve Data 키만 필요)
python src/exchange_report.py dry-run

# 3) Notion 시계열 DB 최초 1회 생성 → 출력된 id 를 NOTION_DATABASE_ID 로 등록
export NOTION_TOKEN=...
export NOTION_PAGE_ID=3b4ecd34b1c780ef920ff9190533edec
python src/exchange_report.py setup-notion

# 4) 실제 발송(영업일에만 기록, 주말·공휴일 자동 스킵)
python src/exchange_report.py run
```

## 배포 (스케줄)
`.github/workflows/daily-exchange-report.yml` 이 **cron `30 23 * * 0-4`(UTC) = 08:30 KST 월~금**에 실행.
GitHub 저장소 **Settings → Secrets and variables → Actions** 에 아래 시크릿 등록:

| 시크릿 | 필수 | 설명 |
|--------|:---:|------|
| `TWELVEDATA_API_KEY` | ✅ | Twelve Data API 키 |
| `NOTION_TOKEN` | ✅ | Notion 내부 통합 토큰 |
| `NOTION_DATABASE_ID` | ✅ | `setup-notion` 으로 생성한 DB id |
| `NOTION_PAGE_ID` | ⭕ | 요약 콜아웃 기록용 페이지 id |
| `SLACK_WEBHOOK_URL` | ⭕ | 실패 알림 Slack Webhook |
| `HOLIDAY_API_KEY` | ⭕ | 특일정보 API 키(없으면 holidays 라이브러리 폴백) |

> `workflow_dispatch` 로 수동 실행하여 사전 테스트 가능.

## 테스트
```bash
python -m pytest -q
```

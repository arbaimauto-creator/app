# greyd 앱 ↔ greyd-ops 정합성 설계 (v1)

작성: 2026-08-10 · 대상: `greyd-app`(모바일, Phase 1 v2 설계) × `greyd-ops`(운영 자동화, 14마디 SSOT)
동일 문서가 greyd-ops 저장소에 `26_앱_연동_정합성_설계.md`로 존재한다.

## 0. 역할 경계 — 한 문장씩

- **greyd-ops = SSOT.** 계약·캠페인·인플루언서 골든 레코드·정산·메시지의 정본. 14마디(CLOSING→RENEW)가 비즈니스의 척추.
- **greyd 앱 = 크리에이터 인게이지먼트 표면.** ops의 SEEDING 트랙에 대한 **인바운드 채널**(신청·수령확인·업로드·평가수신)과 리텐션 장치(G-스코어·포인트·추천 코드).
- 원칙: **비즈니스 상태의 정본은 ops, 앱은 그 투영 + 크리에이터 행동의 수집기.** 충돌 시 ops가 이긴다.

## 1. 결정 목록 (I1~I10)

### I1. 트랙 매핑 — 앱의 "체험" = ops의 SEEDING 트랙

앱의 Open/Curated는 ops 트랙과 **다른 층위**다. 정리:

```
ops Track:  PARTNERS | SEEDING | VISIT          ← 캠페인 상품 유형 (정본)
앱 Try 탭:  ops SEEDING 캠페인만 노출
앱 Open/Curated: SEEDING 캠페인의 "신청 자격 유형" — Campaign에 applyMode('open'|'curated') 필드로 종속
PARTNERS/VISIT: Phase 1 앱 스코프 밖 — 기존 매직링크 허브 유지
```

**결과**: 앱 기획서의 "Open 30% / Curated 70% 물량 배분"은 SEEDING 트랙 내부 배분으로 재해석. 시딩의 수량 게이트(회수율 ≥90%)와 앱 북극성(루프 완료율 70%)은 같은 것을 다른 각도로 보는 지표 — 분모 정의만 다름(발송 대비 vs 수령 대비). 리포트에 둘 다 표기.

### I2. 소싱 이원화 — 아웃바운드(ops 매칭) + 인바운드(앱 신청) 듀얼

시딩 크리에이터는 두 경로로 들어온다:

| 경로 | 흐름 | Match 생성 주체 |
|---|---|---|
| 아웃바운드 (기존) | ops 매칭 → 배치 초대 메일 → ACCEPT | ops (CANDIDATE부터) |
| 인바운드 (앱, 신규) | 앱 Try 신청 → 승인 | 앱 신청이 ops에 Match를 **ACCEPTED 상태로 생성** (크리에이터 의사 이미 확보) |

앱 인바운드는 아웃리치·D3/D7 팔로업이 불필요 — ops의 섭외 비용을 0으로 만드는 게 앱의 존재 이유 중 하나. **성장 루프**: 시딩 배치 초대 메일에 앱 초대 코드를 동봉해 아웃바운드 크리에이터를 앱 유저로 전환한다(다음 캠페인부터 인바운드화).

### I3. 상태머신 매핑 표 (앱 8값 ↔ ops)

| 앱 seeding.status | ops 대응 | 비고 |
|---|---|---|
| `applied` | Match `ACCEPTED` (인바운드 생성) + 승인 대기 | Curated면 `PENDING_APPROVAL` 경유 |
| `approved` | Match `CONFIRMED` (+brandApproved) | 앱 주소 수집 = ops ACCEPT 링크의 주소·전화 수집과 동일 기능 — 앱이 대체 |
| `shipped` | Shipment `SHIPPED` | 운송장은 ops 콘솔에서 입력 (정본) |
| `received` | Shipment `DELIVERED` + RECEIPT 확인 | 앱 "제품 받았어요" 버튼 = ops RECEIPT 매직링크의 앱 버전 |
| `reviewing` | Match `POSTED` (시딩은 DRAFTING/REVISING 스킵 — 트랙 정책 draftReview:false와 정합) | 앱 업로드 제출 = ops `greyd_uploaded` + postUrl 수집을 한 번에 |
| `done` | Seeding step `DONE` + 평가 완료 | 브랜드 평가는 앱 신규 개념(I7) |
| `cancelled` | Match `DROPPED` (사유: 본인 취소) | |
| `no_show` | Match `DROPPED` (사유: 미이행) + 앱 Strike | Strike는 앱 로컬 개념, ops에는 DROPPED 사유로만 기록 |

### I4. ID 연동 — `Influencer.greydAppId` (ops G1 갭 해소)

ops 17번 문서가 이미 식별한 갭. 확정:
- ops `Influencer`에 `greydAppId String? @unique` 추가
- 앱 게이트 통과 시 발급되는 creator id를 ops에 매핑 (Phase 1: 운영 수동 매핑, 초대 코드 발급 대장에서)
- 앱 초대 코드 발급 시 ops 인플루언서 DB(11,850명)에서 대상 선정 → 코드에 influencerId 연결 → 가입 즉시 자동 매핑이 이상형 (2단계)

### I5. 크리에이터 표면 정책 — "시딩은 앱, 파트너스는 허브"

| 트랙 | Phase 1 표면 | 장기 |
|---|---|---|
| SEEDING (앱 유저) | **앱** (신청~보상 전부) | 앱 |
| SEEDING (비앱, 아웃바운드) | 매직링크 허브 5스텝 | 초대 코드로 앱 전환 유도 |
| PARTNERS | 매직링크 허브 7스텝 (초안·네고·정산) | 2단계에 앱 통합 검토 |

같은 캠페인에 앱 유저와 허브 유저가 공존한다 — ops 콘솔은 Match 단위로 표면을 구분 표기(`surface: app|hub`).

### I6. 보상 정합 — 앱 포인트 = APP_REWARD의 적립 원장

**충돌**: 앱 스펙 D7은 "포인트 사용처 없음, 현금 인출 2026 Q4 예정"인데, ops에는 `PayoutMethod.APP_REWARD`("앱 리워드 적립 → 앱 내 출금, 15/30일 사이클")가 이미 정산 흐름으로 존재.

**정리**:
- 앱 포인트 = APP_REWARD의 **적립 원장**이다. 같은 것.
- Phase 1 시딩은 트랙 정책상 `payout: false` — 시딩 앱 유저의 포인트는 **적립 전용이 맞다** (D7 유지, 충돌 아님).
- APP_REWARD 출금이 실제로 필요한 건 PARTNERS의 국내 거주 외국인 지급 건 — 이들은 Phase 1 앱 스코프 밖(허브)이므로 현행(@Arthur 수동) 유지.
- 단, 앱 "Q4 현금 인출 예정" 배너 문구는 유효 — Q4에 열리는 것이 곧 APP_REWARD 출금 UI다. 앱 포인트 원장과 ops Payout이 그때 연결된다.

### I7. 브랜드 평가 데이터 흐름 — 앱 evaluation → ops 리포트

트리아지·루브릭은 앱 신규 개념(ops에 없음). 연결:
- 앱 `evaluation` (triage/scores/rebook/comment) → ops `Content.metrics`·`Report.insights`의 입력 재료
- ops 위클리 발견 카드·FGI 리포트 작성 시 애널리스트가 앱 평가 데이터를 참조 (Phase 1 수동)
- `rebook_flag=Y` 크리에이터는 ops 매칭 모듈의 이력자 우대 신호로 — `Match.role`/collabHistory에 반영 (2단계)
- 역방향: 브랜드 코멘트는 앱 피드백 카드로 (이미 앱 설계에 있음)

### I8. 인플루언서 데이터 — 앱 가입자도 골든 레코드로

- 앱 프로필 폼(핸들·팔로워 밴드·카테고리·3문항)은 ops 워싱 파이프라인의 신규 소스: `source: 'GREYD_APP'` (InfluencerSource enum에 추가 필요 — 현재 UPFLUENCE|TIKTOK_ONE|DB|SEED|AGENCY|REFERRAL|MANUAL|OTHER)
- 앱의 자가신고 팔로워 밴드(nano/micro/mid/macro)는 ops 7단계 티어(PICO~MEGA)로 정규화 매핑: ~1K→PICO·NANO / 1K–10K→NANO·MICRO / 10K–100K→MICRO·MID / 100K+→MACRO+
- 앱 G-스코어·Strike·completed_count는 ops Influencer에 동기화 필드(2단계) — Phase 1은 앱 로컬 + 운영 수동 참조

### I9. 운영 콘솔 — 앱 설계의 FUNNEL 3은 greyd-ops 콘솔로 대체

앱 화면 설계 문서의 "ARBAIM 운영 콘솔 6화면"은 독립 구현하지 않는다. **greyd-ops 콘솔이 실체**이므로, 6화면은 ops 콘솔에 대한 **요구사항 목록**으로 이관:

| 앱 설계 FUNNEL 3 화면 | ops 현재 상태 | 필요 작업 |
|---|---|---|
| 1 운영 대시보드 (북극성·가드레일) | 없음 (캠페인 워크스페이스만) | ops에 지표 위젯 추가 (수동 집계 입력) |
| 2 캠페인 개설 폼 | 있음 (클로징→자동 생성) | applyMode(open/curated)·Base P·G60 조건 필드 추가 |
| 3 신청 승인 큐 | 없음 (매칭·승인보드는 아웃바운드용) | **신규 — 앱 인바운드 신청 큐** (I2) |
| 4 이행 추적 보드 | 있음 (seeding/ 퍼널) | 앱 상태 매핑(I3) 컬럼 반영 |
| 5 검수·지표 입력 | 있음 (Content·metrics D+14) | 앱 평가 데이터 참조 뷰 |
| 6 초대 코드 관리 | 없음 | **신규 — 코드 발급·greydAppId 매핑 대장** |

### I10. Phase 1 통합 스코프 — "인터페이스 계약 + 수동 브리지"

앱은 mock, ops는 실서버. Phase 1에 실제 API 연동은 하지 않는다. 대신:

1. **스키마 계약 확정** (이 문서 I1~I8) — 앱 mock 데이터 구조(api/*.js)를 ops Prisma 필드명과 맞춰 작성해, 2단계 연동 시 필드 리네이밍이 없게 한다
2. **수동 브리지 3개** (운영 루틴):
   - 앱 신청 발생 → 운영이 ops에 Match(ACCEPTED, surface:app) 수동 생성
   - ops 운송장 입력 → 운영이 앱 mock 데이터에 반영 (주간 루틴에 편입)
   - 앱 업로드 링크 → ops Content(postUrl, greyd_uploaded) 수동 입력
3. **ops 측 스키마 선반영** (마이그레이션 3건): `Influencer.greydAppId` · `InfluencerSource.GREYD_APP` · `Campaign.applyMode`
4. 앱 애널리틱스(D19) 이벤트는 앱 전용 — ops EventLog와 통합하지 않는다 (2단계)

## 2. 용어 통일 (양쪽 문서 공통 표기)

| 개념 | 확정 용어 | 폐기/보류 |
|---|---|---|
| 캠페인 상품 유형 | **트랙** (PARTNERS/SEEDING/VISIT) | 앱 문서의 "2-트랙(Open/Curated)" → "신청 유형(applyMode)"으로 개칭 |
| 크리에이터 미션 인스턴스 | **시딩 건** (ops Match = 앱 seeding) | |
| 앱 크리에이터 성장 지표 | **G-스코어** (앱 전용, ops 티어와 별개 축) | |
| 브랜드 평가 | **트리아지 / 루브릭** (앱 발신, ops 리포트 재료) | |
| 크리에이터 표면 | **앱** vs **허브**(매직링크) — surface 필드 | |

## 3. 결정 대기 (양측 합의 필요)

1. 앱 인바운드 신청의 브랜드 승인 절차 — Open은 자동인데 ops 승인보드(브랜드 승인)와 충돌하는가? → 제안: 시딩 Open은 브랜드 사전 위임(캠페인 개설 시 "선착순 자동 승인" 동의)으로 승인보드 스킵
2. G-스코어를 ops 매칭 스코어(t,p,tr,g,e)의 입력으로 쓸지 — 2단계 논의
3. 앱 초대 코드 발급 정책과 ops 아웃리치 배치의 결합 시점 (I2 성장 루프의 실행 시기)
4. `greydAppId` 매핑 UI를 ops 어디에 둘지 (influencers/ 상세 vs 코드 관리 신규 페이지)

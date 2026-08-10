# greyd Phase 1 — 애널리틱스 이벤트 맵

기준: 2026-08-10 · 근거 문서 §11 (데이터 수집 계획)
구현: Firebase Analytics (`@react-native-firebase/analytics` — app 모듈은 이미 설치됨, analytics 모듈 추가 필요)

## 0. 규칙

- 이벤트명 `snake_case`, 동사는 뒤에: `apply_submit` (O) / `submit_apply` (X)
- **공통 파라미터** (모든 이벤트에 자동 첨부): `role`(influencer/brand) · `country` · `g_band`(g50/g60/g80/g100 — 정확값 대신 밴드) · `app_lang`
- **금지**: 주소·전화·이메일·SNS 핸들·닉네임 등 PII를 이벤트 파라미터에 절대 넣지 않는다. 식별은 내부 `user_id`(Firebase userId)로만
- 화면 진입은 `*_view`, 전환 행동은 행동명, 결과 파라미터는 `result`
- mock 단계에서도 전부 실제 전송한다 — 소급 불가능한 데이터이므로 구현 첫 주(작업 #1)에 공통 래퍼부터 만든다

```js
// analytics.js 래퍼 (작업 #1에 포함)
logEvent(name, params) → firebase.analytics().logEvent(name, {role, country, g_band, app_lang, ...params})
```

## 1. 인플루언서 퍼널

### 진입·온보딩

| 이벤트 | 파라미터 | 답하려는 질문 |
|---|---|---|
| `login_view` | — | 유입량 |
| `login_social_tap` | `provider` | 선호 로그인 수단 |
| `gate_code_submit` | `result`: ok/invalid/expired | 코드 실패율 — 초대 전달 품질 |
| `gate_profile_submit` | — | 게이트 통과율 |
| `onboarding_view` | `page`: 1~4 | 어느 장에서 이탈하는가 |
| `onboarding_skip` | `page` | 스킵 지점 |
| `profile_submit` | `filled`: 개수 | 폼 완성도 |
| `profile_skip` | — | 신청 잠김 상태로 진입한 비율 |

### 신청 퍼널 (핵심 — 전환율의 분모/분자)

| 이벤트 | 파라미터 | 답하려는 질문 |
|---|---|---|
| `try_view` | `open_count`, `curated_count` | 체험 탭 방문 |
| `campaign_open` | `campaign_id`, `track` | 카드→상세 전환 |
| `campaign_locked_tap` | `campaign_id` | Curated 잠금이 욕망을 만드는가 (G60 목표 동기) |
| `apply_sheet_open` | `campaign_id` | 상세→시트 전환 |
| `apply_submit` | `campaign_id`, `track`, `appeal_len`, `auto_confirmed` | 시트→신청 전환. **퍼널: try_view→campaign_open→apply_sheet_open→apply_submit**. `auto_confirmed`(D24)로 자동 확정 비율 측정 |
| `apply_limit_blocked` | `limit`, `source?` | 동시 한도에 막힌 수요량 (`source: 'offer'`면 제안 수락 시 차단) |
| `offer_view` | `count` | 제안형(D25) 노출량 — 수락률의 분모 |
| `offer_accept` | `campaign_id` | 제안 수락률 — ops 매칭 품질의 직접 지표 |
| `offer_decline` | `campaign_id`, `reason?` | 거절 사유(product_fit/schedule/null) — 매칭 학습 재료 |

### 이행 (상태머신 — 가드레일 지표의 원천)

| 이벤트 | 파라미터 | 답하려는 질문 |
|---|---|---|
| `address_modal_view` | `seeding_id` | — |
| `address_submit` | `hours_since_approved` | 48h 데드라인 실효성 |
| `received_confirm` | `days_since_shipped` | 배송 리드타임 분포 (국가별) |
| `noti_permission_prompt` | `result`: allow/later | D11 프롬프트 승낙률 |
| `extension_use` | `dday_remaining` | 연장이 이탈을 막는가 |
| `hashtag_copy` | — | 업로드 보조 도구 사용률 |
| `cancel_confirm` | `status_at_cancel` | 취소 발생 지점 |
| `upload_view` | `dday_remaining` | 마감 임박도별 업로드 착수 |
| `upload_submit` | `format`, `grace`(bool), `days_since_received` | **북극성 분자 · 수령→업로드 중앙값** |

### 보상·재참여

| 이벤트 | 파라미터 | 답하려는 질문 |
|---|---|---|
| `done_view` | `points`, `quality_bonus`(bool) | 루프 완료 |
| `feedback_open` | `from`: done/history | 브랜드 피드백 재열람 (D13 검증) |
| `referral_share_open` / `referral_copy` | — | 추천 코드 사용률 가드레일의 선행 지표 |
| `micro_survey_submit` | `campaign_id`, `answer` | 완주 직후 1문항 설문 (§11-3) |
| `noti_open` | `type`: d7/d3/d1/due/eval | 어떤 리마인더가 실제로 여는가 |
| `strike_card_view` | `strike_count` | Strike 경고 도달 |

### 설정

| 이벤트 | 파라미터 |
|---|---|
| `logout` / `account_delete_start` / `account_delete_confirm` | — |

## 2. 브랜드 퍼널

| 이벤트 | 파라미터 | 답하려는 질문 |
|---|---|---|
| `brand_dashboard_view` | `campaign_id`, `upload_count` | 재방문 빈도 (주간 이메일 실효성) |
| `weekly_card_view` | `campaign_id` | 위클리 발견 카드가 읽히는가 |
| `scoreboard_sort` | `column` | 브랜드가 궁금해하는 축 |
| `cta_quote_tap` | `campaign_id`, `country` | **세일즈 리드 — 2차 공구 전환의 씨앗 (최중요)** |
| `report_download_tap` | `campaign_id` | 리포트 수요 |
| `triage_vote` | `verdict`: pick/ok/skip, `ms`: 소요 ms | 100건 10분 목표 검증 |
| `triage_skip_reason` | `reason` | 저품질 유형 분포 |
| `rubric_submit` | `q_quality`, `rebook`(bool) | 평가 완성도 |
| `eval_session_end` | `voted`, `remaining` | 평가 완주율 → 응답 ≤7일 가드레일 |

## 3. KPI ← 이벤트 매핑 (이 표가 존재 이유)

| 지표 (§1 가드레일) | 계산식 |
|---|---|
| 검증 루프 완료율 (북극성) | `done_view` 유니크 seeding ÷ `received_confirm` 유니크 seeding |
| 수령→업로드 중앙값 | `upload_submit.days_since_received` 중앙값 |
| 30일 재참여율 | `upload_submit` 후 30일 내 동일 유저 `apply_submit` 비율 |
| 브랜드 평가 응답 시간 | `upload_submit` → 해당 리뷰 첫 `triage_vote` 시간차 |
| 신청 퍼널 전환율 (신규) | `apply_submit` ÷ `campaign_open` |
| 노티 실효성 (신규) | `noti_open` → 24h 내 `upload_submit` 전환 |

## 4. 구현 체크리스트

- [ ] `@react-native-firebase/analytics` 설치 + `analytics.js` 공통 래퍼 (작업 #1에 편입)
- [ ] 공통 파라미터 4종 자동 첨부 (로그인 시 setUserProperty)
- [ ] PII 금지 규칙 코드리뷰 체크 항목화
- [ ] 이벤트 34종 심기 — 화면 구현할 때 같이 (후행 작업으로 미루면 반드시 누락된다)
- [ ] DebugView로 전 이벤트 발화 확인 후 릴리즈

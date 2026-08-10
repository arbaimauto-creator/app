# greyd 앱 ↔ greyd-ops 얼라인 다이어그램

정본 문서: `2026-08-10-app-ops-integration.md` (I1~I10) — 이 문서는 그 시각화판이다.
원칙 한 줄: **비즈니스 상태의 정본은 greyd-ops. 앱은 SEEDING 트랙의 크리에이터 표면이다.**

---

## 1. 시스템 경계 — 누가 무엇의 정본인가

```mermaid
flowchart LR
    subgraph CREATOR["크리에이터"]
        APP["📱 greyd 앱<br/>(시딩 · 앱 유저)"]
        HUB["🔗 매직링크 허브<br/>(파트너스 · 비앱 유저)"]
    end

    subgraph OPS["greyd-ops — SSOT"]
        CONSOLE["운영 콘솔<br/>14마디 루프"]
        DB[("골든 레코드<br/>인플루언서 11,850")]
        MSG["메시지 엔진<br/>발신 40종"]
    end

    subgraph BRAND["브랜드"]
        BDASH["브랜드 대시보드<br/>(매직링크)"]
        BAPP["📱 앱 브랜드 3탭<br/>(트리아지·루브릭)"]
    end

    APP -- "신청·수령·업로드<br/>(인바운드)" --> CONSOLE
    HUB -- "수락·초안·정산" --> CONSOLE
    CONSOLE --> DB
    MSG --> HUB
    CONSOLE -- "업로드 결과·지표" --> BDASH
    BAPP -- "평가 (트리아지·루브릭)" --> CONSOLE
    CONSOLE -- "피드백 카드" --> APP

    style OPS fill:#FFF3D9,stroke:#8A5D00,stroke-width:2px
    style APP fill:#E4F3E9,stroke:#1F8A4C
    style BAPP fill:#E3EDF7,stroke:#2B5E8E
```

> 충돌 시 ops가 이긴다. 앱·허브·브랜드 화면은 전부 같은 ops 레코드의 투영.

---

## 2. 트랙 계층 — "체험"과 applyMode의 위치 (I1)

```mermaid
flowchart TD
    CT["Contract (계약)"] --> C1["Campaign · track=SEEDING"]
    CT --> C2["Campaign · track=PARTNERS"]
    CT --> C3["Campaign · track=VISIT"]

    C1 --> AM1["applyMode: open<br/>선착순 자동 · 물량 30%"]
    C1 --> AM2["applyMode: curated<br/>G60↑ · 수동 승인 · 70%"]

    C1 -. "앱 체험 탭에 노출" .-> APP["📱 greyd 앱"]
    C2 -. "매직링크 허브 7스텝" .-> HUB["🔗 허브"]
    C3 -. "건별 정책" .-> HUB

    style C1 fill:#E4F3E9,stroke:#1F8A4C,stroke-width:2px
    style APP fill:#E4F3E9,stroke:#1F8A4C
```

> "트랙"은 ops 예약어(상품 유형). 앱의 Open/Curated는 트랙이 아니라 **SEEDING 캠페인의 신청 유형(applyMode)**.

---

## 3. 상태머신 매핑 — 앱 8값 ↔ ops (I3)

```mermaid
flowchart LR
    subgraph APPST["📱 앱 seeding.status"]
        direction TB
        a1["applied"] --> a2["approved"] --> a3["shipped"] --> a4["received"] --> a5["reviewing"] --> a6["done"]
        a2 -.-> a7["cancelled<br/>(무페널티)"]
        a4 -.-> a8["no_show<br/>(Strike)"]
    end

    subgraph OPSST["⚙️ ops Match / Shipment"]
        direction TB
        b1["Match ACCEPTED<br/>(인바운드 생성점)"] --> b2["CONFIRMED<br/>+ brandApproved"] --> b3["Shipment SHIPPED"] --> b4["DELIVERED<br/>+ 수령확인"] --> b5["POSTED<br/>+ greyd_uploaded"] --> b6["Seeding DONE"]
        b2 -.-> b7["DROPPED<br/>사유: 본인취소"]
        b4 -.-> b8["DROPPED<br/>사유: 미이행"]
    end

    a1 === b1
    a2 === b2
    a3 === b3
    a4 === b4
    a5 === b5
    a6 === b6
    a7 === b7
    a8 === b8

    style APPST fill:#E4F3E9,stroke:#1F8A4C
    style OPSST fill:#FFF3D9,stroke:#8A5D00
```

> 앱 인바운드 신청은 ops에 Match를 **ACCEPTED로 생성**한다 — 크리에이터 의사가 이미 확보돼 섭외(OUTREACH·D3/D7 팔로업)를 통째로 생략. 이것이 앱의 존재 이유 중 하나.

---

## 4. 검증 루프 전체 시퀀스 — 세 시스템이 맞물리는 순서

```mermaid
sequenceDiagram
    participant C as 크리에이터 (앱)
    participant O as greyd-ops (운영)
    participant B as 브랜드 (앱 3탭)

    C->>O: ① 체험 신청 (applied → Match ACCEPTED)
    O->>O: ② 승인 (open 자동 / curated 수동)
    C->>O: ③ 주소 입력 (48h)
    O->>C: ④ 운송장 입력 → shipped
    C->>O: ⑤ 📦 수령 확인 (received — 북극성 분모, D+14 시작)
    C->>O: ⑥ 리뷰 업로드 (링크·형식 → POSTED + greyd_uploaded)
    O->>B: ⑦ 검수 · 지표 입력 후 평가 요청
    B->>O: ⑧ 트리아지 👍👌👎 → 루브릭 4항목 + 재협업 Y/N
    O->>C: ⑨ 피드백 카드 + 포인트 + G-스코어 + 추천 코드 3장
    Note over C,B: 루프 완료 — 북극성 지표 카운트 ✓
```

---

## 5. 데이터 연결 — ID · 보상 · 평가의 흐름 (I4 · I6 · I7 · I8)

```mermaid
flowchart LR
    subgraph APPDATA["📱 앱 mock 데이터"]
        cr["creator<br/>프로필 폼"]
        pt["포인트 원장<br/>(적립 전용)"]
        ev["evaluation<br/>트리아지·루브릭"]
    end

    subgraph OPSDATA["⚙️ ops Prisma"]
        inf["Influencer<br/>+ greydAppId 🆕"]
        po["Payout<br/>method=APP_REWARD"]
        rp["Report · 위클리 카드"]
        gr["골든 레코드 파이프라인<br/>source=GREYD_APP 🆕"]
    end

    cr -- "I4: 수동 매핑 대장" --> inf
    cr -- "I8: 신규 소스로 합류" --> gr
    pt -- "I6: 같은 것 — Q4에 출금 연결" --> po
    ev -- "I7: 리포트 재료 · rebook은 이력자 신호" --> rp

    style APPDATA fill:#E4F3E9,stroke:#1F8A4C
    style OPSDATA fill:#FFF3D9,stroke:#8A5D00
```

---

## 6. Phase 1 통합 스코프 — 실제로 연결하는 것 (I10)

```mermaid
flowchart TD
    subgraph NOW["Phase 1 — API 연동 없음"]
        SC["① 스키마 계약<br/>앱 mock 필드명 = ops Prisma 필드명"]
        subgraph BRIDGE["② 수동 브리지 3개 (운영 주간 루틴)"]
            m1["앱 신청 → ops Match 생성"]
            m2["ops 운송장 → 앱 반영"]
            m3["앱 업로드 링크 → ops Content"]
        end
        subgraph MIG["③ ops 마이그레이션 3건 (ops 세션 실행 대기 ⏳)"]
            g1["Influencer.greydAppId"]
            g2["InfluencerSource.GREYD_APP"]
            g3["Campaign.applyMode"]
        end
    end

    NOW --> LATER["Phase 2 — 실 API 연동<br/>필드 리네이밍 0으로 전환"]

    style BRIDGE fill:#E3EDF7,stroke:#2B5E8E
    style MIG fill:#FCE9E2,stroke:#E53400
```

---

---

# 실연동 아키텍처 (Phase 1.5 제안 — 수동 브리지 제거)

앱을 greyd-ops에 직접 연결하는 구조. 핵심: **ops의 기존 인프라(Vercel API·매직링크 토큰·상태머신 엔진)를 그대로 재사용**하고, 앱은 "4번째 표면"으로 붙는다.

## 7. 전체 아키텍처 — 무엇이 어디에 붙는가

```mermaid
flowchart LR
    subgraph PHONE["📱 greyd 앱 (React Native)"]
        UI["화면들<br/>Try · Activity · Done"]
        API_LAYER["api/*.js 데이터 계층<br/>(함수 본문 교체형)"]
        FLAG{"Features.<br/>LIVE_OPS_API"}
        MOCK[("로컬 mock<br/>Preference")]
        UI --> API_LAYER --> FLAG
        FLAG -- OFF --> MOCK
    end

    subgraph VERCEL["⚙️ greyd-ops (Vercel — 이미 배포돼 있음)"]
        MOBILE["/api/mobile/* 🆕<br/>auth · campaigns · apply<br/>seedings · received · upload · feedback"]
        ENGINE["lib/engine/transitions<br/>상태머신 엔진 (기존)"]
        TOKEN["MagicLink 토큰 시스템 (기존)<br/>+ purpose: APP 🆕"]
        MSG["메시지 엔진 40종 (기존)"]
        MOBILE --> ENGINE
        MOBILE --> TOKEN
        ENGINE --> MSG
    end

    DB[("Neon PostgreSQL<br/>Match · Campaign · Influencer<br/>greydAppId · applyMode ✅ 반영됨")]

    FLAG -- "ON · HTTPS + Bearer 토큰" --> MOBILE
    ENGINE --> DB
    CONSOLE["운영 콘솔<br/>+ 앱 신청 승인 큐 🆕"] --> DB
    BRAND["브랜드 대시보드·평가<br/>(기존 매직링크)"] --> DB

    style PHONE fill:#E4F3E9,stroke:#1F8A4C
    style VERCEL fill:#FFF3D9,stroke:#8A5D00,stroke-width:2px
    style DB fill:#E3EDF7,stroke:#2B5E8E
    style MOBILE fill:#FCE9E2,stroke:#E53400
```

> 🆕 = 새로 만드는 것 (API 라우트 6개 + 토큰 purpose 1개 + 콘솔 큐 1화면). 나머지는 전부 기존 재사용.

## 8. 인증 — 초대 코드가 곧 계정 연동

```mermaid
sequenceDiagram
    participant A as 📱 앱
    participant M as /api/mobile/auth
    participant DB as Neon DB

    A->>M: POST { 초대코드, 닉네임, 국가 }
    M->>DB: 코드 대장 조회 (유효 7일 · 역할 · 발급 대상)
    alt 코드 무효/만료
        M-->>A: 401 — "초대해 준 사람에게 다시 요청"
    else 코드 유효
        M->>DB: Influencer 조회/생성 + greydAppId 발급·매핑 (I4 자동화)
        M->>DB: source = GREYD_APP 기록 (골든 레코드 합류)
        M-->>A: { appToken (장수명 Bearer), greydAppId, role }
        Note over A: 토큰 저장 — 이후 모든 호출에 첨부.<br/>수동 매핑 대장이 통째로 사라지는 지점
    end
```

## 9. 검증 루프 실연동 — 수동 브리지 3개가 사라지는 흐름

```mermaid
sequenceDiagram
    participant C as 📱 크리에이터 앱
    participant API as /api/mobile/*
    participant DB as ops DB (정본)
    participant OP as 운영 콘솔
    participant B as 브랜드

    C->>API: POST /apply { campaignId, 서약, 어필 }
    API->>DB: Match 생성 — ACCEPTED · surface:'app' (자동 ← 구 브리지①)
    alt applyMode = open
        API->>DB: 잔여 수량 차감 · 자동 승인 → CONFIRMED
    else applyMode = curated
        DB->>OP: 신청 승인 큐에 노출 → 운영/브랜드 승인
    end
    C->>API: POST /address (48h 내)
    OP->>DB: 운송장 입력 → SHIPPED
    C->>API: GET /seedings — 운송장·상태 실시간 동기화 (자동 ← 구 브리지②)
    C->>API: POST /received → DELIVERED · D+14 타이머 기점
    C->>API: POST /upload { postUrl, format } → POSTED + greyd_uploaded (자동 ← 구 브리지③)
    DB->>B: 평가 대기 목록에 자동 등장
    B->>DB: 트리아지 → 루브릭 → rebook
    C->>API: GET /feedback → 피드백 카드 + 포인트 + G-스코어
    Note over C,B: 루프 완료가 사람 손 없이 DB에 실시간 집계 —<br/>북극성 지표가 운영 대시보드에서 자동 산출
```

## 10. 롤아웃 3단 증분 + 폴백 — 언제든 mock으로 복귀 가능

```mermaid
flowchart TD
    S1["1단계 (반나절)<br/>읽기 전용 — GET /campaigns만 실연동"] --> S2["2단계 (2~3일)<br/>쓰기 — apply · received · upload POST"]
    S2 --> S3["3단계 (2~3일)<br/>인증 — 코드→토큰 · greydAppId 자동 매핑"]
    S3 --> DONE["수동 브리지 0개<br/>주간 루틴 = 지표 입력만 남음"]

    subgraph FALLBACK["모든 단계 공통 폴백"]
        F1{"API 호출 실패?"} -- "예" --> F2["mock 데이터로 즉시 폴백<br/>+ 백그라운드 재시도"]
        F1 -- "플래그 OFF" --> F3["전면 mock 모드<br/>(현행과 동일)"]
    end

    style DONE fill:#E4F3E9,stroke:#1F8A4C,stroke-width:2px
    style FALLBACK fill:#FCE9E2,stroke:#E53400
```

**전제 조건 체크리스트**: ① 스키마 3건 — ✅ 완료(b428d67) ② API 라우트 6개 — ops 세션 작업 ③ 콘솔 신청 큐 — ops 세션 작업 ④ 앱 fetch 교체 + LIVE_OPS_API 플래그 — 앱 세션 작업 ⑤ rate limit·토큰 만료 정책 — 설계 시 확정

---

## 결정 대기 4건 (양측 합의 필요)

| # | 쟁점 | 제안 |
|---|---|---|
| 1 | 시딩 Open 자동 승인 vs 브랜드 승인보드 충돌 | 캠페인 개설 시 브랜드가 "선착순 자동 승인" 사전 위임 |
| 2 | G-스코어를 ops 매칭 스코어 입력으로 쓸지 | 2단계 논의 |
| 3 | 배치 초대 메일 + 앱 초대 코드 동봉(성장 루프) 시작 시점 | Phase 1 후반, 첫 루프 완료 사례 확보 후 |
| 4 | greydAppId 매핑 UI 위치 | ops 초대 코드 관리 화면에 통합 |

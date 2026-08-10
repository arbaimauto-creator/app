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

## 결정 대기 4건 (양측 합의 필요)

| # | 쟁점 | 제안 |
|---|---|---|
| 1 | 시딩 Open 자동 승인 vs 브랜드 승인보드 충돌 | 캠페인 개설 시 브랜드가 "선착순 자동 승인" 사전 위임 |
| 2 | G-스코어를 ops 매칭 스코어 입력으로 쓸지 | 2단계 논의 |
| 3 | 배치 초대 메일 + 앱 초대 코드 동봉(성장 루프) 시작 시점 | Phase 1 후반, 첫 루프 완료 사례 확보 후 |
| 4 | greydAppId 매핑 UI 위치 | ops 초대 코드 관리 화면에 통합 |

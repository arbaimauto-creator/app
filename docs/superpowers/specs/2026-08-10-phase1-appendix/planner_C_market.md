# greyd 1단계 설계 고도화 — 시장 차별화 · 신뢰 · 온보딩

> 전제: 메모리 기준 greyd 2.0은 "K-Product 검증 플랫폼"으로 재정의됨. 아래 제안은 전부 "브랜드가 크리에이터의 반응을 실제로 평가·활용한다"는 검증 루프를 축으로 정리했다. 각 항목 끝에 **[1단계 IN / OUT / LIGHT]** 판정 표기 (LIGHT = 1단계에 최소 버전만).

---

## 1. 경쟁 지형과 greyd의 틈

| 플랫폼 | 모델 | 규모/근거 | greyd가 이길 틈 |
|---|---|---|---|
| **Influenster (Bazaarvoice)** | 무료 VoxBox 발송 → 리뷰 수집. 선정은 설문·SNS 영향력·"운" 기반, 완전 오픈 가입 | 앱 다운로드 후 설문만 하면 누구나 응모. 대형 브랜드 중심 | 선정이 복권처럼 불투명 → "왜 뽑혔는지/내 리뷰가 어디에 쓰였는지" 피드백 없음. greyd는 **브랜드가 내 리뷰를 직접 평가하는 폐쇄 패널** 구조로 정확히 반대편 |
| **Skeepers (구 Octoly)** | 크리에이터가 크레딧으로 제품을 "주문", 리뷰 완료 시 크레딧 반환. 뷰티 5만+ 인플루언서, 연 20만 콜라보 | B2B SaaS로 완전 전환, 브랜드 대상 요금제 중심 | 유럽·미국 대형 브랜드 위주, K-뷰티 중소기업 접점 없음. 크리에이터에게는 "쇼핑몰"일 뿐 커뮤니티/인정 구조 없음 |
| **08liter (공팔리터)** | 한국발 글로벌 시딩. 8개국, 인플루언서 139만 명 표방, 아마존·TikTok Shop 등 커머스 연동 | 물량·전환 중심의 오픈 플랫폼 | 규모 게임이라 리뷰 품질·데이터 신뢰도가 희석됨. greyd는 **소수 정예 FGI 데이터 품질**로 차별화 — "139만의 리뷰"가 아니라 "국가별 검증된 200명의 깊은 반응" |
| **TikTok Creator Marketplace** | 브랜드-크리에이터 유료 매칭 | 팔로워 1만+ 및 최근 28일 좋아요 10만+ 필수 | **~1천 팔로워 나노는 아예 입장 불가.** greyd의 타깃은 구조적으로 TCM 밖에 있는 무주공산. 나노는 TikTok 참여율 ~10.3%로 메가(7.1%)보다 높고, 브랜드 44%가 나노 협업 선호 |
| **레뷰(REVU)** | 국내 최대 체험단, 회원 110만, 월 1.5만 캠페인. 수출바우처 수행사로 해외 인플루언서 마케팅도 병행 | 공개모집형, 블로그·인스타 중심 | 국내 내수형 DNA. 해외 크리에이터에게 "앱 경험"을 주는 게 아니라 대행 서비스에 가까움. greyd는 크리에이터 사이드 프로덕트로 승부 |
| **Butterly** | 브랜드 커뮤니티 가입 → 설문/포인트로 선정 확률 상승 → 무료 제품 | 뷰티 샘플링·테스터 모집 플랫폼 | 역시 "응모형". 포인트가 선정 확률용이라 greyd의 "포인트만 먹고 이탈" 실패를 그대로 반복하는 구조 |

**종합: greyd의 유일하게 방어 가능한 포지션은 3개 교집합** — (a) TCM이 버린 1천 팔로워 나노, (b) 지금 미국에서 폭발 중인 K-뷰티(2025년 한국 화장품 수출 사상 최대 $114.3억, 대미 수출 $22억으로 중국 추월, #kbeauty 태그 16억+ 포스트), (c) 어떤 경쟁사도 안 하는 "브랜드가 내 리뷰를 읽고 평가한다"는 양방향 인정 루프. **[판정: 포지셔닝 근거 자체가 1단계 IN — 아래 모든 설계의 기준]**

---

## 2. 뾰족한 포지셔닝 한 줄 + 광고 훅 3개

"Free K-beauty"는 Influenster/08liter와 구분이 안 되고 "사기 같다" 인상을 오히려 강화한다(공짜 강조 = 스캠 신호). 각도는 **희소성 + 인정(recognition) + 선행 접근(early access)**.

**앱스토어 한 줄:**
> **EN:** "greyd — The invite-only panel where Korean brands actually read your review."
> **KO:** "greyd — 한국 브랜드가 당신의 리뷰를 직접 읽는, 초대제 패널."

**광고 훅 3개:**

1. **인정 욕구 (핵심 훅)**
   - EN: *"1,000 followers. Zero brand deals? Here, the brand replies to YOU."*
   - KO: "팔로워 1천 명, 브랜드 협업 0건? 여기선 브랜드가 당신에게 답장합니다."
   - 근거: TCM 1만 컷오프에 막힌 나노의 좌절을 정면 타격.

2. **희소성/입장 자격**
   - EN: *"You can't download your way in. Someone has to vouch for you."*
   - KO: "다운로드만으로는 못 들어옵니다. 누군가 당신을 보증해야 하죠."

3. **선행 접근 (K-뷰티 붐 편승)**
   - EN: *"Try K-beauty before it hits Sephora. Your take decides if it does."*
   - KO: "세포라에 깔리기 전에 먼저 써보세요. 미국 진출 여부를 당신의 반응이 결정합니다."
   - 근거: K-뷰티 미국 리테일 입점 경쟁(울타·세포라·코스트코) 뉴스 흐름과 결합 — "무료"가 아니라 "심사위원 자격"으로 프레이밍.

**[판정: 1단계 IN — 카피는 코드 아닌 자산, 즉시 적용]**

---

## 3. "사기 같다" 첫인상 제거 체크리스트

### 3-1. 카피 톤 가이드 — 번역체 제거 원칙 3개

| 원칙 | Before (번역체) | After |
|---|---|---|
| **① 명사형/수동태 금지, 2인칭 동사로** | "Campaign participation is available after code verification." | "Enter your code to unlock campaigns." |
| **② 혜택이 아니라 행동+결과를 쓴다** | "Various benefits are provided to members." | "Post your review. The brand scores it within 7 days." |
| **③ 숫자·기한을 박는다 (모호함 = 스캠 신호)** | "Products will be shipped soon." | "Ships from Seoul in 3–5 days. Tracking number included." |

추가 규칙: 느낌표 남발 금지, "FREE!!" 대문자 금지, 원어민 1회 감수 필수. **[IN]**

### 3-2. 온보딩 4장 구성안

| 장 | 카피 (EN/KO) | 일러스트 방향 |
|---|---|---|
| 1. 자격 | "You were invited for a reason." / "당신이 초대된 데는 이유가 있습니다." | 그레이 배경에 옐로우 초대장 실물 그래픽. 코드 입력 필드가 이 장에 바로 |
| 2. 구조 | "Real products from Korea. Shipped to your door, tracked." / "한국에서 실제 제품이 배송됩니다. 전 과정 추적." | 서울→내 도시 배송 경로 일러스트 (실물감 강조 = 신뢰) |
| 3. 검증 루프 | "Your honest take gets graded by the brand — that's the 'grade' in greyd." / "당신의 솔직한 반응을 브랜드가 직접 평가합니다. greyd의 'grade'죠." | 리뷰 카드에 브랜드 스탬프가 찍히는 모션 |
| 4. 첫 행동 | "Pick your first campaign. 12 spots left this week." / "첫 캠페인을 고르세요. 이번 주 12자리 남음." | 실제 제품 썸네일 3개 (큐레이션된 고품질 사진 필수) |

**[판정: IN — 온보딩은 회의에서 지적된 최우선 약점]**

### 3-3. 소셜 프루프 배치 + 카디비 레퍼런스 법적 주의

- **쓸 수 있는 것**: 실제 참여 브랜드 로고(계약서에 로고 사용 조항), 초기 크리에이터의 실명 후기 영상, 배송 인증 UGC. 위치: 온보딩 2장과 대기자 랜딩페이지.
- **카디비 주의**: 미국 right of publicity상 유명인의 이름·이미지를 동의 없이 상업적 맥락에 쓰면 소송 대상이고, 밈/암시적 인용도 "보증하는 것처럼 보이면" 위험. FTC 가이드(16 CFR Part 255)상 실제 관계 없는 보증 암시도 기만 광고. **결론: "As seen with Cardi B" 류는 전면 금지.** 유일한 안전 경로는 사실 서술로서의 언론 인용("Whip Shots, the brand co-founded by Cardi B" 같은 제3자 기사 링크)을 브랜드 소개 텍스트에 한정하는 것 — 그래도 광고 소재/앱스토어 스크린샷에는 넣지 말 것. **[IN — 금지 규칙 자체가 산출물]**
- **신뢰 장치 (기능)**: ① 송장번호 자동 연동 + 배송 상태 푸시("Your box left Incheon ✈") — 무료 앱 스캠 의심의 최대 해독제. ② 회사 실체 노출: About 화면에 ARBAIM 사업자 정보·주소·이메일 명기. ③ 리뷰 제출 후 "브랜드 열람" 타임스탬프 표시. **[①③ IN, 물류 완전 자동화는 LIGHT — 1단계는 수동 송장 입력이라도]**

---

## 4. 초대제 × 성장 — 1단계에 넣을 1개

Clubhouse 교훈: 초대제는 초기 열망을 만들지만, 대기자를 방치하면 개방 시점에 전환 실패(1천만 대기자 대부분 미전환, MAU 70% 급락). 성공 패턴은 "대기 기간에 참여시키는 것"과 "초대장을 통한 네트워크 복제"(초대자의 네트워크가 신규 유저의 네트워크를 부트스트랩).

**1단계에 넣을 것 1개: 크리에이터 추천 코드 (1인 3장, 실적 연동)**
- 활동을 완료한(첫 리뷰가 브랜드 평가를 받은) 크리에이터에게만 코드 3장 발급 → "포인트만 먹고 이탈"하는 계정에는 성장 레버를 안 줌.
- 코드에 발급자 이름 각인("Invited by @mia_beauty") → 보증 구조 + 유입 크리에이터 품질이 기존 크리에이터를 닮음(Clubhouse 네트워크 효과와 동일 원리).
- 대기자 명단·코드 공개 이벤트는 **[OUT — 2단계]**: 지금은 대기 수요를 만들 트래픽 자체가 없고, 운영 리소스가 검증 루프에 집중돼야 함. **[추천 코드: IN]**

---

## 5. 1단계 성공 지표 — DAU 3천은 버린다 (동의)

FGI/검증 플랫폼의 가치는 "많이 오는 것"이 아니라 "루프가 닫히는 것".

**북극성 지표: 검증 루프 완료율 (Loop Completion Rate)**
- 정의: 제품 수령 크리에이터 중 [리뷰 제출 → 브랜드 평가 수신]까지 완료한 비율.
- 1단계 목표: **70%** (Influenster류 오픈 플랫폼의 리뷰 제출율보다 높아야 폐쇄형의 존재 이유 증명). 절대량 목표: 3개월 내 **완료 루프 300건, 참여 브랜드 5곳**.

**가드레일 지표:**
| 지표 | 목표 | 이유 |
|---|---|---|
| 제품 수령 → 리뷰 제출 중앙값 | ≤ 14일 | FGI 데이터의 신선도 = 판매 상품성 |
| 리뷰 제출자의 30일 재참여율 | ≥ 40% | "포인트 먹튀" 재발 감지 |
| 브랜드 평가 응답 시간 | ≤ 7일 | 인정 루프가 끊기면 포지셔닝 전체가 거짓이 됨 |
| 초대 코드 사용률 | 발급분의 ≥ 50% | 코드가 안 쓰이면 희소성 프레임이 아니라 그냥 죽은 앱 |
| 앱스토어 평점 | ≥ 4.3 | "사기 같다" 인상의 외부 지표 |

DAU/MAU는 2단계(개방 확대) 이후 지표로 이관. **[판정: IN — 지표 정의는 지금 박아야 대시보드 설계가 맞물림]**

---

## Sources

- [Influenster — How Do I Get a VoxBox](https://www.influenster.com/article/how-do-i-get-a-voxbox-from-influenster) · [Influenster 홈](https://www.influenster.com/)
- [Skeepers — Octoly's Pull Method and Credit System](https://skeepers.io/blog/why-it-works-octolys-influencer-pull-method-and-credit-system/) · [Influencer Marketing Hub — Skeepers Review](https://influencermarketinghub.com/skeepers/)
- [08liter biz (8개국·139만 인플루언서)](https://biz.08liter.com/) · [0.8 Liter — Google Play](https://play.google.com/store/apps/details?id=com.everyfriday.zeropoint8liter&hl=en_US)
- [Butterly — How it Works](https://butterly.com/en/community/how-it-works)
- [StackInfluence — TikTok Marketplace Requirements](https://stackinfluence.com/blog/tiktok-marketplace-requirements) · [Mavely — TikTok Creator Marketplace](https://www.joinmavely.com/creator-tips/tiktok-creator-marketplace/)
- [레뷰 REVU](https://www.revu.net/) · [레뷰 수출바우처 해외 인플루언서 마케팅](https://biz.revu.net/product/board-tip/134)
- [Waitlister — Clubhouse 10M Waitlist Case Study](https://waitlister.me/growth-hub/case-studies/club-house) · [Growth Models — Clubhouse Invite-Only 분석](https://growthmodels.co/clubhouse-marketing/) · [Brinna Thomsen — 4 Pitfalls of Invite-Only](https://www.brinnathomsen.com/4-pitfalls-of-the-invite-only-strategy-used-by-apps-like-clubhouse-and-superhuman)
- [Personal Care Insights — K-beauty 수출 사상 최대](https://www.personalcareinsights.com/news/k-beauty-export-ipo-scale.html) · [미국, 중국 제치고 K-뷰티 1위 시장](https://www.personalcareinsights.com/news/kbeauty-export-record-us-china-shift.html) · [CNBC — TikTok발 K-beauty 리테일 경쟁](https://www.cnbc.com/2025/11/27/k-beauty-tiktok-makeup.html)
- [Amra & Elma — Nano-Influencer Statistics](https://www.amraandelma.com/best-nano-influencer-statistics-2025/) · [Archive — Micro-Influencer Engagement Stats](https://archive.com/blog/micro-influencer-engagement-rate-statistics)
- [Nolo — Right of Publicity](https://www.nolo.com/legal-encyclopedia/the-right-publicity.html) · [FKKS — Using Someone in Advertising Without Consent](https://fkks.com/news/using-someone-in-advertising...without-consent) · [16 CFR Part 255 (FTC Endorsement Guides)](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255)

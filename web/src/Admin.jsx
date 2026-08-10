import React, { useState } from 'react';
import { CAMPAIGNS, ADMIN_CODE, REVIEWS, WEEKLY_FINDINGS, INVITE_CODE_LEDGER } from './mock.js';

// 운영자 코드 게이트 — #admin은 코드 없이 열리지 않는다 (1단계 mock, 서버 인증으로 교체 예정)
function AdminGate({ onEnter }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (code.trim().toUpperCase() !== ADMIN_CODE) {
      setErr('운영자 코드가 아니에요.');
      return;
    }
    sessionStorage.setItem('adminOk', '1');
    onEnter();
  };
  return (
    <div className="gate">
      <div className="logo">
        grey<b>d</b> <span style={{ fontWeight: 400, fontSize: 18 }}>Admin</span>
      </div>
      <p>ARBAIM 운영자 코드를 입력하세요</p>
      <input
        value={code}
        maxLength={6}
        placeholder="CODE"
        onChange={(e) => {
          setCode(e.target.value);
          setErr('');
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {err ? <div className="err">{err}</div> : null}
      <button onClick={submit}>Admin 열기</button>
    </div>
  );
}

// ── mock 데이터 (전부 로컬 상태 — 서버 연동 시 API 교체) ──

const TABS = ['운영 대시보드', '캠페인 개설', '승인 큐', '이행 추적', '검수 · 리포트', '초대 코드'];

// 승인 큐 — 기존 신청자 mock에 gScore/track/pledge 추가
const MOCK_APPLICANTS = [
  { id: 'ap-1', handle: 'mia_beauty', country: 'US', followerBand: 'nano', gScore: 74, track: 'curated', pledge: true, appeal: 'K-beauty 전문 계정이에요. 아이크림 리뷰 경험 다수!', status: 'applied' },
  { id: 'ap-2', handle: 'yuki.skin', country: 'JP', followerBand: 'micro', gScore: 81, track: 'curated', pledge: true, appeal: '', status: 'approved' },
  { id: 'ap-3', handle: 'berlin.glow', country: 'DE', followerBand: 'nano', gScore: 52, track: 'curated', pledge: true, appeal: 'Sensitive skin creator, honest reviews only.', status: 'applied' },
  { id: 'ap-4', handle: 'seoulglow', country: 'KR', followerBand: 'nano', gScore: 68, track: 'open', pledge: true, appeal: '', status: 'shipped' },
  { id: 'ap-5', handle: 'lena.k', country: 'US', followerBand: 'nano', gScore: 63, track: 'open', pledge: true, appeal: 'First loop! Skincare junkie in NYC.', status: 'applied' },
];

// 이행 추적 — 상태별 카운트(12/6/9/14/8/2)를 배열로 표현, 집계는 렌더에서 수행
const FULFILLMENT_INIT = (() => {
  const seed = [
    ['applied', 12],
    ['approved', 6],
    ['shipped', 9],
    ['received', 14],
    ['reviewing', 8],
    ['no_show', 2],
  ];
  const handles = ['mia_beauty', 'yuki.skin', 'berlin.glow', 'seoulglow', 'lena.k', 'tokyo_mel', 'ny_glow', 'sofi.derma', 'kbeauty_jane', 'paris.jin'];
  const shippedDaysCycle = [4, 9, 12, 15, 18, 19, 21, 6, 20];
  const receivedDCycle = [3, 5, 8, 11, 14, 15, 16, 17, 2, 6, 9, 12, 13, 10];
  const reviewingDCycle = [4, 6, 7, 9, 10, 12, 13, 14];
  const rows = [];
  let n = 0;
  seed.forEach(([status, count]) => {
    for (let i = 0; i < count; i++) {
      n++;
      const base = handles[(n - 1) % handles.length];
      const handle = n <= handles.length ? base : `${base}_${n}`;
      const row = { id: `ff-${n}`, handle, status, trackingNo: '', shippedDays: null, dPlus: null };
      if (status === 'shipped') {
        row.trackingNo = `TRK${5000 + n}`;
        row.shippedDays = shippedDaysCycle[i % shippedDaysCycle.length];
      }
      if (status === 'received') {
        row.trackingNo = `TRK${5000 + n}`;
        row.dPlus = receivedDCycle[i % receivedDCycle.length];
      }
      if (status === 'reviewing') {
        row.trackingNo = `TRK${5000 + n}`;
        row.dPlus = reviewingDCycle[i % reviewingDCycle.length];
      }
      if (status === 'no_show') {
        row.trackingNo = `TRK${5000 + n}`;
        row.dPlus = 17 + i;
      }
      rows.push(row);
    }
  });
  return rows;
})();

const FULFILL_ORDER = ['applied', 'approved', 'shipped', 'received', 'reviewing', 'no_show'];

// 검수 — 기존 REVIEWS mock + 지표 미입력 행 1건
const REVIEWS_INIT = [
  ...REVIEWS['cmp-001'],
  {
    id: 'rv-104',
    reviewer: 'berlin.glow',
    country: 'DE',
    followerBand: 'nano',
    format: 'short',
    productionStyle: 'demo',
    views7d: null,
    likes7d: null,
    uploadedAt: '2026-08-09',
    metricsSource: 'manual',
    capturedAt: '',
  },
];

const STYLE_LABEL = { face_review: '페이스 리뷰', demo: '데모', before_after: '비포애프터' };

const randomCode = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 3; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `GRD-${s}`;
};

// ── 대시보드 (섹션 1) ──
function DashboardTab() {
  const guards = [
    { name: '수령→업로드 중앙값', target: '≤ 14일', value: '11일', ok: true },
    { name: '30일 재참여율', target: '≥ 40%', value: '44%', ok: true },
    { name: '브랜드 평가 응답', target: '≤ 7일', value: '8.5일 ⚠', ok: false, action: '브랜드 리마인드 필요' },
    { name: '초대 코드 사용률', target: '≥ 50%', value: '57%', ok: true },
    { name: '앱스토어 평점', target: '≥ 4.3', value: '4.5', ok: true },
  ];
  return (
    <>
      <div className="rowBetween" style={{ marginTop: 28 }}>
        <h2 className="section" style={{ margin: 0 }}>이번 분기 — 검증 루프</h2>
        <span className="xs">목표: 3개월 완료 300건 · 브랜드 5곳</span>
      </div>
      <div className="kpi3" style={{ marginTop: 12 }}>
        <div className="card kpi">
          <div className="l">루프 완료율 (북극성)</div>
          <div className="kpiBig">68%</div>
          <div className="progress"><i style={{ width: '68%' }} /></div>
          <div className="note">목표 70%</div>
        </div>
        <div className="card kpi">
          <div className="l">완료 루프 누적</div>
          <div className="kpiBig">147</div>
          <div className="progress"><i style={{ width: `${(147 / 300) * 100}%` }} /></div>
          <div className="note">/ 300건</div>
        </div>
        <div className="card kpi">
          <div className="l">참여 브랜드</div>
          <div className="kpiBig">3</div>
          <div className="progress"><i style={{ width: `${(3 / 5) * 100}%` }} /></div>
          <div className="note">/ 5곳</div>
        </div>
      </div>

      <h2 className="section">가드레일 지표<small>임계 이탈 시 우측에 조치 표시</small></h2>
      <table className="board">
        <thead>
          <tr><th>지표</th><th>가드레일</th><th>현재</th><th>상태</th><th>조치</th></tr>
        </thead>
        <tbody>
          {guards.map((g) => (
            <tr key={g.name}>
              <td style={{ fontWeight: 700 }}>{g.name}</td>
              <td>{g.target}</td>
              <td style={{ fontWeight: 700, color: g.ok ? 'inherit' : 'var(--red)' }}>{g.value}</td>
              <td><span className={g.ok ? 'guard-ok' : 'guard-warn'}>{g.ok ? '양호' : '주의'}</span></td>
              <td>{g.action ? <span className="guard-warn">{g.action}</span> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default function Admin() {
  const [adminOk, setAdminOk] = useState(() => sessionStorage.getItem('adminOk') === '1');
  const [activeTab, setActiveTab] = useState(0);

  // 섹션 2 — 캠페인
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [form, setForm] = useState({
    brand: '',
    title: '',
    countries: 'US, JP',
    quota: 30,
    basePoints: 300,
    openPct: 70,
    curatedPct: 30,
    uploadDays: 14,
    unitCost: '',
    shipCost: '',
    guide: '',
    fgiExtra: '',
  });

  // 섹션 3 — 승인 큐 / 섹션 4 — 이행 추적
  const [applicants, setApplicants] = useState(MOCK_APPLICANTS);
  const [fulfillment, setFulfillment] = useState(FULFILLMENT_INIT);

  // 섹션 5 — 검수·리포트
  const [reviews, setReviews] = useState(REVIEWS_INIT);
  const [metricDraft, setMetricDraft] = useState({});
  const [findings, setFindings] = useState(WEEKLY_FINDINGS['cmp-001']);
  const [findingText, setFindingText] = useState('');
  const [referralIssued, setReferralIssued] = useState(false);

  // 섹션 6 — 초대 코드
  const [codes, setCodes] = useState(INVITE_CODE_LEDGER);
  const [newCodeRole, setNewCodeRole] = useState('influencer');

  const addCampaign = () => {
    if (!form.brand.trim() || !form.title.trim()) {
      alert('브랜드명과 캠페인명을 입력해주세요');
      return;
    }
    setCampaigns([
      ...campaigns,
      {
        id: `cmp-${String(campaigns.length + 1).padStart(3, '0')}`,
        brandId: `brand-${form.brand.toLowerCase().replace(/\s/g, '')}`,
        brand: form.brand.trim(),
        title: form.title.trim(),
        period: '(모집 예정)',
        countries: form.countries.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean),
        seedingTotal: Number(form.quota) || 0,
        contentGuide: form.guide.split('\n').map((g) => g.trim()).filter(Boolean),
        fgiExtraQuestions: form.fgiExtra.split('\n').map((q) => q.trim()).filter(Boolean),
        basePoints: Number(form.basePoints) || 0,
        openPct: Number(form.openPct) || 0,
        curatedPct: Number(form.curatedPct) || 0,
        uploadDays: Number(form.uploadDays) || 14,
        unitCost: Number(form.unitCost) || 0,
        shipCost: Number(form.shipCost) || 0,
      },
    ]);
    setForm({
      brand: '', title: '', countries: 'US, JP', quota: 30, basePoints: 300,
      openPct: 70, curatedPct: 30, uploadDays: 14, unitCost: '', shipCost: '', guide: '', fgiExtra: '',
    });
  };

  const setApplicantStatus = (id, status) =>
    setApplicants(applicants.map((a) => (a.id === id ? { ...a, status } : a)));

  const patchFulfill = (id, patch) =>
    setFulfillment(fulfillment.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const saveMetrics = (id) => {
    const d = metricDraft[id] || {};
    if (!String(d.views || '').trim() || !String(d.likes || '').trim()) {
      alert('조회수와 좋아요를 모두 입력해주세요');
      return;
    }
    setReviews(reviews.map((r) =>
      r.id === id ? { ...r, views7d: Number(d.views) || 0, likes7d: Number(d.likes) || 0, capturedAt: '2026-08-10' } : r,
    ));
  };

  const publishFinding = () => {
    if (!findingText.trim()) {
      alert('발견 내용을 입력해주세요');
      return;
    }
    setFindings([{ week: 'W4', text: findingText.trim() }, ...findings]);
    setFindingText('');
    alert('브랜드 대시보드(리포트 화면)에 게시됐어요 — mock: WEEKLY_FINDINGS push');
  };

  const issueReferralCodes = () => {
    const three = Array.from({ length: 3 }, () => ({
      code: randomCode(),
      role: 'influencer',
      channel: '추천 (@mia_beauty)',
      engraving: 'Invited by @mia',
      validLabel: 'D-7',
      status: 'unused',
      usedBy: '',
    }));
    setCodes([...three, ...codes]);
    setReferralIssued(true);
  };

  const issueCode = () => {
    setCodes([
      {
        code: randomCode(),
        role: newCodeRole,
        channel: '운영 직접',
        engraving: '',
        validLabel: 'D-7',
        status: 'unused',
        usedBy: '',
      },
      ...codes,
    ]);
  };

  if (!adminOk) {
    return <AdminGate onEnter={() => setAdminOk(true)} />;
  }

  const field = (label, key, props = {}) => (
    <label className="af">
      <span>{label}</span>
      {props.multiline ? (
        <textarea
          rows={3}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={props.placeholder}
        />
      ) : (
        <input
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={props.placeholder}
        />
      )}
    </label>
  );

  const fulfillCounts = FULFILL_ORDER.map((s) => [s, fulfillment.filter((f) => f.status === s).length]);
  const codeStats = {
    total: codes.length,
    used: codes.filter((c) => c.status === 'used').length,
    expired: codes.filter((c) => c.status === 'expired').length,
    unused: codes.filter((c) => c.status === 'unused').length,
  };

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <div className="logo">
            grey<b>d</b> Admin
          </div>
          <div className="brand">ARBAIM 운영 콘솔 — 검증 루프 · 캠페인 · 초대 코드</div>
        </div>
        <div className="actions">
          <a className="btn" href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ''; window.location.reload(); }}>
            리포트로 →
          </a>
        </div>
      </div>

      <div className="admTabs">
        {TABS.map((t, i) => (
          <button key={t} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {/* 1 ── 운영 대시보드 */}
      {activeTab === 0 && <DashboardTab />}

      {/* 2 ── 캠페인 개설 */}
      {activeTab === 1 && (
        <>
          <h2 className="section">캠페인 등록<small>고객사 계약 후 운영자가 개설 — 질문지·가이드 포함</small></h2>
          <div className="card adminForm">
            {field('브랜드명', 'brand', { placeholder: 'SonPlan' })}
            {field('캠페인명', 'title', { placeholder: '타임 슬립 아이크림 글로벌 체험단' })}
            {field('대상 국가 (쉼표)', 'countries')}
            {field('시딩 수량', 'quota')}
            {field('기본 포인트', 'basePoints')}
            {field('업로드 기한 (일)', 'uploadDays')}
            {field('트랙 비율 — Open %', 'openPct')}
            {field('트랙 비율 — Curated %', 'curatedPct')}
            {field('제품 원가 ₩ (내부용 · 브랜드 비노출)', 'unitCost', { placeholder: '12000' })}
            {field('배송비 ₩ (내부용 · 브랜드 비노출)', 'shipCost', { placeholder: '8500' })}
            {field('콘텐츠 가이드 (줄바꿈)', 'guide', { multiline: true, placeholder: '타임 슬립 성분 언급\n눈가 사용 장면' })}
            {field('FGI 추가 질문 (줄바꿈)', 'fgiExtra', { multiline: true, placeholder: '향에 대한 인상은?\n민감성 피부에도 괜찮았나요?' })}
            <button className="btn primary" onClick={addCampaign}>캠페인 등록</button>
          </div>

          <h2 className="section">등록된 캠페인 ({campaigns.length})</h2>
          <table className="board">
            <thead>
              <tr><th>ID</th><th>브랜드</th><th>캠페인</th><th>국가</th><th>수량</th><th>트랙 비율</th><th>업로드 기한</th></tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace' }}>{c.id}</td>
                  <td>{c.brand}</td>
                  <td>{c.title}</td>
                  <td>{(c.countries || []).join(' · ')}</td>
                  <td>{c.seedingTotal}</td>
                  <td>Open {c.openPct ?? '—'}% · Cur {c.curatedPct ?? '—'}%</td>
                  <td>{c.uploadDays ?? 14}일</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="xs" style={{ marginTop: 8 }}>원가·배송비는 내부 손익 계산용 — 브랜드 리포트에는 노출되지 않습니다.</div>
        </>
      )}

      {/* 3 ── 승인 큐 */}
      {activeTab === 2 && (
        <>
          <h2 className="section">승인 큐<small>Open = 선착순 자동 · Curated = 수동 심사 (G60 게이트)</small></h2>
          <table className="board">
            <thead>
              <tr><th>핸들</th><th>국가</th><th>규모</th><th>G점수</th><th>트랙</th><th>서약</th><th>어필</th><th>상태</th><th>액션</th></tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 700 }}>@{a.handle}</td>
                  <td>{a.country}</td>
                  <td>{a.followerBand}</td>
                  <td style={{ fontWeight: 800, color: a.gScore < 60 ? 'var(--red)' : 'inherit' }}>{a.gScore}</td>
                  <td>{a.track === 'open' ? 'Open' : 'Curated'}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 800 }}>{a.pledge ? '✓' : '—'}</td>
                  <td style={{ maxWidth: 200, fontSize: 12.5, color: '#6b675e' }}>{a.appeal || '—'}</td>
                  <td><span className={`st st-${a.status}`}>{a.status}</span></td>
                  <td>
                    {a.status !== 'applied' ? (
                      '—'
                    ) : a.track === 'open' ? (
                      <span className="st st-auto">자동승인</span>
                    ) : a.gScore < 60 ? (
                      <button className="btn ghost sm" onClick={() => setApplicantStatus(a.id, 'rejected')}>
                        G60 미달 — 반려
                      </button>
                    ) : (
                      <>
                        <button className="btn primary sm" onClick={() => setApplicantStatus(a.id, 'approved')}>승인</button>{' '}
                        <button className="btn sm" onClick={() => setApplicantStatus(a.id, 'applied')}>보류</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="xs" style={{ marginTop: 8 }}>Open = 선착순 자동 · Curated = 수동 심사</div>
        </>
      )}

      {/* 4 ── 이행 추적 */}
      {activeTab === 3 && (
        <>
          <h2 className="section">이행 추적<small>수령 D+14 업로드 기한 — 유예 D+16까지 ×0.7</small></h2>
          <div className="pillrow">
            {fulfillCounts.map(([s, n]) => (
              <span key={s} className={`st st-${s}`}>
                {s}<span className="pcount">{n}</span>
              </span>
            ))}
          </div>
          <table className="board" style={{ marginTop: 14 }}>
            <thead>
              <tr><th>크리에이터</th><th>상태</th><th>운송장</th><th>수령</th><th>D-day</th><th>액션</th></tr>
            </thead>
            <tbody>
              {fulfillment.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 700 }}>@{f.handle}</td>
                  <td><span className={`st st-${f.status}`}>{f.status}</span></td>
                  <td>
                    {f.status === 'approved' ? (
                      <input
                        className="trk"
                        value={f.trackingNo}
                        placeholder="tracking no."
                        onChange={(e) => patchFulfill(f.id, { trackingNo: e.target.value })}
                      />
                    ) : (
                      <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{f.trackingNo || '—'}</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--green)', fontWeight: 800 }}>
                    {f.status === 'received' || f.status === 'reviewing' ? '✓' : '—'}
                  </td>
                  <td>
                    {f.dPlus != null ? (
                      <>
                        D+{f.dPlus}
                        {f.dPlus >= 14 && f.dPlus <= 16 ? <span className="graceTag">유예 ×0.7</span> : null}
                      </>
                    ) : f.shippedDays != null ? (
                      `발송 +${f.shippedDays}일`
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {f.status === 'approved' ? (
                      <button
                        className="btn primary sm"
                        onClick={() => {
                          if (!f.trackingNo.trim()) {
                            alert('운송장 번호를 먼저 입력해주세요');
                            return;
                          }
                          patchFulfill(f.id, { status: 'shipped', shippedDays: 0 });
                        }}
                      >
                        발송 처리
                      </button>
                    ) : f.status === 'shipped' && f.shippedDays >= 18 ? (
                      <button
                        className="btn sm"
                        onClick={() => patchFulfill(f.id, { status: 'received', shippedDays: null, dPlus: 0 })}
                      >
                        21일 시 수령 간주
                      </button>
                    ) : f.status === 'received' && f.dPlus >= 16 ? (
                      <button
                        className="btn ghost sm"
                        style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                        onClick={() => patchFulfill(f.id, { status: 'no_show' })}
                      >
                        Strike 1 부여 · G−10
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="xs" style={{ marginTop: 8 }}>
            유예(D+14~16) 업로드 = ×0.7 자동 표시 · Strike 2회 = 영구 차단(수동 집행) · cancelled는 무페널티.
          </div>
        </>
      )}

      {/* 5 ── 검수 · 리포트 */}
      {activeTab === 4 && (
        <>
          <h2 className="section">리뷰 지표 입력<small>metricsSource: manual — 수집일 함께 기록</small></h2>
          <table className="board">
            <thead>
              <tr><th>리뷰</th><th>형식</th><th>스타일</th><th>조회 @7d</th><th>좋아요</th><th>수집일</th></tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>@{r.reviewer} <span className="xs">({r.country})</span></td>
                  <td>{r.format}</td>
                  <td><span className="styleTag">{STYLE_LABEL[r.productionStyle] || r.productionStyle}</span></td>
                  {r.views7d == null ? (
                    <>
                      <td>
                        <input
                          className="metricIn"
                          placeholder="views"
                          value={(metricDraft[r.id] || {}).views || ''}
                          onChange={(e) => setMetricDraft({ ...metricDraft, [r.id]: { ...(metricDraft[r.id] || {}), views: e.target.value } })}
                        />
                      </td>
                      <td>
                        <input
                          className="metricIn"
                          placeholder="likes"
                          value={(metricDraft[r.id] || {}).likes || ''}
                          onChange={(e) => setMetricDraft({ ...metricDraft, [r.id]: { ...(metricDraft[r.id] || {}), likes: e.target.value } })}
                        />
                      </td>
                      <td><button className="btn primary sm" onClick={() => saveMetrics(r.id)}>저장</button></td>
                    </>
                  ) : (
                    <>
                      <td>{r.views7d.toLocaleString()}</td>
                      <td>{r.likes7d.toLocaleString()}</td>
                      <td className="xs">{r.capturedAt}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="section">위클리 발견 카드<small>작성 후 브랜드 대시보드에 게시</small></h2>
          <div className="wf">
            <textarea
              value={findingText}
              placeholder="🇯🇵 일본: 예상 밖 '지속력' 언급 집중 (7건 중 5건)…"
              onChange={(e) => setFindingText(e.target.value)}
            />
            <div style={{ marginTop: 10 }}>
              <button className="btn primary sm" onClick={publishFinding}>브랜드 대시보드 게시</button>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            {findings.map((w, i) => (
              <div key={i} className="xs" style={{ padding: '4px 0' }}>
                <b style={{ color: 'var(--accent-deep)' }}>{w.week}</b> · {w.text}
              </div>
            ))}
          </div>

          <h2 className="section">추천 코드 발급<small>첫 루프 완료 크리에이터에게 초대 코드 3장</small></h2>
          <div className="card rowBetween">
            <div>
              <b>@mia_beauty</b> 첫 루프 완료 <span style={{ color: 'var(--green)', fontWeight: 800 }}>✓</span>
              <div className="xs">발급 시 초대 코드 탭 원장에 3장 추가 (유효 7일 · Invited by @mia 각인)</div>
            </div>
            {referralIssued ? (
              <span className="guard-ok">발급 완료 ✓</span>
            ) : (
              <button className="btn primary sm" onClick={issueReferralCodes}>코드 3장 발급</button>
            )}
          </div>

          <div className="pillrow" style={{ marginTop: 18 }}>
            <button className="btn ghost" onClick={() => alert('FGI 리포트 PDF는 애널리스트가 수동 제작 후 브랜드 대시보드에 업로드합니다. (1단계 mock)')}>
              FGI 리포트 PDF 업로드 (애널리스트 수동 제작)
            </button>
            <button className="btn ghost" onClick={() => alert('주간 요약 이메일 체크리스트:\n1) 위클리 발견 카드 게시 확인\n2) 리뷰 지표 수집일 최신화\n3) 가드레일 이탈 항목 코멘트\n4) 브랜드 담당자 CC 확인')}>
              주간 요약 이메일 발송 체크리스트
            </button>
          </div>
        </>
      )}

      {/* 6 ── 초대 코드 */}
      {activeTab === 5 && (
        <>
          <div className="rowBetween" style={{ marginTop: 28 }}>
            <div>
              <h2 className="section" style={{ margin: 0 }}>초대 코드 관리</h2>
              <span className="xs">사용률 57% · 가드레일 ≥50% ✓</span>
            </div>
            <div className="pillrow">
              <select className="roleSel" value={newCodeRole} onChange={(e) => setNewCodeRole(e.target.value)}>
                <option value="influencer">influencer</option>
                <option value="brand">brand</option>
              </select>
              <button className="btn primary" onClick={issueCode}>+ 코드 발급</button>
            </div>
          </div>
          <div className="codeSummary">
            <span className="cs">발급 <b>{codeStats.total}</b></span>
            <span className="cs">사용 <b style={{ color: 'var(--green)' }}>{codeStats.used}</b></span>
            <span className="cs">만료 <b style={{ color: 'var(--red)' }}>{codeStats.expired}</b></span>
            <span className="cs">잔여 <b style={{ color: 'var(--accent-deep)' }}>{codeStats.unused}</b></span>
          </div>
          <table className="board">
            <thead>
              <tr><th>코드</th><th>역할</th><th>발급 경로</th><th>각인</th><th>유효</th><th>상태</th></tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.code}</td>
                  <td>{c.role}</td>
                  <td>{c.channel}</td>
                  <td className="xs">{c.engraving || '—'}</td>
                  <td>{c.validLabel}</td>
                  <td>
                    <span className={`st st-${c.status}`}>
                      {c.status === 'unused' ? '미사용' : c.status === 'used' ? `사용됨${c.usedBy ? ` → ${c.usedBy}` : ''}` : '만료'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="xs" style={{ marginTop: 8 }}>코드는 발급 시점부터 7일 유효 — 만료 코드는 재발급으로만 갱신합니다.</div>
        </>
      )}

      <footer>greyd Admin · 1단계는 mock 로컬 상태 — 서버 연동 시 이 화면의 액션이 앱 상태머신(approved/shipped/received)을 구동합니다.</footer>
    </div>
  );
}

import React, { useState } from 'react';
import { CAMPAIGNS, ADMIN_CODE } from './mock.js';

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

// B2B Admin (계획서 TSK-009/010) — 1단계 mock: 로컬 상태, 서버 연동 시 API 교체.
// 캠페인 등록(질문지 설정 포함) + 신청 크리에이터 승인 + 운송장 입력.
const MOCK_APPLICANTS = [
  { id: 'ap-1', handle: 'mia_beauty', country: 'US', followerBand: 'nano', appeal: 'K-beauty 전문 계정이에요. 아이크림 리뷰 경험 다수!', status: 'applied', trackingNo: '' },
  { id: 'ap-2', handle: 'yuki.skin', country: 'JP', followerBand: 'micro', appeal: '', status: 'approved', trackingNo: '' },
  { id: 'ap-3', handle: 'berlin.glow', country: 'DE', followerBand: 'nano', appeal: 'Sensitive skin creator, honest reviews only.', status: 'applied', trackingNo: '' },
  { id: 'ap-4', handle: 'seoulglow', country: 'KR', followerBand: 'nano', appeal: '', status: 'shipped', trackingNo: 'KR1234567890' },
];

export default function Admin() {
  const [adminOk, setAdminOk] = useState(() => sessionStorage.getItem('adminOk') === '1');
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [applicants, setApplicants] = useState(MOCK_APPLICANTS);
  const [form, setForm] = useState({
    brand: '',
    title: '',
    countries: 'US, JP',
    quota: 30,
    basePoints: 300,
    guide: '',
    fgiExtra: '',
  });

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
      },
    ]);
    setForm({ brand: '', title: '', countries: 'US, JP', quota: 30, basePoints: 300, guide: '', fgiExtra: '' });
  };

  const setStatus = (id, status) =>
    setApplicants(applicants.map((a) => (a.id === id ? { ...a, status } : a)));
  const setTracking = (id, trackingNo) =>
    setApplicants(applicants.map((a) => (a.id === id ? { ...a, trackingNo } : a)));

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

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <div className="logo">
            grey<b>d</b> Admin
          </div>
          <div className="brand">캠페인 개설·크리에이터 승인·배송 관리 (ARBAIM 운영 전용)</div>
        </div>
        <div className="actions">
          <a className="btn" href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ''; window.location.reload(); }}>
            리포트로 →
          </a>
        </div>
      </div>

      <h2 className="section">캠페인 등록<small>고객사 계약 후 운영자가 개설 — 질문지·가이드 포함</small></h2>
      <div className="card adminForm">
        {field('브랜드명', 'brand', { placeholder: 'SonPlan' })}
        {field('캠페인명', 'title', { placeholder: '타임 슬립 아이크림 글로벌 체험단' })}
        {field('대상 국가 (쉼표)', 'countries')}
        {field('시딩 수량', 'quota')}
        {field('기본 포인트', 'basePoints')}
        {field('콘텐츠 가이드 (줄바꿈)', 'guide', { multiline: true, placeholder: '타임 슬립 성분 언급\n눈가 사용 장면' })}
        {field('FGI 추가 질문 (줄바꿈)', 'fgiExtra', { multiline: true, placeholder: '향에 대한 인상은?\n민감성 피부에도 괜찮았나요?' })}
        <button className="btn primary" onClick={addCampaign}>캠페인 등록</button>
      </div>

      <h2 className="section">등록된 캠페인 ({campaigns.length})</h2>
      <table className="board">
        <thead>
          <tr><th>ID</th><th>브랜드</th><th>캠페인</th><th>국가</th><th>수량</th></tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td style={{ fontFamily: 'monospace' }}>{c.id}</td>
              <td>{c.brand}</td>
              <td>{c.title}</td>
              <td>{(c.countries || []).join(' · ')}</td>
              <td>{c.seedingTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="section">크리에이터 승인 · 배송<small>승인 → 주소 수집(앱) → 운송장 입력 → 발송</small></h2>
      <table className="board">
        <thead>
          <tr><th>핸들</th><th>국가</th><th>규모</th><th>어필</th><th>상태</th><th>운송장</th><th>액션</th></tr>
        </thead>
        <tbody>
          {applicants.map((a) => (
            <tr key={a.id}>
              <td style={{ fontWeight: 700 }}>@{a.handle}</td>
              <td>{a.country}</td>
              <td>{a.followerBand}</td>
              <td style={{ maxWidth: 220, fontSize: 12.5, color: '#6b675e' }}>{a.appeal || '—'}</td>
              <td><span className={`st st-${a.status}`}>{a.status}</span></td>
              <td>
                <input
                  className="trk"
                  value={a.trackingNo}
                  placeholder="tracking no."
                  disabled={a.status === 'applied'}
                  onChange={(e) => setTracking(a.id, e.target.value)}
                />
              </td>
              <td>
                {a.status === 'applied' ? (
                  <>
                    <button className="btn primary sm" onClick={() => setStatus(a.id, 'approved')}>승인</button>{' '}
                    <button className="btn sm" onClick={() => setStatus(a.id, 'rejected')}>거절</button>
                  </>
                ) : a.status === 'approved' ? (
                  <button
                    className="btn primary sm"
                    onClick={() => {
                      if (!a.trackingNo.trim()) {
                        alert('운송장 번호를 먼저 입력해주세요');
                        return;
                      }
                      setStatus(a.id, 'shipped');
                    }}
                  >
                    발송 처리
                  </button>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer>greyd Admin · 1단계는 mock 로컬 상태 — 서버 연동 시 이 화면의 액션이 앱 상태머신(approved/shipped)을 구동합니다.</footer>
    </div>
  );
}

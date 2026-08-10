import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  INVITE_CODES,
  CAMPAIGNS,
  FGI_STATS,
  COUNTRY_STATS,
  WEEKLY_FINDINGS,
  REVIEWS,
  QUALITATIVE,
} from './mock.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);

const ACCENT = '#f5a300';
const LINE = '#e8e5df';

// ── 브랜드 코드 게이트 (mock — 서버 연동 시 세션 교체) ──
function Gate({ onEnter }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    const found = INVITE_CODES.find((c) => c.code === code.trim().toUpperCase());
    if (!found) {
      setErr('유효하지 않은 코드예요. 담당 매니저에게 코드를 요청해주세요.');
      return;
    }
    sessionStorage.setItem('brandId', found.brandId);
    sessionStorage.setItem('brandName', found.brandName);
    onEnter(found);
  };
  return (
    <div className="gate">
      <div className="logo">
        grey<b>d</b> <span style={{ fontWeight: 400, fontSize: 18 }}>for Brands</span>
      </div>
      <p>브랜드 코드를 입력하면 캠페인 FGI 리포트를 볼 수 있어요</p>
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
      <button onClick={submit}>리포트 열기</button>
    </div>
  );
}

function GaugeCard({ score }) {
  const data = useMemo(
    () => ({
      datasets: [
        {
          data: [score, 100 - score],
          backgroundColor: [ACCENT, LINE],
          borderWidth: 0,
          cutout: '78%',
          circumference: 270,
          rotation: 225,
        },
      ],
    }),
    [score],
  );
  return (
    <div className="card gaugeCard">
      <div style={{ position: 'relative', width: 190, height: 170 }}>
        <Doughnut data={data} options={{ plugins: { tooltip: { enabled: false } } }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 900 }}>{score}</div>
          <div style={{ fontSize: 12, color: '#6b675e' }}>/ 100</div>
        </div>
      </div>
      <div className="kpi l" style={{ fontSize: 12, color: '#6b675e' }}>
        종합 매력도 (정량 평균 환산)
      </div>
    </div>
  );
}

function Dashboard({ brand }) {
  const campaigns = CAMPAIGNS.filter((c) => c.brandId === brand.brandId || true); // mock: 전체 노출
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id);
  const fgi = FGI_STATS[campaignId];
  const countries = COUNTRY_STATS[campaignId] || [];
  const findings = WEEKLY_FINDINGS[campaignId] || [];
  const reviews = REVIEWS[campaignId] || [];
  const qual = QUALITATIVE[campaignId] || [];
  const campaign = campaigns.find((c) => c.id === campaignId);

  const totalUploads = reviews.length;
  const totalReach = reviews.reduce((s, r) => s + (r.views7d || 0), 0);

  const quantBar = fgi && {
    labels: ['구매의향', '가격 적정성', '경쟁력'],
    datasets: [
      {
        data: [fgi.quant.purchaseIntent, fgi.quant.priceFairness, fgi.quant.competitiveness],
        backgroundColor: ACCENT,
        borderRadius: 6,
      },
    ],
  };
  const priceBar = fgi && {
    labels: Object.keys(fgi.priceDistribution),
    datasets: [
      {
        data: Object.values(fgi.priceDistribution),
        backgroundColor: Object.keys(fgi.priceDistribution).map((k, i) =>
          i === 2 ? ACCENT : LINE,
        ),
        borderRadius: 6,
      },
    ],
  };
  const barOpts = {
    plugins: { tooltip: { enabled: true } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0eee9' } },
      x: { grid: { display: false } },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <div className="logo">
            grey<b>d</b> for Brands
          </div>
          <div className="brand">
            {brand.brandName} · {campaign?.title} · {campaign?.period}
          </div>
        </div>
        <div className="actions no-print">
          <button className="btn" onClick={() => window.print()}>
            PDF로 내보내기
          </button>
          <button
            className="btn primary"
            onClick={() => alert('담당 매니저가 2차 캠페인 견적을 보내드릴게요.')}
          >
            2차 캠페인 상담
          </button>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <div className="grid4">
        <div className="card kpi">
          <div className="v">{totalUploads}</div>
          <div className="l">총 업로드</div>
        </div>
        <div className="card kpi">
          <div className="v">{totalReach.toLocaleString()}</div>
          <div className="l">총 도달 (7일차 수동 집계)</div>
        </div>
        <div className="card kpi">
          <div className="v">{fgi?.responses ?? '—'}</div>
          <div className="l">FGI 응답 수</div>
        </div>
        <div className="card kpi">
          <div className="v">{countries.length}</div>
          <div className="l">참여 국가</div>
        </div>
      </div>
      <div className="note">도달·좋아요는 업로드 7일차에 수동 수집됩니다 (metricsSource: manual)</div>

      <h2 className="section">위클리 발견</h2>
      {findings.map((f) => (
        <div className="finding" key={f.week}>
          <span className="tag">WEEKLY FINDING · {f.week}</span>
          <p>{f.text}</p>
        </div>
      ))}

      {/* 2. Quantitative FGI */}
      {fgi ? (
        <>
          <h2 className="section">
            FGI 정량 결과<small>구매의향·가격·경쟁력 1~5점 설문 (n={fgi.responses})</small>
          </h2>
          <div className="fgiGrid">
            <GaugeCard score={fgi.overallScore} />
            <div className="card intentCard">
              <div className="v">{fgi.purchaseIntentRate}%</div>
              <div className="kpi l">구매 전환 의향 (4점 이상)</div>
              <div className="sub">적정가 중앙값 ${fgi.fairPriceUsdMedian}</div>
            </div>
            <div className="card" style={{ minHeight: 220 }}>
              <div style={{ height: 90 }}>
                <Bar data={quantBar} options={barOpts} />
              </div>
              <div style={{ fontSize: 12, color: '#6b675e', margin: '10px 0 4px' }}>
                적정가 응답 분포 (USD)
              </div>
              <div style={{ height: 80 }}>
                <Bar data={priceBar} options={barOpts} />
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* 국가 스코어보드 */}
      <h2 className="section">국가 스코어보드</h2>
      <table className="board">
        <thead>
          <tr>
            <th>국가</th>
            <th>이행 (업로드/시딩)</th>
            <th>평균 루브릭</th>
            <th>평균 도달</th>
            <th>업로드 소요</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((c) => (
            <tr key={c.country}>
              <td style={{ fontWeight: 800 }}>{c.country}</td>
              <td>
                <span className="bar">
                  <i style={{ width: `${(c.uploaded / c.quota) * 100}%` }} />
                </span>
                <span>
                  {c.uploaded}/{c.quota}
                </span>
              </td>
              <td>{c.avgScore}</td>
              <td>{c.avgViews.toLocaleString()}</td>
              <td>{c.avgDaysToUpload}일</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 3. Qualitative FGI */}
      {fgi ? (
        <>
          <h2 className="section">
            정성 피드백<small>현지 언어 원문 — 자주 등장한 키워드</small>
          </h2>
          <div className="kw" style={{ marginBottom: 12 }}>
            {fgi.keywords.positive.map((k) => (
              <span className="pos" key={k}>
                {k}
              </span>
            ))}
            {fgi.keywords.negative.map((k) => (
              <span className="neg" key={k}>
                {k}
              </span>
            ))}
          </div>
          <div className="qual">
            {qual.map((q) => (
              <div className="card" key={q.id}>
                <div className="who">
                  @{q.reviewer} <span className="country">· {q.country}</span>
                </div>
                <p className="pros">{q.pros}</p>
                <p className="cons">{q.cons}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* 4. UGC Gallery */}
      <h2 className="section">
        UGC 갤러리<small>원본 HD는 담당 매니저가 전달</small>
      </h2>
      <div className="gallery">
        {reviews.map((r) => (
          <div className="card" key={r.id} style={{ padding: 12 }}>
            <img className="thumb" src={r.thumbnailUrl} alt={r.reviewer} />
            <div className="who">@{r.reviewer}</div>
            <div className="meta">
              {r.country} · {r.followerBand} · {r.views7d.toLocaleString()} views ·{' '}
              {r.productionStyle}
            </div>
            <a className="hd" href={r.platformUrl} target="_blank" rel="noreferrer">
              게시물 보기 ↗
            </a>
          </div>
        ))}
      </div>

      {/* 5. 2차 CTA */}
      <div
        className="cta no-print"
        onClick={() => alert('담당 매니저가 2차 캠페인 견적을 보내드릴게요.')}
      >
        <b>
          이행률 {countries.length ? Math.round((countries[0].uploaded / countries[0].quota) * 100) : 0}
          % {countries[0]?.country} — 2차 공구 캠페인 견적 보기
        </b>
        <span className="arrow">→</span>
      </div>

      <footer>
        greyd for Brands · ARBAIM INC. · 본 리포트의 정량 수치는 FGI 설문(n={fgi?.responses}) 및
        수동 수집 SNS 지표 기준입니다.
      </footer>
    </div>
  );
}

export default function App() {
  const [brand, setBrand] = useState(() => {
    const brandId = sessionStorage.getItem('brandId');
    const brandName = sessionStorage.getItem('brandName');
    return brandId ? { brandId, brandName } : null;
  });
  if (!brand) {
    return <Gate onEnter={setBrand} />;
  }
  return <Dashboard brand={brand} />;
}

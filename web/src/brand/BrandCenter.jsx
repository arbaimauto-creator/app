// 브랜드 파트너센터 — #brand. 공동구매 현황 · 명단·송장 · 월 정산 · 상품 진행 요청.
// 명단(개인정보)은 결제 완료 후에만 서버가 내려준다(released). 화면은 그 값을 그대로 따른다.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from './api.js';
import { termsLabel } from './settlement.js';
import './brand.css';

const VIEWS = [
  { id: 'home', label: '요약', group: '운영', icon: 'M4 10.5 12 4l8 6.5V20H4zM10 20v-5h4v5' },
  { id: 'groupbuys', label: '공동구매', group: '운영', icon: 'M3 20h18M6 16v-5M11 16V6M16 16v-8' },
  { id: 'orders', label: '주문·배송', group: '운영', icon: 'M2.5 6.5h11v10h-11zM13.5 9.5h4l3 3.5v3.5h-7M6.5 19a1.6 1.6 0 1 0 0-.01M16.5 19a1.6 1.6 0 1 0 0-.01' },
  { id: 'settle', label: '정산', group: '정산 · 상품', icon: 'M5 3h14v18l-2.3-1.5L14.3 21 12 19.5 9.7 21l-2.4-1.5L5 21zM9 8h6M9 12h6' },
  { id: 'products', label: '상품 진행 요청', group: '정산 · 상품', icon: 'M20.5 7.5 12 3 3.5 7.5 12 12zM3.5 7.5v9L12 21l8.5-4.5v-9M12 12v9' },
];

function parseRoute() {
  const m = /^#brand\/?([a-z]*)\/?([a-z0-9-]*)/.exec(window.location.hash);
  const view = VIEWS.some((v) => v.id === m?.[1]) ? m[1] : 'home';
  return { view, code: m?.[2] || null };
}

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);
const Pill = ({ map, k }) => (map[k] ? <span className={`pill ${map[k][1]}`}>{map[k][0]}</span> : null);

function Life({ state }) {
  const idx = api.lifeIndex(state);
  if (idx === null) {
    return <Pill map={api.GB_STATE_LABEL} k={state} />;
  }
  const cls = (k) => (k < idx ? 'd' : k === idx ? 'n' : '');
  return (
    <div>
      <div className="life">
        {api.LIFE_STEPS.map((s, k) => (
          <i key={s} className={cls(k)} />
        ))}
      </div>
      <div className="lifel">
        {api.LIFE_STEPS.map((s, k) => (
          <span key={s} className={cls(k)}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet card${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="ch">
          <h2>{title}</h2>
          <button className="btn ghost" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file, 'utf-8');
  });

const errText = (e) =>
  ({
    not_released: '아직 명단이 열리지 않은 공동구매예요.',
    invalid_tracking: '송장번호 형식을 확인해주세요.',
    not_cancellable: '이미 마감된 공동구매는 취소할 수 없어요.',
    not_found: '찾을 수 없어요. 새로고침해주세요.',
  })[e?.code] || (e?.status === 401 ? '접속이 만료됐어요. 담당자에게 새 링크를 요청해주세요.' : '잠시 후 다시 시도해주세요.');

// ── 요약 ────────────────────────────────────────────────────────────
function Home({ gbs, rosters, settlements, go }) {
  const active = gbs.filter((g) => !api.ENDED_STATES.includes(g.state));
  const open = gbs.filter((g) => g.state === 'OPEN');
  const toShip = gbs
    .filter((g) => api.RELEASED_STATES.includes(g.state) && rosters[g.code])
    .map((g) => ({ g, n: rosters[g.code].orders.filter((o) => o.state === 'PAID').length }))
    .filter((x) => x.n > 0);
  const toShipTotal = toShip.reduce((a, x) => a + x.n, 0);
  // 지급 예정 정산이 없으면(지급일 당일 이후) 가장 최근 정산서를 보여준다
  const next = settlements?.find((s) => s.state === 'PLANNED') || settlements?.[settlements.length - 1];
  const recentPaid = (settlements || []).filter((s) => s.state === 'PAID').slice(-4);

  const todos = [
    ...toShip.map(({ g, n }) => ({
      hot: true,
      title: `송장 입력 ${n}건`,
      sub: `${g.product.name} · ${api.fmtDate(g.shipBy)}까지`,
      action: '입력',
      to: ['orders', g.code],
    })),
    ...gbs
      .filter((g) => g.state === 'PENDING_HOST')
      .map((g) => ({ hot: false, title: '호스트 수락 대기', sub: `${g.product.name} · @${g.host.handle}`, action: '보기', to: ['groupbuys', g.code] })),
    ...(next?.state === 'PLANNED' ? [{ hot: false, title: `${api.fmtDate(next.payoutDate)} 정산 예정`, sub: api.money(next.payout), action: '정산서', to: ['settle'] }] : []),
  ];

  return (
    <>
      <div className="hero">
        <div className="l">
          {next ? (
            <>
              <div className="eyebrow">{running(next) ? '이번 달 정산 예정 · 집계 중' : next.state === 'PLANNED' ? '다음 정산 예정' : '최근 정산 · 지급 완료'}</div>
              <div className="amt num">
                {api.int(next.payout)}
                <small>원</small>
              </div>
              <div className="due">
                <b>{api.fmtDate(next.payoutDate)}</b> 지급 · {api.fmtMonth(next.periodStart)} 결제 완료분{running(next) ? ' (오늘까지 집계)' : ''}
              </div>
              <Fall s={next} dark />
            </>
          ) : (
            <>
              <div className="eyebrow">진행 중 공동구매</div>
              <div className="amt num">
                {active.length}
                <small>건</small>
              </div>
              <div className="due">정산 내역은 첫 결제 완료 후 표시됩니다</div>
            </>
          )}
        </div>
        <div className="r">
          <div className="stats">
            <div>
              <small>모집 중 예약 수량</small>
              <b className="num">
                {api.int(open.reduce((a, g) => a + g.reservedQuantity, 0))}
                <em>개</em>
              </b>
              <span>모집 중 {open.length}건</span>
            </div>
            <div>
              <small>진행 중 공동구매</small>
              <b className="num">
                {active.length}
                <em>건</em>
              </b>
              <span>완료 {gbs.filter((g) => g.state === 'DONE').length}건</span>
            </div>
            <div>
              <small>발송 대기</small>
              <b className="num" style={{ color: toShipTotal ? 'var(--accent)' : undefined }}>
                {toShipTotal}
                <em>건</em>
              </b>
              <span>{toShip[0] ? `${api.fmtDate(toShip[0].g.shipBy)}까지` : '대기 없음'}</span>
            </div>
            <div>
              <small>{recentPaid.length ? `최근 ${recentPaid.length}개월 정산` : '정산'}</small>
              <b className="num">
                {recentPaid.length ? (recentPaid.reduce((a, s) => a + s.payout, 0) / 1e8).toFixed(2) : '—'}
                {recentPaid.length ? <em>억원</em> : null}
              </b>
              <span>월 1회 지급</span>
            </div>
          </div>
        </div>
      </div>

      <div className="g two" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="ch">
            <div>
              <h2>진행 중 공동구매</h2>
              <div className="s">개설부터 발송까지, 지금 어느 단계인지</div>
            </div>
            <button className="btn ghost" onClick={() => go('groupbuys')}>
              전체 보기 →
            </button>
          </div>
          {active.length === 0 ? <p className="empty">진행 중인 공동구매가 없어요.</p> : null}
          <div className="gbs">
            {active.map((g, i) => (
              <button className="gb" key={g.code} onClick={() => go('groupbuys', g.code)}>
                <div className="prod">
                  <Swatch i={i} name={g.product.name} />
                  <div>
                    <b>{g.product.name}</b>
                    <span>
                      @{g.host.handle} · {api.fmtDate(g.startsAt)}–{api.fmtDate(g.endsAt)}
                    </span>
                  </div>
                </div>
                <div className="lifewrap">
                  <Life state={g.state} />
                </div>
                <div className="right">
                  <b className="num">{g.state === 'OPEN' ? `${Math.round(api.fillRatio(g) * 100)}%` : api.int(g.reservedQuantity)}</b>
                  <span className="num">{g.state === 'OPEN' ? `${api.int(g.reservedQuantity)}/${api.int(g.maxQuantity || g.minQuantity)}` : '예약 수량'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="ch">
            <div>
              <h2>지금 할 일</h2>
              <div className="s">처리하면 목록에서 빠집니다</div>
            </div>
          </div>
          {todos.length === 0 ? <p className="empty">처리할 일이 없어요.</p> : null}
          <div className="todo">
            {todos.map((t, i) => (
              <div className={`td${t.hot ? ' hot' : ''}`} key={i}>
                <div>
                  <b>{t.title}</b>
                  <span>{t.sub}</span>
                </div>
                <button className={`btn${t.hot ? '' : ' ghost'}`} onClick={() => go(...t.to)}>
                  {t.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const SW = ['#F4C9A0', '#CFE0D2', '#D9D3EC', '#F0D9C4', '#E6E1A8'];
const Swatch = ({ i, name }) => (
  <div className="sw" style={{ background: SW[i % SW.length] }} aria-hidden="true">
    {name.replace(/\s/g, '').slice(0, 2)}
  </div>
);

function Fall({ s, dark }) {
  const parts = [
    ['지급액', s.payout, 'var(--accent)'],
    ['인플루언서 수수료', s.hostIncentive, dark ? 'var(--on-ink2)' : 'var(--fg2)'],
    ['운영 수수료', s.fees, dark ? 'color-mix(in srgb,var(--on-ink2) 60%,var(--ink))' : 'var(--fg3)'],
    ['배송비', s.shipping, dark ? 'color-mix(in srgb,var(--on-ink2) 35%,var(--ink))' : 'var(--line2)'],
    ['반품·환불', s.refunds, dark ? 'var(--ink-line)' : 'var(--line)'],
  ].filter(([, v], i) => i === 0 || v > 0);
  return (
    <div className="fall">
      <div className="fbar">
        {parts.map(([n, v, c]) => (
          <i key={n} style={{ width: `${(v / s.gross) * 100}%`, background: c }} title={`${n} ${api.int(v)}원`} />
        ))}
      </div>
      <div className="leg">
        <span>
          정산 대상 <em className="num">{api.int(s.gross)}</em>
        </span>
        {parts.map(([n, v, c]) => (
          <span key={n}>
            <i style={{ background: c }} />
            {n} <em className="num">{api.int(v)}</em>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 공동구매 ────────────────────────────────────────────────────────
const GB_FILTERS = [
  ['all', '전체', () => true],
  ['live', '진행 중', (g) => !api.ENDED_STATES.includes(g.state)],
  ['ship', '발송', (g) => ['CONFIRMED', 'SHIPPING'].includes(g.state)],
  ['ended', '종료', (g) => api.ENDED_STATES.includes(g.state)],
];

function GroupBuys({ gbs, code, go, onCancel }) {
  const [f, setF] = useState('all');
  const sel = gbs.find((g) => g.code === code) || null;
  const rows = gbs.filter(GB_FILTERS.find((x) => x[0] === f)[2]);
  return (
    <>
      <div className="card">
        <div className="ch">
          <div>
            <h2>공동구매 목록</h2>
            <div className="s">
              {gbs.length}건 · 진행 중 {gbs.filter(GB_FILTERS[1][2]).length}건
            </div>
          </div>
          <div className="seg">
            {GB_FILTERS.map(([id, label]) => (
              <button key={id} aria-pressed={f === id} onClick={() => setF(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>상품 · 호스트</th>
                <th>기간</th>
                <th className="r">공동구매가</th>
                <th className="r">예약 / 목표</th>
                <th>진행</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g, i) => (
                <tr key={g.code} className={`click${sel?.code === g.code ? ' on' : ''}`} onClick={() => go('groupbuys', g.code)}>
                  <td>
                    <div className="prod">
                      <Swatch i={i} name={g.product.name} />
                      <div>
                        <b>{g.product.name}</b>
                        <span>
                          @{g.host.handle} · {g.country === 'JP' ? '일본' : '국내'} · <span className="num">{g.code}</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="num nw">
                    {api.fmtDate(g.startsAt)}–{api.fmtDate(g.endsAt)}
                  </td>
                  <td className="r num">{api.money(g.price, g.currency)}</td>
                  <td className="r num nw">
                    {api.int(g.reservedQuantity)} / {g.maxQuantity ? api.int(g.maxQuantity) : `최소 ${api.int(g.minQuantity)}`}
                  </td>
                  <td style={{ minWidth: 140 }}>
                    <div className="mrow">
                      <div className={`meter${g.state === 'DONE' ? ' acc' : ''}`}>
                        <i style={{ width: `${api.fillRatio(g) * 100}%` }} />
                      </div>
                      <small className="num">{Math.round(api.fillRatio(g) * 100)}%</small>
                    </div>
                  </td>
                  <td>
                    <Pill map={api.GB_STATE_LABEL} k={g.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {sel ? (
        <Modal title={sel.product.name} onClose={() => go('groupbuys')}>
          <div className="eyebrow" style={{ marginTop: -8 }}>
            {sel.code} · {sel.openedBy === 'ARBAIM' ? '아르바임 개설' : '브랜드 개설'}
          </div>
          <div style={{ margin: '16px 0 18px' }}>
            <Life state={sel.state} />
          </div>
          <dl className="kv">
            <dt>상태</dt>
            <dd>
              <Pill map={api.GB_STATE_LABEL} k={sel.state} />
            </dd>
            <dt>호스트</dt>
            <dd>@{sel.host.handle}</dd>
            <dt>판매 국가</dt>
            <dd>{sel.country === 'JP' ? '일본 (JPY)' : '국내 (KRW)'}</dd>
            <dt>공동구매가 · 정가</dt>
            <dd className="num">
              {api.money(sel.price, sel.currency)} · {api.money(sel.product.listPrice, 'KRW')}
            </dd>
            <dt>배송비</dt>
            <dd className="num">{api.money(sel.shippingFee, sel.currency)}</dd>
            <dt>최소 · 최대 수량</dt>
            <dd className="num">
              {api.int(sel.minQuantity)} · {sel.maxQuantity ? api.int(sel.maxQuantity) : '제한 없음'}
            </dd>
            <dt>옵션</dt>
            <dd>{sel.options.length ? sel.options.join(' · ') : '없음'}</dd>
            <dt>모집 기간</dt>
            <dd className="num">
              {sel.startsAt ? api.fmtDateTime(sel.startsAt) : '—'} – {sel.endsAt ? api.fmtDateTime(sel.endsAt) : '—'}
            </dd>
            <dt>발송 예정일</dt>
            <dd className="num">{sel.shipBy ? api.fmtDate(sel.shipBy) : '—'}</dd>
            <dt>예약 수량</dt>
            <dd className="num">
              {api.int(sel.reservedQuantity)}개 · {api.int(sel.orderCount)}건
            </dd>
            <dt>정산 조건</dt>
            <dd>
              {termsLabel(sel.settlement)}
              <div className="addr">반품은 환불 후 정산에서 차감 · 조건은 공동구매마다 담당자와 협의해 정합니다</div>
            </dd>
          </dl>
          {sel.state === 'FAILED' ? <p className="note">최소 수량에 못 미쳐 결제 없이 종료됐어요. 구매자 카드는 청구되지 않았습니다.</p> : null}
          <div className="actions">
            {api.CANCELLABLE_STATES.includes(sel.state) ? (
              <button className="btn danger" onClick={() => onCancel(sel)}>
                공동구매 취소
              </button>
            ) : null}
            {sel.state !== 'CANCELLED' && sel.state !== 'FAILED' && sel.state !== 'PENDING_HOST' ? (
              <button className="btn pri" onClick={() => go('orders', sel.code)}>
                주문·배송 보기
              </button>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}

// ── 주문·배송 ────────────────────────────────────────────────────────
function Orders({ gbs, code, go, roster, reload, toast }) {
  const candidates = gbs.filter((g) => !['PENDING_HOST', 'CANCELLED', 'FAILED'].includes(g.state));
  const gb = candidates.find((g) => g.code === code) || candidates.find((g) => ['CONFIRMED', 'SHIPPING'].includes(g.state)) || candidates[0];
  const [f, setF] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [sel, setSel] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setDrafts({});
    setSel(new Set());
    setF('all');
  }, [gb?.code]);

  if (!gb) {
    return <p className="empty card">주문을 볼 공동구매가 없어요.</p>;
  }
  if (!roster) {
    return <p className="empty card">불러오는 중…</p>;
  }

  const { released, summary, orders } = roster;
  const ordersById = new Map(orders.map((o) => [o.id, o]));
  const pending = orders.filter((o) => o.state === 'PAID');
  const shipped = orders.length - pending.length;
  const rows = orders.filter((o) => f === 'all' || o.state === f);
  const defaultCourier = gb.country === 'JP' ? 'YAMATO' : 'CJ';
  const draftOf = (o) => drafts[o.id] || { courier: o.shipment?.courier || defaultCourier, tracking: o.shipment?.trackingNumber || '' };
  const setDraft = (id, patch) => setDrafts((d) => ({ ...d, [id]: { ...draftOf(ordersById.get(id)), ...patch } }));
  const dd = api.dday(gb.shipBy);

  async function saveMany(items) {
    setBusy(true);
    let ok = 0;
    const failed = [];
    for (const it of items) {
      try {
        await api.setShipment(it.orderId, it.courier, it.trackingNumber);
        ok++;
      } catch (e) {
        failed.push(`${it.orderId}: ${errText(e)}`);
      }
    }
    setBusy(false);
    await reload(gb.code);
    setDrafts({});
    setSel(new Set());
    toast(failed.length ? `${ok}건 저장 · ${failed.length}건 실패 (${failed[0]})` : `${ok}건 송장을 저장했어요`);
    return failed;
  }

  function saveOne(o) {
    const d = draftOf(o);
    if (d.courier !== 'OTHER' && !api.isValidTracking(d.tracking)) {
      toast('송장번호는 영문·숫자 6–30자예요');
      return;
    }
    saveMany([{ orderId: o.id, courier: d.courier, trackingNumber: d.tracking }]);
  }

  function saveSelected() {
    const items = [...sel].map((id) => ({ orderId: id, ...draftOf(ordersById.get(id)) }));
    const bad = items.filter((it) => it.courier !== 'OTHER' && !api.isValidTracking(it.tracking));
    if (bad.length) {
      toast(`송장번호가 비었거나 형식이 틀린 주문 ${bad.length}건이 있어요`);
      document.getElementById(`trk-${bad[0].orderId}`)?.focus();
      return;
    }
    saveMany(items.map((it) => ({ orderId: it.orderId, courier: it.courier, trackingNumber: it.tracking })));
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) {
      return;
    }
    if (!/\.csv$/i.test(file.name)) {
      toast('CSV 파일만 올릴 수 있어요. 엑셀에서 "CSV UTF-8"로 저장해주세요');
      return;
    }
    const rows = api.parseTrackingCsv(await readFile(file), ordersById, gb.country);
    setUpload({ name: file.name, rows });
  }

  const allPendingSelected = pending.length > 0 && pending.every((o) => sel.has(o.id));
  const toggleAll = () => setSel(allPendingSelected ? new Set() : new Set(pending.map((o) => o.id)));
  const toggle = (id) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <>
      <div className="seg picker">
        {candidates.map((g) => (
          <button key={g.code} aria-pressed={g.code === gb.code} onClick={() => go('orders', g.code)}>
            {g.product.name}
          </button>
        ))}
      </div>

      {!released ? (
        <div className="card locked" style={{ marginTop: 12 }}>
          <div className="eyebrow">명단 공개 전</div>
          <h2>결제가 끝나면 주문 명단이 열려요</h2>
          <p>
            모집 마감 후 등록 카드로 일괄 결제가 끝나면 받는 분 정보가 공개됩니다. 지금은 예약 숫자만 볼 수 있어요.
          </p>
          <div className="strip" style={{ marginTop: 16 }}>
            <div>
              <small>예약 수량</small>
              <b className="num">
                {api.int(gb.reservedQuantity)}
                <em>개</em>
              </b>
              <span>{api.int(summary.reserved || gb.orderCount)}건</span>
            </div>
            <div>
              <small>목표 · 최대</small>
              <b className="num">
                {api.int(gb.maxQuantity || gb.minQuantity)}
                <em>개</em>
              </b>
              <span>최소 {api.int(gb.minQuantity)}개</span>
            </div>
            <div>
              <small>모집 마감</small>
              <b className="num">{api.fmtDate(gb.endsAt)}</b>
              <span>{gb.state === 'CLOSED' ? '결제 진행 중' : `D-${Math.max(0, api.dday(gb.endsAt))}`}</span>
            </div>
            <div>
              <small>발송 예정일</small>
              <b className="num">{api.fmtDate(gb.shipBy)}</b>
              <span>물량 준비 기준</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="ship" style={{ marginTop: 12 }}>
            <div>
              <div className="eyebrow">송장 입력</div>
              <div className="big num">
                {shipped}
                <em>/{orders.length}</em>
              </div>
            </div>
            <div>
              <div className="track">
                <i style={{ width: `${orders.length ? (shipped / orders.length) * 100 : 0}%` }} />
              </div>
              <div className="lab">
                <span>
                  결제 완료 {orders.length}건{summary.failed ? ` · 결제 실패 ${summary.failed}건(명단 제외)` : ''}
                </span>
                <span>남은 {pending.length}건</span>
              </div>
            </div>
            <div className="dl">
              <b className="num">{api.fmtDate(gb.shipBy)}</b>
              <span className={dd !== null && dd <= 1 && pending.length ? 'hot' : ''}>
                {pending.length === 0 ? '발송 완료' : dd === null ? '발송 예정일 미정' : dd >= 0 ? `D-${dd} 발송 마감` : `${-dd}일 지남`}
              </span>
            </div>
          </div>

          <div className="g two" style={{ marginTop: 14, gridTemplateColumns: 'minmax(0,1fr) 290px' }}>
            <div className="card">
              <div className="ch">
                <div>
                  <h2>주문 명단</h2>
                  <div className="s">배송 목적으로만 쓰며, 조회·내려받기 기록이 남습니다</div>
                </div>
                <div className="tools">
                  <button className="btn" onClick={() => download(`${gb.code}_명단.csv`, api.ordersToCsv(orders))}>
                    명단 CSV
                  </button>
                  <button className="btn" disabled={!pending.length} onClick={() => download(`${gb.code}_송장양식.csv`, api.trackingTemplateCsv(pending))}>
                    송장 양식
                  </button>
                  <button className="btn ink" disabled={!pending.length && !orders.length} onClick={() => fileRef.current?.click()}>
                    송장 일괄 업로드
                  </button>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
                </div>
              </div>
              <div className="seg" style={{ marginBottom: 12 }}>
                {[
                  ['all', `전체 ${orders.length}`],
                  ['PAID', `발송 대기 ${pending.length}`],
                  ['SHIPPED', `발송 완료 ${shipped}`],
                ].map(([id, label]) => (
                  <button key={id} aria-pressed={f === id} onClick={() => setF(id)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="tw">
                <table className="orders">
                  <thead>
                    <tr>
                      <th style={{ width: 28 }}>
                        <input type="checkbox" className="cb" checked={allPendingSelected} disabled={!pending.length} onChange={toggleAll} aria-label="발송 대기 전체 선택" />
                      </th>
                      <th>주문번호</th>
                      <th>받는 분</th>
                      <th>옵션 · 수량</th>
                      <th>택배사 · 송장번호</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((o) => {
                      const d = draftOf(o);
                      return (
                        <tr key={o.id}>
                          <td>
                            {o.state === 'PAID' ? (
                              <input type="checkbox" className="cb" checked={sel.has(o.id)} onChange={() => toggle(o.id)} aria-label={`${o.id} 선택`} />
                            ) : null}
                          </td>
                          <td className="num nw oid">{o.id}</td>
                          <td className="nw">
                            <b>{o.recipient.name}</b>
                            <div className="addr">
                              {o.recipient.address1.split(' ').slice(0, 2).join(' ')}
                              {o.recipient.memo ? ` · ${o.recipient.memo}` : ''}
                            </div>
                          </td>
                          <td className="nw">
                            {o.option || '—'} <span className="num">× {o.quantity}</span>
                          </td>
                          <td>
                            <div className="shipin">
                              <select className="inp" value={d.courier} onChange={(e) => setDraft(o.id, { courier: e.target.value })} aria-label="택배사">
                                {api.couriersFor(gb.country).map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.ko}
                                  </option>
                                ))}
                              </select>
                              <input
                                id={`trk-${o.id}`}
                                className="inp code"
                                value={d.tracking}
                                placeholder="송장번호"
                                inputMode="text"
                                onChange={(e) => setDraft(o.id, { tracking: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && saveOne(o)}
                                aria-label="송장번호"
                              />
                              <button className="btn" disabled={busy || (!drafts[o.id] && o.state === 'SHIPPED')} onClick={() => saveOne(o)}>
                                {o.state === 'SHIPPED' ? '수정' : '저장'}
                              </button>
                            </div>
                          </td>
                          <td>
                            <Pill map={api.ORDER_STATE_LABEL} k={o.state} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {sel.size ? (
                <div className="bulk">
                  <span>{sel.size}건 선택</span>
                  <div className="tools">
                    <select
                      className="inp dark"
                      aria-label="선택한 주문 택배사 일괄 지정"
                      defaultValue=""
                      onChange={(e) => {
                        const c = e.target.value;
                        if (c) {
                          setDrafts((prev) => {
                            const n = { ...prev };
                            sel.forEach((id) => (n[id] = { ...draftOf(ordersById.get(id)), courier: c }));
                            return n;
                          });
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">택배사 일괄 지정</option>
                      {api.couriersFor(gb.country).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.ko}
                        </option>
                      ))}
                    </select>
                    <button className="btn" onClick={() => setSel(new Set())}>
                      선택 해제
                    </button>
                    <button className="btn pri" disabled={busy} onClick={saveSelected}>
                      {busy ? '저장 중…' : '선택한 주문 송장 저장'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="g" style={{ alignContent: 'start' }}>
              <div className="card">
                <div className="ch">
                  <div>
                    <h2>옵션별 수량</h2>
                    <div className="s">포장 준비용 합계</div>
                  </div>
                </div>
                <OptionTotals orders={orders} />
              </div>
              <div className="card sunk">
                <div className="ch">
                  <h2>송장 일괄 업로드</h2>
                </div>
                <ol className="howto">
                  <li>
                    <b>송장 양식</b>을 내려받으면 발송 대기 주문번호가 채워져 있어요.
                  </li>
                  <li>택배사 · 송장번호 열을 채워 CSV(UTF-8)로 저장하세요.</li>
                  <li>
                    <b>송장 일괄 업로드</b>로 올리면 저장 전에 오류를 먼저 보여드려요.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}

      {upload ? (
        <UploadPreview
          upload={upload}
          busy={busy}
          onClose={() => setUpload(null)}
          onApply={async (items) => {
            await saveMany(items);
            setUpload(null);
          }}
        />
      ) : null}
    </>
  );
}

function OptionTotals({ orders }) {
  const t = api.optionTotals(orders);
  const total = t.reduce((a, x) => a + x.quantity, 0);
  return (
    <>
      {t.map((x) => (
        <div className="opt" key={x.option}>
          <b>{x.option}</b>
          <div className="q num">{api.int(x.quantity)}개</div>
          <span>주문 {x.orders}건</span>
          <span />
          <div className="obar">
            <i style={{ width: `${total ? (x.quantity / total) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
      <div className="opt">
        <b>합계</b>
        <div className="q num" style={{ color: 'var(--accent-ink)' }}>
          {api.int(total)}개
        </div>
        <span>결제 완료 {orders.length}건</span>
      </div>
    </>
  );
}

function UploadPreview({ upload, busy, onClose, onApply }) {
  const ok = upload.rows.filter((r) => !r.error);
  const bad = upload.rows.filter((r) => r.error);
  return (
    <Modal title="송장 업로드 확인" onClose={onClose} wide>
      <p className="s" style={{ marginTop: -6 }}>
        {upload.name} · {upload.rows.length}행
      </p>
      <div className="strip mini">
        <div>
          <small>저장 가능</small>
          <b className="num">
            {ok.length}
            <em>건</em>
          </b>
        </div>
        <div className={bad.length ? 'hot' : ''}>
          <small>확인 필요</small>
          <b className="num">
            {bad.length}
            <em>건</em>
          </b>
        </div>
      </div>
      {bad.length ? (
        <div className="tw" style={{ marginTop: 14, maxHeight: 220, overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>행</th>
                <th>주문번호</th>
                <th>문제</th>
              </tr>
            </thead>
            <tbody>
              {bad.map((r) => (
                <tr key={r.line}>
                  <td className="num">{r.line}</td>
                  <td className="num">{r.orderId || '—'}</td>
                  <td>{r.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="note">확인 필요 행은 저장하지 않아요. 파일을 고쳐 다시 올리면 됩니다. 이미 발송된 주문은 송장이 새 값으로 바뀝니다.</p>
      <div className="actions">
        <button className="btn" onClick={onClose}>
          취소
        </button>
        <button className="btn pri" disabled={!ok.length || busy} onClick={() => onApply(ok)}>
          {busy ? '저장 중…' : `${ok.length}건 저장`}
        </button>
      </div>
    </Modal>
  );
}

// ── 정산 ────────────────────────────────────────────────────────────
// 진행 중인 달 — 금액이 아직 늘어나는 중
const running = (s) => new Date(s.periodEnd).getTime() > Date.now();
function Settle({ settlements }) {
  const [cur, setCur] = useState(null);
  if (settlements === undefined) {
    return <p className="empty card">불러오는 중…</p>;
  }
  if (settlements === null) {
    return (
      <div className="card locked">
        <div className="eyebrow">준비 중</div>
        <h2>월 정산서는 서버 연결 후 열립니다</h2>
        <p>매월 결제 완료분 기준 정산 내역이 이 화면에 표시됩니다. 그 전까지 정산 내역은 담당자에게 문의해주세요.</p>
      </div>
    );
  }
  if (!settlements.length) {
    return <p className="empty card">아직 정산 내역이 없어요. 첫 결제 완료 달의 다음 정산일에 표시됩니다.</p>;
  }
  const idx = cur ?? settlements.length - 1;
  const s = settlements[idx];
  const max = Math.max(...settlements.map((x) => x.payout));
  return (
    <>
      <div className="g two" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)' }}>
        <div className="card">
          <div className="ch">
            <div>
              <h2>월별 지급액</h2>
              <div className="s">막대를 누르면 정산서가 바뀝니다</div>
            </div>
            <div className="legend">
              <span>
                <i style={{ background: 'var(--fg)' }} />
                지급 완료
              </span>
              <span>
                <i style={{ background: 'var(--accent)' }} />
                선택
              </span>
            </div>
          </div>
          <div className="wk">
            {settlements.map((x, i) => (
              <button key={x.id} className={`${x.state === 'PAID' ? 'paid' : ''} ${i === idx ? 'on' : ''}`} aria-pressed={i === idx} onClick={() => setCur(i)}>
                <b className="num">{(x.payout / 1e6).toFixed(1)}M</b>
                <i style={{ height: Math.max(6, Math.round((x.payout / max) * 110)) }} />
                <span className="num">{new Date(x.periodStart).getMonth() + 1}월</span>
              </button>
            ))}
          </div>
          <p className="note">
            매월 1일~말일 {settlements.contract?.basis === 'SHIPPED' ? '발송 완료' : '결제 완료'}분을 익월 {settlements.contract?.payoutDay ?? 10}일에 지급합니다. 창고형은 공급가 × 판매 수량, 인스타 공구는 판매 금액에서 인플루언서 · 운영 수수료를 뺀 금액이며, 반품은 환불 후 차감합니다. 진행 중인 달은 오늘까지 집계한 금액입니다.
          </p>
        </div>
        <Receipt s={s} />
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="ch">
          <div>
            <h2>정산 내역</h2>
            <div className="s">조건은 공동구매마다 다르며, 정산서에서 공동구매별 계산을 볼 수 있어요</div>
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>정산 월</th>
                <th className="r">정산 대상</th>
                <th className="r">차감 합계</th>
                <th className="r">지급액</th>
                <th>지급일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {[...settlements].reverse().map((x) => (
                <tr key={x.id} className="click" onClick={() => setCur(settlements.indexOf(x))}>
                  <td className="nw">
                    <b>{api.fmtMonth(x.periodStart)}</b>
                    {running(x) ? <span className="addr"> · 집계 중</span> : null}
                  </td>
                  <td className="r num">{api.int(x.gross)}</td>
                  <td className="r num" style={{ color: 'var(--fg2)' }}>
                    −{api.int(x.gross - x.payout)}
                  </td>
                  <td className="r num">
                    <b>{api.int(x.payout)}</b>
                  </td>
                  <td className="num">{api.fmtDate(x.payoutDate)}</td>
                  <td>
                    <span className={`pill ${x.state === 'PAID' ? 'p-ok' : 'p-acc'}`}>{x.state === 'PAID' ? '지급 완료' : '지급 예정'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Receipt({ s }) {
  const row = (label, v, minus) => (
    <div className={`rc-row${minus ? ' minus' : ''}`}>
      <span>{label}</span>
      <b className="num">
        {minus ? '−' : ''}
        {api.int(v)}
      </b>
    </div>
  );
  return (
    <div>
      <div className="receipt">
        <div className="rc-hd">
          <div>
            <div className="eyebrow">월 정산서</div>
            <h3>{api.fmtMonth(s.periodStart)} 정산</h3>
          </div>
          <span className={`pill ${s.state === 'PAID' ? 'p-ok' : 'p-acc'}`}>{s.state === 'PAID' ? '지급 완료' : '지급 예정'}</span>
        </div>
        <div className="rc-meta num">
          판매 기간 {api.fmtDate(s.periodStart)}–{running(s) ? '오늘(집계 중)' : api.fmtDate(s.periodEnd)} · 지급일 {api.fmtDate(s.payoutDate)}
        </div>
        {row('정산 대상 금액', s.gross)}
        {s.refunds ? row('반품 · 환불', s.refunds, true) : null}
        {s.hostIncentive ? row('인플루언서 수수료', s.hostIncentive, true) : null}
        {s.fees ? row('운영 수수료', s.fees, true) : null}
        {s.shipping ? row('배송비 정산', s.shipping, true) : null}
        <div className="rc-sep" />
        <div className="rc-tot">
          <span>지급액</span>
          <b className="num">{api.money(s.payout, s.currency)}</b>
        </div>
        {s.lines.length ? (
          <>
            <div className="rc-sep" />
            <div className="eyebrow" style={{ margin: '6px 0 4px' }}>
              공동구매별 정산
            </div>
            {s.lines.map((l) => (
              <div className="rc-line" key={l.code + l.title}>
                <div className="rc-row small">
                  <span>
                    <b className="t">{l.title}</b>
                    <span className="addr">{termsLabel(l.terms)}</span>
                  </span>
                  <b className="num">{l.unset ? '조건 확인 중' : api.int(l.payout)}</b>
                </div>
                <div className="rc-sub num">
                  {l.terms.type === 'SUPPLY'
                    ? `판매 ${api.int(l.quantity)}개 × ${api.int(l.terms.supplyPrice)} = ${api.int(l.base)}`
                    : `판매 ${api.int(l.quantity)}개 · ${api.int(l.base)}${l.hostFee ? ` − 인플 ${api.int(l.hostFee)}` : ''}${l.platformFee ? ` − 운영 ${api.int(l.platformFee)}` : ''}`}
                  {l.refunds ? ` · 반품 ${api.int(l.returnedQuantity)}개 −${api.int(l.refunds)}` : ''}
                </div>
              </div>
            ))}
            {s.unset ? <p className="note">정산 조건이 아직 세팅되지 않은 공동구매가 있어요. 담당자가 확정하면 지급액에 반영됩니다.</p> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ── 상품 진행 요청 ──────────────────────────────────────────────────
const PR_STATE = {
  REVIEW: ['검토 중', 'p-info'],
  NEGOTIATING: ['조건 협의', 'p-acc'],
  APPROVED: ['진행 확정', 'p-ok'],
  REJECTED: ['진행 어려움', 'p-mute'],
};
const GOALS = { CLEARANCE: '재고 소진', TEST: '마켓 테스트' };
const toNum = (v) => parseInt(String(v || '').replace(/[^\d]/g, ''), 10) || 0;

function Products({ requests, onCreate, toast }) {
  const empty = { name: '', spec: '', quantity: '', expiresOn: '', supplyPrice: '', goal: 'CLEARANCE' };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(items) {
    setBusy(true);
    try {
      await onCreate(items);
      toast(`${items.length}개 상품을 검토 요청했어요 · 영업일 1일 안에 안내드려요`);
      return true;
    } catch (e) {
      toast(errText(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function ingest(file) {
    if (!file) {
      return;
    }
    if (!/\.csv$/i.test(file.name)) {
      toast('CSV 파일만 올릴 수 있어요. 엑셀에서 "CSV UTF-8"로 저장해주세요');
      return;
    }
    const lines = (await readFile(file)).replace(/^﻿/, '').split(/\r?\n/).map((l) => l.split(','));
    const items = lines
      .filter((c, i) => c[0]?.trim() && !(i === 0 && /상품/.test(c[0])))
      .map((c) => ({
        name: c[0].trim(),
        spec: (c[1] || '').trim(),
        quantity: toNum(c[2]),
        expiresOn: (c[3] || '').trim(),
        supplyPrice: toNum(c[4]),
        goal: /테스트/.test(c[5] || '') ? 'TEST' : 'CLEARANCE',
      }));
    if (!items.length) {
      toast('상품 행을 찾지 못했어요. 첫 열이 상품명인지 확인해주세요');
      return;
    }
    submit(items);
  }

  if (requests === null) {
    return (
      <div className="card locked">
        <div className="eyebrow">준비 중</div>
        <h2>상품 진행 요청은 서버 연결 후 열립니다</h2>
        <p>그 전까지는 상품 리스트(상품명 · 용량 · 보유 수량 · 유통기한 · 희망 공급가 · 목적)를 담당자에게 보내주세요.</p>
      </div>
    );
  }

  return (
    <>
      <div className="g two" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)' }}>
        <div className="card">
          <div
            className={`drop${over ? ' over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              ingest(e.dataTransfer.files?.[0]);
            }}
          >
            <b>상품 리스트 CSV를 끌어다 놓으세요</b>
            <p>열 순서: 상품명 · 용량 · 보유 수량 · 유통기한 · 희망 공급가 · 목적(소진/테스트)</p>
            <button className="btn ink" disabled={busy} onClick={() => fileRef.current?.click()}>
              파일 선택
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                ingest(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          <form
            className="form"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              if (!form.name.trim()) {
                toast('상품명을 입력해주세요');
                return;
              }
              const okd = await submit([
                { name: form.name.trim(), spec: form.spec.trim(), quantity: toNum(form.quantity), expiresOn: form.expiresOn, supplyPrice: toNum(form.supplyPrice), goal: form.goal },
              ]);
              if (okd) {
                setForm(empty);
              }
            }}
          >
            <h2 className="full" style={{ margin: '20px 0 2px' }}>
              한 개씩 등록
            </h2>
            <label className="field full">
              <span>상품명</span>
              <input value={form.name} onChange={set('name')} placeholder="예: 시카 진정 마스크팩 10매" />
            </label>
            <label className="field">
              <span>용량 · 구성</span>
              <input value={form.spec} onChange={set('spec')} placeholder="25ml × 10매" />
            </label>
            <label className="field">
              <span>보유 수량</span>
              <input value={form.quantity} onChange={set('quantity')} inputMode="numeric" placeholder="3,000" />
            </label>
            <label className="field">
              <span>유통기한</span>
              <input type="date" value={form.expiresOn} onChange={set('expiresOn')} />
            </label>
            <label className="field">
              <span>희망 공급가 (원)</span>
              <input value={form.supplyPrice} onChange={set('supplyPrice')} inputMode="numeric" placeholder="4,500" />
            </label>
            <div className="field full">
              <span>목적</span>
              <div className="radios">
                {Object.entries(GOALS).map(([k, v]) => (
                  <label key={k}>
                    <input type="radio" name="goal" checked={form.goal === k} onChange={() => setForm((f) => ({ ...f, goal: k }))} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div className="actions full">
              <button type="button" className="btn" onClick={() => setForm(empty)}>
                지우기
              </button>
              <button type="submit" className="btn pri" disabled={busy}>
                검토 요청
              </button>
            </div>
          </form>
        </div>
        <div className="card sunk">
          <div className="ch">
            <h2>진행 순서</h2>
          </div>
          <div className="steps">
            {[
              ['상품 접수', '리스트 업로드 또는 한 개씩 등록'],
              ['진행 가능 검토', '카테고리 · 수량 · 유통기한 확인, 영업일 1일'],
              ['판매 조건 협의', '공급가 · 수량 · 판매 채널 확정'],
              ['공동구매 개설', '호스트 지정 후 모집 일정 안내'],
              ['발송 · 정산', '송장 입력 후 월 1회 정산'],
            ].map(([t, d], i) => (
              <div className="stp" key={t}>
                <div className="dot num">{i + 1}</div>
                <div>
                  <b>{t}</b>
                  <span>{d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="ch">
          <div>
            <h2>요청한 상품</h2>
            <div className="s">{requests ? `${requests.length}개` : '불러오는 중…'}</div>
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>상품</th>
                <th className="r">보유 수량</th>
                <th>유통기한</th>
                <th className="r">희망 공급가</th>
                <th>목적</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {(requests || []).map((r) => {
                const soon = r.expiresOn && api.dday(r.expiresOn) !== null && api.dday(r.expiresOn) < 90;
                return (
                  <tr key={r.id}>
                    <td>
                      <b>{r.name}</b>
                      <div className="addr">{[r.spec, r.note].filter(Boolean).join(' · ') || '—'}</div>
                    </td>
                    <td className="r num">{r.quantity ? api.int(r.quantity) : '—'}</td>
                    <td className="num nw">
                      {r.expiresOn || '—'} {soon ? <span className="pill p-warn">임박</span> : null}
                    </td>
                    <td className="r num">{r.supplyPrice ? api.int(r.supplyPrice) : '—'}</td>
                    <td className="nw">{GOALS[r.goal] || '—'}</td>
                    <td>
                      <Pill map={PR_STATE} k={r.state} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── 셸 ──────────────────────────────────────────────────────────────
const TITLES = {
  home: ['SUMMARY', '요약', null],
  groupbuys: ['GROUP BUYS', '공동구매', '모집 상황과 조건을 확인하고, 시작 전이면 취소할 수 있어요.'],
  orders: ['ORDERS', '주문 · 배송', '결제가 끝난 주문만 명단이 열립니다. 발송 후 송장을 입력해주세요.'],
  settle: ['SETTLEMENT · MONTHLY', '정산', '공동구매마다 정한 조건(창고형 공급가 · 인스타 수수료율)으로 월 1회 정산해 지급합니다.'],
  products: ['PRODUCTS', '상품 진행 요청', '리스트를 보내면 담당자가 진행 가능 여부를 안내합니다.'],
};

export default function BrandCenter() {
  api.captureTokenFromHash();
  const [route, setRoute] = useState(parseRoute);
  const [gbs, setGbs] = useState(null);
  const [rosters, setRosters] = useState({});
  const [settlements, setSettlements] = useState(undefined);
  const [requests, setRequests] = useState(undefined);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const toast = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);

  useEffect(() => {
    const on = () => setRoute(parseRoute());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const go = useCallback((view, code) => {
    window.location.hash = `#brand/${view}${code ? `/${code}` : ''}`;
    window.scrollTo({ top: 0 });
  }, []);

  const loadRoster = useCallback(async (code) => {
    try {
      const r = await api.getOrders(code);
      setRosters((m) => ({ ...m, [code]: r }));
    } catch (e) {
      setError(errText(e));
    }
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const list = await api.listGroupBuys();
      setGbs(list);
      list.filter((g) => api.RELEASED_STATES.includes(g.state)).forEach((g) => loadRoster(g.code));
      if (route.view === 'orders' && route.code) {
        loadRoster(route.code);
      }
    } catch (e) {
      setError(errText(e));
      setGbs([]);
    }
    api.listSettlements().then(setSettlements, () => setSettlements(null));
    api.listProductRequests().then(setRequests, () => setRequests(null));
  }, [loadRoster, route.view, route.code]);

  useEffect(() => {
    if (api.getToken()) {
      loadAll();
    }
    // 첫 진입에만 — 이후는 각 화면이 필요한 것만 다시 부른다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 주문 화면에서 고른 공동구매 명단이 없으면 부른다
  const ordersGb = useMemo(() => {
    if (!gbs || route.view !== 'orders') {
      return null;
    }
    const c = gbs.filter((g) => !['PENDING_HOST', 'CANCELLED', 'FAILED'].includes(g.state));
    return c.find((g) => g.code === route.code) || c.find((g) => ['CONFIRMED', 'SHIPPING'].includes(g.state)) || c[0] || null;
  }, [gbs, route]);
  useEffect(() => {
    if (ordersGb && !rosters[ordersGb.code]) {
      loadRoster(ordersGb.code);
    }
  }, [ordersGb, rosters, loadRoster]);

  const reloadRoster = useCallback(
    async (code) => {
      await loadRoster(code);
      setGbs(await api.listGroupBuys());
    },
    [loadRoster],
  );

  if (!api.getToken()) {
    return (
      <div className="bc">
        <div className="gatebox card">
          <Mark />
          <h1>브랜드 파트너센터</h1>
          <p>담당자에게 받은 접속 링크로 들어와주세요. 링크는 브랜드 담당자 본인만 사용해주세요.</p>
        </div>
      </div>
    );
  }

  const pendingShip = Object.values(rosters).reduce((a, r) => a + r.orders.filter((o) => o.state === 'PAID').length, 0);
  const [crumb, title, sub] = TITLES[route.view];
  let group = null;

  return (
    <div className="bc">
      <div className="app">
        <aside className="rail">
          <div className="mark">
            <Mark />
            <div>
              <b>greyd</b>
              <small>PARTNER CENTER</small>
            </div>
          </div>
          <nav className="nav" aria-label="메뉴">
            {VIEWS.map((v) => {
              const head = v.group !== group ? (group = v.group) : null;
              return (
                <React.Fragment key={v.id}>
                  {head ? <div className="grp">{head}</div> : null}
                  <button aria-current={route.view === v.id ? 'page' : undefined} onClick={() => go(v.id)}>
                    <Icon d={v.icon} />
                    {v.label}
                    {v.id === 'orders' && pendingShip ? <span className="badge num">{pendingShip}</span> : null}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
          <div className="payday">
            <small>정산</small>
            <b>월 1회 · 결제 완료분 기준</b>
            {api.IS_MOCK ? (
              <button className="linkbtn" onClick={async () => (await api.resetMock(), window.location.reload())}>
                예시 데이터 처음으로
              </button>
            ) : (
              <button className="linkbtn" onClick={() => (api.signOut(), window.location.reload())}>
                접속 종료
              </button>
            )}
          </div>
        </aside>
        <main className="main">
          <div className="head">
            <div>
              <div className="crumb">{crumb}</div>
              <h1>{title}</h1>
              {sub ? <p>{sub}</p> : null}
            </div>
            <div className="tools">
              {api.IS_MOCK ? <span className="sample">예시 데이터 · 서버 미연결</span> : null}
              <button className="btn" onClick={loadAll}>
                새로고침
              </button>
            </div>
          </div>
          {error ? (
            <div className="alert" role="alert">
              {error}
            </div>
          ) : null}
          <div className="view">
            {gbs === null ? (
              <p className="empty card">불러오는 중…</p>
            ) : route.view === 'home' ? (
              <Home gbs={gbs} rosters={rosters} settlements={settlements} go={go} />
            ) : route.view === 'groupbuys' ? (
              <GroupBuys gbs={gbs} code={route.code} go={go} onCancel={(g) => setConfirm(g)} />
            ) : route.view === 'orders' ? (
              <Orders gbs={gbs} code={route.code} go={go} roster={ordersGb ? rosters[ordersGb.code] : null} reload={reloadRoster} toast={toast} />
            ) : route.view === 'settle' ? (
              <Settle settlements={settlements} />
            ) : (
              <Products
                requests={requests}
                toast={toast}
                onCreate={async (items) => {
                  await api.createProductRequests(items);
                  setRequests(await api.listProductRequests());
                }}
              />
            )}
          </div>
        </main>
      </div>

      {confirm ? (
        <Modal title="공동구매를 취소할까요?" onClose={() => setConfirm(null)}>
          <p className="s">
            {confirm.product.name} · 예약 {api.int(confirm.orderCount)}건
          </p>
          <p>예약한 구매자 전원의 결제 예약이 풀리고, 되돌릴 수 없어요. 구매자와 호스트에게 취소 알림이 갑니다.</p>
          <div className="actions">
            <button className="btn" onClick={() => setConfirm(null)}>
              돌아가기
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                const g = confirm;
                setConfirm(null);
                try {
                  await api.cancelGroupBuy(g.code);
                  setGbs(await api.listGroupBuys());
                  toast('공동구매를 취소했어요');
                } catch (e) {
                  toast(errText(e));
                }
              }}
            >
              취소하기
            </button>
          </div>
        </Modal>
      ) : null}
      <div className={`toast${msg ? ' on' : ''}`} role="status">
        {msg}
      </div>
    </div>
  );
}

const Mark = () => (
  <svg className="hex" viewBox="0 0 200 200" aria-hidden="true">
    <path d="M100 8 L180 54 Q186 58 186 65 L186 135 Q186 142 180 146 L100 192 L20 146 Q14 142 14 135 L14 65 Q14 58 20 54 Z" fill="#FD7C02" />
    <path d="M58 102 L88 130 L146 70" fill="none" stroke="#121212" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

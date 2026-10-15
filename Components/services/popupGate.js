// 첫 화면 팝업 순서 조정 (2026-10 인앱 공지 도입).
// 업데이트 안내·인앱 공지·이벤트 팝업이 같은 순간에 겹쳐 뜨지 않게 한 번에 하나만 화면을 쥔다.
// 동시에 기다리는 경우 우선순위: 업데이트 안내 → 인앱 공지 → 이벤트 팝업.
// 슬롯을 받지 못한 쪽은 앞선 팝업이 닫힐 때까지 기다렸다가 이어서 뜬다.

export const POPUP_PRIORITY = {
  UPDATE: 0,
  NOTICE: 1,
  EVENT: 2,
};

// 닫힘 애니메이션이 끝나기 전에 다음 팝업을 띄우면 iOS에서 표시가 누락될 수 있어 잠깐 쉰다.
const HANDOFF_DELAY_MS = 350;

let holder = null;
let waiters = [];
let seq = 0;

function grantNext() {
  if (holder || waiters.length === 0) {
    return;
  }
  waiters.sort((a, b) => a.priority - b.priority || a.seq - b.seq);
  const next = waiters.shift();
  holder = next;
  next.resolve(makeRelease(next));
}

function makeRelease(entry) {
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    if (holder === entry) {
      holder = null;
      setTimeout(grantNext, HANDOFF_DELAY_MS);
    }
  };
}

// 화면을 쓸 차례가 되면 release 함수를 돌려준다. 반드시 팝업을 닫을 때 release를 호출할 것.
// 반환값의 cancel()은 아직 차례가 오지 않은 대기를 취소한다(화면 언마운트 등).
export function requestPopupSlot(priority = POPUP_PRIORITY.EVENT) {
  let entry = null;
  const promise = new Promise((resolve) => {
    seq += 1;
    entry = { priority, seq, resolve };
    waiters.push(entry);
  });
  // 같은 틱에 들어온 요청끼리 우선순위 비교가 되도록 한 틱 미룬다.
  setTimeout(grantNext, 0);
  promise.cancel = () => {
    waiters = waiters.filter((w) => w !== entry);
  };
  return promise;
}

// 테스트 전용
export function __resetPopupGate() {
  holder = null;
  waiters = [];
  seq = 0;
}

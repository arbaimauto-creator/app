const { POPUP_PRIORITY, __resetPopupGate, requestPopupSlot } = require('./popupGate');

beforeEach(() => {
  jest.useFakeTimers();
  __resetPopupGate();
});
afterEach(() => jest.useRealTimers());

test('한 번에 하나, 동시 대기 시 업데이트 → 공지 → 이벤트 순', async () => {
  const order = [];
  const take = (name, p) =>
    requestPopupSlot(p).then((release) => {
      order.push(name);
      return release;
    });
  const event = take('event', POPUP_PRIORITY.EVENT);
  const notice = take('notice', POPUP_PRIORITY.NOTICE);
  const update = take('update', POPUP_PRIORITY.UPDATE);

  jest.runAllTimers();
  const releaseUpdate = await update;
  expect(order).toEqual(['update']);

  releaseUpdate();
  jest.runAllTimers();
  const releaseNotice = await notice;
  expect(order).toEqual(['update', 'notice']);

  releaseNotice();
  releaseNotice(); // 중복 호출 무해
  jest.runAllTimers();
  await event;
  expect(order).toEqual(['update', 'notice', 'event']);
});

test('취소한 대기는 차례를 받지 않는다', async () => {
  const first = requestPopupSlot(POPUP_PRIORITY.NOTICE);
  const cancelled = requestPopupSlot(POPUP_PRIORITY.EVENT);
  const granted = jest.fn();
  cancelled.then(granted);
  cancelled.cancel();
  jest.runAllTimers();
  (await first)();
  jest.runAllTimers();
  await Promise.resolve();
  expect(granted).not.toHaveBeenCalled();
});

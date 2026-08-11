/**
 * 부팅 경로 추적 (릴리스 흰 화면 진단용).
 *
 * 릴리스 빌드에서는 console.* 이 제거되므로, 시작 경로의 분기를 메모리에 남겨
 * 화면에서 확인할 수 있게 한다. 어떤 화면에서도 import 가능하도록 의존성 없음.
 *
 * 사용:
 *   import { trace, getTrace } from '../Components/bootTrace';
 *   trace('drawer:boot-start');
 */

const MAX_STEPS = 40;
const t0 = Date.now();

const steps = [];

/**
 * 부팅 단계 기록. 최대 40개까지만 보관(이후 호출은 무시)하여 메모리 증가를 막는다.
 * @param {string} step 단계 식별자 (예: 'linking:dynamiclink-timeout')
 */
export function trace(step) {
  if (steps.length >= MAX_STEPS) {
    return;
  }
  steps.push({ t: Date.now() - t0, step: String(step) });
}

/**
 * 기록된 단계 목록(복사본) 반환.
 * @returns {Array<{t: number, step: string}>}
 */
export function getTrace() {
  return steps.slice();
}

export default { trace, getTrace };

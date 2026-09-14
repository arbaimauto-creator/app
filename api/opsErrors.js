// 제출 실패를 원인별로 구분해 다음 행동이 담긴 메시지로 바꾼다 (기획서 §5.2).
// 마감 · 조건 불일치 · 네트워크 · 서버 오류를 하나의 "다시 시도" 알럿으로 뭉개지 않는다.
import Strings from '../Components/Strings';

export const ERROR_KIND = {
  NETWORK: 'network',
  DEADLINE: 'deadline',
  CONDITION: 'condition',
  DUPLICATE: 'duplicate',
  SOLD_OUT: 'sold_out',
  AUTH: 'auth',
  SERVER: 'server',
  UNKNOWN: 'unknown',
};

// opsClient.request는 4xx/5xx에 status·body를 붙여 던진다. fetch 실패·타임아웃은 status가 없다.
export function classifyError(err) {
  const status = err?.status;
  const code = err?.body?.error || err?.message || '';
  if (status == null) {
    if (/abort|network|timeout|failed to fetch/i.test(String(code))) {
      return ERROR_KIND.NETWORK;
    }
    if (/invalid_seeding_status|fgi_required|expired/i.test(String(code))) {
      return ERROR_KIND.CONDITION;
    }
    return ERROR_KIND.UNKNOWN;
  }
  if (status === 401 || status === 403) {
    return ERROR_KIND.AUTH;
  }
  if (status === 404) {
    return ERROR_KIND.DEADLINE;
  }
  if (status === 409) {
    if (/already/i.test(String(code))) {
      return ERROR_KIND.DUPLICATE;
    }
    if (/sold_out|full/i.test(String(code))) {
      return ERROR_KIND.SOLD_OUT;
    }
    return ERROR_KIND.CONDITION;
  }
  if (status >= 400 && status < 500) {
    return ERROR_KIND.CONDITION;
  }
  return ERROR_KIND.SERVER;
}

// { title, body, action: 'retry' | 'browse' | 'activity' | 'none' }
export function describeError(err) {
  const kind = classifyError(err);
  switch (kind) {
    case ERROR_KIND.NETWORK:
      return {
        kind,
        title: Strings.ERR_NETWORK_TITLE,
        body: Strings.ERR_NETWORK_BODY,
        action: 'retry',
      };
    case ERROR_KIND.DEADLINE:
      return {
        kind,
        title: Strings.ERR_CLOSED_TITLE,
        body: Strings.ERR_CLOSED_BODY,
        action: 'browse',
      };
    case ERROR_KIND.SOLD_OUT:
      return {
        kind,
        title: Strings.ERR_SOLD_OUT_TITLE,
        body: Strings.ERR_SOLD_OUT_BODY,
        action: 'browse',
      };
    case ERROR_KIND.DUPLICATE:
      return {
        kind,
        title: Strings.ERR_DUPLICATE_TITLE,
        body: Strings.ERR_DUPLICATE_BODY,
        action: 'activity',
      };
    case ERROR_KIND.CONDITION:
      return {
        kind,
        title: Strings.ERR_CONDITION_TITLE,
        body: Strings.ERR_CONDITION_BODY,
        action: 'activity',
      };
    case ERROR_KIND.AUTH:
      return { kind, title: Strings.ERR_AUTH_TITLE, body: Strings.ERR_AUTH_BODY, action: 'retry' };
    case ERROR_KIND.SERVER:
      return {
        kind,
        title: Strings.ERR_SERVER_TITLE,
        body: Strings.ERR_SERVER_BODY,
        action: 'retry',
      };
    default:
      return {
        kind,
        title: Strings.ERR_UNKNOWN_TITLE,
        body: Strings.RETRY_GUIDELINES,
        action: 'retry',
      };
  }
}

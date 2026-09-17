/**
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import StartupErrorScreen, {
  reportStartupError,
  subscribeStartupError,
} from './Components/StartupErrorScreen';
import BootDiagnosticScreen from './Components/BootDiagnosticScreen';

// 부팅 단계 기록은 담당 A의 모듈 — 아직 없을 수 있으므로 방어적으로 로드한다.
let bootTrace = null;
let getTrace = () => [];
try {
  bootTrace = require('./Components/bootTrace');
  if (bootTrace && typeof bootTrace.getTrace === 'function') {
    getTrace = bootTrace.getTrace;
  }
} catch (e) {
  // bootTrace 미탑재 — 단계 기록 없이 경과 시간만 보여준다.
}

// 네이티브 부팅 감시장치(AppDelegate 8초 알림)용 마커 — JS 번들이 실행됐음을 남긴다.
// 이 줄에 도달하지 못하면 알림에 "JS 실행: 안 됨"이 떠 번들/브리지 단계 문제로 특정된다.
try {
  require('react-native-default-preference').default.set('bootJsStartedAt', String(Date.now()));
} catch (e) {
  // 마커 실패는 부팅에 영향 없음
}

// 화면이 뜨지 않았다고 판정하기까지의 유예 시간.
const BOOT_TIMEOUT_MS = 6000;
const BOOT_POLL_MS = 500;

// "정상 진입" 신호를 찾는다. 찾으면 그 근거 문자열, 없으면 null.
// root.js(담당 A)는 수정할 수 없으므로 여러 경로를 모두 허용한다.
function findReadySignal() {
  try {
    if (global.__GREYD_APP_READY__) {
      return 'global.__GREYD_APP_READY__';
    }
    if (bootTrace) {
      if (typeof bootTrace.isAppReady === 'function' && bootTrace.isAppReady()) {
        return 'bootTrace.isAppReady()';
      }
      if (bootTrace.appReady === true) {
        return 'bootTrace.appReady';
      }
    }
    const trace = getTrace() || [];
    for (let i = trace.length - 1; i >= 0; i -= 1) {
      const step = String((trace[i] && trace[i].step) || '');
      if (/app[\s_-]?ready|nav(igation)?[\s_-]?ready|on[\s_-]?ready/i.test(step)) {
        return `trace:${step}`;
      }
    }
  } catch (e) {
    // 판정 실패는 "신호 없음"으로 취급
  }
  return null;
}

// 시작 단계의 어떤 오류도 흰 화면으로 끝나지 않게 한다 —
// import·초기화·렌더 어디서 터지든 화면에 원인을 띄운다.
if (global.ErrorUtils?.setGlobalHandler) {
  const previousHandler = global.ErrorUtils.getGlobalHandler?.();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    reportStartupError(error, isFatal ? 'fatal' : 'global');
    if (previousHandler) {
      previousHandler(error, isFatal);
    }
  });
}

let App = null;
try {
  App = require('./App.tsx').default;
  require('./Components/services').pushNotifications.configure();
  // 설정에서 고른 언어를 기기 언어보다 우선 적용 (비동기 — 첫 렌더 이후 화면부터 반영)
  require('./Components/Strings').initLanguage();
} catch (e) {
  reportStartupError(e, 'import');
}

function RootWithGuard() {
  const [error, setError] = React.useState(null);
  const [diag, setDiag] = React.useState(null);
  const dismissedRef = React.useRef(false);

  React.useEffect(() => subscribeStartupError(setError), []);

  // 예외 없이 그냥 멈추는(= 흰 화면) 경우를 잡는다.
  React.useEffect(() => {
    if (!App) {
      return undefined;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      try {
        const elapsedMs = Date.now() - startedAt;
        const readySignal = findReadySignal();
        if (readySignal) {
          // 정상 진입 — 이미 떠 있었다면 스스로 내려간다(오탐 자동 복구).
          clearInterval(timer);
          setDiag(null);
          return;
        }
        if (elapsedMs < BOOT_TIMEOUT_MS || dismissedRef.current) {
          return;
        }
        setDiag({ elapsedMs, readySignal: null, trace: getTrace() || [] });
      } catch (e) {
        clearInterval(timer);
      }
    }, BOOT_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  if (error || !App) {
    return (
      <StartupErrorScreen error={error || { phase: 'import', message: 'App 모듈 로드 실패' }} />
    );
  }

  const onDismiss = () => {
    dismissedRef.current = true;
    setDiag(null);
  };

  return (
    <>
      <App />
      {diag ? (
        <BootDiagnosticScreen
          elapsedMs={diag.elapsedMs}
          trace={diag.trace}
          readySignal={diag.readySignal}
          onDismiss={onDismiss}
        />
      ) : null}
    </>
  );
}

AppRegistry.registerComponent(appName, () => RootWithGuard);

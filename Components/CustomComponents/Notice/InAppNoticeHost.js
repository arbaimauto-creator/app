// 인앱 공지 팝업 (2026-10) — 앱 실행 직후·백그라운드 복귀 시 ops 공지를 받아 한 번에 하나씩 띄운다.
// 로그인 여부와 무관하게 NavigationContainer 바로 아래에서 동작한다(가입 전 화면 포함).
// 실패·빈 목록이면 아무것도 그리지 않으며, 다른 첫 화면 팝업과는 popupGate로 순서를 맞춘다.
import { getActionFromState, getStateFromPath } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { getVersion } from 'react-native-device-info';
import { WebView } from 'react-native-webview';
import { loadPendingNotices, rememberShown, reportSeen } from '../../../api/mobileNotices';
import { prefGetSafe } from '../../../api/prefSafe';
import T from '../../Constants/DesignTokens';
import Strings, { getLanguage } from '../../Strings';
import { trace } from '../../bootTrace';
import { POPUP_PRIORITY, requestPopupSlot } from '../../services/popupGate';
import { extractDeepLinkPath, isAllowedLinkPath, linkingConfig } from '../../utils/linking';

function mergeQueue(queue, incoming) {
  const keys = new Set(queue.map((n) => n.key));
  return [...queue, ...incoming.filter((n) => !keys.has(n.key))];
}

// greyd:// CTA — 딥링크와 같은 화이트리스트·라우트 해석으로 앱 안에서 이동한다.
function navigateInApp(navigationRef, url) {
  try {
    const path = extractDeepLinkPath(url);
    if (!path || !isAllowedLinkPath(path) || !navigationRef?.isReady?.()) {
      return;
    }
    const state = getStateFromPath(path, linkingConfig);
    const action = state ? getActionFromState(state, linkingConfig) : null;
    if (action) {
      navigationRef.dispatch(action);
    }
  } catch (e) {
    trace('notice:navigate-fail');
  }
}

export default function InAppNoticeHost({ navigationRef }) {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [browserUrl, setBrowserUrl] = useState(null);
  const [webCanGoBack, setWebCanGoBack] = useState(false);
  const webRef = useRef(null);
  const releaseRef = useRef(null);
  const slotRequestRef = useRef(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const { width, height } = useWindowDimensions();

  const load = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    try {
      const country = await prefGetSafe('creatorCountry');
      const notices = await loadPendingNotices({
        lang: getLanguage(),
        country,
        platform: Platform.OS,
        version: getVersion(),
      });
      if (mountedRef.current && notices.length > 0) {
        setQueue((q) => mergeQueue(q, notices));
      }
    } catch (e) {
      trace('notice:load-fail');
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // 실행 직후 + 백그라운드에서 돌아올 때
  useEffect(() => {
    mountedRef.current = true;
    load();
    let wentBackground = false;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        wentBackground = true;
      } else if (next === 'active' && wentBackground) {
        wentBackground = false;
        load();
      }
    });
    return () => {
      mountedRef.current = false;
      sub?.remove?.();
      slotRequestRef.current?.cancel?.();
      releaseRef.current?.();
    };
  }, [load]);

  // 대기 중인 공지가 있으면 화면 차례를 받아 첫 공지를 띄운다.
  useEffect(() => {
    if (current || browserUrl || queue.length === 0) {
      return;
    }
    if (releaseRef.current) {
      // 이미 차례를 쥐고 있으면 이어서 다음 공지
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
      return;
    }
    if (slotRequestRef.current) {
      return;
    }
    const request = requestPopupSlot(POPUP_PRIORITY.NOTICE);
    slotRequestRef.current = request;
    request.then((release) => {
      slotRequestRef.current = null;
      if (!mountedRef.current) {
        release();
        return;
      }
      const pending = queueRef.current;
      if (pending.length === 0) {
        release();
        return;
      }
      releaseRef.current = release;
      setCurrent(pending[0]);
      setQueue(pending.slice(1));
    });
  }, [current, browserUrl, queue]);

  // 보여 준 직후: 노출 기록(ONCE는 기기에 key 저장) + seen 집계(실패 무시)
  useEffect(() => {
    if (!current) {
      return;
    }
    rememberShown(current).catch(() => {});
    reportSeen(current.id);
  }, [current]);

  // 띄울 것이 더 없으면 화면 차례를 돌려준다.
  useEffect(() => {
    if (!current && !browserUrl && queue.length === 0 && releaseRef.current) {
      const release = releaseRef.current;
      releaseRef.current = null;
      release();
    }
  }, [current, browserUrl, queue]);

  const dismiss = () => setCurrent(null);

  const onPressCta = () => {
    const url = current?.cta?.url;
    if (!url) {
      dismiss();
      return;
    }
    if (/^https:\/\//i.test(url)) {
      setWebCanGoBack(false);
      setBrowserUrl(url);
      setCurrent(null);
      return;
    }
    setCurrent(null);
    navigateInApp(navigationRef, url);
  };

  const closeBrowser = () => {
    setBrowserUrl(null);
    setWebCanGoBack(false);
  };

  // Android 뒤로가기
  const onRequestClose = () => {
    if (browserUrl) {
      if (webCanGoBack && webRef.current) {
        webRef.current.goBack();
      } else {
        closeBrowser();
      }
      return;
    }
    dismiss();
  };

  // 인앱 브라우저 안에서 greyd:// 링크는 앱 내 이동, 그 밖의 스킴(tel: 등)은 OS에 넘긴다.
  const onShouldStartLoadWithRequest = ({ url }) => {
    if (/^https?:\/\//i.test(url) || url === 'about:blank') {
      return true;
    }
    if (/^greyd:\/\//i.test(url)) {
      closeBrowser();
      navigateInApp(navigationRef, url);
      return false;
    }
    Linking.openURL(url).catch(() => {});
    return false;
  };

  const visible = Boolean(current || browserUrl);
  if (!visible) {
    return null;
  }

  const cardWidth = Math.min(width - 48, 420);

  return (
    // 공지 → 인앱 브라우저 전환 중 Modal을 새로 띄우지 않도록(iOS 표시 누락 방지) 한 Modal 안에서 바꾼다.
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      {browserUrl ? (
        <SafeAreaView style={s.browser}>
          <View style={s.browserHeader}>
            <Pressable onPress={closeBrowser} hitSlop={12} style={s.browserClose}>
              <Text style={s.browserCloseText}>{Strings.CLOSE}</Text>
            </Pressable>
          </View>
          <WebView
            ref={webRef}
            source={{ uri: browserUrl }}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onNavigationStateChange={(nav) => setWebCanGoBack(Boolean(nav.canGoBack))}
            startInLoadingState
            renderLoading={() => (
              <View style={s.browserLoading}>
                <ActivityIndicator color={T.COLORS.AMBER} />
              </View>
            )}
            setSupportMultipleWindows={false}
          />
        </SafeAreaView>
      ) : (
        <View style={s.backdrop}>
          <View style={[s.card, { width: cardWidth, maxHeight: height * 0.8 }]}>
            {current.imageUrl ? (
              <Image source={{ uri: current.imageUrl }} style={s.image} resizeMode="cover" />
            ) : null}
            <View style={s.content}>
              {current.title ? <Text style={s.title}>{current.title}</Text> : null}
              {current.body ? (
                <ScrollView style={s.bodyScroll} contentContainerStyle={s.bodyContent}>
                  <Text style={s.body}>{current.body}</Text>
                </ScrollView>
              ) : null}
            </View>
            <View style={s.buttons}>
              {current.cta ? (
                <Pressable
                  onPress={onPressCta}
                  style={({ pressed }) => [s.primary, pressed && s.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={s.primaryText} numberOfLines={1}>
                    {current.cta.label}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={dismiss}
                style={({ pressed }) => [
                  current.cta ? s.secondary : s.primary,
                  pressed && s.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={current.cta ? s.secondaryText : s.primaryText}>{Strings.OK}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: T.COLORS.SURFACE,
    borderRadius: T.RADIUS.CARD,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: T.COLORS.LINE,
  },
  content: {
    flexShrink: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: T.COLORS.INK,
    marginBottom: 10,
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    paddingBottom: 4,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: T.COLORS.DARK,
  },
  buttons: {
    padding: 20,
    paddingTop: 16,
    gap: 8,
  },
  primary: {
    height: 48,
    borderRadius: T.RADIUS.BTN,
    backgroundColor: T.COLORS.AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: T.COLORS.ON_AMBER,
  },
  secondary: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: T.COLORS.GREY,
  },
  pressed: {
    opacity: 0.7,
  },
  browser: {
    flex: 1,
    backgroundColor: T.COLORS.SURFACE,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
  },
  browserHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.COLORS.LINE,
  },
  browserClose: {
    paddingVertical: 8,
  },
  browserCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: T.COLORS.INK,
  },
  browserLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

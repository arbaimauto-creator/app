import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import APIprovider from './APIprovider';

import VideoPageScreen from '../screens/VideoPageScreen';
import Constants from './Constants';

const layout = Dimensions.get('window');

const noop = () => {};

const MemorizedVideoPage = ({
  nestedProps,
  videoId,
  isFocused,
  isSeekBarMoved,
  setIsSeekBarMoved,
  setIsDetailAtTop,
  setIsTouchingDetail,
  pageBy,
  video,
}) => {
  return useMemo(
    () => (
      <VideoPageScreen
        navigation={nestedProps.navigation}
        route={{
          ...nestedProps.route,
          params: {
            ...nestedProps.route.params,
            videoId: videoId,
            isFocused: isFocused,
            isSeekBarMoved,
            setIsSeekBarMoved: (isMoved) => setIsSeekBarMoved(isMoved),
            setIsDetailAtTop,
            setIsTouchingDetail,
            pageBy,
            video,
          },
        }}
      />
    ),
    [
      nestedProps.navigation,
      nestedProps.route,
      videoId,
      isFocused,
      isSeekBarMoved,
      setIsSeekBarMoved,
      setIsDetailAtTop,
      setIsTouchingDetail,
      pageBy,
      video,
    ],
  );
};

export default function VideoPageScreenWrapper(props) {
  let { videoList, videoId, videoType, videoSortType } = props.route.params;
  let { onVideoIndexChanged, onVideoListChanged } = props.route.params;

  const [storedVideoList, setStoredVideoList] = useState(videoList || []);
  const [index, setIndex] = useState(
    videoList ? videoList.findIndex((item) => item._id === videoId) : null,
  );
  const [routes, setRoutes] = useState(
    videoList ? videoList.map((item) => ({ key: item._id, title: item._id })) : [],
  );
  const [entireCount, setEntireCount] = useState(-1);
  const [isRandomType, setIsRandomType] = useState(false);
  const [isSeekBarMoved, setIsSeekBarMoved] = useState(false);

  // 세로 페이징과 리뷰 상세 스크롤이 같은 축을 쓰므로, 아래 두 조건일 때 페이저를 잠근다.
  // (1) 상세를 이미 스크롤해 내려간 상태  (2) 손가락이 상세 영역에서 시작한 제스처
  const [isDetailAtTop, setIsDetailAtTop] = useState(true);
  const [isTouchingDetail, setIsTouchingDetail] = useState(false);
  const pagerRef = useRef(null);
  // 오버레이가 코드로 한 장 넘길 때 쓴다 (캡션 펼친 카드 위 세로 스와이프 — 2026-09-15).
  // 펼친 카드 영역에선 Android 네이티브 페이저가 제스처를 못 받는 현상이 있어 RNGH Pan → setPage로 넘긴다.
  // 참조가 안 바뀌어야 모든 페이지가 다시 그려지지 않으므로 ref로 최신 index/길이를 읽는다.
  const pageStateRef = useRef({ index: 0, count: 0 });
  const pageBy = useCallback((delta) => {
    const { index: current, count } = pageStateRef.current;
    const next = current + delta;
    if (next >= 0 && next < count) {
      pagerRef.current?.setPage(next);
    }
  }, []);

  // videoId가 목록에 없으면(딥링크·삭제된 영상 등) findIndex가 -1이라
  // videoList[-1].linkedProduct 접근으로 렌더 중 크래시했다 — 널 안전 접근
  const currentVideo = videoList ? videoList.find((item) => item._id === videoId) : null;
  const product = currentVideo?.linkedProduct ?? null;
  const productId =
    typeof product?.productId === 'object' ? product?.productId._id : product?.productId;
  const user = currentVideo?.author ?? null;
  const userId = user?.userId;

  // let isRefreshing = false;
  const [_isRefreshing, setIsRefreshing] = useState(false);

  // 최신 값을 ref로 들고 있다가 "언마운트 시 1회"만 부모에 동기화한다
  // (기존엔 deps 없는 effect라 매 렌더마다 cleanup이 돌아 콜백이 수십 번 호출됐다)
  const syncRef = useRef({ storedVideoList, index });
  syncRef.current = { storedVideoList, index };
  useEffect(() => {
    return () => {
      if (onVideoListChanged) {
        onVideoListChanged(syncRef.current.storedVideoList);
      }
      if (onVideoIndexChanged) {
        onVideoIndexChanged(syncRef.current.index);
      }
    };
    // 언마운트 시 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onListLoadError = () => {
    // Alert.alert(
    //     Strings.LOAD_REVIEW_LIST,
    //     err.errorMsg ? err.errorMsg : "",
    //     [ { text: Strings.OK }],
    //     { cancelable: true }
    // )

    // isRefreshing = false;
    setIsRefreshing(false);
  };

  const onListAdded = (data) => {
    // console.log('called onListAdded')
    setStoredVideoList([...storedVideoList, ...data.videoList]);
    setRoutes(
      [...storedVideoList, ...data.videoList].map((item) => ({
        key: item._id,
        title: item._id,
      })),
    );
    setEntireCount(data.entireCount);

    // isRefreshing = false;
    setIsRefreshing(false);
  };

  const onRandomListAdded = (data) => {
    const ids = new Set();
    const newVideos = [];
    for (const video of [...storedVideoList, ...data.videoList]) {
      const prevSize = ids.size;
      ids.add(video._id);
      if (ids.size > prevSize) {
        newVideos.push(video);
      }
    }

    setIsRandomType(true);
    setStoredVideoList(newVideos);
    setRoutes(newVideos.map((item) => ({ key: item._id, title: item._id })));
    setEntireCount(data.entireCount);

    // isRefreshing = false;
    setIsRefreshing(false);
  };

  const onListEndReached = () => {
    // 페이저가 연속 발화해도 동일 offset 요청이 중복 발사되지 않도록 재진입 가드
    if (_isRefreshing) {
      return;
    }
    setIsRefreshing(true);

    const limit = 15;

    // console.log(videoSortType, videoType, videoList[index], productId);
    if (videoType === Constants.VIDEO_LIST_LINKED_PRODUCT) {
      APIprovider.getLinkedVideoListOfProduct(
        productId,
        videoSortType,
        '',
        storedVideoList.length,
        limit,
      )
        .then(onListAdded)
        .catch(onListLoadError);
    } else if (videoType === Constants.VIDEO_LIST_RELAYING) {
      APIprovider.getRelayingVideoList(videoId, videoSortType, '', storedVideoList.length, limit)
        .then(onListAdded)
        .catch(onListLoadError);
    } else if (videoType === Constants.VIDEO_LIST_TRENDING) {
      // APIprovider.getVideoList(Constants.VIDEO_LIST_TRENDING, videoSortType, null, '', storedVideoList.length, limit)
      APIprovider.getVideoList('random', Constants.VIDEO_LIST_TRENDING, null, '', '', limit)
        .then(onRandomListAdded)
        .catch(onListLoadError);
    } else if (videoType === Constants.VIDEO_LIST_FOLLOWING) {
      APIprovider.getVideoList(
        Constants.VIDEO_LIST_FOLLOWING,
        videoSortType,
        null,
        '',
        storedVideoList.length,
        limit,
      )
        .then(onListAdded)
        .catch(onListLoadError);
    } else if (videoType === Constants.VIDEO_LIST_CATEGORY) {
      APIprovider.getCategorizedVideoList(
        videoType,
        videoSortType,
        '',
        storedVideoList.length,
        limit,
      )
        .then(onListAdded)
        .catch(onListLoadError);
    } else if (videoType === 'userUpload') {
      APIprovider.getUserUploadVideoList(userId, '', storedVideoList.length, limit)
        .then(onListAdded)
        .catch(onListLoadError);
    } else if (videoType === Constants.VIDEO_LIST_RECENT) {
      APIprovider.getVideoList(Constants.VIDEO_LIST_RECENT, videoType, null, '', '', limit)
        // .then(onListAdded)
        .then(onRandomListAdded)
        .catch(onListLoadError);
    } else {
      // APIprovider.getVideoList(videoType, videoSortType, null, '', storedVideoList.length, limit)
      APIprovider.getVideoList('random', videoType, null, '', '', limit)
        .then(onRandomListAdded)
        .catch(onListLoadError);
    }
  };

  const onPageSelected = useCallback(
    (e) => {
      const _index = e.nativeEvent.position;
      setIndex(_index);
      // 새 영상으로 넘어오면 상세는 항상 최상단부터 시작하므로 잠금을 푼다.
      setIsDetailAtTop(true);
      setIsTouchingDetail(false);

      if (isRandomType && _index > storedVideoList.length - 3) {
        onListEndReached();
      } else if (
        _index > storedVideoList.length - 3 &&
        (entireCount === -1 || entireCount > storedVideoList.length)
      ) {
        onListEndReached();
      }
    },
    // onListEndReached는 매 렌더마다 새로 만들어지는 일반 함수라 deps에 넣으면 의미가 없다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRandomType, storedVideoList, entireCount],
  );

  // PagerView는 자식이 하나도 없으면 Android에서 죽으므로 단일 페이지로 떨어뜨린다.
  if (!videoList || routes.length === 0) {
    return (
      <MemorizedVideoPage
        isSeekBarMoved={isSeekBarMoved}
        setIsSeekBarMoved={(isMoved) => setIsSeekBarMoved(isMoved)}
        setIsDetailAtTop={noop}
        setIsTouchingDetail={noop}
        nestedProps={props}
        isFocused={true}
        videoId={videoId}
      />
    );
  }

  // 2026-09-14 쇼츠 UX: 리뷰 상세가 더 이상 세로 스크롤 위치가 아니라(캡션 더보기 + 시트) 페이저를 잠글 이유가 없다.
  // 캡션을 접든 펼치든 세로 스와이프는 항상 다음/이전 쇼츠. 시크바 드래그 중에만 잠근다.
  // (isDetailAtTop/isTouchingDetail 상태는 호환용으로 남겨두되 판정엔 쓰지 않는다)
  // 상세 모드(마이페이지 > 저장 → 전체 상세)에선 페이지 안 FlatList가 세로 스크롤을 쓰므로 페이저를 잠근다 (2026-09-15)
  const isPagerScrollEnabled = !isSeekBarMoved && !props.route.params.detailMode;
  pageStateRef.current = { index: Math.max(0, index ?? 0), count: routes.length };

  return (
    <KeyboardAvoidingView
      // behavior={Platform.OS === 'ios' ? 'padding' : null} // to prevent keyboard from popping up twice (added it in index.js)
      style={{ flex: 1, width: '100%' }}
    >
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        orientation="vertical"
        initialPage={Math.max(0, index)}
        // 다음/이전 영상을 미리 붙여둬야 스와이프가 끊기지 않고 이어진다
        offscreenPageLimit={2}
        // 끝에서 살짝 딸려오는 저항감 — 화면 전환이 아니라 연속된 피드로 느껴지게 한다
        overdrag={true}
        scrollEnabled={isPagerScrollEnabled}
        onPageSelected={onPageSelected}
      >
        {routes.map((route) => {
          const videoIndex = storedVideoList.findIndex((item) => item._id === route.key);
          const video = storedVideoList.find((item) => item._id === route.key);
          const distance = Math.abs(videoIndex - index);

          if (distance > 2) {
            return <View key={route.key} style={styles.page} />;
          }

          return (
            <View key={route.key} style={styles.page}>
              <MemorizedVideoPage
                isSeekBarMoved={isSeekBarMoved}
                setIsSeekBarMoved={(isMoved) => setIsSeekBarMoved(isMoved)}
                setIsDetailAtTop={setIsDetailAtTop}
                setIsTouchingDetail={setIsTouchingDetail}
                pageBy={pageBy}
                nestedProps={props}
                isFocused={distance === 0}
                videoId={route.key}
                video={video}
              />
            </View>
          );
        })}
      </PagerView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: layout.height,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});

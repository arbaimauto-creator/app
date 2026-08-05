import { CommonActions, useIsFocused, useScrollToTop } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeModules,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import DeviceCountry from 'react-native-device-country';
import { getUniqueIdSync } from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import SplashScreen from 'react-native-splash-screen';
import { FlatGrid } from 'react-native-super-grid';
import { useDispatch, useSelector } from 'react-redux';
import { Context } from '../Contexts';
import { REGION } from '../Contexts/actionTypes';
import { store } from '../redux/store';
// import { bootChannelIO } from '../screens/SignInScreen/commonHelperFunction';
import {
  setCountryCode,
  setCurrencyRate,
  setGuest,
  setTotalRevenue,
  setTotalReward,
  setUser,
} from '../slices/user';
import APIprovider from './APIprovider';
import Reward from './Common/Reward';
import Constants from './Constants';
import EventPageModal from './CustomComponents/EventBanner/EventPageModal';
import HelpBubble from './CustomComponents/HelpBubble';
import SliderEntry from './SliderEntry';
import Strings from './Strings';
import VideoListItemView from './VideoListItemView';
import MainBottomSheet from './Views/MainBottomSheet';
import { pushNotifications } from './services';
import { LogoutAlert, getIPhoneHeaderMarginTop, isGuestUser, pageRoutingFunctions } from './utils';
import { getDeviceHeight } from './utils/scailing';
import ToggleTextButton from './CustomComponents/ToggleTextButton';
import LinearGradient from 'react-native-linear-gradient';
import DiscoverScreenWrapper from './DiscoverScreen';
import EventModalCarousel from './CustomComponents/EventBanner/EventModalCarousel';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const recommendedTypeList = [
  { keyword: '', sortType: Constants.VIDEO_LIST_SORT_TYPE.RECENT },
  { keyword: 'abroad', sortType: Constants.VIDEO_LIST_SORT_TYPE.RECENT },
  { keyword: 'worstProduct', sortType: Constants.VIDEO_LIST_SORT_TYPE.RECENT },
  { keyword: 'trending', sortType: Constants.VIDEO_LIST_SORT_TYPE.RECENT },
  { keyword: '', sortType: Constants.VIDEO_LIST_SORT_TYPE.VIEW },
  { keyword: 'abroad', sortType: Constants.VIDEO_LIST_SORT_TYPE.VIEW },
  { keyword: 'worstProduct', sortType: Constants.VIDEO_LIST_SORT_TYPE.VIEW },
  { keyword: 'trending', sortType: Constants.VIDEO_LIST_SORT_TYPE.VIEW },
  { keyword: '', sortType: Constants.VIDEO_LIST_SORT_TYPE.SCORE },
  { keyword: 'abroad', sortType: Constants.VIDEO_LIST_SORT_TYPE.SCORE },
  { keyword: 'worstProduct', sortType: Constants.VIDEO_LIST_SORT_TYPE.SCORE },
  { keyword: 'trending', sortType: Constants.VIDEO_LIST_SORT_TYPE.SCORE },
];

const getVideoListTitle = (videoListType) => {
  if (videoListType === 'trending') {
    return Constants.MAIN_VIDEO_LIST_TITLE[videoListType];
  } else if (videoListType === 'recent') {
    return Constants.MAIN_VIDEO_LIST_TITLE[videoListType];
  } else if (videoListType === 'following') {
    return Constants.MAIN_VIDEO_LIST_TITLE[videoListType];
  } else if (videoListType === 'abroad') {
    return Constants.MAIN_VIDEO_LIST_TITLE[videoListType];
  } else if (videoListType === 'worstProduct') {
    return Constants.MAIN_VIDEO_LIST_TITLE[videoListType];
  } else {
    return '';
  }
};

function MoreVideoCard({ videoListType, navigation }) {
  return (
    <View style={styles.moreVideoCardContainer}>
      <TouchableNativeFeedback
        onPress={() => {
          navigation.navigate('VideoList', {
            listOf: videoListType,
          });
        }}
      >
        <View style={styles.moreVideoCardButton}>
          <Text style={styles.moreVideoCardTitle}>{Strings.MORE_REVIEW_BUTTON1}</Text>
          <Text style={styles.moreVideoCardTitle}>
            <Text>{Strings.MORE_REVIEW_BUTTON2}</Text>
            {Platform.OS !== 'ios' && <Text />}
            {Platform.OS !== 'ios' && (
              <Image
                style={styles.moreVideoCardMoreIcon}
                source={require('../Resources/img/iconRenewal/icCommonTitle20W.png')}
              />
            )}
          </Text>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}

function VideoListItem({ dataType, dataSortType, dataList, data, index, navigation }) {
  return (
    <VideoListItemView
      key={dataType + '_' + index + '_' + data._id}
      navigation={navigation}
      data={data}
      dataList={dataList}
      dataSortType={dataSortType}
      dataType={dataType}
      style={{ width: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH }}
      noCreator
    />
  );
}

function ActionButton({ renderItem, onPress = () => {} }) {
  return (
    <View>
      <TouchableNativeFeedback
        onPress={() => onPress()}
        background={TouchableNativeFeedback.Ripple('#777', true)}
      >
        <View
          style={{
            // width: 44,
            // height: 44,
            marginLeft: 15,
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {renderItem}
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}

export default function MainScreenWrapper(props) {
  const ref = useRef(null);
  useScrollToTop(ref);

  if (Platform.OS !== 'ios') {
    StatusBar.setBackgroundColor(Constants.TIER_COLORS.ARTISAN);
    StatusBar.setBarStyle('default', true);
  }

  return <MainScreen {...props} scrollRef={ref} />;
}

function MainScreen(props) {
  const global = useContext(Context);
  const carousel = useRef(null);
  const scrollViewRef = useRef(null);
  const productListRef = useRef(null);
  const userListRef = useRef(null);
  const { navigation } = props;

  const mountedRef = useRef(true);

  let sliderEntryList = [];
  let isVideoListLoadingMain = false;

  // let recommendedKeyword = '';
  const [recommendedKeyword, setRecommendedKeyword] = useState('');

  // let recommendedSortType = Constants.VIDEO_LIST_SORT_TYPE.RECENT;
  const [recommendedSortType, setRecommendedSortType] = useState(
    Constants.VIDEO_LIST_SORT_TYPE.RECENT,
  );

  // let recommendVideosLength = 0;
  const [recommendVideosLength, setRecommendVideosLength] = useState(0);

  let videoListRef = {
    trending: useRef(null),
    recent: useRef(null),
    following: useRef(null),
    abroad: useRef(null),
    worstProduct: useRef(null),
  };
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [prevFocusedIndex, setPrevFocusedIndex] = useState(0);
  const [paginationSlidePos, setPaginationSlidePos] = useState(0);
  const [isPreviewChanging, setPreviewChanging] = useState(false);
  const [videoLists, setVideoLists] = useState([]);
  const [videoListRecommended, setVideoListRecommended] = useState([]);

  // 세로 피드: 아이템 높이는 상수로 계산할 수 없다. MainScreen은 탭바를 가진
  // material-bottom-tabs 안에 있어서 실제 뷰포트가 window 높이보다 작다.
  // onLayout으로 실측한 값을 아이템 높이로 내려줘야 pagingEnabled가 정확히 맞는다.
  const [feedHeight, setFeedHeight] = useState(0);
  const focusedIndexRef = useRef(0);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 60 });

  const [videoListRecent, setVideoListRecent] = useState([]);
  const [videoListRecentEntireCount, setVideoListRecentEntireCount] = useState(0);

  // const [videoListTrending, setVideoListTrending] = useState([]);
  const [discountedProductList, setDiscountedProductList] = useState([]);
  const [userListRecommended, setUserListRecommended] = useState([]);
  const [currentListType, setCurrentListType] = useState([]);

  const [isSheetOpened, setSheetOpened] = useState(false);
  const [onLoad, setOnLoad] = useState(true);

  function getVideoList(videoListType) {
    if (videoListType === 'trending') {
      // return videoListTrending;
    } else if (videoListType === 'recent') {
      return videoListRecent;
    } else if (videoListType === 'following') {
      // return videoListFollowing;
    } else if (videoListType === 'abroad') {
      // return videoListAbroad;
    } else if (videoListType === 'worstProduct') {
      // return videoListWorstProduct;
    } else {
      return [];
    }
  }

  const [isRefreshing, setRefreshing] = useState(false);
  const [isMainRefreshing, setMainRefreshing] = useState(false);
  const [isNewNotifications, setNewNotifications] = useState(false);

  // helpbubble index
  const [helpBubbleIndex, setHelpBubbleIndex] = useState(null);

  // event popup
  const [eventBanner, setEventBanner] = useState(null);

  // transform screen
  const [screenType, setScreenType] = useState(0);

  const isGuest = useSelector((state) => state.user.isGuest);
  const { notification: initialNotification } = useSelector((state) => state.notification);

  const dispatch = useDispatch();

  const loadMainData = async ({ isInitial }) => {
    if (isMainRefreshing) {
      return;
    }
    setMainRefreshing(true);
    // TOCHECK: offset을 3달로 두고, 3달전 리뷰를 메인피드로 볼 수 있도록 변경.
    try {
      let recommended = [];
      const keyword = await Preference.get('currentListType');
      // const {videoList} = await APIprovider.getVideoList(recommendedKeyword, recommendedSortType, "", "", 0, 18);
      const { videoList, eventBanner } = await APIprovider.getVideoList(
        'random',
        recommendedKeyword,
        '',
        '',
        0,
        18,
        isInitial,
      );

      for (let i = 0; i < videoList.length; i++) {
        if (videoList[i].title) {
          recommended.push(videoList[i]);
        }
      }
      // recommendVideosLength = recommended.length;
      setRecommendVideosLength((prevLength) => recommended.length);

      if (recommended.length > 0) {
        setVideoListRecommended(recommended);
      }
      focusedIndexRef.current = 0;
      setFocusedIndex(0);
      setPrevFocusedIndex(0);
      setMainRefreshing(false);

      // scrollViewRef는 어떤 컴포넌트에도 연결된 적이 없어 새로고침 후에도
      // 스크롤이 그대로 남았다. 그러면 focusedIndex 0과 실제 위치가 어긋나
      // 재생되는 영상이 없는 상태가 된다.
      props.scrollRef?.current?.scrollToOffset?.({ offset: 0, animated: true });
      setPaginationSlidePos(0);

      if (eventBanner) {
        setEventBanner(eventBanner);
      }
    } catch (err) {
      setMainRefreshing(false);
      console.log(err);
    }
  };

  const loadData = async () => {
    if (isRefreshing) {
      return;
    }
    let lists = [];
    setRefreshing(true);
    try {
      const mainData = await APIprovider.getVideoList('main', undefined, '', '', 0, 30);
      // console.log('loaddata recommendVideosLength', recommendVideosLength);
      // if (!isMainRefreshing && recommendVideosLength === 0) {
      //   let recommended = [];
      //   for (let i = 0; i < mainData.recent.videoList.length; i++) {
      //     if (mainData.recent.videoList[i].title) {
      //       recommended.push(mainData.recent.videoList[i]);
      //     }
      //   }
      //   console.log('loaddata setVideoListRecommended(recommended)')
      //   setVideoListRecommended(recommended);
      //   setFocusedIndex(0);
      //   setPrevFocusedIndex(0);
      // }

      // mainData.recent.videoList.push({ type: 'more' });

      // setVideoListRecent(mainData.recent.videoList);
      setVideoListRecent(mainData.recent.videoList.map((video) => ({ ...video })));
      setVideoListRecentEntireCount(mainData.recent.entireCount);

      lists.push('recent');

      // setVideoListTrending(mainData.trending.videoList);
      // lists.push('trending');

      setVideoLists(lists);

      const storeItems = await APIprovider.getStoreMain(20);
      onStoreItemLoaded(storeItems);

      // TODO: 유저 선별은 서버에서 가능하도록 수정 필요, 200명은 아님.
      const userItems = await APIprovider.getUserList(
        Constants.USER_LIST_LATEST_RECOMMENDED,
        '',
        '',
        0,
        30,
      );
      setUserListRecommended(userItems.userList);
      setRefreshing(false);

      videoListRef.recent?.current?.scrollToIndex({ index: 0 });
      // videoListRef['trending']?.current?.scrollToIndex({index: 0});
      productListRef?.current?.scrollToIndex({ index: 0 });
      userListRef?.current?.scrollToIndex({ index: 0 });
    } catch (err) {
      setRefreshing(false);
      console.log(err);
    }
  };

  const loadTotalReward = async (userId) => {
    const getEntireReviewRewardList = APIprovider.getEntireReviewRewardList({ userId });
    const getTotalReward = APIprovider.getUserTotalReward(userId);
    const getCurrencyRate = APIprovider.getCurrencyRate('USD');
    try {
      // const [entireReviewRewardList, totalRewardResult, currencyRateResult] = await Promise.all([
      //   getEntireReviewRewardList,
      //   getTotalReward,
      //   getCurrencyRate,
      // ]);

      // if (entireReviewRewardList.length) {
      //   console.log('loadTotalReward entireReviewRewardList', entireReviewRewardList.length);

      //   // const unearnedRevenues = entireReviewRewardList.filter(
      //   //   (reward) => !reward.isValid && reward.contributionRate < 1,
      //   // );

      //   const { profitAmount, revenueAmount, withdrawalAmount } = entireReviewRewardList[0].user;
      //   console.log('profitAmount', profitAmount);
      //   console.log('revenueAmount', revenueAmount);
      //   console.log('withdrawalAmount', withdrawalAmount);

      //   // const unearnedProfit = unearnedRevenues.reduce((accumulator, currentValue) => {
      //   //   return accumulator + currentValue.profitAmount;
      //   // }, 0);
      //   // const unearnedRevenue = unearnedRevenues.reduce((accumulator, currentValue) => {
      //   //   return accumulator + (currentValue.revenueAmount ?? 0);
      //   // }, 0);

      //   // 인증리뷰어 계산추가
      //   const certifiedReviewerRewards = entireReviewRewardList.filter(
      //     ({ revenueType, isValid, certifiedReviewerReward }) =>
      //       (revenueType === Constants.REWARD_TYPE.CERTIFIED_REVIEWER_REWARD ||
      //         (revenueType === Constants.REWARD_TYPE.DEDUCT && certifiedReviewerReward < 0)) &&
      //       isValid,
      //   );
      //   let certifiedReviewerReward = certifiedReviewerRewards.reduce(
      //     (accumulator, currentValue) => {
      //       return accumulator + currentValue.profitAmount + currentValue.certifiedReviewerReward;
      //     },
      //     0,
      //   );
      //   //

      //   // dispatch(setUnearnedRevenue({ unearnedRevenue }));
      //   // dispatch(setUnearnedProfit({ unearnedProfit }));
      //   dispatch(
      //     setUser({
      //       user: {
      //         profitAmount: profitAmount,
      //         certifiedReviewerReward: certifiedReviewerReward,
      //         revenueAmount,
      //         withdrawalAmount: withdrawalAmount ?? 0,
      //       },
      //     }),
      //   );
      // }

      const [totalRewardResult, currencyRateResult] = await Promise.all([
        getTotalReward,
        getCurrencyRate,
      ]);

      if (totalRewardResult.success) {
        dispatch(setTotalReward({ totalReward: totalRewardResult.reward }));
        dispatch(setTotalRevenue({ totalRevenue: totalRewardResult.totalRevenue }));
        dispatch(
          setUser({
            user: {
              _id: props.route.params?.logonUserId,
            },
          }),
        );
      }

      if (currencyRateResult?.success) {
        console.log(currencyRateResult.currencyRate.toString());
        Preference.set('KRW/USD', currencyRateResult.currencyRate.toString());
        dispatch(setCurrencyRate({ currencyRate: currencyRateResult.currencyRate }));
      }
    } catch (err) {
      console.error('loadTotalReward error', err);
    }
  };

  const logout = useCallback(() => {
    //Singular.unsetCustomUserId();
    APIprovider.clearRequester();
    Preference.set('userId', null);
    Preference.set('userName', '');
    Preference.set('userProfilePicUrl', '');
    // Preference.set('userIsSeller', 'false');
    Preference.set('userIsSeller', '');
    Preference.set('userAccessToken', null);
    props.route.params.setLogonUserId(null);
    props.route.params.setLogonUserName('');
    props.route.params.setLogonUserProfilePicUrl('');
    // props.route.params.setLogonUserIsSeller('false');
    props.route.params.setLogonUserIsSeller('');
    props.navigation.navigate('NotSignedIn');
    props.navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'NotSignedIn' }],
      }),
    );

    store.dispatch(setGuest({ isGuest: false }));
  }, [props.navigation, props.route.params]);
  function onPreviewEnded(index, isSnapped = true) {
    const nextIndex = index === videoListRecommended.length - 1 ? 0 : index + 1;

    if (!isSnapped) {
      // 재생이 끝나면 다음 영상으로 자동 이동한다. 기존 carousel ref는 옛
      // snap-carousel용이라 항상 null이었고 ?.로 삼켜져 동작하지 않았다.
      scrollFeedToIndex(nextIndex);
    }

    setPrevFocusedIndex(focusedIndexRef.current);
    focusedIndexRef.current = nextIndex;
    setFocusedIndex(nextIndex);
  }
  function onPreviewLoaded(index) {
    if (index === focusedIndex) {
      setPreviewChanging(false);
    }
  }

  function onStoreItemLoaded({ specialPrice }) {
    setDiscountedProductList(specialPrice.productList);
  }

  const MainVideoItem = ({ item, index }) => {
    return (
      <SliderEntry
        key={`slide_entry_${item.videoId}`}
        data={item}
        // dataType={recommendedKeyword}
        dataType={currentListType}
        dataList={videoListRecommended}
        dataSortType={recommendedSortType}
        even={true}
        index={index}
        height={feedHeight}
        focusedIndex={focusedIndex}
        paused={isPreviewChanging}
        navigation={props.navigation}
        onPreviewEnded={onPreviewEnded}
        onPreviewLoaded={onPreviewLoaded}
        ref={(sliderEntry) => {
          sliderEntryList[item.videoId] = sliderEntry;
        }}
        carouselRef={carousel}
        onVideoIndexChanged={(_index) => {
          focusedIndexRef.current = _index;
          setFocusedIndex(_index);
          setTimeout(() => {
            scrollFeedToIndex(_index, false);
          }, 0);
        }}
        onVideoListChanged={(changedList) => {
          setVideoListRecommended(changedList);
        }}
        isSheetOpened={isSheetOpened}
      />
    );
  };

  const VideoList = (videoListType) => {
    if (getVideoList(videoListType) && getVideoList(videoListType).length > 0) {
      return (
        <View style={styles.sectionContainer}>
          <View>
            <TouchableNativeFeedback
              onPress={() => {
                props.navigation.navigate('VideoList', { listOf: videoListType });
              }}
            >
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>{getVideoListTitle(videoListType)}</Text>
                <FastImage
                  style={styles.sectionTitleMoreIcon}
                  source={require('../Resources/img/iconRenewal/icCommonTitle20W.png')}
                />
              </View>
            </TouchableNativeFeedback>
            <FlatGrid
              onScrollToIndexFailed={(info) => {
                const wait = new Promise((resolve) => setTimeout(resolve, 500));
                wait.then(() => {
                  videoListRef.recent?.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                  });
                });
              }}
              onTouchStart={() => {
                console.log('onTouchStart', idRef.current);
                clearTimeout(idRef.current);
              }}
              ref={videoListRef[videoListType]}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              itemDimension={Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT}
              spacing={Constants.VIDEO_LIST_SPACING}
              data={getVideoList(videoListType)}
              renderItem={({ item, index }) => {
                if (item.type === 'more') {
                  return MoreVideoCard({
                    videoListType,
                    navigation: props.navigation,
                  });
                } else {
                  return VideoListItem({
                    dataType: videoListType,
                    dataSortType: 'recent',
                    dataList: getVideoList(videoListType),
                    data: item,
                    index,
                    navigation: props.navigation,
                  });
                }
              }}
              keyExtractor={(item) => {
                // console.log('VideoList flatlist', item.videoId)
                // return item.videoId + '_' + uuid.v4();
                return item.videoId;
              }}
              style={{
                height: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT,
                marginBottom: -10,
                paddingLeft: 20,
              }}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={15}
            />
          </View>
        </View>
      );
    }
  };

  function RenderDots({ activeIndex, setPaginationSlidePos }) {
    const beginPos = 0;
    const endPos = videoListRecommended.length - 8;
    // let paginationSlidePosVar = paginationSlidePos;
    const [paginationSlidePosVar, setPaginationSlidePosVar] = useState(paginationSlidePos);

    useEffect(() => {
      if (
        paginationSlidePosVar === activeIndex &&
        paginationSlidePosVar > beginPos &&
        prevFocusedIndex > activeIndex
      ) {
        setPaginationSlidePos(activeIndex - 1);

        // paginationSlidePosVar = activeIndex - 1;
        setPaginationSlidePosVar(activeIndex - 1);

        scrollViewRef.current.scrollTo({
          x: paginationSlidePosVar * 34,
          animated: true,
        });
      }
      if (
        paginationSlidePosVar + 8 === activeIndex &&
        paginationSlidePosVar < endPos &&
        prevFocusedIndex < activeIndex
      ) {
        setPaginationSlidePos(activeIndex - 7);

        // paginationSlidePosVar = activeIndex - 7;
        setPaginationSlidePosVar(activeIndex - 7);

        scrollViewRef.current.scrollTo({
          x: paginationSlidePosVar * 34,
          animated: true,
        });
      }
      // }, [activeIndex, endPos, paginationSlidePosVar, setPaginationSlidePos]);
      return () => {};

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return videoListRecommended.map((item, i) => (
      <View key={i} style={styles.paginationDotContainer}>
        <View
          style={activeIndex === i ? styles.paginationActiveDot : styles.paginationInactiveDot}
        />
      </View>
    ));
  }

  useEffect(() => {
    SplashScreen.hide();

    if (initialNotification) {
      if (initialNotification.type === 'qna') {
        props.navigation.navigate('QNAChat', {
          qnaId: initialNotification.qnaId,
        });
      }
    }
    pushNotifications.setNotificationHandler((notification) => {
      // 알림 클릭을 이용해 바로 링크가 되는 경우
      const data = notification.data;

      if (data.isTouchEvent && Constants.PAGE_SCREEN_NAMES.includes(data.navigationParams?.page)) {
        props.navigation.navigate(data.navigationParams.page, data.navigationParams?.params);
      }

      if (data.type === 'default') {
        return;
      }
      if (data.type === 'notification') {
        props.navigation.navigate('Notification');
      } else if (data.type === 'video') {
        props.navigation.navigate('VideoPage', {
          videoId: data.id,
        });
      } else if (data.type === 'mypage') {
        props.navigation.navigate('Profile');
      } else if (data.type === 'user') {
        props.navigation.navigate('UserPage', {
          userId: data.id,
        });
      } else if (data.type === 'qna') {
        props.navigation.navigate('QNAChat', {
          qnaId: data.qnaId,
        });
      } else if (data.type === 'store') {
        props.navigation.navigate('Store');
      }
    });
    Preference.get('userId').then(async (value) => {
      if (value) {
        // Check user token
        const dispatchContext = global.dispatch;
        const userfbToken = await pushNotifications.getDeviceToken();
        const deviceLanguage =
          Platform.OS === 'ios'
            ? NativeModules.SettingsManager.settings.AppleLocale ||
              NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
            : NativeModules.I18nManager.localeIdentifier;
        const locale = deviceLanguage.substring(0, 2);
        const location = await DeviceCountry.getCountryCode();
        dispatchContext({
          type: REGION.SET,
          value: location.code.toLowerCase() === 'kr' || locale === 'ko' ? 'kr' : 'us',
        });
        const profile = {
          userfbToken,
          locale,
          region: location.code.toLowerCase() === 'kr' || locale === 'ko' ? 'kr' : 'us',
        };

        if (mountedRef.current) {
          APIprovider.logon(profile)
            .then((result) => {
              if (result && !result.success) {
                console.error('result && !result.success logout', result.message);
                return logout();
              }
              // result가 null이면 아래 접근에서 크래시하던 버그 가드
              if (!result) {
                return;
              }

              if (result.notificationIsReadCnt > 0) {
                setNewNotifications(true);
              }
              Preference.get('RecommendedListTypeIndex').then(async (index) => {
                if (!index) {
                  index = 0;
                }
                index = ++index % recommendedTypeList.length;
                Preference.set('RecommendedListTypeIndex', index.toString());

                // setState 직후 recommendedKeyword를 읽으면 이전 렌더 값(stale)이라
                // 방금 선택한 키워드를 지역 변수로 직접 사용한다.
                const newKeyword = recommendedTypeList[index].keyword;
                setRecommendedKeyword(newKeyword);

                Preference.set('currentListType', newKeyword);
                setCurrentListType(newKeyword);

                // recommendedSortType = recommendedTypeList[index].sortType;
                setRecommendedSortType(recommendedTypeList[index].sortType);

                await loadMainData({ isInitial: true });
                await loadTotalReward(value);
                // loadData();
                setOnLoad(false);

                if (!__DEV__) {
                  if (isGuestUser(props.route.params?.logonUserId)) {
                    // await bootChannelIO({ name: getUniqueIdSync() });
                  } else {
                    const userDetail = await APIprovider.getUserDetails(value);
                    if (userDetail && userDetail.countryCode) {
                      dispatch(setCountryCode(userDetail.countryCode));
                      dispatch(setUser({ user: userDetail }));
                    }
                    // await bootChannelIO(userDetail);
                  }
                }
                Preference.get('previousPage').then((previousPage) => {
                  console.log('previousPage', previousPage, value);

                  if (previousPage && value !== '63a126963389e30449162c3b') {
                    Preference.set('previousPage', '');
                    const [page, pageId] = previousPage.split('/');

                    return pageRoutingFunctions[page](props.navigation, pageId);
                  }
                });

                Preference.get(`helpBubble[${Constants.HELP_BUBBLE_PAGE_KEY.MAIN}]`).then((res) => {
                  if (res) {
                    setHelpBubbleIndex(+res);
                  }
                });

                if (props.route.params?.initialRoute !== 'Home') {
                  props.navigation.navigate(props.route.params?.initialRoute);
                }
              });
            })
            .catch((err) => {
              console.error('logon error', err);

              logout();
            });
        }
      } else {
        props.navigation.navigate('NotSignedIn');
        props.navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'NotSignedIn' }],
          }),
        );
      }
    });

    return () => {
      mountedRef.current = false;
    };

    // }, [global.dispatch, logout, props.navigation]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [videoScrollIdx, setVideoScrollIdx] = useState(0);

  const [myState, setMyState] = useState(null);
  const idRef = useRef();

  const handlePress = () => {
    // console.log('handlePress');
    let id = setTimeout(() => {
      animatedEvent();
    }, 2000);
    idRef.current = id;
  };

  // function videoScrollEvent() {
  //   videoListRef.recent?.current?.scrollToIndex({ index: videoScrollIdx, animated: true });
  // }

  useEffect(() => {
    handlePress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoScrollIdx]);
  useEffect(() => {
    const timer = idRef.current;

    return () => clearTimeout(timer);
  }, [videoScrollIdx, animatedEvent]);

  const animatedEvent = useCallback(() => {
    videoListRef.recent?.current?.scrollToIndex({ index: videoScrollIdx });

    if (videoScrollIdx > 29) {
      setVideoScrollIdx(0);
    } else {
      setVideoScrollIdx(videoScrollIdx + 1);
    }
  }, [videoListRef.recent, videoScrollIdx]);

  // onMomentumScrollEnd는 천천히 끌었다 놓으면 momentum 없이 끝나 누락된다.
  // 가시성 기준으로 판정해야 세로 피드에서 인덱스가 새지 않는다.
  // FlatList가 prop 교체를 허용하지 않으므로 ref에 담아 identity를 고정한다.
  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    const first = viewableItems && viewableItems[0];
    if (!first || first.index === null || first.index === undefined) {
      return;
    }
    if (focusedIndexRef.current === first.index) {
      return;
    }
    setPrevFocusedIndex(focusedIndexRef.current);
    focusedIndexRef.current = first.index;
    setFocusedIndex(first.index);
  });

  const scrollFeedToIndex = (index, animated = true) => {
    const list = props.scrollRef?.current;
    if (!list || typeof list.scrollToIndex !== 'function') {
      return;
    }
    if (index < 0 || index >= videoListRecommended.length) {
      return;
    }
    list.scrollToIndex({ index, animated });
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Constants.TIER_COLORS.GIVER }}>
      <View
        style={{
          ...styles.headerBarContainer,
          flexDirection: 'column',
          paddingTop: Platform.OS === 'android' ? insets.top : 0,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <FastImage
            style={styles.logo}
            source={require('../Resources/img/newIcon/greyd-logo-new.png')}
          />

          <ToggleTextButton screenType={screenType} setScreenType={setScreenType} />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActionButton
              renderItem={
                <FastImage
                  style={styles.headerButton}
                  source={
                    // isNewNotifications > 0
                    //   ? require('../Resources/img/newIcon/alarmNotification.png')
                    //   : require('../Resources/img/newIcon/alarm.png')
                    isNewNotifications > 0
                      ? require('../Resources/img/iconRenewal/alarm-on.png')
                      : require('../Resources/img/iconRenewal/alarm.png')
                  }
                />
              }
              onPress={() => {
                if (isGuestUser(props.route.params?.logonUserId)) {
                  return LogoutAlert(props);
                }
                navigation.navigate('Notification');
                setNewNotifications(false);
              }}
            />
            <ActionButton
              renderItem={
                <FastImage
                  style={styles.headerButton}
                  // source={require('../Resources/img/newIcon/search.png')}
                  source={require('../Resources/img/iconRenewal/search.png')}
                />
              }
              onPress={() => navigation.navigate('Search')}
            />
          </View>
        </View>
        {/* <ToggleTextButton screenType={screenType} setScreenType={setScreenType} /> */}
        {!isGuestUser(props.route.params?.logonUserId) && screenType === 0 ? (
          <View
            style={{
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: '100%', alignItems: 'flex-end', marginTop: 20 }}>
              <Reward navigation={navigation} />
            </View>
          </View>
        ) : null}
      </View>

      {screenType === 0 ? (
        <View
          style={styles.container}
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            if (height > 0 && height !== feedHeight) {
              setFeedHeight(height);
            }
          }}
        >
          <Animated.FlatList
            ref={props.scrollRef}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            initialNumToRender={2}
            pagingEnabled={true}
            legacyImplementation={false}
            data={videoListRecommended}
            renderItem={MainVideoItem}
            extraData={`${videoListRecommended.length}_${focusedIndex}_${feedHeight}`}
            windowSize={3}
            maxToRenderPerBatch={2}
            removeClippedSubviews={Platform.OS === 'android'}
            keyExtractor={(item) => item?._id}
            onViewableItemsChanged={onViewableItemsChangedRef.current}
            viewabilityConfig={viewabilityConfigRef.current}
            getItemLayout={
              feedHeight
                ? (data, i) => ({ length: feedHeight, offset: feedHeight * i, index: i })
                : undefined
            }
            onScrollToIndexFailed={({ index }) => {
              const list = props.scrollRef?.current;
              list?.scrollToOffset?.({ offset: index * (feedHeight || 0), animated: true });
            }}
            style={{ width: Dimensions.get('window').width, height: '100%' }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                tintColor={Constants.TIER_COLORS.ARTISAN}
                onRefresh={() => {
                  Preference.get('RecommendedListTypeIndex').then((index) => {
                    if (!index) {
                      index = 0;
                    }
                    index = ++index % recommendedTypeList.length;
                    Preference.set('RecommendedListTypeIndex', index.toString());

                    // stale state 대신 방금 선택한 키워드를 직접 사용
                    const newKeyword = recommendedTypeList[index].keyword;
                    setRecommendedKeyword(newKeyword);

                    Preference.set('currentListType', newKeyword);
                    setCurrentListType(newKeyword);

                    // recommendedSortType = recommendedTypeList[index].sortType;
                    setRecommendedSortType(recommendedTypeList[index].sortType);

                    loadMainData({ isInitial: false });
                  });
                  // loadData();
                }}
              />
            }
            onEndReachedThreshold={2}
            onEndReached={async ({ distanceFromEnd }) => {
              if (distanceFromEnd >= 0 && videoListRecommended.length >= 10) {
                const offset = videoListRecommended[videoListRecommended.length - 1].createdAt;
                isVideoListLoadingMain = true;
                const keyword = await Preference.get('currentListType');
                APIprovider.getVideoList('random', keyword, '', '', 0, 18)
                  // APIprovider.getVideoList(recommendedKeyword, recommendedSortType, "", offset, videoListRecommended.length, 18)
                  .then((data) => {
                    // const newVideoSet = new Set([...videoListRecommended, ...data.videoList]);
                    // setVideoListRecommended([...newVideoSet]);
                    const ids = new Set();
                    const newVideos = [];
                    for (const video of [...videoListRecommended, ...data.videoList]) {
                      const prevSize = ids.size;
                      ids.add(video._id);
                      if (ids.size > prevSize) {
                        newVideos.push(video);
                      }
                    }
                    setVideoListRecommended(newVideos);

                    // setVideoListRecommended([...videoListRecommended, ...data.videoList]);
                    isVideoListLoadingMain = false;
                  })
                  .catch(() => {
                    isVideoListLoadingMain = false;
                  });
              }
            }}
          />
          {/* <Carousel
          ref={carousel}
          data={videoListRecommended}
          renderItem={MainVideoItem}
          sliderWidth={Dimensions.get('window').width}
          itemWidth={Dimensions.get('window').width}

          swipeThreshold={5}
          onBeforeSnapToItem={(index) => {
            if (focusedIndex !== index) {
              onPreviewEnded(index - 1);
            }
          }}
          onEndReached={async ({ distanceFromEnd }) => {
            if (distanceFromEnd >= 0 && videoListRecommended.length >= 10) {
              const offset = videoListRecommended[videoListRecommended.length - 1].createdAt;
              isVideoListLoadingMain = true;
              const keyword = await Preference.get('currentListType');
              APIprovider.getVideoList('random', keyword, '', '', 0, 18)
                // APIprovider.getVideoList(recommendedKeyword, recommendedSortType, "", offset, videoListRecommended.length, 18)
                .then((data) => {
                  // const newVideoSet = new Set([...videoListRecommended, ...data.videoList]);
                  // setVideoListRecommended([...newVideoSet]);
                  const ids = new Set();
                  const newVideos = [];
                  for (const video of [...videoListRecommended, ...data.videoList]) {
                    const prevSize = ids.size;
                    ids.add(video._id);
                    if (ids.size > prevSize) {
                      newVideos.push(video);
                    }
                  }
                  setVideoListRecommended(newVideos);

                  // setVideoListRecommended([...videoListRecommended, ...data.videoList]);
                  isVideoListLoadingMain = false;
                })
                .catch(() => {
                  isVideoListLoadingMain = false;
                });
            }
          }}
          onEndReachedThreshold={2}
        /> */}

          {/* {onLoad ? null : (
          <MainBottomSheet navigation={navigation} setSheetOpened={setSheetOpened} />
        )} */}

          {/* <View style={styles.paginationContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={{ width: 310 }}
            disableIntervalMomentum={true}
            horizontal={true}
            pagingEnabled={true}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
          >
            <View style={{ marginHorizontal: -18 }}>
              <Pagination
                dotsLength={videoListRecommended.length}
                activeDotIndex={focusedIndex}
                dotContainerStyle={{
                  borderColor: Constants.TIER_COLORS.ARTISAN,
                  borderWidth: 1,
                  marginHorizontal: 2,
                }}
                renderDots={(activeIndex) => (
                  <RenderDots
                    activeIndex={activeIndex}
                    setPaginationSlidePos={setPaginationSlidePos}
                  />
                )}
              />
            </View>
          </ScrollView>
        </View> */}
        </View>
      ) : (
        <DiscoverScreenWrapper navigation={navigation} />
      )}
      {/* <MainBottomSheet
          navigation={navigation}
          setSheetOpened={setSheetOpened}
          logonUserId={props.route.params?.logonUserId}
        /> */}
      {onLoad ? null : (
        <>
          {/* <MainBottomSheet navigation={navigation} setSheetOpened={setSheetOpened} /> */}
          {/* {popupImage ? <EventPageModal navigation={navigation} popupImage={popupImage} /> : null} */}
          {eventBanner ? (
            <EventModalCarousel navigation={navigation} eventBanner={eventBanner} />
          ) : null}
        </>
      )}
      <Shadow distance={20} stretch={true} containerStyle={{ zIndex: 100 }}>
        <View style={{ height: 0.1 }} />
      </Shadow>
      <HelpBubble
        type={Constants.HELP_BUBBLE_PAGE_KEY.MAIN}
        helpBubbleIndex={helpBubbleIndex}
        onPress={() => {
          if (helpBubbleIndex <= 2) {
            Preference.set(
              `helpBubble[${Constants.HELP_BUBBLE_PAGE_KEY.MAIN}]`,
              (helpBubbleIndex + 1).toString(),
            );
            setHelpBubbleIndex(helpBubbleIndex + 1);
          }
        }}
      />
    </View>
  );
}

// const slideHeight =
//   Dimensions.get('window').width * 1.5 > Dimensions.get('window').height * 0.618
//     ? Dimensions.get('window').height * 0.618
//     : Dimensions.get('window').width * 1.5;
// const slideHeight = Dimensions.get('window').height * 0.85;
const slideHeight = getDeviceHeight(false) * 0.9;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  logo: {
    width: 86,
    height: 32,
  },
  headerBarContainer: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    // paddingHorizontal: 20,
    // paddingVertical: 20,
    padding: 20,
    marginTop: Platform.OS === 'ios' ? getIPhoneHeaderMarginTop() : 0,
    zIndex: 1,
  },
  headerButton: {
    width: 24,
    height: 24,
  },
  paginationContainer: {
    position: 'absolute',
    top: slideHeight - 60,
    alignSelf: 'center',
  },
  paginationDotContainer: {
    marginHorizontal: 2,
    paddingVertical: 4,
  },
  paginationActiveDot: {
    width: 30,
    height: 2,
    backgroundColor: Constants.TIER_COLORS.ARTISAN,
  },
  paginationInactiveDot: {
    width: 30,
    height: 2,
    // backgroundColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  slider: {
    overflow: 'visible', // for custom animations
  },
  sliderContentContainer: {
    paddingTop: 0, // for custom animation
  },
  sectionContainer: {
    // marginTop: 35,
    paddingTop: 35,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  sectionTitleContainer: {
    marginLeft: 10,
    marginBottom: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    // fontSize: 19,
    fontSize: 20,
    // fontWeight: 'bold',
    color: Constants.TIER_COLORS.ARTISAN,
    // fontFamily: 'DancingScript-Regular',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  sectionTitleMoreIcon: {
    marginLeft: 5,
    width: 12,
    height: 20,
  },
  moreVideoCardContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH,
    height: Constants.VIDEO_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
    borderRadius: 4,
    marginRight: 10,
  },
  moreVideoCardButton: {
    justifyContent: 'center',
    width: Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2,
    height:
      Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - Constants.VIDEO_LIST_ITEM_VIEW_FOOTER_HEIGHT,
    backgroundColor: 'rgb(31, 31, 31)',
    borderRadius: 6,
  },
  moreVideoCardMoreIcon: {
    marginLeft: 5,
    width: 10,
    height: 16,
  },
  moreVideoCardTitle: {
    flexDirection: 'column',
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 14,
    alignSelf: 'center',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  myRewardContainer: {
    width: 'auto',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myRewardContent: { fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM, fontSize: 14, color: 'white' },
});

import { useNavigation, useScrollToTop } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import Carousel from 'react-native-snap-carousel';
import { SectionGrid } from 'react-native-super-grid';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';
import { useDispatch, useSelector } from 'react-redux';
import UserListItemView from '../screens/UserPageScreen/UserListItemView';
import {
  fetchMainReviews,
  fetchMoreMainReviews,
  fetchMoreMainUsers,
  fetchMoreReviews,
  fetchMoreUsers,
  fetchReviews,
  fetchUsers,
  setCurrentReviewCateogry,
} from '../slices/review';
import APIprovider from './APIprovider';
import Constants from './Constants';
import CuratedKProducts from './CustomComponents/CuratedKProducts';
import MainBanner from './CustomComponents/EventBanner/MainBanner';
import HotShimmerView from './CustomComponents/ShimmerView/HotShimmerView';
import RecentShimmerView from './CustomComponents/ShimmerView/RecentShimmerView';
import Strings, { getLanguage } from './Strings';
import VideoListItemView from './VideoListItemView';
import SortingKeywordSelector, {
  USER_SORTING_KEYWORD_LIST,
  VIDEO_SORTING_KEYWORD_LIST,
} from './Views/SortingKeywordSelector';
import { getIPhoneHeaderMarginTop } from './utils';
import { horizontalScale, moderateScale, verticalScale } from './utils/scailing';

function ReviewCategoryHeader({
  isRefresh,
  headerScrollRef,
  setCategoryIndex,
  currentReviewCategory,
}) {
  const dispatch = useDispatch();

  return useMemo(
    () => (
      <View style={styles.categorySectionHeader}>
        <ScrollView
          ref={headerScrollRef}
          showsHorizontalScrollIndicator={false}
          style={{
            height: verticalScale(24),
            marginHorizontal: horizontalScale(20),
          }}
          horizontal={true}
        >
          <View style={{ flexDirection: 'row' }}>
            {Constants.DISCOVER_SCREEN_CATEGORY_LIST.map((category, index) => {
              return (
                <TouchableNativeFeedback
                  onPress={() => {
                    if (!isRefresh) {
                      dispatch(setCurrentReviewCateogry(category.key));
                      setCategoryIndex(
                        Constants.DISCOVER_SCREEN_CATEGORY_LIST.findIndex(
                          (c) => c.key === category.key,
                        ),
                      );
                    }
                  }}
                  key={index}
                >
                  <View
                    style={{
                      // marginRight: horizontalScale(20),
                      justifyContent: 'center',
                      borderBottomWidth: horizontalScale(
                        category.key === currentReviewCategory ? 3 : 0,
                      ),
                      borderBottomColor: Constants.COLOR_MAIN,
                      paddingBottom: 5,
                      paddingHorizontal: 10,
                    }}
                  >
                    <Text
                      style={{
                        ...styles.categorySectionTitle,
                        color:
                          category.key === currentReviewCategory ? Constants.COLOR_MAIN : '#e6e6e6',
                      }}
                    >
                      {category.title}
                    </Text>
                  </View>
                </TouchableNativeFeedback>
              );
            })}
          </View>
        </ScrollView>
        <View
          style={{
            height: verticalScale(1),
            backgroundColor: 'grey',
            marginHorizontal: horizontalScale(20),
          }}
        />
      </View>
    ),
    [currentReviewCategory, dispatch, headerScrollRef, isRefresh, setCategoryIndex],
  );
}

function GreydGuide({ navigation }) {
  return useMemo(
    () => (
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginTop: verticalScale(10),
            marginHorizontal: horizontalScale(20),
          }}
          contentContainerStyle={{
            // marginHorizontal: horizontalScale(17),
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            // flexWrap: 'wrap',
          }}
        >
          {Constants.GREYD_GUIDE_LIST.map((category) => (
            <View
              style={{
                flexDirection: 'column',
                marginBottom: horizontalScale(30),
                // marginRight: horizontalScale(34),
                // width: '25%',
              }}
              key={category.key}
            >
              <Pressable
                onPress={() => {
                  if (category.title === Strings.GREYD_GUIDE_TIER_DESCRIPTION) {
                    return navigation.navigate('TierGuide', {
                      category: category.title,
                    });
                  }

                  return navigation.navigate('VideoGuide', {
                    videoUrl:
                      getLanguage() === 'ko' ? category.url?.video?.ko : category.url?.video?.en,
                    category: category.title,
                  });
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      borderWidth: horizontalScale(2),
                      borderColor: 'white',
                      backgroundColor: '#292929',
                      marginBottom: horizontalScale(10),
                      width: moderateScale(62),
                      height: moderateScale(62),
                      borderRadius: 100,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FastImage
                      style={{
                        // borderWidth:
                        //   category.title === Strings.GREYD_GUIDE_WHAT_IS_GREYD
                        //     ? 0
                        //     : horizontalScale(0.5),
                        borderColor: 'white',
                        backgroundColor: '#292929',
                        width:
                          category.title === Strings.GREYD_GUIDE_WHAT_IS_GREYD
                            ? moderateScale(28)
                            : '100%',
                        height:
                          category.title === Strings.GREYD_GUIDE_WHAT_IS_GREYD
                            ? moderateScale(28)
                            : '100%',
                        borderRadius: 100,
                      }}
                      source={category.image}
                    />
                  </View>
                </View>
                <View
                  style={{
                    alignItems: 'center',
                    width: getLanguage() === 'ko' ? '100%' : horizontalScale(60),
                  }}
                >
                  <Text numberOfLines={2} style={styles.guideTitle}>
                    {category.title}
                  </Text>
                </View>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
    ),
    [navigation],
  );
}

function EventCarousel() {
  function renderItem({ item, index }) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <FastImage
          style={{
            width: 13,
            height: 13,
            marginRight: horizontalScale(5),
            marginVertical: 5,
          }}
          source={require('../Resources/img/newIcon/event-icon.png')}
        />
        <Text style={{ fontFamily: 'SUIT-Medium', fontSize: moderateScale(10), color: '#A0A0A0' }}>
          당신의 일상과 경험을 부담없이
          <Text style={{ color: Constants.COLOR_MAIN }}> {item.title} 공유</Text>
          하세요!
        </Text>
      </View>
    );
  }

  return (
    <Carousel
      data={[
        {
          title: 'Item 1',
          text: 'Text 1',
        },
        {
          title: 'Item 2',
          text: 'Text 2',
        },
        {
          title: 'Item 3',
          text: 'Text 3',
        },
        {
          title: 'Item 4',
          text: 'Text 4',
        },
        {
          title: 'Item 5',
          text: 'Text 5',
        },
      ]}
      renderItem={renderItem}
      sliderHeight={25}
      itemHeight={60}
      autoplay={true}
      autoplayDelay={3000}
      autoplayInterval={3000}
      vertical={true}
      loop={true}
      // enableSnap={false}
      windowSize={1}
      scrollEnabled={false}
      useScrollView={true}
    />
  );
}

// function EventBanner() {
//   return (
//     <View style={{ marginBottom: horizontalScale(20) }}>
//       <Pressable onPress={() => {}}>
//         <Shadow
//           distance={15}
//           // sides={{ top: false, start: false }}
//           // corners={{ topStart: false }} //, topEnd: false, bottomStart: false
//           style={{
//             // backgroundColor: '#4a4a4a',
//             height: verticalScale(50),
//             borderWidth: horizontalScale(1),
//             borderColor: Constants.COLOR_BACKGROUND_DARK, // Constants.COLOR_MAIN,
//             borderRadius: 14,
//             justifyContent: 'center',
//             alignItems: 'center',
//           }}
//           containerStyle={{ marginHorizontal: horizontalScale(20) }}
//           stretch={true}
//         >
//           <Text style={{ fontFamily: 'SUIT-Bold', fontSize: moderateScale(16), color: '#d5d5d5' }}>
//             지금 바로 출석체크하고
//             <Text style={{ color: Constants.COLOR_MAIN }}> 포인트 </Text>
//             받기! (매일 지급)
//           </Text>
//         </Shadow>
//       </Pressable>

//       <View
//         style={{
//           marginTop: 10,
//           flexDirection: 'row',
//           justifyContent: 'space-between',
//           marginHorizontal: horizontalScale(20),
//         }}
//       >
//         <View
//           style={{
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             backgroundColor: '#343434', //'#2a2a2a',
//             borderColor: Constants.COLOR_BACKGROUND_DARK,
//             borderRadius: 4,
//             borderWidth: horizontalScale(0.5),
//             paddingRight: 23,
//             paddingLeft: 5,
//           }}
//         >
//           <EventCarousel />
//           {/* <FastImage
//             style={{
//               width: 13,
//               height: 13,
//               marginRight: horizontalScale(5),
//               marginVertical: 5,
//             }}
//             source={require('../Resources/img/newIcon/event-icon.png')}
//           />
//           <Text
//             style={{ fontFamily: 'SUIT-Medium', fontSize: moderateScale(10), color: '#A0A0A0' }}
//           >
//             당신의 일상과 경험을 부담없이
//             <Text style={{ color: Constants.COLOR_MAIN }}> 공유</Text>
//             하세요!
//           </Text> */}
//         </View>
//         <View style={{ marginVertical: 5 }}>
//           <Text
//             style={{ fontFamily: 'SUIT-Medium', fontSize: moderateScale(10), color: '#A0A0A0' }}
//           >
//             2022.09.15 16:30 기준
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// }

function ReviewBox({ listTitle, reviewList, navigation, setIndex, videoCategory }) {
  // return useMemo(
  //   () => (
  //     <View>
  //       <SectionGrid
  //         listKey={listTitle}
  //         stickySectionHeadersEnabled
  //         showsVerticalScrollIndicator={false}
  //         style={{
  //           marginHorizontal: 10,
  //           marginBottom: listTitle === Strings.HOT_REVIEWER ? 10 : 0,
  //         }}
  //         itemDimension={
  //           listTitle === Strings.HOT_REVIEWER
  //             ? horizontalScale(100)
  //             : Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2
  //         }
  //         spacing={moderateScale(Constants.VIDEO_LIST_SPACING)}
  //         sections={[
  //           {
  //             title: 'reviewList',
  //             data: reviewList,
  //           },
  //         ]}
  //         renderSectionHeader={() => {
  //           return (
  //             <View
  //               style={{
  //                 ...styles.sectionContainer,
  //                 marginBottom: verticalScale(10),
  //                 marginHorizontal: horizontalScale(10),
  //               }}
  //             >
  //               <Pressable
  //                 style={{
  //                   flexDirection: 'row',
  //                   alignItems: 'center',
  //                   justifyContent: 'space-between',
  //                 }}
  //                 onPress={() => {
  //                   const tabIndex = reviewIndex.findIndex(
  //                     (reviewTitle) => reviewTitle === listTitle,
  //                   );
  //                   setIndex(tabIndex);
  //                 }}
  //               >
  //                 <Text
  //                   style={{
  //                     fontSize: moderateScale(20),
  //                     fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  //                     color: Constants.TIER_COLORS.ARTISAN,
  //                   }}
  //                 >
  //                   {listTitle}
  //                 </Text>
  //                 <FastImage
  //                   style={styles.sectionTitleMoreIcon}
  //                   source={require('../Resources/img/iconRenewal/icCommonTitle20W.png')}
  //                 />
  //               </Pressable>
  //             </View>
  //           );
  //         }}
  //         renderItem={({ item }) => {
  //           return listTitle === Strings.HOT_REVIEWER ? (
  //             <UserListItemView
  //               navigation={navigation}
  //               user={item}
  //               mode={'list_horizontal'}
  //               outline={false}
  //             />
  //           ) : (
  //             <VideoListItemView
  //               style={{
  //                 height: Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - verticalScale(90),
  //                 // marginBottom: horizontalScale(40),
  //                 marginBottom: horizontalScale(-20),
  //               }}
  //               navigation={navigation}
  //               data={item}
  //               dataType={'recent'}
  //               dataSortType={Constants.VIDEO_LIST_SORT_TYPE.RECENT}
  //               dataList={reviewList}
  //             />
  //           );
  //         }}
  //         keyExtractor={(item) => item._id}
  //       />
  //     </View>
  //   ),
  //   [listTitle, navigation, reviewList, setIndex],
  // );
  return useMemo(
    () => (
      <View>
        <SectionGrid
          listKey={listTitle}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          style={{
            marginHorizontal: 10,
          }}
          itemDimension={Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2}
          spacing={moderateScale(Constants.VIDEO_LIST_SPACING)}
          sections={[
            {
              title: 'reviewList',
              data: reviewList,
            },
          ]}
          renderSectionHeader={() => {
            return (
              <View
                style={{
                  ...styles.sectionContainer,
                  marginBottom: verticalScale(10),
                  marginHorizontal: horizontalScale(10),
                }}
              >
                <Pressable
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => {
                    const tabIndex = reviewIndex.findIndex(
                      (reviewTitle) => reviewTitle === listTitle,
                    );
                    setIndex(tabIndex);
                  }}
                >
                  <Text
                    style={{
                      fontSize: moderateScale(20),
                      fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
                      color: Constants.TIER_COLORS.ARTISAN,
                    }}
                  >
                    {listTitle}
                  </Text>
                  <FastImage
                    style={styles.sectionTitleMoreIcon}
                    source={require('../Resources/img/iconRenewal/icCommonTitle20W.png')}
                  />
                </Pressable>
              </View>
            );
          }}
          renderItem={({ item }) => (
            <VideoListItemView
              style={{
                height: Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - verticalScale(90),
                marginBottom: horizontalScale(-20),
              }}
              navigation={navigation}
              data={item}
              dataType={'recent'}
              dataSortType={Constants.VIDEO_LIST_SORT_TYPE.RECENT}
              dataList={reviewList}
              videoCategory={videoCategory}
            />
          )}
          keyExtractor={(item) => item._id}
        />
      </View>
    ),
    // videoCategory는 부모 상태와 함께 갱신 — 아래 deps 변경 시에만 재생성하는 의도
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listTitle, navigation, reviewList, setIndex],
  );
}

function ReviewBoxMoreButton({ fetchMoreData, listTitle }) {
  return (
    <Pressable
      onPress={() => {
        fetchMoreData({ limit: listTitle === Strings.HOT_REVIEWER ? 6 : 4 });
      }}
    >
      <Shadow
        // sides={{ top: false, start: false }}
        // corners={{ topStart: false }} //, topEnd: false, bottomStart: false
        // startColor="#1a1a1a"
        // endColor="#3a3a3a"
        distance={0.5}
        style={{
          // backgroundColor: '#4a4a4a',
          justifyContent: 'center',
          alignItems: 'center',
          height: verticalScale(45),
          borderRadius: 14,
          backgroundColor: 'white',
        }}
        containerStyle={{
          marginTop: verticalScale(0),
          marginBottom: horizontalScale(30),
          marginHorizontal: horizontalScale(20),
        }}
        stretch={true}
      >
        <Text
          style={{
            fontSize: moderateScale(16),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
            color: Constants.TIER_COLORS.ARTISAN,
          }}
        >
          {Strings.MORE}
        </Text>
      </Shadow>
    </Pressable>
  );
}

function CategoryReviewHeader({
  listTitle,
  fetchData,
  setSortType,
  sectionListRef,
  isShownFilterSelector,
  setShownFilterSelector,
  currentReviewCategory,
}) {
  const sortDownIcon = require('../Resources/img/iconRenewal/icSortDown22.png');
  const sortUpIcon = require('../Resources/img/iconRenewal/icSortUp22.png');

  const [activeSortingItem, setActiveSortingItem] = useState('');

  useEffect(() => {
    setActiveSortingItem(
      listTitle === Strings.HOT_REVIEWER
        ? Strings.SORTING_KEYWORD_RECENT_ACCOUNT_CREATED
        : Strings.SORTING_KEYWORD_RECENT,
    );
  }, [listTitle]);

  return (
    <View
      style={{
        ...styles.sectionContainer,
        marginHorizontal: horizontalScale(20),
        marginBottom: horizontalScale(10),
        zIndex: 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: moderateScale(20),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
            color: Constants.TIER_COLORS.ARTISAN,
          }}
        >
          {listTitle}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          setShownFilterSelector(!isShownFilterSelector);
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: moderateScale(15),
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
              color: Constants.COLOR_POINT_BLUE,
            }}
          >
            {activeSortingItem}
          </Text>
          <FastImage source={isShownFilterSelector ? sortUpIcon : sortDownIcon} />
        </View>
      </Pressable>
      {isShownFilterSelector && (
        <SortingKeywordSelector
          top={28}
          items={
            listTitle === Strings.HOT_REVIEWER
              ? USER_SORTING_KEYWORD_LIST
              : VIDEO_SORTING_KEYWORD_LIST
          }
          activeItem={activeSortingItem}
          onItemPress={(selectedItem) => {
            setActiveSortingItem(selectedItem);
            setShownFilterSelector(false);

            let sortType =
              selectedItem === Strings.SORTING_KEYWORD_SCORE
                ? Constants.VIDEO_LIST_SORT_TYPE.SCORE
                : selectedItem === Strings.SORTING_KEYWORD_VIEW
                  ? Constants.VIDEO_LIST_SORT_TYPE.VIEW
                  : selectedItem === Strings.SORTING_KEYWORD_RECENT
                    ? Constants.VIDEO_LIST_SORT_TYPE.RECENT
                    : undefined;

            if (listTitle === Strings.HOT_REVIEWER) {
              sortType =
                selectedItem === Strings.SORTING_KEYWORD_RECENT_ACCOUNT_CREATED
                  ? Constants.USER_LIST_SORT_TYPE.RECENT_ACCOUNT_CREATED
                  : selectedItem === Strings.SORTING_KEYWORD_RECENT_REVIEW_UPLOADED
                    ? Constants.USER_LIST_SORT_TYPE.RECENT_REVIEW_UPLOADED
                    : selectedItem === Strings.SORTING_KEYWORD_REVIEW_COUNT
                      ? Constants.USER_LIST_SORT_TYPE.REVIEW_COUNT
                      : selectedItem === Strings.SORTING_KEYWORD_VIEW
                        ? Constants.USER_LIST_SORT_TYPE.VIEW_COUNT
                        : selectedItem === Strings.SORTING_KEYWORD_SCORE
                          ? Constants.USER_LIST_SORT_TYPE.SCORE
                          : selectedItem === Strings.SORTING_KEYWORD_REVENUE_AMOUNT
                            ? Constants.USER_LIST_SORT_TYPE.REVENUE_AMOUNT
                            : undefined;
            }

            sectionListRef?.current?.scrollToLocation({
              sectionIndex: 0,
              itemIndex: 0,
            });
            console.log(sortType);
            setSortType(sortType);
            fetchData({
              category: currentReviewCategory,
              sortType,
              skip: 0,
              limit: listTitle === Strings.HOT_REVIEWER ? 15 : 16,
            });
          }}
        />
      )}
    </View>
  );
}

function CategoryReviewBody({
  isRefresh,
  reviewList,
  listTitle,
  navigation,
  fetchData,
  fetchMoreData,
  reviewListEntireCount,
  sortType,
  sectionListRef,
  isShownFilterSelector,
  currentReviewCategory,
}) {
  // https://stackoverflow.com/questions/53408470/flatlist-onendreached-being-called-multiple-times
  const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);

  return useMemo(
    () => (
      <SectionGrid
        ref={sectionListRef}
        refreshControl={
          <RefreshControl
            tintColor={Constants.TIER_COLORS.ARTISAN}
            refreshing={isRefresh}
            onRefresh={() => {
              fetchData({
                category: currentReviewCategory,
                sortType,
                skip: 0,
                limit: listTitle === Strings.HOT_REVIEWER ? 15 : 16,
              });
            }}
          />
        }
        listKey={listTitle}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        style={{ marginBottom: verticalScale(40), marginHorizontal: 10 }} // 80
        itemDimension={
          listTitle === Strings.HOT_REVIEWER
            ? horizontalScale(100)
            : Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2
        }
        spacing={moderateScale(Constants.VIDEO_LIST_SPACING)}
        sections={[
          {
            title: 'reviewList',
            data: reviewList,
          },
        ]}
        renderItem={({ item }) => {
          return listTitle === Strings.HOT_REVIEWER ? (
            <UserListItemView
              navigation={navigation}
              user={item}
              mode={'list_horizontal'}
              isShownFilterSelector={isShownFilterSelector}
            />
          ) : (
            <VideoListItemView
              style={{
                height: Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - verticalScale(90),
                // marginBottom: horizontalScale(40),
                marginBottom: horizontalScale(-20),
              }}
              navigation={navigation}
              data={item}
              dataType={'recent'}
              dataSortType={Constants.VIDEO_LIST_SORT_TYPE.RECENT}
              dataList={reviewList}
              // onVideoListChanged={changedReviewList =>
              //   console.log('changedReviewList', changedReviewList)
              // }
              // onVideoIndexChanged={index => {
              //   console.log('onVideoIndexChanged', index);
              // }}
              isShownFilterSelector={isShownFilterSelector}
              videoCategory={currentReviewCategory}
            />
          );
        }}
        keyExtractor={(item) => item._id}
        onEndReachedThreshold={0.1}
        onMomentumScrollBegin={() => setOnEndReachedCalledDuringMomentum(false)}
        onEndReached={async ({ distanceFromEnd }) => {
          if (
            reviewList.length > 10 &&
            reviewList.length < reviewListEntireCount &&
            !onEndReachedCalledDuringMomentum
          ) {
            console.log('onEndReached', reviewList.length, reviewListEntireCount, sortType);
            await fetchMoreData({
              category: currentReviewCategory,
              sortType,
              skip: reviewList?.length,
              limit: listTitle === Strings.HOT_REVIEWER ? 15 : 16,
            });
            setOnEndReachedCalledDuringMomentum(true);
          }
        }}
      />
    ),
    [
      sectionListRef,
      isRefresh,
      listTitle,
      reviewList,
      fetchData,
      currentReviewCategory,
      sortType,
      navigation,
      isShownFilterSelector,
      reviewListEntireCount,
      onEndReachedCalledDuringMomentum,
      fetchMoreData,
    ],
  );
}

function CategoryReviews({ navigation, currentReviewCategory }) {
  const reviews = useSelector((state) => state.review[currentReviewCategory]);
  const dispatch = useDispatch();

  const [isRefresh, setIsRefresh] = useState(false);
  const [isShownFilterSelector, setShownFilterSelector] = useState(false);
  const [sortType, setSortType] = useState(
    currentReviewCategory === Constants.VIDEO_LIST_HOT_REVIEWER
      ? Constants.USER_LIST_SORT_TYPE.RECENT_ACCOUNT_CREATED
      : Constants.VIDEO_LIST_SORT_TYPE.RECENT,
  );
  const sectionListRef = useRef(null);

  const fetchData = useCallback(
    ({ category, sortType, skip, limit }) => {
      setIsRefresh(true);

      dispatch(
        category === Constants.VIDEO_LIST_HOT_REVIEWER
          ? fetchUsers({
              listOf: Constants.USER_LIST_LATEST_RECOMMENDED,
              sortType,
              skip,
              limit,
            })
          : fetchReviews({
              listType: category,
              sortType,
              skip,
              limit,
            }),
      );
      setIsRefresh(false);
    },
    [dispatch],
  );

  const fetchMoreData = useCallback(
    ({ category, sortType, skip, limit }) => {
      // console.log('fetchMoreData!!!@!', category, sortType, skip, limit);
      return dispatch(
        category === Constants.VIDEO_LIST_HOT_REVIEWER
          ? fetchMoreUsers({
              listOf: Constants.USER_LIST_LATEST_RECOMMENDED,
              sortType,
              skip,
              limit,
            })
          : fetchMoreReviews({
              listType: category,
              sortType,
              skip,
              limit,
            }),
      );
    },
    [dispatch],
  );
  useEffect(() => {
    // console.log(currentReviewCategory, reviews?.count, reviews?.loading, reviews?.error);
    if (!reviews?.data?.length) {
      fetchData({
        category: currentReviewCategory,
        limit: currentReviewCategory === Constants.VIDEO_LIST_HOT_REVIEWER ? 15 : 16,
      });
    }
  }, [currentReviewCategory, fetchData, reviews]);

  if (!reviews?.data?.length) {
    return null;
  }

  return (
    <View style={{ marginTop: 20 }}>
      <CategoryReviewHeader
        listTitle={Constants.MAIN_VIDEO_LIST_TITLE[currentReviewCategory]}
        currentReviewCategory={currentReviewCategory}
        fetchData={fetchData}
        setSortType={setSortType}
        sectionListRef={sectionListRef}
        isShownFilterSelector={isShownFilterSelector}
        setShownFilterSelector={setShownFilterSelector}
      />
      <CategoryReviewBody
        listTitle={Constants.MAIN_VIDEO_LIST_TITLE[currentReviewCategory]}
        reviewList={reviews?.data}
        reviewListEntireCount={reviews?.count}
        currentReviewCategory={currentReviewCategory}
        fetchData={fetchData}
        fetchMoreData={fetchMoreData}
        isRefresh={isRefresh}
        navigation={navigation}
        sortType={sortType}
        sectionListRef={sectionListRef}
        isShownFilterSelector={isShownFilterSelector}
      />
    </View>
  );
}

export default function DiscoverScreenWrapper(props) {
  const ref = React.useRef(null);
  useScrollToTop(ref);

  return <NewDiscoverScreen {...props} scrollRef={ref} />;
}

const ReviewHome = ({ route }) => {
  // const { navigation } = route.props;
  const navigation = useNavigation();
  const headerScrollRef = useRef(null);

  const [isRefresh, setIsRefresh] = useState(false);
  const [categoryIndex, setCategoryIndex] = useState(0);

  const dispatch = useDispatch();
  const reviewMain = useSelector((state) => state.review.reviewMain);
  const currentReviewCategory = useSelector((state) => state.review.currentReviewCategory);

  useEffect(() => {
    if (currentReviewCategory === Constants.VIDEO_LIST_HOME) {
      if (
        // !reviewMain?.hotReviewer?.length ||
        !reviewMain?.recent?.length ||
        !reviewMain?.trending?.length ||
        !reviewMain?.worstProduct?.length ||
        !reviewMain?.abroad?.length
      ) {
        console.log('fetchMainData 발동!!');
        fetchMainData();
      }
    }
    // reviewMain 길이는 조건 검사용 — deps에 넣으면 응답 도착마다 재실행됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentReviewCategory, fetchMainData]);

  const fetchMainData = useCallback(() => {
    setIsRefresh(true);
    try {
      dispatch(fetchMainReviews());
      setIsRefresh(false);
    } catch (err) {
      setIsRefresh(false);
      console.log(err);
    }
  }, [dispatch]);

  const fetchMoreDataFunctions = {
    [Constants.VIDEO_LIST_HOT_REVIEWER]: async ({ sortType, limit }) => {
      setIsRefresh(true);
      dispatch(
        (currentReviewCategory === Constants.VIDEO_LIST_HOME ? fetchMoreMainUsers : fetchMoreUsers)(
          {
            listOf: Constants.USER_LIST_LATEST_RECOMMENDED,
            sortType,
            skip: reviewMain[Constants.VIDEO_LIST_HOT_REVIEWER].length,
            limit,
          },
        ),
      );
      setIsRefresh(false);
    },
    [Constants.VIDEO_LIST_RECENT]: async ({ sortType, limit }) => {
      setIsRefresh(true);

      dispatch(
        (currentReviewCategory === Constants.VIDEO_LIST_HOME
          ? fetchMoreMainReviews
          : fetchMoreReviews)({
          listType: Constants.VIDEO_LIST_RECENT,
          sortType,
          skip: reviewMain[Constants.VIDEO_LIST_RECENT].length,
          limit,
        }),
      );

      setIsRefresh(false);
    },
    [Constants.VIDEO_LIST_TRENDING]: async ({ sortType, limit }) => {
      setIsRefresh(true);

      dispatch(
        (currentReviewCategory === Constants.VIDEO_LIST_HOME
          ? fetchMoreMainReviews
          : fetchMoreReviews)({
          listType: Constants.VIDEO_LIST_TRENDING,
          sortType,
          skip: reviewMain[Constants.VIDEO_LIST_TRENDING].length,
          limit,
        }),
      );

      setIsRefresh(false);
    },
    [Constants.VIDEO_LIST_WORSTPRODUCT]: async ({ sortType, limit }) => {
      setIsRefresh(true);

      dispatch(
        (currentReviewCategory === Constants.VIDEO_LIST_HOME
          ? fetchMoreMainReviews
          : fetchMoreReviews)({
          listType: Constants.VIDEO_LIST_WORSTPRODUCT,
          sortType,
          skip: reviewMain[Constants.VIDEO_LIST_WORSTPRODUCT].length,
          limit,
        }),
      );

      setIsRefresh(false);
    },
    [Constants.VIDEO_LIST_ABROAD]: async ({ sortType, limit }) => {
      setIsRefresh(true);

      dispatch(
        (currentReviewCategory === Constants.VIDEO_LIST_HOME
          ? fetchMoreMainReviews
          : fetchMoreReviews)({
          listType: Constants.VIDEO_LIST_ABROAD,
          sortType,
          skip: reviewMain[Constants.VIDEO_LIST_ABROAD].length,
          limit,
        }),
      );

      setIsRefresh(false);
    },
    [Constants.VIDEO_LIST_FOLLOWING]: async ({ sortType, limit }) => {
      setIsRefresh(true);

      dispatch(
        (currentReviewCategory === Constants.VIDEO_LIST_HOME
          ? fetchMoreMainReviews
          : fetchMoreReviews)({
          listType: Constants.VIDEO_LIST_FOLLOWING,
          sortType,
          skip: reviewMain[Constants.VIDEO_LIST_FOLLOWING].length,
          limit,
        }),
      );

      setIsRefresh(false);
    },
    [Constants.VIDEO_LIST_SCORE_EVENT]: async ({ sortType, limit }) => {
      setIsRefresh(true);

      dispatch(
        (currentReviewCategory === Constants.VIDEO_LIST_HOME
          ? fetchMoreMainReviews
          : fetchMoreReviews)({
          listType: Constants.VIDEO_LIST_SCORE_EVENT,
          sortType,
          skip: reviewMain[Constants.VIDEO_LIST_SCORE_EVENT].length,
          limit,
        }),
      );

      setIsRefresh(false);
    },
  };

  return (
    <View style={{ height: '100%', marginTop: verticalScale(0) }}>
      {
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={{ marginBottom: verticalScale(0) }} // 50
          refreshControl={
            <RefreshControl
              tintColor={Constants.TIER_COLORS.ARTISAN}
              refreshing={isRefresh}
              onRefresh={() => {
                fetchMainData();
              }}
            />
          }
          ListHeaderComponent={
            <View>
              {/* <GreydGuide navigation={navigation} /> */}
              <MainBanner navigation={navigation} eventBanner={reviewMain?.eventBanner} />
              <ReviewMainHeaderCategories navigation={navigation} />
              {(!reviewMain || reviewMain.loading) && <RecentShimmerView />}
              {reviewMain && !reviewMain.loading
                ? Object.keys(reviewMain)
                    .filter((category) => category !== 'eventBanner')
                    .map((videoCategory, idx) => {
                      if (videoCategory === 'loading' || videoCategory === 'error') {
                        return;
                      }

                      if (!reviewMain[videoCategory]?.length) {
                        return;
                      }

                      const listTitle =
                        Constants.MAIN_VIDEO_LIST_TITLE[videoCategory] || Strings.HOT_REVIEWER;

                      return (
                        <View key={listTitle + '_' + idx}>
                          <ReviewBox
                            listTitle={listTitle}
                            reviewList={reviewMain[videoCategory]}
                            navigation={navigation}
                            setIndex={route.setIndex}
                            videoCategory={videoCategory}
                          />
                          <ReviewBoxMoreButton
                            fetchMoreData={fetchMoreDataFunctions[videoCategory]}
                            listTitle={listTitle}
                          />
                        </View>
                      );
                    })
                : null}
            </View>
          }
        />
      }
      {/* <Shadow distance={50} stretch={true} containerStyle={{ zIndex: 100 }}>
        <View style={{ height: 0.1 }} />
      </Shadow> */}
    </View>
  );
};

const HotReviewer = ({ route }) => {
  const { navigation } = route.props;
  const reviewMain = useSelector((state) => state.review.reviewMain);

  if (!reviewMain || reviewMain.loading) {
    return <HotShimmerView />;
  }

  return (
    <View style={styles.container}>
      <CategoryReviews navigation={navigation} currentReviewCategory={'hotReviewer'} />
    </View>
  );
};

const ReviewTabByCategory = ({ route }) => {
  const { navigation } = route.props;
  const reviewMain = useSelector((state) => state.review.reviewMain);

  if (!reviewMain || reviewMain.loading) {
    // return <RecentShimmerView />;
  }

  return (
    <View style={styles.reviewContainer}>
      <CategoryReviews navigation={navigation} currentReviewCategory={route.key} />
    </View>
  );
};

// const CuratedKProduct = ({ route }) => {
//   const { navigation } = route.props;
//   const reviewMain = useSelector((state) => state.review.reviewMain);

//   if (!reviewMain || reviewMain.loading) {
//     // return <RecentShimmerView />;
//   }

//   return (
//     <View style={styles.reviewContainer}>
//       <CategoryReviews navigation={navigation} currentReviewCategory={route.key} />
//     </View>
//   );
// };

function ReviewMainHeaderCategories({ navigation }) {
  return (
    <ScrollView
      showsHorizontalScrollIndicator={false}
      horizontal
      style={{
        marginHorizontal: horizontalScale(20),
        height: verticalScale(85),
        marginBottom: verticalScale(10),
      }}
    >
      {Constants.CATEGORY_LIST.map(({ key, title, activeIcon, deactiveIcon }, index) => {
        return (
          <View key={key + '-' + index} style={{ marginRight: horizontalScale(20) }}>
            <Pressable
              style={{ height: 54, width: 54, backgroundColor: Constants.COLOR_BACKGROUND_DARK }}
              onPress={() =>
                navigation.navigate('VideoList', {
                  listOf: Constants.VIDEO_LIST_CATEGORY,
                  categoryCode: key,
                  category: title,
                })
              }
            >
              <View
                style={{
                  borderRadius: 14,
                  // borderWidth: 1,
                  borderColor: '#3a3a3a',
                  justifyContent: 'center',
                  width: 54,
                  height: 54,
                }}
              >
                <FastImage
                  style={{
                    alignSelf: 'center',
                    width: moderateScale(24),
                    height: moderateScale(24),
                  }}
                  source={deactiveIcon}
                />
              </View>

              <Text
                style={{
                  textAlign: 'center',
                  color: Constants.TIER_COLORS.ARTISAN,
                  fontSize: moderateScale(13),
                  fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
                  // paddingTop: 5,
                }}
              >
                {title}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const renderScene = SceneMap({
  [Constants.VIDEO_LIST_HOME]: ReviewHome,
  // [Constants.VIDEO_LIST_SCORE_EVENT]: ReviewTabByCategory,
  [Constants.VIDEO_LIST_CURATED_K_PRODUCT]: CuratedKProducts,
  [Constants.VIDEO_LIST_RECENT]: ReviewTabByCategory,
  [Constants.VIDEO_LIST_TRENDING]: ReviewTabByCategory,
  [Constants.VIDEO_LIST_WORSTPRODUCT]: ReviewTabByCategory,
  [Constants.VIDEO_LIST_ABROAD]: ReviewTabByCategory,
  [Constants.VIDEO_LIST_FOLLOWING]: ReviewTabByCategory,
  // [Constants.VIDEO_LIST_HOT_REVIEWER]: HotReviewer,
});

let reviewIndex = [
  '',
  // Strings.SCORE_EVENT_REVIEWS,
  Strings.CURATED_K_PRODUCT,
  Strings.NEWEST_REVIEWS,
  Strings.TRENDING_REVIEWS,
  Strings.WORSTPRODUCT_REVIEWS,
  Strings.ABROAD_REVIEWS,
  Strings.FOLLOWING_REVIEWS,
  // Strings.HOT_REVIEWER,
];

function NewDiscoverScreen(props) {
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: Constants.VIDEO_LIST_HOME, title: Strings.HOME, props, setIndex },
    // { key: Constants.VIDEO_LIST_SCORE_EVENT, title: Strings.SCORE_EVENT_REVIEWS, props },
    { key: Constants.VIDEO_LIST_CURATED_K_PRODUCT, title: Strings.CURATED_K_PRODUCT, props },
    { key: Constants.VIDEO_LIST_RECENT, title: Strings.NEW, props },
    {
      key: Constants.VIDEO_LIST_TRENDING,
      title: Strings.TRENDING_REVIEWS.replace(' 리뷰', ''),
      props,
    },
    {
      key: Constants.VIDEO_LIST_WORSTPRODUCT,
      title: Strings.WORSTPRODUCT_REVIEWS.replace(' 리뷰', ''),
      props,
    },
    { key: Constants.VIDEO_LIST_ABROAD, title: Strings.ABROAD_REVIEWS.replace(' 리뷰', ''), props },
    {
      key: Constants.VIDEO_LIST_FOLLOWING,
      title: Strings.FOLLOWING_REVIEWS.replace(' 리뷰', ''),
      props,
    },
    // {
    //   key: Constants.VIDEO_LIST_HOT_REVIEWER,
    //   title: Strings.HOT,
    //   props,
    // },
  ]);
  const [globalGroupBuyingCount, setGlobalGroupBuyingCount] = useState(0);

  async function fetchData() {
    const response = await APIprovider.getGlobalGroupBuyings();
    console.log('response', response.globalGroupBuyings.length);

    if (response.success) {
      setGlobalGroupBuyingCount(response.globalGroupBuyings.length);
      if (response.globalGroupBuyings.length < 1) {
        const ckIndex = reviewIndex.findIndex(
          (reviewType) => reviewType === Strings.CURATED_K_PRODUCT,
        );
        reviewIndex = reviewIndex.slice(0, ckIndex).concat(reviewIndex.slice(ckIndex + 1));

        const ckRouteIndex = routes.findIndex(
          (route) => route.key === Constants.VIDEO_LIST_CURATED_K_PRODUCT,
        );
        if (ckRouteIndex > 0) {
          let newRoutes = routes.slice(0, ckRouteIndex).concat(routes.slice(ckRouteIndex + 1));
          setRoutes(newRoutes);
        }
      }
    }
  }

  useEffect(() => {
    fetchData();
    // 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={{ ...styles.container, backgroundColor: Constants.TIER_COLORS.GIVER }}>
      <View style={styles.container}>
        {/* <Header navigation={props.navigation} screenTitle={Strings.REVIEW} /> */}
        <TabView
          sceneContainerStyle={{ marginTop: verticalScale(0) }}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          // renderTabBar={(tabBarProps) => (
          //   <TabBar
          //     scrollEnabled
          //     {...tabBarProps}
          //     tabStyle={{ width: 'auto', margin: -10 }}
          //     style={{ backgroundColor: Constants.TIER_COLORS.EXPLORER }}
          //     indicatorStyle={{ backgroundColor: Constants.TIER_COLORS.EXPLORER }}
          //     indicatorContainerStyle={{ borderBottomColor: Constants.TIER_COLORS.EXPLORER }}
          //     renderLabel={({ route, focused }) => {
          //       switch (route.key) {
          //         // case 'curatedKProduct1':
          //         //   return (
          //         //     <LinearGradient
          //         //       colors={[
          //         //         '#FF0000',
          //         //         '#FF7F00',
          //         //         '#FFFF00',
          //         //         '#00FF00',
          //         //         '#0000FF',
          //         //         '#4B0082',
          //         //         '#8B00FF',
          //         //       ]}
          //         //       style={{ width: '100%', height: '100%' }}
          //         //       start={{ x: 0, y: 0 }}
          //         //       end={{ x: 1, y: 0 }}
          //         //     >
          //         //       <View style={{ width: '100%', height: '100%' }}>
          //         //         <Text
          //         //           style={
          //         //             focused ? styles.curatedTabBarLabelFocused : styles.curatedTabBarLabel
          //         //           }
          //         //         >
          //         //           {route.title}
          //         //         </Text>
          //         //       </View>
          //         //     </LinearGradient>
          //         //   );

          //         case 'curatedKProduct':
          //           return (
          //             <View
          //               style={{ ...styles.tabBarLabelContainer(focused), flexDirection: 'row' }}
          //             >
          //               <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
          //                 {route.title}
          //               </Text>
          //               <Text
          //                 style={{
          //                   color: 'red',
          //                   paddingLeft: 4,
          //                   fontSize: 10,
          //                   fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
          //                 }}
          //               >
          //                 N
          //               </Text>
          //             </View>
          //           );

          //         default:
          //           return (
          //             <View style={styles.tabBarLabelContainer(focused)}>
          //               <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
          //                 {route.title}
          //               </Text>
          //             </View>
          //           );
          //       }
          //     }}
          //   />
          // )}
          // renderTabBar={renderTabBar}
          renderTabBar={(tabBarProps) => (
            <TabBar
              scrollEnabled
              {...tabBarProps}
              tabStyle={{ width: 'auto', margin: -10 }}
              style={{ backgroundColor: Constants.TIER_COLORS.EXPLORER }}
              indicatorStyle={{ backgroundColor: Constants.TIER_COLORS.EXPLORER }}
              indicatorContainerStyle={{ borderBottomColor: Constants.TIER_COLORS.EXPLORER }}
            />
          )}
          commonOptions={{
            label: ({ route, labelText, focused, color }) => {
              // 기존 switch-case 로직
              switch (route.key) {
                case 'curatedKProduct':
                  return (
                    <View
                      style={{
                        ...styles.tabBarLabelContainer(focused),
                        flexDirection: 'row',
                      }}
                    >
                      <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                        {route.title}
                      </Text>
                      <Text
                        style={{
                          color: 'red',
                          paddingLeft: 4,
                          fontSize: 10,
                          fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
                        }}
                      >
                        N
                      </Text>
                    </View>
                  );

                default:
                  return (
                    <View style={styles.tabBarLabelContainer(focused)}>
                      <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                        {route.title}
                      </Text>
                    </View>
                  );
              }
            },
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    marginTop: getIPhoneHeaderMarginTop() + 7 + (Platform.OS === 'ios' ? 0 : 4),
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  tabs: {
    flex: 1,
    marginHorizontal: horizontalScale(10),
  },
  reviewRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    marginBottom: horizontalScale(-20),
  },
  categorySectionHeader: {},
  categorySectionTitle: {
    color: '#e6e6e6',
    fontSize: moderateScale(16), //14
    fontFamily: 'SUIT-Bold',
  },
  guideTitle: {
    color: '#e6e6e6',
    fontSize: moderateScale(12),
    fontFamily: 'SUIT-Bold',
    textAlign: 'center',
  },

  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: horizontalScale(20),
    marginBottom: horizontalScale(5),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    color: '#e6e6e6',
    fontFamily: 'SUIT-Bold',
  },
  sectionTitleMoreIcon: {
    marginLeft: horizontalScale(5),
    width: horizontalScale(12),
    height: verticalScale(20),
  },
  moreVideoCardContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: horizontalScale(Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH),
    height: verticalScale(Constants.VIDEO_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT),
    borderRadius: 4,
    marginRight: horizontalScale(10),
  },
  moreVideoCardButton: {
    justifyContent: 'center',
    width: Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2,
    height: verticalScale(
      Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - Constants.VIDEO_LIST_ITEM_VIEW_FOOTER_HEIGHT,
    ),
    backgroundColor: 'rgb(31, 31, 31)',
    borderRadius: 6,
  },
  moreVideoCardMoreIcon: {
    marginLeft: horizontalScale(5),
    width: horizontalScale(10),
    height: verticalScale(16),
  },
  moreVideoCardTitle: {
    flexDirection: 'column',
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: moderateScale(14),
    alignSelf: 'center',
  },
  tabBarLabelFocused: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
  },
  tabBarLabel: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },

  curatedTabBarLabelFocused: {
    color: Constants.TIER_COLORS.PIONEER,
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
  },
  curatedTabBarLabel: {
    color: Constants.TIER_COLORS.PIONEER,
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
  tabBarLabelContainer: (focused) => {
    return {
      backgroundColor: focused ? Constants.COLOR_POINT_BLUE : Constants.COLOR_BACKGROUND_DARK,
      width: focused ? '150%' : '100%',
      paddingVertical: 7.5,
      paddingHorizontal: 20,
    };
  },
  rainbowTab: {
    // width: '100%',
    // height: '100%',
    justifyContent: 'center',
    // alignItems: 'center',
    // borderRadius: 10,
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
  },
});

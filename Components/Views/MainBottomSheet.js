import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import InsetShadow from 'react-native-inset-shadow';
import Animated from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import APIprovider from '../APIprovider';
import Constants from '../Constants';
// import PatchedReanimatedBottomSheet from '../PatchedReanimatedBottomSheet';
import Strings from '../Strings';
import { getDeviceHeight, horizontalScale, moderateScale, verticalScale } from '../utils/scailing';
import VideoListItemView from '../VideoListItemView';
import SortingKeywordSelector, { VIDEO_SORTING_KEYWORD_LIST } from './SortingKeywordSelector';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getIPhoneHeaderMarginTop, isGuestUser } from '../utils';
import LinearGradient from 'react-native-linear-gradient';
import Reward from '../Common/Reward';

function BottomSheetContent({
  navigation,
  reviewCategory,
  mainReviewFlatListRef,
  setReviewCategory,
  onChangeCategory,
  activeSortingItem,
  sortUpIcon,
  sortDownIcon,
  setActiveSortingItem,
  setShownFilterSelector,
  isReviewsRefreshing,
  dataType,
  isShownFilterSelector,
  reviewList,
  reviewListEntireCount,
  onListEndReached,
  logonUserId,
}) {
  return (
    <View
      style={{
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        marginTop: getIPhoneHeaderMarginTop() + 32 + 20,
        // height: getDeviceHeight(true) * 0.86,
      }}
    >
      <View style={{ marginTop: verticalScale(15), height: '100%' }}>
        <View
          style={{ ...styles.sectionContainer, marginHorizontal: horizontalScale(20), zIndex: 1 }}
        >
          <Animated.FlatList
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={{
              backgroundColor: Constants.COLOR_BACKGROUND_DARK,
            }}
            horizontal={true}
            data={[
              {
                key: '',
                title: Strings.CATEGORY_ALL,
                activeIcon: require('../../Resources/newIcon/7.3.png'),
                deactiveIcon: require('../../Resources/newIcon/7.2.png'),
              },
              ...Constants.CATEGORY_LIST,
            ]}
            renderItem={({ item: category, index }) => (
              <View style={{ marginRight: horizontalScale(20) }} key={category.key + '-' + index}>
                <View
                  style={{
                    height: 54,
                    width: 54,
                    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
                  }}
                >
                  {/* <InsetShadow
                    top={reviewCategory === category.key ? true : false}
                    left={reviewCategory === category.key ? true : false}
                    top={false}
                    left={false}
                    right={false}
                    bottom={false}
                    shadowOffset={1}
                    shadowOpacity={0.8}
                    shadowRadius={5}
                    elevation={25}
                    containerStyle={{ borderRadius: 15 }}
                  > */}
                  <TouchableNativeFeedback
                    onPress={async () => {
                      mainReviewFlatListRef?.current?.scrollToOffset({
                        offset: 0,
                      });
                      setReviewCategory(category.key);
                      await onChangeCategory(category.key);
                    }}
                    key={index}
                  >
                    <View
                      style={{
                        borderRadius: 14,
                        borderWidth: reviewCategory === category.key ? 0.5 : 0,
                        borderColor: Constants.TIER_COLORS.STRIVER,
                        justifyContent: 'center',
                        width: 54,
                        height: 54,
                      }}
                    >
                      <FastImage
                        style={{
                          alignSelf: 'center',
                          width: moderateScale(28),
                          height: moderateScale(28),
                        }}
                        source={
                          reviewCategory === category.key
                            ? category.activeIcon
                            : category.deactiveIcon
                        }
                      />
                    </View>
                  </TouchableNativeFeedback>
                  {/* </InsetShadow> */}
                </View>

                <Text
                  style={{
                    textAlign: 'center',
                    // color: reviewCategory === category.key ? 'white' : '#D5D5D5',
                    fontSize: moderateScale(12),
                    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
                    paddingTop: 5,
                    paddingBottom: 10,
                  }}
                >
                  {category.title}
                </Text>
              </View>
            )}
          />

          <View
            style={{
              width: '100%',
              backgroundColor: Constants.TIER_COLORS.ARTISAN,
              height: 0.5,
              marginBottom: 20,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
                color: Constants.TIER_COLORS.ARTISAN,
              }}
            >
              {reviewCategory === ''
                ? Strings.CATEGORY_ALL
                : Constants.CATEGORY_LIST.find((category) => category.key === reviewCategory).title}
            </Text>

            {/* {!isGuestUser(logonUserId) ? (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '100%' }}>
                  <Reward navigation={navigation} />
                </View>
              </View>
            ) : null} */}

            <TouchableOpacity
              onPress={() => {
                setShownFilterSelector(!isShownFilterSelector);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: Constants.TIER_COLORS.ARTISAN,
                    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
                  }}
                >
                  {activeSortingItem}
                </Text>
                <FastImage source={isShownFilterSelector ? sortUpIcon : sortDownIcon} />
              </View>
            </TouchableOpacity>
          </View>

          {isShownFilterSelector && (
            <SortingKeywordSelector
              top={150}
              items={VIDEO_SORTING_KEYWORD_LIST}
              activeItem={activeSortingItem}
              onItemPress={(selectedItem) => {
                setActiveSortingItem(selectedItem);
                setShownFilterSelector(false);

                const sortType =
                  selectedItem === Strings.SORTING_KEYWORD_SCORE
                    ? Constants.VIDEO_LIST_SORT_TYPE.SCORE
                    : selectedItem === Strings.SORTING_KEYWORD_VIEW
                      ? Constants.VIDEO_LIST_SORT_TYPE.VIEW
                      : selectedItem === Strings.SORTING_KEYWORD_RECENT
                        ? Constants.VIDEO_LIST_SORT_TYPE.RECENT
                        : undefined;

                mainReviewFlatListRef?.current?.scrollToOffset({
                  offset: 0,
                });
                onChangeCategory(reviewCategory, sortType);
              }}
            />
          )}
        </View>

        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ref={mainReviewFlatListRef}
          style={{
            marginTop: verticalScale(20),
            marginBottom: verticalScale(20),
            marginHorizontal: horizontalScale(15),
          }}
          contentContainerStyle={{
            justifyContent: 'center',
            alignSelf: 'center',
            alignItems: 'center',
          }}
          refreshControl={
            <RefreshControl
              refreshing={isReviewsRefreshing}
              tintColor={Constants.TIER_COLORS.ARTISAN}
              onRefresh={async () => {
                await onChangeCategory(reviewCategory);
              }}
            />
          }
          data={reviewList}
          key={'#'}
          numColumns={2}
          renderItem={({ item }) => (
            <VideoListItemView
              style={{
                height: Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - 90,
                // marginBottom: 40,
                marginBottom: -20,
                marginHorizontal: 5,
                width: Dimensions.get('window').width / 2 - horizontalScale(25),
              }}
              navigation={navigation}
              data={item}
              dataType={dataType}
              dataSortType={Constants.VIDEO_LIST_SORT_TYPE.RECENT}
              dataList={reviewList}
              onVideoListChanged={
                (_changedReviewList) => { }
                // console.log('changedReviewList', changedReviewList)
              }
              onVideoIndexChanged={(_index) => {
                // console.log('onVideoIndexChanged', index);
                // setTimeout(() => {
                //   mainReviewFlatListRef?.current?.scrollToIndex({
                //     sectionIndex: 0,
                //     itemIndex: Math.floor(index / 2) + 1,
                //   });
                // }, 0);
              }}
              isShownFilterSelector={isShownFilterSelector}
            />
          )}
          keyExtractor={(item) => item.videoId}
          onEndReachedThreshold={2}
          onEndReached={async ({ distanceFromEnd }) => {
            console.log(distanceFromEnd);
            if (reviewList.length > 10 && reviewList.length < reviewListEntireCount) {
              console.log(reviewList.length, reviewListEntireCount);
              await onListEndReached(reviewCategory);
            }
          }}
        />
      </View>
    </View>
  );
}

export default function MainBottomSheet({ navigation, setSheetOpened, logonUserId }) {
  const sortDownIcon = require('../../Resources/img/iconRenewal/icSortDown22.png');
  const sortUpIcon = require('../../Resources/img/iconRenewal/icSortUp22.png');
  const dataType = Constants.VIDEO_LIST_SORT_TYPE.RECENT;

  const sheetRef = useRef(null);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(2);
  const mainReviewFlatListRef = useRef(null);

  const [reviewList, setReviewList] = useState([]);
  const [reviewListEntireCount, setReviewListEntireCount] = useState(0);

  const [reviewCategory, setReviewCategory] = useState('');
  const [isReviewsRefreshing, setReviewsRefreshing] = useState(false);
  const [isShownFilterSelector, setShownFilterSelector] = useState(false);
  const [activeSortingItem, setActiveSortingItem] = useState(Strings.SORTING_KEYWORD_RECENT);

  useEffect(() => {
    console.log('main bottom sheet init');

    onChangeCategory(reviewCategory);
  }, [reviewCategory]);

  function getSortingStatus(selectedItem) {
    return selectedItem === Strings.SORTING_KEYWORD_SCORE
      ? Constants.VIDEO_LIST_SORT_TYPE.SCORE
      : selectedItem === Strings.SORTING_KEYWORD_VIEW
        ? Constants.VIDEO_LIST_SORT_TYPE.VIEW
        : selectedItem === Strings.SORTING_KEYWORD_RECENT
          ? Constants.VIDEO_LIST_SORT_TYPE.RECENT
          : undefined;
  }
  async function onListEndReached(category) {
    setReviewsRefreshing(true);

    const offset = null; //reviewList[reviewList.length - 1].createdAt;
    const sortType = getSortingStatus(activeSortingItem) || Constants.VIDEO_LIST_SORT_TYPE.RECENT;
    const limit = 15;

    if (!category) {
      try {
        const { videoList: addedReviewList } = await APIprovider.getVideoList(
          dataType,
          sortType,
          null,
          offset,
          reviewList.length,
          limit,
        );

        setReviewList([...reviewList, ...addedReviewList]);
      } catch (err) {
        console.log('onListEndReached getVideoList Error', err);
      }
    } else {
      const { videoList: categorizedReviewList } = await APIprovider.getCategorizedVideoList(
        category,
        sortType,
        offset,
        reviewList.length,
        limit,
      );
      setReviewList([...reviewList, ...categorizedReviewList]);
    }

    setReviewsRefreshing(false);
  }

  async function onChangeCategory(category, sortType = undefined) {
    setReviewsRefreshing(true);

    if (!category) {
      const { videoList: recentReviewList, entireCount } = await APIprovider.getVideoList(
        'recent',
        sortType,
        '',
        '',
        0,
        30,
      );

      setReviewList(recentReviewList);
      setReviewListEntireCount(entireCount);
    } else {
      const { videoList: categorizedReviewList, entireCount } =
        await APIprovider.getCategorizedVideoList(category, sortType, '', 0, 30);
      setReviewList(categorizedReviewList);
      setReviewListEntireCount(entireCount);
    }

    if (!sortType) {
      setActiveSortingItem(Strings.SORTING_KEYWORD_RECENT);
    }
    setReviewsRefreshing(false);
  }

  return BottomSheetContent({
    navigation,
    reviewCategory,
    mainReviewFlatListRef,
    setReviewCategory,
    onChangeCategory,
    activeSortingItem,
    sortUpIcon,
    sortDownIcon,
    setActiveSortingItem,
    setShownFilterSelector,
    isReviewsRefreshing,
    dataType,
    isShownFilterSelector,
    reviewList,
    reviewListEntireCount,
    onListEndReached,
    logonUserId,
  });
  // <PatchedReanimatedBottomSheet
  //   enabledContentGestureInteraction={false}
  //   ref={sheetRef}
  //   snapPoints={[getDeviceHeight(true) * 0.83, verticalScale(30), verticalScale(30)]}
  //   initialSnap={2}
  //   renderHeader={() => (
  //     <Shadow
  //       sides={{ bottom: false }}
  //       corners={{ bottomStart: false, bottomEnd: false }}
  //       stretch={true}
  //     >
  //       <View
  //         style={{
  //           backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  //           borderTopLeftRadius: 30,
  //           borderTopRightRadius: 30,
  //           paddingTop: 10,
  //           paddingBottom: 20,
  //         }}
  //       >
  //         <View
  //           style={{
  //             left: Dimensions.get('window').width * 0.5 - horizontalScale(25),
  //           }}
  //         >
  //           <View
  //             onTouchEnd={() => {
  //               console.log('bottomsheet clicked!', bottomSheetIndex);

  //               if (bottomSheetIndex === 2) {
  //                 sheetRef.current.snapTo(0);
  //                 setBottomSheetIndex(0);
  //               } else {
  //                 sheetRef.current.snapTo(2);
  //                 setBottomSheetIndex(2);
  //               }
  //             }}
  //             style={{
  //               width: horizontalScale(50),
  //               height: verticalScale(5),
  //               backgroundColor: Constants.TIER_COLORS.GIVER,
  //               borderRadius: 10,
  //               top: 2,
  //             }}
  //           />
  //         </View>
  //       </View>
  //     </Shadow>
  //   )}
  //   renderContent={() =>
  //     BottomSheetContent({
  //       navigation,
  //       reviewCategory,
  //       mainReviewFlatListRef,
  //       setReviewCategory,
  //       onChangeCategory,
  //       activeSortingItem,
  //       sortUpIcon,
  //       sortDownIcon,
  //       setActiveSortingItem,
  //       setShownFilterSelector,
  //       isReviewsRefreshing,
  //       dataType,
  //       isShownFilterSelector,
  //       reviewList,
  //       reviewListEntireCount,
  //       onListEndReached,
  //     })
  //   }
  //   onOpenEnd={() => {
  //     setBottomSheetIndex(0);
  //     setSheetOpened(true);
  //   }}
  //   onCloseEnd={() => {
  //     setBottomSheetIndex(2);
  //     setSheetOpened(false);
  //   }}
  // />
}

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  leftBorder: {
    width: 25,
    height: moderateScale(4),
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 5,
    transform: [{ rotate: '-30deg' }],
    position: 'absolute',
    left: -22,
  },
  rightBorder: {
    width: 25,
    height: moderateScale(4),
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 5,
    transform: [{ rotate: '-150deg' }],
    position: 'absolute',
    right: -22,
  },
  leftBorder1: {
    width: 43,
    height: moderateScale(24),
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    borderRadius: moderateScale(4),
    transform: [{ rotate: '-30deg' }],
    position: 'absolute',
    left: -34,
    bottom: -12,
    borderTopColor: 'rgba(50, 50, 50, 1)',
    borderTopWidth: 2,
  },
  rightBorder1: {
    width: 43,
    height: moderateScale(24),
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    borderRadius: moderateScale(4),
    transform: [{ rotate: '-150deg' }],
    position: 'absolute',
    right: -34,
    bottom: -12,
    borderBottomColor: 'rgba(50, 50, 50, 1)',
    borderBottomWidth: 2,
  },
  box: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftBorder2: {
    width: 44,
    height: verticalScale(2),
    // backgroundColor: 'red',
    borderRadius: 5,
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15.0,
    elevation: 3,
    position: 'absolute',
    top: -8,
  },
  rightBorder2: {
    width: 44,
    height: verticalScale(2),
    // backgroundColor: 'red',
    borderRadius: 5,
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15.0,
    elevation: 3,
    position: 'absolute',
    top: 26,
  },
});

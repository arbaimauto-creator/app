import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import IconFontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { VideoPageFollowButton } from '../UserPageScreen/UserPageScreen';
import { getIPhoneHeaderMarginTop, isGuestUser } from '../../Components/utils';
import UserListItemView from '../UserPageScreen/UserListItemView';

const G6Chart = React.lazy(() => import('../../Components/CustomComponents/G6/G6Chart'));

function LazyG6Chart({ innerData, innerMaxima }) {
  return (
    <React.Suspense fallback={<View />}>
      <G6Chart innerData={innerData} innerMaxima={innerMaxima} isVideoPage />
    </React.Suspense>
  );
}

function RatingListModal({ context }) {
  const { video, ratingList } = context.state;

  const [g6Rating, setG6Rating] = useState({});
  useEffect(() => {
    if (ratingList) {
      const foundG6Rating = ratingList.find((v) => {
        return v?.user?._id === APIprovider.requesterId;
      });

      if (foundG6Rating && foundG6Rating.g6Score) {
        setG6Rating(foundG6Rating.g6Score);
      }
    }
  }, [ratingList]);

  const MemoizedRatingListModal = (
    <Modal
      animationType="slide"
      transparent={true}
      visible={context.state.isShowingRatingList}
      onRequestClose={() => {
        context.setState({ isShowingRatingList: false });
      }}
    >
      <View style={styles.ratingListModalContainer}>
        <View style={styles.ratingListModalView}>
          <View style={styles.ratingListModalHeaderContainer}>
            <View style={styles.ratingListModalCloseButton} />
            <View style={styles.ratingListModalHeaderRatingContainer}>
              {/* {video.myG6Rating ? (
                <Image
                  style={styles.ratingListModalHeaderRatingIcon}
                  source={require('../../Resources/img/icBadgeGreydOn22.png')}
                />
              ) : (
                <Image
                  style={styles.ratingListModalHeaderRatingIcon}
                  source={require('../../Resources/img/icBadgeGreydOff22.png')}
                />
              )} */}
              <Text
                style={[
                  styles.ratingListModalHeaderRatingTitle,
                  {
                    color: video.myG6Rating ? Constants.COLOR_MAIN : Constants.TIER_COLORS.ARTISAN,
                  },
                ]}
              >
                {Strings.AVERAGE_GRADE} {video.g6AvgRatingScore}
              </Text>
              {/* <Text
                style={[
                  styles.ratingListModalHeaderRatingSubTitle,
                  {
                    color: Constants.TIER_COLORS.ARTISAN,
                  },
                ]}
              >
                {`(${Strings.GREYD_COUNT}  ${video.g6RatingCount})`}
              </Text> */}
            </View>
            <TouchableWithoutFeedback
              onPress={() => {
                context.setState({ isShowingRatingList: false });
              }}
            >
              <FastImage
                style={styles.ratingListModalCloseButton}
                source={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
              />
            </TouchableWithoutFeedback>
          </View>
          <Animated.FlatList
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              context.state.isShowingRatingList && (
                <>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginHorizontal: 20,
                    }}
                    onPress={() => {
                      context.props.navigation.navigate('G6Guide');
                      context.setState({
                        isShowingRatingList: !context.state.isShowingRatingList,
                      });
                    }}
                  >
                    <Text style={styles.userG6}>
                      {context.state.video.author.name}'s
                      <Text style={{ color: Constants.COLOR_MAIN }}> G6</Text>
                    </Text>
                    <IconFontAwesome5
                      name={'question-circle'}
                      size={18}
                      color={Constants.TIER_COLORS.STRIVER}
                    />
                  </TouchableOpacity>
                  <LazyG6Chart
                    innerData={context.state.innerData}
                    innerMaxima={context.state.innerMaxima}
                    isVideoPage
                  />
                </>
              )
            }
            ListFooterComponent={
              <>
                {Object.keys(g6Rating).length ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.alignCenter}>
                      <Text
                        style={{
                          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
                          fontSize: 16,
                          color: Constants.TIER_COLORS.ARTISAN,
                          marginBottom: 20,
                        }}
                      >
                        {Strings.SCORE_I_GAVE}
                      </Text>
                      <View style={styles.scoreContainer}>
                        {Object.keys(g6Rating).map((g6) => (
                          <View key={g6} style={styles.scoreGroup}>
                            <View style={styles.scoreBox}>
                              <Text style={styles.scoreText}>{g6Rating[g6]}</Text>
                            </View>
                            <Text style={styles.scoreTitleText}>
                              {Strings.G_SIX[g6.toUpperCase()]}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                ) : null}
                <View style={styles.divider} />
                <View style={styles.alignCenter}>
                  <Text style={styles.subTitleText}>
                    {Strings.SCORE_GIVERS} ({video.g6RatingCount})
                  </Text>
                </View>
                <Animated.FlatList
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  data={context.state.ratingList}
                  renderItem={({ item, index }) => (
                    <View style={styles.ratingListModalItemContainer}>
                      <UserListItemView
                        key={item._id + index}
                        navigation={context.props.navigation}
                        user={item.user}
                        mode={'grade'}
                        onPress={() => {
                          context.setState({
                            isShowingRatingList: !context.state.isShowingRatingList,
                          });
                        }}
                      />

                      {context.state.myUserId !== item.user.userId &&
                      !isGuestUser(context.props.route.params.logonUserId) ? (
                        <VideoPageFollowButton user={item.user} context={context} />
                      ) : null}

                      {/* <ReviewGradeBadgeView
                    ratingScore={item.ratingScore}
                    ratingCount={1}
                    type={'review_on'}
                    containerStyle={{
                      alignSelf: 'center',
                    }}
                    isVideoPage={true}
                  /> */}
                    </View>
                  )}
                  keyExtractor={(item) => item._id}
                  onEndReached={({ distanceFromEnd }) => {
                    if (
                      distanceFromEnd > 0 &&
                      context.state.ratingList.length >= 10 &&
                      !context.state.isLoadingRatingList
                    ) {
                      context.onVideoRatingListEndReached();
                    }
                  }}
                  onEndReachedThreshold={2}
                />
              </>
            }
          />
        </View>
      </View>
    </Modal>
  );

  // 의도적 메모 패턴 — 아래 상태 변경 시에만 갱신

  return React.useMemo(
    () => MemoizedRatingListModal,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [context.state.isShowingRatingList, context.state.ratingList],
  );
}

const styles = StyleSheet.create({
  ratingListModalContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK, //'rgba(0, 0, 0, 0.5)',
  },
  ratingListModalView: {
    height: '100%',
    width: '100%',
    marginHorizontal: 20,
    // paddingVertical: isIphoneX() ? 30 : 0,
    paddingVertical: getIPhoneHeaderMarginTop(),
    backgroundColor: Constants.COLOR_BACKGROUND_DARK, //'#111',
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ratingListModalHeaderContainer: {
    width: Dimensions.get('window').width,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 13,
  },
  ratingListModalCloseButton: {
    width: 22,
    height: 22,
    margin: 20,
  },
  ratingListModalHeaderRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingListModalHeaderRatingIcon: {
    width: 22,
    height: 22,
  },
  ratingListModalHeaderRatingTitle: {
    marginLeft: 6,
    fontSize: 17,
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
    fontWeight: '600',
  },
  ratingListModalHeaderRatingSubTitle: {
    marginLeft: 6,
    fontSize: 16,
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.EXTRALIGHT_2,
    fontWeight: '100',
  },
  ratingListModalItemContainer: {
    width: Dimensions.get('window').width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  userG6: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
    fontSize: 18,
    marginRight: 5,
  },
  divider: { marginHorizontal: 20, height: 1, backgroundColor: 'black' },
  alignCenter: { marginVertical: 20, marginHorizontal: 20, alignItems: 'center' },
  subTitleText: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    fontSize: 16,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  scoreContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  scoreBox: {
    borderWidth: 0.5,
    borderColor: Constants.TIER_COLORS.ARTISAN,
    borderRadius: 100,
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    width: 44,
    height: 44,
  },
  scoreGroup: { width: '100%', alignItems: 'center' },
  scoreTitleText: { fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4, fontSize: 11 },
  scoreText: { fontFamily: Constants.CUSTOM_FONTS.SCDREAM.BOLD_7, fontSize: 18 },
});

export default RatingListModal;

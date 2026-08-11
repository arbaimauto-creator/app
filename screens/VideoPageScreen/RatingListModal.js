import React, { useEffect, useState } from 'react';
import {
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
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { VideoPageFollowButton } from '../UserPageScreen/UserPageScreen';
import { isGuestUser } from '../../Components/utils';
import UserListItemView from '../UserPageScreen/UserListItemView';

const { COLORS, RADIUS, FONT } = T;

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
          <View style={styles.grabBar} />
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
                    color: video.myG6Rating ? COLORS.AMBER_DEEP : COLORS.INK,
                  },
                ]}
              >
                {Strings.AVERAGE_GRADE} {video.g6AvgRatingScore}
              </Text>
              {/* <Text style={styles.ratingListModalHeaderRatingSubTitle}>
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
                    style={styles.userG6Row}
                    onPress={() => {
                      context.props.navigation.navigate('G6Guide');
                      context.setState({
                        isShowingRatingList: !context.state.isShowingRatingList,
                      });
                    }}
                  >
                    <Text style={styles.userG6}>
                      {context.state.video.author.name}'s
                      <Text style={styles.userG6Accent}> G6</Text>
                    </Text>
                    <IconFontAwesome5 name={'question-circle'} size={16} color={COLORS.GREY} />
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
                      <Text style={[styles.subTitleText, styles.subTitleSpacing]}>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  ratingListModalView: {
    height: '94%',
    width: '100%',
    paddingTop: 8,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: RADIUS.SHEET,
    borderTopRightRadius: RADIUS.SHEET,
    ...T.SHADOW_SHEET,
  },
  grabBar: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD9D2',
  },
  ratingListModalHeaderContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LINE,
  },
  ratingListModalCloseButton: {
    width: 22,
    height: 22,
    marginHorizontal: 16,
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
    fontSize: 14.5,
    color: COLORS.INK,
    fontFamily: FONT.ExtraBold,
    letterSpacing: -0.2,
  },
  ratingListModalHeaderRatingSubTitle: {
    marginLeft: 6,
    fontSize: 11.5,
    color: COLORS.GREY,
    fontFamily: FONT.Regular,
  },
  ratingListModalItemContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LINE,
  },
  userG6Row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
  },
  userG6: {
    color: COLORS.INK,
    fontFamily: FONT.ExtraBold,
    fontSize: 15,
    letterSpacing: -0.2,
    marginRight: 5,
  },
  userG6Accent: { color: COLORS.AMBER_DEEP },
  divider: { marginHorizontal: 20, height: 1, backgroundColor: COLORS.LINE },
  alignCenter: { marginVertical: 20, marginHorizontal: 20, alignItems: 'center' },
  subTitleText: {
    fontFamily: FONT.Bold,
    fontSize: 13,
    color: COLORS.INK,
  },
  subTitleSpacing: { marginBottom: 16 },
  scoreContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  scoreBox: {
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.PILL,
    backgroundColor: COLORS.AMBER_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    width: 44,
    height: 44,
  },
  scoreGroup: { width: '100%', alignItems: 'center' },
  scoreTitleText: { fontFamily: FONT.Regular, fontSize: 11, color: COLORS.GREY },
  scoreText: { fontFamily: FONT.ExtraBold, fontSize: 16, color: COLORS.AMBER_DEEP },
});

export default RatingListModal;

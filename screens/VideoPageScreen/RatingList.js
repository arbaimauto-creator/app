import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import IconFontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import HeaderLeftBackButton from '../../Components/CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from '../../Components/Strings';
import { VideoPageFollowButton } from '../UserPageScreen/UserPageScreen';
import { getMaxima, isGuestUser, processData } from '../../Components/utils';
import { moderateScale } from '../../Components/utils/scailing';
import UserListItemView from '../UserPageScreen/UserListItemView';

const G6Chart = React.lazy(() => import('../../Components/CustomComponents/G6/G6Chart'));

function LazyG6Chart({ innerData, innerMaxima }) {
  return (
    <React.Suspense fallback={<View />}>
      <G6Chart innerData={innerData} innerMaxima={innerMaxima} isVideoPage />
    </React.Suspense>
  );
}

export default function RatingList({
  route: {
    params: { context },
  },
}) {
  const navigation = useNavigation();
  const { video, g6RatingScoreGraph, ratingList } = context.state;

  const [g6Rating, setG6Rating] = useState({});
  const [innerData, setInnerData] = useState(null);
  const [innerMaxima, setInnerMaxima] = useState(null);
  const [ratings, setRatingList] = useState(ratingList);

  useEffect(() => {
    navigation.setOptions({
      title: `${Strings.AVERAGE_GRADE} ${video.g6AvgRatingScore}`, //Strings.SIGN_UP,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });

    setInnerData(processData(g6RatingScoreGraph));
    setInnerMaxima(getMaxima(g6RatingScoreGraph));
  }, [g6RatingScoreGraph, navigation, video.g6AvgRatingScore]);

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

  return (
    <View style={styles.ratingListModalContainer}>
      <Animated.FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 20,
              }}
              onPress={() => {
                context.props.navigation.push('G6Guide');
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
            <LazyG6Chart innerData={innerData} innerMaxima={innerMaxima} isVideoPage />
          </>
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
                    {/* {Object.keys(g6Rating).map((g6) => ( */}
                    {[
                      'authentic',
                      'creative',
                      'aesthetic',
                      'informative',
                      'attractive',
                      'entertaining',
                    ].map((g6) => (
                      <View key={g6} style={styles.scoreGroup}>
                        <View style={styles.scoreBox}>
                          <Text style={styles.scoreText}>{g6Rating[g6]}</Text>
                        </View>
                        <Text style={styles.scoreTitleText}>{Strings.G_SIX[g6.toUpperCase()]}</Text>
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
              data={ratings}
              renderItem={({ item, index }) => (
                <View style={styles.ratingListModalItemContainer}>
                  <UserListItemView
                    key={item._id + index}
                    navigation={context.props.navigation}
                    user={item.user}
                    mode={'grade'}
                    onPress={() => {}}
                  />

                  {context.state.myUserId !== item.user.userId &&
                  !isGuestUser(context.props.route.params.logonUserId) ? (
                    <VideoPageFollowButton
                      user={item.user}
                      context={context}
                      setRatingList={(_ratingList) => setRatingList(_ratingList)}
                    />
                  ) : null}
                </View>
              )}
              keyExtractor={(item) => item._id}
              onEndReached={({ distanceFromEnd }) => {
                if (
                  distanceFromEnd > 0 &&
                  ratingList.length >= 10 &&
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
  );
}

const styles = StyleSheet.create({
  ratingListModalContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK, //'rgba(0, 0, 0, 0.5)',
    marginTop: 20,
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

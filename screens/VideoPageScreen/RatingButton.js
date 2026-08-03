import React from 'react';
import { Alert, LayoutAnimation, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import APIprovider from '../../Components/APIprovider';
import Strings from '../../Components/Strings';
import { isGuestUser, LogoutAlert } from '../../Components/utils';
import { View } from 'react-native';
import Constants from '../../Components/Constants';
import { useNavigation } from '@react-navigation/native';
function RatingButton({ context }) {
  const review = context.state.video;
  const navigation = useNavigation();

  return React.useMemo(
    () => (
      <View
        style={{
          position: 'absolute',
          alignSelf: 'flex-end',
          justifyContent: 'center',
          alignItems: 'center',
          bottom: 60,
          right: 14,
        }}
      >
        <TouchableOpacity
          style={styles.ratingButtonContainer(context.state.video.myG6Rating)}
          // disabled={context.state.video.myG6Rating ? true : false}
          onPress={() => {
            if (isGuestUser(context.props.route.params.logonUserId)) {
              return LogoutAlert(context.props);
            }
            if (context.state.video.myG6Rating) {
              // context.setState({
              //   isShowingRatingList: true,
              //   innerData: processData(context.state.g6RatingScoreGraph),
              //   innerMaxima: getMaxima(context.state.g6RatingScoreGraph),
              // });
              APIprovider.getVideoG6RatingList(review.videoId)
                .then((ratingList) => {
                  context.setState({ ratingList });

                  navigation.navigate('RatingList', {
                    ratingList,
                    context: context,
                  });
                })
                .catch(() => Alert.alert(Strings.FAILED_LOAD_RATINGS));
            } else {
              context.setState({
                isGreyingShowed: true,
                isShowingGreyding: true,
              });
            }
            LayoutAnimation.easeInEaseOut();
          }}
        >
          {review.myG6Rating || review.myAvgG6Rating ? null : (
            <Animatable.View
              useNativeDriver={true}
              ref={(ref) => {
                context.handleRatingButtonAnimationRef = ref;
              }}
            >
              <FastImage
                style={styles.ratingButton}
                source={require('../../Resources/img/icBadgeGreydW34.png')}
              />
            </Animatable.View>
          )}
          <Text style={styles.myRating}>{context.state.video.myAvgG6Rating}</Text>
        </TouchableOpacity>
        {context.state.video.myG6Rating ? null : (
          <Text
            style={{
              color: Constants.TIER_COLORS.ARTISAN,
              fontSize: 16,
              fontFamily: 'S-CoreDream-5Medium',
              marginTop: 10,
            }}
          >
            {Strings.RATE_G_SIX}
          </Text>
        )}
      </View>
    ),
    [context, navigation, review.myAvgG6Rating, review.myG6Rating, review.videoId],
  );
}

const styles = StyleSheet.create({
  ratingButtonContainer: (_rate) => ({
    backgroundColor: Constants.TIER_COLORS.GIVER,
    borderRadius: 60,
    width: 60 * 1.25,
    height: 60 * 1.25,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  ratingButton: {
    width: 34 * 1.5,
    height: 34 * 1.5,
  },
  myRating: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default RatingButton;

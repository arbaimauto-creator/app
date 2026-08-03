import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import ActionButton from '../../screens/VideoPageScreen/ActionButton';
import { LogoutAlert, isGuestUser } from '../utils';
import Strings from '../Strings';
import APIprovider from '../APIprovider';

export default function VideoLikeButton({ context, size = 26, center }) {
  const review = context.state.video;

  const icBookmark = review.isLiked ? (
    <FastImage
      style={{
        ...styles.headerButton,
        height: size,
        width: size,
      }}
      source={require('../../Resources/img/iconRenewal/heart-on.png')}
    />
  ) : (
    <FastImage
      style={{
        ...styles.headerButton,
        height: size,
        width: size,
      }}
      source={require('../../Resources/img/iconRenewal/heart-off.png')}
    />
  );

  return (
    <View style={{ ...styles.likeButton, alignSelf: center ? 'center' : 'flex-start' }}>
      <ActionButton
        isHeaderRight
        renderItem={icBookmark}
        onPress={() => {
          // console.log('Like button pressed');

          if (isGuestUser(context.props.route.params.logonUserId)) {
            // console.log('Guest user detected');
            return LogoutAlert(context.props);
          }

          // console.log('Setting loading state to true');
          context.setState({ isLikeLoading: true });

          APIprovider.likeVideo(review.videoId, !review.isLiked)
            .then((result) => {
              if (result && result.success) {
                // console.log('API response received:', result);

                const { videoLike } = result;
                context.setState({
                  video: {
                    ...review,
                    isLiked: videoLike.isLiked,
                    likes: videoLike.likes,
                  },
                });
                // console.log('Updated video state:', context.state.video);
              }

              context.setState({ isLikeLoading: false });
              // console.log('Loading state set to false');
            })
            .catch((err) => {
              // console.error('Error during like request:', err);
              Alert.alert(
                Strings.FAILED_TO_BOOKMARK,
                err.errorMsg ? err.errorMsg : '',
                [{ text: Strings.OK }],
                { cancelable: true },
              );
              context.setState({
                video: {
                  ...review,
                  isLiked: !review.isLiked,
                },
              });

              context.setState({ isLikeLoading: false });
            });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 26,
    height: 26,
  },
  likeButton: {
    alignSelf: 'flex-start',
  },
});

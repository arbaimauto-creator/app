import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import APIprovider from '../../Components/APIprovider';
import Strings from '../../Components/Strings';
import { isGuestUser, LogoutAlert } from '../../Components/utils';
import ActionButton from './ActionButton';
import Constants from '../../Components/Constants';

function BookmarkButton({ context, size = 26, center }) {
  const review = context.state.video;

  const icBookmark = review.isBookmarked ? (
    <View style={{ alignItems: 'center' }}>
      <FastImage
        style={{
          ...styles.headerButton,
          height: size,
          width: size,
        }}
        source={require('../../Resources/img/iconRenewal/white-bookmark-on.png')}
      />
      {/* <Text style={styles.iconText}>{Strings.BOOKMARKS}</Text> */}
    </View>
  ) : (
    <View style={{ alignItems: 'center' }}>
      <FastImage
        style={{
          ...styles.headerButton,
          height: size,
          width: size,
        }}
        source={require('../../Resources/img/iconRenewal/white-bookmark-off.png')}
      />
      {/* <Text style={styles.iconText}>{Strings.BOOKMARKS}</Text> */}
    </View>
  );

  return (
    <View style={{ ...styles.bookmarkButton, alignSelf: center ? 'center' : 'flex-start' }}>
      <ActionButton
        isHeaderRight
        renderItem={icBookmark}
        onPress={() => {
          if (isGuestUser(context.props.route.params.logonUserId)) {
            return LogoutAlert(context.props);
          }

          APIprovider.bookmarkVideo(review.videoId, !review.isBookmarked)
            .then(() => {
              context.setState({
                video: {
                  ...review,
                  isBookmarked: !review.isBookmarked,
                },
              });
            })
            .catch((err) => {
              Alert.alert(
                Strings.FAILED_TO_BOOKMARK,
                err.errorMsg ? err.errorMsg : '',
                [{ text: Strings.OK }],
                { cancelable: true },
              );
              // 실패 시 상태를 토글하면 실패했는데 북마크가 켜짐 — 상태 유지
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
  bookmarkButton: {
    alignSelf: 'flex-start',
  },
  iconText: {
    color: Constants.COLOR_BACKGROUND_DARK,
    paddingTop: 5,
    fontSize: 12,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
});

export default BookmarkButton;

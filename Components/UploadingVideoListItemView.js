import React, { Component } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Constants from './Constants';
import Codes from './Constants/Codes';
import Strings from './Strings';
import CancelBadgeView from './Views/CancelBadgeView';
import ReloadBadgeView from './Views/ReloadBadgeView';

function ReviewMain({ review }) {
  return (
    <View style={styles.reviewMainContainer}>
      <FastImage style={styles.reviewThumbnail} source={{ uri: review.thumbnailUri }} />
      <View
        style={{
          flex: 1,
          position: 'absolute',
          bottom: 0,
          width: '100%',
          padding: 10,
        }}
      />
    </View>
  );
}

function ReviewFooter({ review, author }) {
  return (
    <View style={{}}>
      {review.title !== null && review.title !== '' && (
        <Text style={styles.reviewTitle} numberOfLines={2}>
          {review.title}
        </Text>
      )}
      <View style={styles.reviewFooterInfoContainer}>
        <Text style={styles.reviewFooterInfoUserId} numberOfLines={1}>
          {author.name}
        </Text>
      </View>
    </View>
  );
}

export default class UploadingVideoListItemView extends Component {
  static defaultProps = {
    key: 0,
    style: {},
    navigation: '',
    data: {
      thumbnailUrl: '',
    },
    onRetry: () => {},
    onCancel: () => {},
    onCompleted: () => {},
    isCancelable: false,
  };

  constructor(props) {
    super(props);
  }

  shouldComponentUpdate() {
    return true;
  }

  render() {
    return (
      <View style={[styles.horizontalTypeContainer, this.props.style]}>
        <View style={styles.reviewContainer}>
          <ReviewMain review={this.props.uploadingVideo} />
          {(this.props.uploadingVideo.state === Codes.UPLOADING_VIDEO_STATE.UPLOADING ||
            this.props.uploadingVideo.state === Codes.UPLOADING_VIDEO_STATE.ENCODING ||
            this.props.uploadingVideo.state === Codes.UPLOADING_VIDEO_STATE.STANDBY) && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Constants.COLOR_MAIN} />
              <Text style={styles.loadingMessage}>{Strings.LOADING}</Text>
            </View>
          )}
          {this.props.uploadingVideo.state === Codes.UPLOADING_VIDEO_STATE.ERROR && (
            <View style={styles.loadingContainer}>
              <TouchableOpacity onPress={this.props.onRetry}>
                <ReloadBadgeView />
              </TouchableOpacity>
              <Text style={styles.loadingMessage}>{Strings.RETRY}</Text>
            </View>
          )}
          {this.props.uploadingVideo.state === Codes.UPLOADING_VIDEO_STATE.ERROR && (
            <View style={styles.cancelBadgeContainer}>
              <TouchableOpacity onPress={this.props.onCancel}>
                <CancelBadgeView />
              </TouchableOpacity>
            </View>
          )}
          <ReviewFooter review={this.props.uploadingVideo} author={this.props.author} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  reviewContainer: {
    width: '100%',
  },
  reviewMainContainer: {
    width: '100%',
    marginBottom: 13,
  },
  reviewThumbnail: {
    width: '100%',
    height: Constants.VIDEO_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
    borderRadius: 4,
  },
  reviewTitle: {
    color: 'white',
    fontSize: 15,
    lineHeight: 19,
    marginBottom: 3,
  },
  reviewFooterInfoContainer: {
    flexDirection: 'row',
  },
  reviewFooterInfoUserId: {
    flexShrink: 1,
    color: 'rgb(128, 128, 128)',
    fontSize: 13,
  },
  reviewFooterInfoViewCount: {
    color: 'rgb(128, 128, 128)',
    fontSize: 13,
  },
  horizontalTypeContainer: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  loadingMessage: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
  },
  cancelBadgeContainer: {
    position: 'absolute',
    marginLeft: 10,
    marginTop: 11,
  },
});

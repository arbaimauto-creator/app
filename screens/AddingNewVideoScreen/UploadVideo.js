import React, { useState } from 'react';
import {
  Alert,
  BackHandler,
  LayoutAnimation,
  Platform,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import ImagePicker from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import IconFeather from 'react-native-vector-icons/Feather';
import Video from 'react-native-video';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import Utils, { isASCII } from '../../Components/utils';
import styles from './styles';
import { getThumbnailImageFromVideo, uploadToGcsBySignedUrl } from './utils';
import * as Sentry from '@sentry/react-native';

function VideoView({ context }) {
  return (
    <Video
      videoPlayerRef={(videoPlayer) => (context.videoPlayer = videoPlayer)}
      source={{ uri: context.state.videoUri }}
      onError={(error) => context.onError(error)}
      onLoad={context.onLoad}
      onLoadStart={context.onLoadStart}
      onProgress={context.onProgress}
      paused={!context.state.isLoading}
      // paused={false}
      resizeMode={'contain'}
      style={context.getPlayerStyle()}
      volume={1}
      ignoreSilentSwitch="ignore"
      mixWithOthers="duck"
      repeat={true}
      disableBack
      disableVolume
      disablePlayPause
    />
  );
}

function openPicker(context) {
  const options = {
    mediaType: 'video',
    compressVideoPreset: 'Passthrough',
  };
  if (Platform.OS === 'ios') {
    context.setState({ isVideoLoading: true });

    launchImageLibrary(options)
      .then((res) => {
        // when fileName has a space in ios
        const fileName = res.assets[0].fileName;
        const spaceRegex = /\s/; // Matches any whitespace character

        const uri = res.assets[0].uri;
        const splittedUri = uri.split('/');
        const folderPath = splittedUri.slice(0, splittedUri.length - 1).join('/');

        if (spaceRegex.test(fileName) || !isASCII(fileName)) {
          res.assets[0].uriWithSpaces = folderPath + '/' + fileName;
        }

        onSuccess(res);
        context.setState({ isVideoLoading: false });
      })
      .catch((err) => {
        console.log('load err', err);
        onFailure(err);
        context.setState({ isVideoLoading: false });
      });
  } else {
    ImagePicker.openPicker(options)
      .then((res) => {
        onSuccess(res);
      })
      .catch((err) => {
        onFailure(err);
      });
  }

  const onFailure = (err) => {
    Sentry.captureException(err);
    context.setState({ isUsingGallery: false });
    if (err.code !== 'E_PICKER_CANCELLED' && err.code !== 'E_PERMISSION_MISSING') {
      Alert.alert(Strings.ALERT_FAIL_TO_LOADING_VIDEO, Strings.ALERT_FAIL_TO_LOADING_VIDEO_GUIDE);
    }
  };

  const onSuccess = async (respond) => {
    try {
      const video = Platform.OS === 'ios' ? respond.assets[0] : respond;
      const filePath = Platform.OS === 'ios' ? video.uri : video.path;
      const duration = Platform.OS === 'ios' ? video.duration : video.duration / 1000;
      const uriWithSpaces = Platform.OS === 'ios' ? video.uriWithSpaces : '';
      const nonAsciiUri = Platform.OS === 'ios' ? video.nonAsciiUri : '';
      // const streams = await Utils.getMediaStreams(respond.path);
      const streams = await Utils.getMediaStreams(filePath);
      let videoFps = 0;
      streams.forEach((stream) => {
        const a = Number(stream.avg_frame_rate.split('/')[0]);
        const b = Number(stream.avg_frame_rate.split('/')[1]);
        if (!Number.isNaN(a) && !Number.isNaN(b) && a !== 0 && b !== 0) {
          videoFps = a / b;
        }
      });

      // if(video.height*video.width > 1920*1080) {
      //   Alert.alert(Strings.ALERT_FAIL_TO_LOADING_VIDEO, Strings.ALERT_NOT_SUPPORTED_VIDEO_RESOLUTION_GUIDE);
      //   return;
      // }

      if (video.fileSize > 1024 ** 3) {
        Alert.alert(Strings.CAUTION_VIDEO_SIZE_EXCEED, Strings.CAUTION_VIDEO_SIZE_EXCEED_GUIDE);
      }

      if (videoFps > 60) {
        Alert.alert(
          Strings.ALERT_FAIL_TO_LOADING_VIDEO,
          Strings.ALERT_NOT_SUPPORTED_VIDEO_FPS_GUIDE,
        );
        return;
      }

      const uploadResult = await uploadToGcsBySignedUrl(
        {
          videoUri: uriWithSpaces ? uriWithSpaces : filePath,
          videoType: video.mime,
          nonAsciiUri: nonAsciiUri ? nonAsciiUri : '',
        },
        context,
      );

      if (!uploadResult.success) {
        if (uploadResult.error === 'ENOENT') {
          Alert.alert(Strings.ALERT_FAIL_TO_LOADING_VIDEO, Strings.UPLOAD_FILENAME_RULES);
          return;
        }

        // GCS 업로드 실패시 다시 시도하게 함
        Alert.alert(Strings.ALERT_FAIL_TO_LOADING_VIDEO, Strings.ALERT_FAIL_TO_LOADING_VIDEO_GUIDE);
        return;
      }

      if (duration < Constants.MAX_VIDEO_LENGTH) {
        context.setState({
          videoUri: filePath,
          videoStartTime: 0,
          videoEndTime: 0,
          // videoType: video.mime,
          // videoSize: video.size,
          // height: video.height,
          // width: video.width,
          videoUrl: uploadResult.videoUrl,
          videoPath: uploadResult.videoPath,
          uriWithSpaces,
          nonAsciiUri,
        });
        LayoutAnimation.linear();
        getThumbnailImageFromVideo(context, 2);
      } else {
        context.setState({
          videoUri: filePath,
          videoUrl: uploadResult.videoUrl,
          videoPath: uploadResult.videoPath,
        });
        BackHandler.removeEventListener('hardwareBackPress', context._handleBackButton);
        context.isBackHandlerEnable = false;
        context.props.navigation.navigate('EditSingleVideo', {
          video: {
            path: filePath,
          },
          onTrimmed: (trimBegin, trimEnd) => {
            context.setState({
              videoStartTime: trimBegin,
              videoEndTime: trimEnd,
            });
            getThumbnailImageFromVideo(context, 2);
          },
        });
      }
    } catch (error) {
      console.error('uploadVideo onSuccess error', error);
    }
  };
}

export default function UploadVideo({ context }) {
  return (
    <View style={{ marginTop: 5, alignItems: 'center' }}>
      {context.state.videoUri ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <VideoView context={context} />
          <TouchableWithoutFeedback
            style={{ paddingHorizontal: 5 }}
            onPress={() => {
              if (context.state.videoUri) {
                context.setState({
                  videoUri: null,
                  isFullScreen: false,
                });
              }
              context.setState({
                isInvalidVideo: false,
              });
            }}
          >
            <FastImage
              style={styles.removeVideoButton}
              source={require('../../Resources/img/icHeaderSearchCancle16W.png')}
            />
          </TouchableWithoutFeedback>
        </View>
      ) : (
        <TouchableNativeFeedback
          onPress={() => {
            Utils.checkPermissionToAccessGallery()
              .then(() => openPicker(context))
              .catch((err) => Alert.alert(err.message));
          }}
        >
          <View style={[styles.addVideoButtonContainer]}>
            <FastImage
              source={require('../../Resources/img/icProductAdd34.png')}
              style={styles.addVideoButtonImage}
            />
            {context.state.isEdit ? (
              <View />
            ) : context.state.videoUri ? (
              <View>
                {context.state.isInvalidVideo && (
                  <Text style={styles.fieldTitleError}>
                    <IconFeather name={'alert-circle'} size={14} color={'#a00'} />
                    <Text />
                    <Text>{Strings.CANT_LOAD_VIDEO_CHECK}</Text>
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => {
                    if (context.state.videoUri) {
                      context.setState({ videoUri: null });
                    }
                    LayoutAnimation.easeInEaseOut();
                    context.setState({
                      isInvalidVideo: false,
                    });
                  }}
                >
                  <Text style={styles.uploadVideoTitle}>{Strings.DELETE_VIDEO}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.uploadVideoTitle}>{Strings.UPLOAD_VIDEO}</Text>
            )}
          </View>
        </TouchableNativeFeedback>
      )}
    </View>
  );
}

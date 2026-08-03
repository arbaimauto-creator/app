'use strict';
import React from 'react';
import { StyleSheet, TouchableHighlight, View } from 'react-native';
// import { RNCamera } from 'react-native-camera';
import ImagePicker from 'react-native-image-crop-picker';

import { isIphoneX } from 'react-native-iphone-x-helper';
import Utils from './utils';
import Constants from './Constants';
import { LoadingView } from './Views';

export default class CameraScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isRecording: false,
      recordFileUri: null,
      isUsingGallery: false,
      isShowActivityIndicator: false,
      // cameraType: RNCamera.Constants.Type.back,
      galleryThumbnailUri: '',
    };
  }

  componentDidMount() {
    this.props.navigation.navigate('AddingNewVideo', {
      linkedProduct: this.props.route.params.linkedProduct,
      relayingVideo: this.props.route.params.relayingVideo,
    });
    //    Utils.checkPermissionToAccessGallery()
    //    .then(() => this.openPicker())
    //    .catch(err => Alert.alert(err))
  }

  openPicker() {
    const options = {
      mediaType: 'video',
      //      compressVideoPreset: "960x540",
      compressVideoPreset: 'Passthrough',
      //      compressImageMaxWidth: Constants.MAX_SCALE_VIDEO,
      //      compressImageMaxHeight: Constants.MAX_SCALE_VIDEO,
      //      compressImageQuality: 1
    };
    ImagePicker.openPicker(options)
      .then(async (respond) => {
        this.showActivityIndicator();
        const { duration } = await Utils.getVideoInfo(respond.path);
        if (duration < Constants.MAX_VIDEO_LENGTH) {
          this.props.navigation.navigate('AddingNewVideo', {
            video: respond.path,
            linkedProduct: this.props.route.params.linkedProduct,
            relayingVideo: this.props.route.params.relayingVideo,
          });
        } else {
          this.props.navigation.navigate('EditSingleVideo', {
            hideActivityIndicatorPreviousScreen: this.hideActivityIndicator.bind(this),
            video: respond,
            linkedProduct: this.props.route.params.linkedProduct,
            relayingVideo: this.props.route.params.relayingVideo,
            onVideoSubmitted: this.props.route.params.onVideoSubmitted,
          });
        }
      })
      .catch(() => {
        this.setState({ isUsingGallery: false });
        this.props.navigation.pop();
      });
  }

  async startRecording() {
    this.setState({ isRecording: true });
    // default to mp4 for android as codec is not set
    const video = await this.camera.recordAsync();
    this.props.navigation.navigate('AddingNewVideo', {
      video: video,
      linkedProduct: this.props.route.params.linkedProduct,
    });
  }

  stopRecording() {
    this.camera.stopRecording();
    this.setState({ isRecording: false });
  }

  // async upload() {
  //   const data = new FormData();
  //   data.append('video', {
  //     name: 'mobile-video-upload',
  //     type,
  //     uri,
  //   });

  //   try {
  //     await fetch(ENDPOINT, {
  //       method: 'post',
  //       body: data,
  //     });
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }

  showActivityIndicator() {
    this.setState({ isShowActivityIndicator: true });
  }

  hideActivityIndicator() {
    this.setState({
      isShowActivityIndicator: false,
      isUsingGallery: false,
    });
    this.forceUpdate();
  }

  renderActivityIndicator() {
    if (this.state.isShowActivityIndicator) {
      return <LoadingView />;
    }
  }

  renderRecordButton() {
    if (this.state.isRecording) {
      return (
        <TouchableHighlight
          style={{
            width: 66,
            height: 66,
            borderRadius: 8,
            borderWidth: 20,
            borderColor: 'rgba(255, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            this.stopRecording();
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              backgroundColor: 'red',
              borderRadius: 5,
            }}
          />
        </TouchableHighlight>
      );
    } else {
      return (
        <TouchableHighlight
          style={{
            width: 66,
            height: 66,
            borderRadius: 66,
            borderWidth: 6,
            borderColor: 'rgba(255, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            this.startRecording();
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              backgroundColor: 'red',
              borderRadius: 50,
            }}
          />
        </TouchableHighlight>
      );
    }
  }

  render() {
    return <View />;
    // return (
    //   <View style={styles.container}>
    //     <RNCamera
    //       ref={ref => {
    //         this.camera = ref;
    //       }}
    //       style={styles.preview}
    //       type={this.state.cameraType}
    //       flashMode={RNCamera.Constants.FlashMode.on}
    //       androidCameraPermissionOptions={{
    //         title: Strings.CAMERA_PERMISSION,
    //         message: Strings.CAMERA_PERMISSION_MESSAGE,
    //         buttonPositive: Strings.OK,
    //         buttonNegative: Strings.CANCEL,
    //       }}
    //       androidRecordAudioPermissionOptions={{
    //         title: Strings.AUDIO_RECORDING_PERMISSION,
    //         message: Strings.AUDIO_RECORDING_PERMISSION_MESSAGE,
    //         buttonPositive: Strings.OK,
    //         buttonNegative: Strings.CANCEL,
    //       }}
    //       onGoogleVisionBarcodesDetected={({ barcodes }) => {
    //         console.log(barcodes);
    //       }}
    //     />

    //     <View style={styles.headerBarContainer}>
    //       <TouchableOpacity
    //         onPress={() => {
    //           this.props.navigation.pop();
    //         }}
    //       >
    //         <Text
    //           style={{
    //             fontWeight: 'bold',
    //             fontSize: 20,
    //             color: 'white',
    //             marginHorizontal: 4,
    //           }}
    //         >
    //           <IconIonicons name={'arrow-back'} size={30} color={Constants.TIER_COLORS.ARTISAN} />
    //         </Text>
    //       </TouchableOpacity>

    //       <View style={{ flex: 1 }} />

    //       <TouchableOpacity
    //         onPress={() => {
    //           if (this.state.cameraType === RNCamera.Constants.Type.back) {
    //             this.setState({ cameraType: RNCamera.Constants.Type.front });
    //           } else if (this.state.cameraType === RNCamera.Constants.Type.front) {
    //             this.setState({ cameraType: RNCamera.Constants.Type.back });
    //           }
    //         }}
    //       >
    //         <Text
    //           style={{
    //             fontWeight: 'bold',
    //             fontSize: 20,
    //             color: 'white',
    //             marginHorizontal: 4,
    //           }}
    //         >
    //           <IconIonicons name={'camera-reverse-outline'} size={30} color={Constants.TIER_COLORS.ARTISAN} />
    //         </Text>
    //       </TouchableOpacity>
    //     </View>

    //     <View
    //       style={{
    //         flex: 1,
    //         flexDirection: 'row',
    //         bottom: 40,
    //         alignSelf: 'center',
    //         position: 'absolute',
    //       }}
    //     >
    //       {this.renderRecordButton()}
    //     </View>

    //     <View
    //       style={{
    //         flex: 1,
    //         flexDirection: 'row',
    //         bottom: 40,
    //         right: 60,
    //         position: 'absolute',
    //       }}
    //     >
    //       <TouchableOpacity
    //         onPress={() => {
    //           if (this.state.isUsingGallery) {
    //             return;
    //           }
    //           this.setState({ isUsingGallery: true });
    //           const options = {
    //             mediaType: 'video',
    //           };
    //           ImagePicker.launchImageLibrary(options, respond => {
    //             if (respond.hasOwnProperty('didCancel') && respond.didCancel) {
    //               this.setState({ isUsingGallery: false });
    //             } else {
    //               this.props.navigation.navigate('AddingNewVideo', {
    //                 video: respond,
    //                 hideActivityIndicatorPreviousScreen: this.hideActivityIndicator.bind(this),
    //                 linkedProduct: this.props.route.params.linkedProduct,
    //                 relayingVideo: this.props.route.params.relayingVideo,
    //               });
    //               this.showActivityIndicator();
    //             }
    //           });
    //         }}
    //       >
    //         <View style={{ alignItems: 'center' }}>
    //           <Image
    //             style={{
    //               width: 30,
    //               height: 30,
    //               borderRadius: 4,
    //               borderWidth: 2,
    //               borderColor: 'white',
    //             }}
    //             source={{ uri: this.state.galleryThumbnailUri }}
    //           />
    //           <Text style={{ fontSize: 14, color: Constants.TIER_COLORS.ARTISAN }}> {'Gallery'} </Text>
    //         </View>
    //       </TouchableOpacity>
    //     </View>

    //     {this.renderActivityIndicator()}
    //   </View>
    // );
  }

  takePicture = async () => {
    if (this.camera) {
      const options = { quality: 0.5, base64: true };
      const data = await this.camera.takePictureAsync(options);
      console.log(data.uri);
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerBarContainer: {
    flex: 1,
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginTop: isIphoneX() ? 50 : 20,
  },
  capture: {
    flex: 0,
    backgroundColor: 'transparent',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
});

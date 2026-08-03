import React, { useEffect, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-easy-toast';
import RNFS from 'react-native-fs';
import { TouchableOpacity } from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import { getStatusBarHeight } from 'react-native-safearea-height';
import Share from 'react-native-share';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import { moderateScale } from './utils/scailing';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

let toastRef;
export default function QRScreen(props) {
  const [dynamicLink, setDynamicLink] = useState('');
  const [ref, setRef] = useState(null);
  const [QRResult, setQRResult] = useState({});

  const saveQrToDisk = () => {
    ref.toDataURL((data) => {
      RNFS.writeFile(RNFS.CachesDirectoryPath + '/some-name.png', data, 'base64')
        .then((success) => {
          if (Platform.OS === 'android') {
            return CameraRoll.saveToCameraRoll(
              RNFS.CachesDirectoryPath + '/some-name.png',
              'photo',
            );
          } else {
            return CameraRoll.save(RNFS.CachesDirectoryPath + '/some-name.png', { type: 'photo' });
          }
        })
        .then(() => {
          // this.setState({busy: false, imageSaved: true});
          // if (Platform.OS === 'android') {
          //   ToastAndroid.show('Saved to gallery !!', ToastAndroid.SHORT);
          // }

          console.log(RNFS.CachesDirectoryPath);
          toastRef.show(`다운로드가 완료되었습니다. ${RNFS.CachesDirectoryPath}/some-name.png`);
        });
    });
  };

  const shareToExport = () => {
    const { id, title, description, thumbnailUrl } = props.route.params;
    // APIprovider.getUserProfileDynamicLink(id, title, description, thumbnailUrl).then((res) => {
    const url = QRResult?.shortLink;
    const message = title;
    const options = Platform.select({
      ios: {
        activityItemSources: [
          {
            placeholderItem: { type: 'url', content: url },
            item: {
              default: { type: 'url', content: url },
            },
            subject: {
              default: description,
            },
            linkMetadata: { originalUrl: url, url, description },
          },
          {
            placeholderItem: { type: 'text', content: message },
            item: {
              default: { type: 'text', content: message },
              message: null, // Specify no text to share via Messages app.
            },
          },
        ],
      },
      default: {
        description,
        subject: description,
        message: `${message} ${url}`,
      },
    });

    Share.open(options)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        err && console.log(err);
      });
    // });
  };

  const productShareWithDynamicLink = () => {
    const {
      product: { productId, title, description, attachmentList },
    } = props.route.params;

    // APIprovider.getProductDynamicLink(
    //   productId,
    //   title,
    //   description.slice(0, 250),
    //   attachmentList[0].url,
    // ).then((res) => {
    const url = QRResult?.shortLink;
    const message = Strings.SHARE_PRODUCT_MESSAGE;
    const options = Platform.select({
      ios: {
        activityItemSources: [
          {
            placeholderItem: { type: 'url', content: url },
            item: {
              default: { type: 'url', content: url },
            },
            subject: {
              default: description,
            },
            linkMetadata: { originalUrl: url, url, description },
          },
          {
            placeholderItem: { type: 'text', content: message },
            item: {
              default: { type: 'text', content: message },
              message: null, // Specify no text to share via Messages app.
            },
          },
        ],
      },
      default: {
        description,
        subject: description,
        message: `${message} ${url}`,
      },
    });

    Share.open(options)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        err && console.log(err);
      });
    // });
  };

  useEffect(() => {
    props.navigation.setOptions({
      title: Strings.QR_CODE,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation: props.navigation }),
    });
    async function getProfileLink() {
      const { id, title, description, thumbnailUrl } = props.route.params;

      const result = await APIprovider.getUserProfileDynamicLink(
        id,
        title,
        description,
        thumbnailUrl,
      );

      console.log(result);

      if (result.success) {
        setDynamicLink(result.shortLink);
        setQRResult(result);
      }
    }

    async function getProductLink() {
      const {
        product: { productId, title, description, attachmentList },
      } = props.route.params;

      const result = await APIprovider.getProductDynamicLink(
        productId,
        title,
        description.slice(0, 250),
        attachmentList[0].url,
      );

      console.log(result);

      if (result.success) {
        setDynamicLink(result.shortLink);
        setQRResult(result);
      }
    }

    if (props.route.params.type === 'product') {
      getProductLink();
      return;
    }

    getProfileLink();
  }, [props, props.navigation, ref]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.info}>
        {dynamicLink ? (
          <View style={styles.border}>
            <QRCode
              size={250}
              value={dynamicLink}
              logo={require('../Resources/img/icBadgeGreydOn42_3x.png')}
              color={Constants.TIER_COLORS.ARTISAN}
              logoBorderRadius={50}
              logoMargin={10}
              logoBackgroundColor={Constants.TIER_COLORS.ARTISAN}
              getRef={(reference) => setRef(reference)}
            />
            <Text
              style={{
                ...styles.userName,
                width: 250,
                fontSize: props.route.params.type === 'product' ? 20 : 35,
              }}
              numberOfLines={1}
            >
              {props.route.params.type === 'product'
                ? props.route.params.product.title
                : props.route.params.logonUserName}
            </Text>
          </View>
        ) : null}

        <View>
          <TouchableOpacity
            onPress={() => {
              if (props.route.params.type === 'product') {
                return productShareWithDynamicLink();
              }
              shareToExport();
            }}
          >
            <Text
              style={{
                color: Constants.TIER_COLORS.ARTISAN,
                fontSize: 20,
                marginTop: 40,
                fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
              }}
            >
              {Strings.SHARE_QR_CODE}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Toast
        ref={(reference) => {
          toastRef = reference;
        }}
        fadeInDuration={100}
        fadeOutDuration={1900}
        position={'bottom'}
        positionValue={Platform.OS === 'ios' ? 300 : 120}
        style={{
          backgroundColor: Constants.TIER_COLORS.ARTISAN,
          borderRadius: 20,
          paddingHorizontal: 20,
          bottom: getStatusBarHeight(),
        }}
        opacity={0.9}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  info: {
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  border: {
    backgroundColor: Constants.TIER_COLORS.ARTISAN,
    padding: 20,
    borderRadius: 10,
    paddingBottom: 13,
  },
  userName: {
    marginTop: 10,
    textAlign: 'center',
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: 35,
    fontWeight: '700',
  },
});

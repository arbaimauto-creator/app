import { CommonActions } from '@react-navigation/native';
import T from '../../Constants/DesignTokens';
import React from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import FastImage from 'react-native-fast-image';
import { getBottomSpace, isIphoneX } from 'react-native-iphone-x-helper';
import SplashScreen from 'react-native-splash-screen';
import Strings, { getLanguage } from '../../Strings';
import Constants from '../../Constants';

const data = {
  image: {
    en: require('../../../Resources/img/initialGuide/ko-initial-guide.png'),
    ko: require('../../../Resources/img/initialGuide/en-initial-guide.png'),
  },
};
export default class InitialGuideScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeSlideIndex: 0,
    };
    this._carousel = null;
  }

  componentDidMount() {
    SplashScreen.hide();
  }

  onPressStartButton() {
    Preference.set('isOnboarded', 'true');
    this.props.navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Main' }],
      }),
    );
  }

  _renderSlide({ item, index }) {
    return (
      <View style={{ flex: 1 }}>
        <Image source={item.image} style={styles.slideImage} resizeMode={'contain'} />
      </View>
    );
  }

  render() {
    const { navigation } = this.props;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ebebeb' }}>
        <View style={styles.headerBarContainer}>
          <Image style={styles.logo} source={require('../../../Resources/img/icGreydLogo32.png')} />
          <TouchableOpacity onPress={this.onPressStartButton.bind(this)}>
            <Text style={styles.skipButtonTitle}>{Strings.SKIP}</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            alignItems: 'center',
            marginTop: 60,
          }}
        >
          <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR, fontSize: 36 }}>
            {Strings.INITIAL_GUIDE_TITLE_1}
          </Text>
          <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD, fontSize: 36 }}>
            {Strings.INITIAL_GUIDE_TITLE_2}{' '}
            <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD }}>greyd</Text>
          </Text>
          <Text
            style={{
              marginTop: 20,
              textAlign: 'center',
              fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
              fontSize: 24,
              color: '#3a3a3a',
            }}
          >
            {Strings.INITIAL_GUIDE_CONTENT}
          </Text>

          <TouchableOpacity
            style={{
              marginTop: 40,
              borderRadius: 14,
              paddingHorizontal: 40,
              paddingVertical: 10,
              backgroundColor: '#3a3a3a',
            }}
            onPress={() => {
              this.onPressStartButton();
            }}
          >
            <Text
              style={{
                fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
                fontSize: 24,
                color: T.COLORS.INK,
              }}
            >
              {Strings.INITIAL_GUIDE_BUTTON}
            </Text>
          </TouchableOpacity>
        </View>
        <FastImage
          source={data.image[getLanguage()]}
          style={{
            width: '100%',
            height: '60%',
          }}
          resizeMode="contain"
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBarContainer: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: isIphoneX() ? 40 : 20,
    alignItems: 'center',
  },
  slideImage: {
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  skipButtonTitle: {
    color: 'white',
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
    backgroundColor: '#3a3a3a',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  slideMessageContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    bottom: getBottomSpace() + 140,
  },
  slideTitle: {
    color: 'white',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  slideMessage: {
    color: 'white',
    fontSize: 15,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  slidePagination: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: getBottomSpace() + 70,
  },
  startButtonContainer: {
    position: 'absolute',
    paddingTop: 20,
    paddingBottom: isIphoneX() ? getBottomSpace() : 20,
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: 'rgb(165, 115, 25)',
    width: '100%',
  },
  startButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

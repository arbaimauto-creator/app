import React from 'react';
import {
  Dimensions,
  NativeModules,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { getBottomSpace, isIphoneX } from 'react-native-iphone-x-helper';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import SplashScreen from 'react-native-splash-screen';
import Constants from './Constants';
import Strings from './Strings';

const dataEng = [
  {
    type: 'default',
    image: require('../Resources/img/imgObd1.png'),
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_1_1, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_1_2, color: Constants.COLOR_MAIN },
      { msg: Strings.TUTORIAL_REVIEW_BODY_1_3, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_1_4, color: Constants.COLOR_MAIN },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  {
    type: 'default',
    image: require('../Resources/img/imgObd2.png'),
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_2_1, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_2_2, color: Constants.COLOR_MAIN },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  {
    type: 'default',
    image: require('../Resources/img/imgObd3.png'),
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_3_1, color: Constants.COLOR_MAIN },
      { msg: Strings.TUTORIAL_REVIEW_BODY_3_2, color: 'white' },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  {
    type: 'default',
    image: require('../Resources/img/imgObd1.png'),
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_4_1, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_4_2, color: Constants.COLOR_MAIN },
      { msg: Strings.TUTORIAL_REVIEW_BODY_4_3, color: 'white' },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  {
    type: 'escape',
    title: Strings.TUTORIAL_REVIEW_TITLE_5,
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_5_1, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_5_2, color: Constants.COLOR_MAIN },
      { msg: Strings.TUTORIAL_REVIEW_BODY_5_3, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_5_4, color: Constants.COLOR_MAIN },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
];

const dataKor = [
  {
    type: 'default',
    image: require('../Resources/img/imgObd1.png'),
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_1_1, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_1_2, color: Constants.COLOR_MAIN },
      { msg: Strings.TUTORIAL_REVIEW_BODY_1_3, color: 'white' },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  {
    type: 'default',
    image: require('../Resources/img/imgObd2.png'),
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_2_1, color: Constants.COLOR_MAIN },
      { msg: Strings.TUTORIAL_REVIEW_BODY_2_2, color: 'white' },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  {
    type: 'default',
    image: require('../Resources/img/imgObd3.png'),
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_3_1, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_3_2, color: Constants.COLOR_MAIN },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  {
    type: 'default',
    image: require('../Resources/img/imgObd1.png'),
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_4_1, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_4_2, color: Constants.COLOR_MAIN },
      { msg: Strings.TUTORIAL_REVIEW_BODY_4_3, color: 'white' },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  {
    type: 'escape',
    title: Strings.TUTORIAL_REVIEW_TITLE_5,
    message: [
      { msg: Strings.TUTORIAL_REVIEW_BODY_5_1, color: Constants.COLOR_MAIN },
      { msg: Strings.TUTORIAL_REVIEW_BODY_5_2, color: 'white' },
      { msg: Strings.TUTORIAL_REVIEW_BODY_5_3, color: Constants.COLOR_MAIN },
      { msg: Strings.TUTORIAL_REVIEW_BODY_5_4, color: 'white' },
    ],
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
];

export default class TutorialReviewScreen extends React.Component {
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
    Preference.set('isFirstReviewPosting', 'false');
    this.props.navigation.pop();
  }

  _renderSlide({ item, index }) {
    return (
      <View style={{ flex: 1, backgroundColor: item.backgroundColor }}>
        {item.type === 'default' ? (
          <FastImage source={item.image} style={styles.slideImage} resizeMode={'contain'} />
        ) : (
          <Text style={styles.slideText}>{item.title}</Text>
        )}
        {item.type === 'default' ? (
          <View style={styles.slideMessageContainer}>
            <Text style={styles.slideTitle}>
              {item.message.map((item) => (
                <Text style={{ color: item.color }}>{item.msg}</Text>
              ))}
            </Text>
          </View>
        ) : (
          <View style={styles.slideMessageContainer}>
            <Text style={styles.slideTitle}>
              {item.message.map((item) => (
                <Text style={{ color: item.color }}>{item.msg}</Text>
              ))}
            </Text>
            <Pressable onPress={this.onPressStartButton.bind(this)}>
              <Text style={styles.slideTitle}>
                {Strings.GO_TO_POST_REVIEW}
                <FastImage
                  style={styles.sectionTitleMoreIcon}
                  source={require('../Resources/img/iconRenewal/icCommonTitle20W.png')}
                />
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  render() {
    const { navigation } = this.props;
    const deviceLanguage =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager.settings.AppleLocale ||
          NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
        : NativeModules.I18nManager.localeIdentifier;
    const locale = deviceLanguage.substring(0, 2);
    const data = locale === 'ko' ? dataKor : dataEng;

    return (
      <View style={styles.container}>
        <Carousel
          ref={(c) => {
            this._carousel = c;
          }}
          data={data}
          renderItem={this._renderSlide.bind(this)}
          sliderWidth={Dimensions.get('window').width}
          itemWidth={Dimensions.get('window').width}
          onSnapToItem={(index) => this.setState({ activeSlideIndex: index })}
        />
        <View style={styles.headerBarContainer}>
          <FastImage style={styles.logo} source={require('../Resources/img/icGreydLogo32.png')} />
          <Button
            title={Strings.SKIP}
            type="clear"
            titleStyle={styles.skipButtonTitle}
            onPress={this.onPressStartButton.bind(this)}
          />
        </View>
        <View style={styles.slidePagination}>
          <Pagination
            dotsLength={data.length}
            activeDotIndex={this.state.activeSlideIndex}
            dotContainerStyle={{
              marginHorizontal: 2,
            }}
            dotStyle={{
              width: 5,
              height: 5,
              borderRadius: 5,
              backgroundColor: 'rgba(255, 255, 255, 1)',
            }}
            inactiveDotStyle={{}}
            inactiveDotOpacity={0.2}
            inactiveDotScale={1}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 35,
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
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
    marginTop: isIphoneX() ? 100 : 70,
    height: Dimensions.get('window').height * 0.52,
    alignSelf: 'center',
  },
  slideText: {
    marginTop: isIphoneX() ? 100 : 70,
    paddingTop: 140,
    color: 'white',
    fontSize: 40,
    lineHeight: 50,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButtonTitle: {
    color: 'white',
    opacity: 0.5,
    fontSize: 18,
  },
  slideMessageContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    bottom: getBottomSpace() + 140,
  },
  slideTitle: {
    color: Constants.COLOR_MAIN,
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
  sectionTitleMoreIcon: {
    marginLeft: 10,
    width: 20,
    height: 15,
  },
});

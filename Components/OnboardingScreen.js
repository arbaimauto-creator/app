import { CommonActions } from '@react-navigation/native';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Preference from 'react-native-default-preference';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { getBottomSpace, isIphoneX } from 'react-native-iphone-x-helper';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import SplashScreen from 'react-native-splash-screen';
import Constants from './Constants';
import Strings, { getLanguage } from './Strings';
import { SafeAreaView } from 'react-native';

const data = [
  {
    image: 'https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/en-initial-guide-01.png',
  },
  {
    image: 'https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/en-initial-guide-02.png',
  },
  {
    image: 'https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/en-initial-guide-03.png',
  },
  {
    image: 'https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/en-initial-guide-04.png',
  },
  {
    image: 'https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/en-initial-guide-05.png',
  },
  {
    image: 'https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/en-initial-guide-06.png',
  },
  // {
  //   image: require('../Resources/img/imgObd1.png'),
  //   title: Strings.ONBOARING_1_TITLE,
  //   message: Strings.ONBOARING_1_MESSAGE,
  //   backgroundColor: 'rgb(175, 111, 120)',
  // },
  // {
  //   image: require('../Resources/img/imgObd2.png'),
  //   title: Strings.ONBOARING_2_TITLE,
  //   message: Strings.ONBOARING_2_MESSAGE,
  //   backgroundColor: 'rgb(87, 100, 132)',
  // },
  // {
  //   image: require('../Resources/img/imgObd3.png'),
  //   title: Strings.ONBOARING_3_TITLE,
  //   message: Strings.ONBOARING_3_MESSAGE,
  //   backgroundColor: 'rgb(192, 142, 50)',
  // },
];

const getOnboardingImages = (language) => [
  {
    image: `https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/${language}-initial-guide-01.png`,
  },
  {
    image: `https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/${language}-initial-guide-02.png`,
  },
  {
    image: `https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/${language}-initial-guide-03.png`,
  },
  {
    image: `https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/${language}-initial-guide-04.png`,
  },
  {
    image: `https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/${language}-initial-guide-05.png`,
  },
  {
    image: `https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/${language}-initial-guide-06.png`,
  },
];

export default class OnboardingScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeSlideIndex: 0,
      language: 'en',
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
        {/* <Image source={item.image} style={styles.slideImage} resizeMode={'contain'} /> */}
        <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 999 }}>
          <Button
            title={Strings.SKIP}
            type="clear"
            titleStyle={styles.skipButtonTitle}
            onPress={this.onPressStartButton.bind(this)}
          />
        </View>
        <FastImage source={{ uri: item.image }} style={styles.slideImage} resizeMode={'contain'} />
      </View>
    );
  }

  render() {
    const { navigation } = this.props;

    return (
      <SafeAreaView style={styles.container}>
        <Carousel
          ref={(c) => {
            this._carousel = c;
          }}
          data={getOnboardingImages(getLanguage())}
          renderItem={this._renderSlide.bind(this)}
          sliderWidth={Dimensions.get('window').width}
          itemWidth={Dimensions.get('window').width}
          onSnapToItem={(index) => this.setState({ activeSlideIndex: index })}
          useExperimentalSnap={true}
          disableIntervalMomentum={true}
        />
        {/* <View style={styles.headerBarContainer}>
          <Image style={styles.logo} source={require('../Resources/img/icGreydLogo32.png')} />
          <Button
            title={Strings.SKIP}
            type="clear"
            titleStyle={styles.skipButtonTitle}
            onPress={this.onPressStartButton.bind(this)}
          />
        </View> */}
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
              display: 'none',
            }}
            inactiveDotStyle={{ display: 'none' }}
            inactiveDotOpacity={0.2}
            inactiveDotScale={1}
          />
        </View>
        {this.state.activeSlideIndex === data.length - 1 && (
          <Button
            title={Strings.START}
            type="clear"
            titleStyle={styles.startButtonTitle}
            containerStyle={styles.startButtonContainer}
            onPress={this.onPressStartButton.bind(this)}
          />
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.TIER_COLORS.PIONEER,
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
    // marginTop: isIphoneX() ? 100 : 70,
    // height: Dimensions.get('window').height * 0.52,
    height: '100%',
    width: '100%',
    alignSelf: 'center',
  },
  skipButtonTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    fontSize: 14,
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
    backgroundColor: Constants.TIER_COLORS.GIVER,
    width: '100%',
  },
  startButtonTitle: {
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
    color: 'white',
  },
});

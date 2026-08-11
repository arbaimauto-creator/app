import React from 'react';
import T from '../../Components/Constants/DesignTokens';
import {
  Alert,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import FastImage from 'react-native-fast-image';
import IconFontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Constants from '../../Components/Constants';
import HorizontalRatingButtonContainer from '../../Components/CustomComponents/G6HorizontalRating/HorizontalRatingButtonsContainer';
import Strings, { getLanguage } from '../../Components/Strings';
import { moderateScale } from '../../Components/utils/scailing';

function RatingModalView({ context }) {
  const { myG6Rating } = context.state;

  const handlePress = () => {
    context.setState({
      isShowingGreyding: false,
    });
    LayoutAnimation.easeInEaseOut();
    if (
      myG6Rating?.authentic &&
      myG6Rating?.informative &&
      myG6Rating?.creative &&
      myG6Rating?.aesthetic &&
      myG6Rating?.entertaining &&
      myG6Rating?.attractive
    ) {
      context.onRatingComplete({
        authentic: myG6Rating?.authentic,
        informative: myG6Rating?.informative,
        creative: myG6Rating?.creative,
        aesthetic: myG6Rating?.aesthetic,
        entertaining: myG6Rating?.entertaining,
        attractive: myG6Rating?.attractive,
      });
      Preference.set('isGradeBubbleGuided', 'true');
      Preference.set('isGradedAlready', 'true');
    } else {
      context.onRatingCancel();
    }
  };

  return (
    <View style={styles.ratingModalContainer}>
      {/* <View style={styles.greydScoreGuidelinesContainer}>
        <FastImage
          source={require('../../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
        <Text style={styles.fieldGreydGuidelines}>{Strings.GREYD_GUIDELINES}</Text>
      </View>
       */}
      {/* {context.state.isGradedAlready === false && (
          <View style={styles.greyingGuideMessageContainer}>
            <Text style={styles.greyingGuideTitle}>
              {GRADING_GUIDE_TITLE.split(' ').map((word, idx) => (
                <Text key={word + '_' + idx} style={styles.greyingGuideTitle}>
                  {word}{' '}
                </Text>
              ))}
            </Text>
            <View style={styles.greyingGuideWapper}>
              <Text style={styles.greyingGuideMessage}>{'1) '}</Text>
              <Text style={styles.greyingGuideMessage}>
                {GRADING_GUIDE_BODY_1.split(' ').map((word, idx) => (
                  <Text key={word + '_' + idx} style={styles.greyingGuideMessage}>
                    {word}{' '}
                  </Text>
                ))}
              </Text>
            </View>
            <View style={styles.greyingGuideWapper}>
              <Text style={styles.greyingGuideMessage}>{'2) '}</Text>
              <Text style={styles.greyingGuideMessage}>
                {GRADING_GUIDE_BODY_2.split(' ').map((word, idx) => (
                  <Text key={word + '_' + idx} style={styles.greyingGuideMessage}>
                    {word}{' '}
                  </Text>
                ))}
              </Text>
            </View>
            <View style={styles.greyingGuideWapper}>
              <Text style={styles.greyingGuideMessage}>{'3) '}</Text>
              <Text style={styles.greyingGuideMessage}>
                {GRADING_GUIDE_BODY_3.split(' ').map((word, idx) => (
                  <Text key={word + '_' + idx} style={styles.greyingGuideMessage}>
                    {word}{' '}
                  </Text>
                ))}
              </Text>
            </View>
          </View>
        )} */}
      <TouchableWithoutFeedback>
        <View style={styles.ratingModalView}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <TouchableOpacity
                onPress={() => {
                  context.props.navigation.navigate('G6Guide');
                }}
              >
                <Text style={{ ...styles.modalTitle, fontSize: 18 }}>
                  {getLanguage() !== 'ko' ? Strings.RATE_G_SIX : ''}
                  {/* <Text style={{ color: Constants.COLOR_MAIN }}> G6 </Text> */}
                  <Text> G6 </Text>
                  {getLanguage() === 'ko' ? Strings.RATE_G_SIX : ''}
                  <IconFontAwesome5
                    name={'question-circle'}
                    size={18}
                    color={T.COLORS.GREY}
                  />
                </Text>
              </TouchableOpacity>

              <View style={styles.greydScoreGuidelinesContainer}>
                {/* <FastImage
              source={require('../../Resources/img/icCommonNe10.png')}
              style={styles.requiredIcon}
            /> */}
                <Text style={styles.fieldGreydGuidelines}>{Strings.GREYD_GUIDELINES}</Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                right: 20,
              }}
            >
              <FastImage
                source={require('../../Resources/img/icGreydSplashSymbol126.png')}
                style={{ width: 24, height: 24 }}
              />
              <Text
                style={{
                  color: 'black', //Constants.TIER_COLORS.PIONEER,
                  fontSize: moderateScale(24),
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                  marginLeft: moderateScale(8),

                  // textShadowColor: 'rgba(0, 0, 0, 1)',
                  // textShadowOffset: { width: 0.5, height: 0.5 },
                  // textShadowRadius: 1,
                }}
              >
                {(
                  (myG6Rating?.authentic +
                    myG6Rating?.informative +
                    myG6Rating?.creative +
                    myG6Rating?.aesthetic +
                    myG6Rating?.entertaining +
                    myG6Rating?.attractive) /
                  6
                ).toFixed(1) || 5.0}
              </Text>
            </View>
          </View>

          <HorizontalRatingButtonContainer context={context} />

          {/* <View style={{ marginHorizontal: 20 }}>
            <View
              style={{
                marginTop: 20,
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}
            >
              <VerticalRatingButtons
                title={Strings.G_SIX.AUTHENTIC}
                onPress={(value) => {
                  context.setState({
                    myG6Rating: {
                      ...myG6Rating,
                      authentic: value,
                    },
                  });
                }}
              />
              <VerticalRatingButtons
                title={Strings.G_SIX.CREATIVE}
                onPress={(value) => {
                  context.setState({
                    myG6Rating: {
                      ...myG6Rating,
                      authentic: value,
                    },
                  });
                }}
              />
              <VerticalRatingButtons
                title={Strings.G_SIX.AESTHETIC}
                onPress={(value) => {
                  context.setState({
                    myG6Rating: {
                      ...myG6Rating,
                      authentic: value,
                    },
                  });
                }}
              />
              <VerticalRatingButtons
                title={Strings.G_SIX.INFORMATIVE}
                onPress={(value) => {
                  context.setState({
                    myG6Rating: {
                      ...myG6Rating,
                      authentic: value,
                    },
                  });
                }}
              />
              <VerticalRatingButtons
                title={Strings.G_SIX.ATTRACTIVE}
                onPress={(value) => {
                  context.setState({
                    myG6Rating: {
                      ...myG6Rating,
                      authentic: value,
                    },
                  });
                }}
              />
              <VerticalRatingButtons
                title={Strings.G_SIX.ENTERTAINING}
                onPress={(value) => {
                  context.setState({
                    myG6Rating: {
                      ...myG6Rating,
                      authentic: value,
                    },
                  });
                }}
              />
            </View>
          </View> */}

          {/* <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'center',
              justifyContent: 'center',
            }}
          >
            {(video._id || video.videoId) && (
              <View style={{ flexDirection: 'column' }}>
                <View style={{ flexDirection: 'column' }}>
                  <PlusRatingMarker
                    labelText={Strings.G_SIX.AUTHENTIC}
                    value={
                      myG6Rating?.authentic
                        ? myG6Rating?.authentic
                        : video.myG6Rating?.authentic || 0
                    }
                    plusClick={() => {
                      const value = {
                        ...myG6Rating,
                        authentic: myG6Rating?.authentic
                          ? myG6Rating?.authentic
                          : video.myG6Rating?.authentic || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          authentic: value?.authentic < 10 ? value.authentic + 1 : 10,
                        },
                      });
                    }}
                    minusClick={() => {
                      const value = {
                        ...myG6Rating,
                        authentic: myG6Rating?.authentic
                          ? myG6Rating?.authentic
                          : video.myG6Rating?.authentic || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          authentic: value?.authentic > 0 ? value.authentic - 1 : 0,
                        },
                      });
                    }}
                  />
                  <PlusRatingMarker
                    labelText={Strings.G_SIX.CREATIVE}
                    value={
                      myG6Rating?.creative ? myG6Rating?.creative : video.myG6Rating?.creative || 0
                    }
                    plusClick={() => {
                      const value = {
                        ...myG6Rating,
                        creative: myG6Rating?.creative
                          ? myG6Rating?.creative
                          : video.myG6Rating?.creative || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          creative: value?.creative < 10 ? value.creative + 1 : 10,
                        },
                      });
                    }}
                    minusClick={() => {
                      const value = {
                        ...myG6Rating,
                        creative: myG6Rating?.creative
                          ? myG6Rating?.creative
                          : video.myG6Rating?.creative || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          creative: value?.creative > 0 ? value.creative - 1 : 0,
                        },
                      });
                    }}
                  />
                  <PlusRatingMarker
                    labelText={Strings.G_SIX.AESTHETIC}
                    value={
                      myG6Rating?.aesthetic
                        ? myG6Rating?.aesthetic
                        : video.myG6Rating?.aesthetic || 0
                    }
                    plusClick={() => {
                      const value = {
                        ...myG6Rating,
                        aesthetic: myG6Rating?.aesthetic
                          ? myG6Rating?.aesthetic
                          : video.myG6Rating?.aesthetic || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          aesthetic: value?.aesthetic < 10 ? value.aesthetic + 1 : 10,
                        },
                      });
                    }}
                    minusClick={() => {
                      const value = {
                        ...myG6Rating,
                        aesthetic: myG6Rating?.aesthetic
                          ? myG6Rating?.aesthetic
                          : video.myG6Rating?.aesthetic || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          aesthetic: value?.aesthetic > 0 ? value.aesthetic - 1 : 0,
                        },
                      });
                    }}
                  />
                  <PlusRatingMarker
                    labelText={Strings.G_SIX.INFORMATIVE}
                    value={
                      myG6Rating?.informative
                        ? myG6Rating?.informative
                        : video.myG6Rating?.informative || 0
                    }
                    plusClick={() => {
                      const value = {
                        ...myG6Rating,
                        informative: myG6Rating?.informative
                          ? myG6Rating?.informative
                          : video.myG6Rating?.informative || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          informative: value?.informative < 10 ? value.informative + 1 : 10,
                        },
                      });
                    }}
                    minusClick={() => {
                      const value = {
                        ...myG6Rating,
                        informative: myG6Rating?.informative
                          ? myG6Rating?.informative
                          : video.myG6Rating?.informative || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          informative: value?.informative > 0 ? value.informative - 1 : 0,
                        },
                      });
                    }}
                  />
                  <PlusRatingMarker
                    labelText={Strings.G_SIX.ATTRACTIVE}
                    value={
                      myG6Rating?.attractive
                        ? myG6Rating?.attractive
                        : video.myG6Rating?.attractive || 0
                    }
                    plusClick={() => {
                      const value = {
                        ...myG6Rating,
                        attractive: myG6Rating?.attractive
                          ? myG6Rating?.attractive
                          : video.myG6Rating?.attractive || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          attractive: value?.attractive < 10 ? value.attractive + 1 : 10,
                        },
                      });
                    }}
                    minusClick={() => {
                      const value = {
                        ...myG6Rating,
                        attractive: myG6Rating?.attractive
                          ? myG6Rating?.attractive
                          : video.myG6Rating?.attractive || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          attractive: value?.attractive > 0 ? value.attractive - 1 : 0,
                        },
                      });
                    }}
                  />
                  <PlusRatingMarker
                    labelText={Strings.G_SIX.ENTERTAINING}
                    value={
                      myG6Rating?.entertaining
                        ? myG6Rating?.entertaining
                        : video.myG6Rating?.entertaining || 0
                    }
                    plusClick={() => {
                      const value = {
                        ...myG6Rating,
                        entertaining: myG6Rating?.entertaining
                          ? myG6Rating?.entertaining
                          : video.myG6Rating?.entertaining || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          entertaining: value?.entertaining < 10 ? value.entertaining + 1 : 10,
                        },
                        currentChangedScore: Strings.G_SIX.ENTERTAINING,
                        currentChangedG6Title:
                          value?.entertaining < 10 ? value.entertaining + 1 : 10,
                      });
                    }}
                    minusClick={() => {
                      const value = {
                        ...myG6Rating,
                        entertaining: myG6Rating?.entertaining
                          ? myG6Rating?.entertaining
                          : video.myG6Rating?.entertaining || 0,
                      };
                      context.setState({
                        myG6Rating: {
                          ...myG6Rating,
                          entertaining: value?.entertaining > 0 ? value.entertaining - 1 : 0,
                        },
                      });
                    }}
                  />
                </View>
              </View>
            )}
          </View> */}

          {/* <View style={styles.greydScoreGuidelinesContainer}>
            <FastImage
              source={require('../../Resources/img/icCommonNe10.png')}
              style={styles.requiredIcon}
            />
            <Text style={styles.fieldGreydGuidelines}>{Strings.GREYD_GUIDELINES}</Text>
          </View> */}
        </View>
      </TouchableWithoutFeedback>

      <TouchableOpacity
        style={styles.openButton}
        onPress={() => {
          if (
            myG6Rating?.authentic === 5 &&
            myG6Rating?.informative === 5 &&
            myG6Rating?.creative === 5 &&
            myG6Rating?.aesthetic === 5 &&
            myG6Rating?.entertaining === 5 &&
            myG6Rating?.attractive === 5
          ) {
            Alert.alert(
              Strings.BASE_SCORE_TITLE,
              Strings.BASE_SCORE_CONTENT,
              [
                {
                  text: Strings.CANCEL,
                  onPress: () => {},
                  style: 'destructive',
                },
                {
                  text: Strings.OK,
                  onPress: () => handlePress(),
                },
              ],
              { cancelable: true },
            );
          } else {
            handlePress();
          }
        }}
      >
        <Text style={styles.buttonTextStyle}>{Strings.OK}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  ratingModalContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 15,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ratingModalView: {
    width: '100%',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    paddingVertical: 15,
    // alignItems: 'center',
    // borderBlockColor: T.COLORS.INK,
    // borderWidth: 0.5,
  },
  modalTitle: {
    color: 'black', //Constants.TIER_COLORS.PIONEER,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5, //'SUIT-Bold',
    marginBottom: 10,
    marginHorizontal: 20,
    fontSize: 15,

    // textShadowColor: 'rgba(0, 0, 0, 1)',
    // textShadowOffset: { width: 0.5, height: 0.5 },
    // textShadowRadius: 1,
  },
  greydScoreGuidelinesContainer: {
    // flexDirection: 'row',
    // alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  requiredIcon: {
    width: 8,
    height: 10,
    marginHorizontal: 5,
  },
  fieldGreydGuidelines: {
    color: T.COLORS.INK,
    fontSize: 11,
    // lineHeight: 18,
    marginBottom: -5,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,

    // textShadowColor: 'rgba(255, 255, 255, 1)',
    // textShadowOffset: { width: 0.3, height: 0.3 },
    // textShadowRadius: 0,
  },
  openButton: {
    width: '100%',
    borderRadius: 14,
    borderColor: T.COLORS.INK,
    // borderWidth: 0.5,
    elevation: 2,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
  },
  buttonTextStyle: {
    color: T.COLORS.INK,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
    fontSize: 17,
  },
});

export default RatingModalView;

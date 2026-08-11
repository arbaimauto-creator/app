import React from 'react';
import T from '../../Constants/DesignTokens';
import { StyleSheet, Text, View } from 'react-native';
import Constants from '../../Constants';
import Strings, { getLanguage } from '../../Strings';
import { horizontalScale, moderateScale, verticalScale } from '../../utils/scailing';

function G6DescriptionText() {
  return (
    <View>
      <Text style={styles.G6DescriptionTitle}>{Strings.G6_TITLE}</Text>
      <Text style={styles.G6DescriptionContent}>
        {getLanguage() === 'en' ? 'G6 is ' : ''}
        <Text
          style={{
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
            color: T.COLORS.INK,
          }}
        >
          greyd
        </Text>
        {getLanguage() === 'en' ? "'s " : ''}
        {Strings.G6_CONTENT_1}
      </Text>
      <Text style={styles.G6DescriptionContent}>{Strings.G6_CONTENT_2}</Text>
      <Text style={styles.G6DescriptionContent}>{Strings.G6_CONTENT_3}</Text>
    </View>
  );
}

function BaseDescriptionText({ title, content }) {
  return (
    <View>
      <Text style={styles.G6DescriptionTitle}>{title}</Text>
      <Text style={styles.G6DescriptionContent}>{content}</Text>
    </View>
  );
}

function G6Description({ tierState }) {
  const g6Divider = {
    [Strings.G_SIX.AUTHENTIC]: (
      <BaseDescriptionText
        title={Strings.G_SIX.AUTHENTIC}
        content={Strings.AUTHENTIC_DESCRIPTION}
      />
    ),
    [Strings.G_SIX.INFORMATIVE]: (
      <BaseDescriptionText
        title={Strings.G_SIX.INFORMATIVE}
        content={Strings.INFORMATIVE_DESCRIPTION}
      />
    ),
    [Strings.G_SIX.ATTRACTIVE]: (
      <BaseDescriptionText
        title={Strings.G_SIX.ATTRACTIVE}
        content={Strings.ATTRACTIVE_DESCRIPTION}
      />
    ),
    [Strings.G_SIX.ENTERTAINING]: (
      <BaseDescriptionText
        title={Strings.G_SIX.ENTERTAINING}
        content={Strings.ENTERTAINING_DESCRIPTION}
      />
    ),
    [Strings.G_SIX.AESTHETIC]: (
      <BaseDescriptionText
        title={Strings.G_SIX.AESTHETIC}
        content={Strings.AESTHETIC_DESCRIPTION}
      />
    ),
    [Strings.G_SIX.CREATIVE]: (
      <BaseDescriptionText title={Strings.G_SIX.CREATIVE} content={Strings.CREATIVE_DESCRIPTION} />
    ),
  };

  const defaultDescription = <G6DescriptionText />;

  return (
    <View style={{ marginHorizontal: horizontalScale(40), marginTop: moderateScale(60) }}>
      <View
        style={{
          width: horizontalScale(50),
          height: verticalScale(6),
          backgroundColor: Constants.COLOR_MAIN,
          borderRadius: moderateScale(10),
          marginBottom: moderateScale(10),
        }}
      />
      {g6Divider[tierState] || defaultDescription}
    </View>
  );
}

const styles = StyleSheet.create({
  G6DescriptionTitle: {
    color: T.COLORS.INK,
    fontSize: moderateScale(20),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    marginTop: moderateScale(5),
    marginBottom: moderateScale(20),
  },
  G6DescriptionContent: {
    // lineHeight: moderateScale(18),
    color: T.COLORS.INK,
    fontSize: moderateScale(13),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
    marginBottom: moderateScale(10),
    lineHeight: moderateScale(22),
  },
});

export default G6Description;

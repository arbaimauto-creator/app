import { useScrollToTop } from '@react-navigation/native';
import T from '../Constants/DesignTokens';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Path, Svg, Text as SvgText } from 'react-native-svg';
import Constants from '../Constants';
import HeaderLeftBackButton from '../CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from '../Strings';
import { horizontalScale, moderateScale, verticalScale } from '../utils/scailing';
import HelpBubble from '../CustomComponents/HelpBubble';
import Preference from 'react-native-default-preference';

export default function UserScreenWrapper(props) {
  const ref = React.useRef(null);
  useScrollToTop(ref);
  return <UserPageScreen {...props} scrollRef={ref} />;
}
function HexagonWithText({ grade, textColor, fillColor, opacity, tierState }) {
  return (
    <Svg height={moderateScale(100)} width={moderateScale(100)} viewBox="0 0 90 100">
      <Path
        opacity={opacity}
        stroke={'white'}
        strokeWidth={grade === tierState ? 2 : 0.5}
        fill={fillColor}
        d="M34.64101615137754 4.999999999999999Q43.30127018922193 0 51.96152422706632 4.999999999999999L77.94228634059948 20Q86.60254037844386 25 86.60254037844386 35L86.60254037844386 65Q86.60254037844386 75 77.94228634059948 80L51.96152422706632 95Q43.30127018922193 100 34.64101615137754 95L8.660254037844387 80Q0 75 0 65L0 35Q0 25 8.660254037844387 20Z"
      />

      <SvgText
        x={'45%'}
        y={'55%'}
        textAnchor="middle"
        fill={textColor}
        // fontWeight="600"
        fontSize={14}
        letterSpacing="0"
        fontFamily={Constants.CUSTOM_FONTS.SUIT.REGULAR}
        opacity={opacity}
      >
        {grade}
      </SvgText>
    </Svg>
  );
}

function GreydTierIntro({ tierState, setTierState }) {
  const hexagonLeftPosition = Dimensions.get('window').width / 2 - horizontalScale(50);

  return (
    <View style={{ height: moderateScale(290) }}>
      <TouchableOpacity
        style={styles.hexagon(205 + 4, hexagonLeftPosition)}
        onPress={() => {
          if (tierState === Strings.GREYD_TIER_GIVER) {
            return setTierState(null);
          }
          return setTierState(Strings.GREYD_TIER_GIVER);
        }}
      >
        <HexagonWithText
          grade={Strings.GREYD_TIER_GIVER}
          textColor={'#3a3a3a'}
          fillColor={T.COLORS.AMBER}
          opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_GIVER ? 1 : 0.4}
          tierState={tierState}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.hexagon(285, hexagonLeftPosition - moderateScale(45 - 1.25))}
        onPress={() => {
          if (tierState === Strings.GREYD_TIER_ARTISAN) {
            return setTierState(null);
          }
          return setTierState(Strings.GREYD_TIER_ARTISAN);
        }}
      >
        <HexagonWithText
          grade={Strings.GREYD_TIER_ARTISAN}
          textColor={'white'}
          fillColor={T.COLORS.INK}
          opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_ARTISAN ? 1 : 0.4}
          tierState={tierState}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.hexagon(285, hexagonLeftPosition + moderateScale(45 - 1.25))}
        onPress={() => {
          if (tierState === Strings.GREYD_TIER_OPERATOR) {
            return setTierState(null);
          }
          return setTierState(Strings.GREYD_TIER_OPERATOR);
        }}
      >
        <HexagonWithText
          grade={Strings.GREYD_TIER_OPERATOR}
          textColor={'white'}
          fillColor={T.COLORS.GREY}
          opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_OPERATOR ? 1 : 0.4}
          tierState={tierState}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.hexagon(365 - 4, hexagonLeftPosition - moderateScale(90 - 2.5))}
        onPress={() => {
          if (tierState === Strings.GREYD_TIER_STRIVER) {
            return setTierState(null);
          }
          return setTierState(Strings.GREYD_TIER_STRIVER);
        }}
      >
        <HexagonWithText
          grade={Strings.GREYD_TIER_STRIVER}
          textColor={'#1a1a1a'}
          fillColor={T.COLORS.GREY}
          opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_STRIVER ? 1 : 0.4}
          tierState={tierState}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.hexagon(365 - 4, hexagonLeftPosition)}
        onPress={() => {
          if (tierState === Strings.GREYD_TIER_EXPLORER) {
            return setTierState(null);
          }
          return setTierState(Strings.GREYD_TIER_EXPLORER);
        }}
      >
        <HexagonWithText
          grade={Strings.GREYD_TIER_EXPLORER}
          textColor={'#2a2a2a'}
          fillColor={T.COLORS.LINE}
          opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_EXPLORER ? 1 : 0.4}
          tierState={tierState}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.hexagon(365 - 4, hexagonLeftPosition + moderateScale(90 - 2.5))}
        onPress={() => {
          if (tierState === Strings.GREYD_TIER_PIONEER) {
            return setTierState(null);
          }
          return setTierState(Strings.GREYD_TIER_PIONEER);
        }}
      >
        <HexagonWithText
          grade={Strings.GREYD_TIER_PIONEER}
          textColor={'#3a3a3a'}
          fillColor={Constants.TIER_COLORS.PIONEER}
          // opacity={!tierState ? 1 : 0.4}
          opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_PIONEER ? 1 : 0.4}
          tierState={tierState}
        />
      </TouchableOpacity>
    </View>
  );
}

function GreydTierDescriptionText() {
  return (
    <View>
      <Text
        style={{
          color: T.COLORS.INK,
          fontSize: moderateScale(16),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
          marginBottom: moderateScale(10),
        }}
      >
        {Strings.G6_DESCRIPTION.GENERAL.TITLE}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.GREY,
          fontSize: moderateScale(13),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
          marginBottom: moderateScale(10),
        }}
      >
        {Strings.G6_DESCRIPTION.GENERAL.CONTENT_1}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.GREY,
          fontSize: moderateScale(13),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
        }}
      >
        {Strings.G6_DESCRIPTION.GENERAL.CONTENT_2}
      </Text>
    </View>
  );
}

function GiverDescriptionText() {
  return (
    <>
      <Text
        style={{
          color: T.COLORS.INK,
          fontSize: moderateScale(16),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(10),
        }}
      >
        {Strings.GREYD_TIER_GIVER}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.INK,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(5),
        }}
      >
        {Strings.G6_DESCRIPTION.GIVER.CONTENT_1}
        <Text
          style={{
            color: Constants.COLOR_MAIN,
            fontSize: moderateScale(13),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          }}
        >
          {' '}
          {Strings.GREYD_TIER_GIVER}
        </Text>{' '}
        {Strings.G6_DESCRIPTION.GIVER.CONTENT_2}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.GREY,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
        }}
      >
        {Strings.G6_DESCRIPTION.GIVER.CONTENT_3}
        <Text
          style={{
            color: Constants.COLOR_MAIN,
            fontSize: moderateScale(12),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          }}
        >
          {' '}
          {Strings.GREYD_TIER_GIVER}{' '}
        </Text>
        {Strings.G6_DESCRIPTION.GIVER.CONTENT_4}
      </Text>
    </>
  );
}

function ArtisanDescriptionText() {
  return (
    <>
      <Text
        style={{
          color: T.COLORS.INK,
          fontSize: moderateScale(16),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(10),
        }}
      >
        {Strings.GREYD_TIER_ARTISAN}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.INK,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(5),
        }}
      >
        {Strings.G6_DESCRIPTION.ARTISAN.CONTENT_1}
        <Text style={{ fontSize: moderateScale(13), fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD }}>
          {' '}
          {Strings.GREYD_TIER_ARTISAN}
        </Text>{' '}
        {Strings.G6_DESCRIPTION.ARTISAN.CONTENT_2}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.GREY,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
        }}
      >
        {Strings.G6_DESCRIPTION.ARTISAN.CONTENT_3}
        <Text
          style={{
            fontSize: moderateScale(12),
            fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD,
            color: T.COLORS.INK,
          }}
        >
          {' '}
          {Strings.GREYD_TIER_ARTISAN}{' '}
        </Text>
        {Strings.G6_DESCRIPTION.ARTISAN.CONTENT_4}
      </Text>
    </>
  );
}

function OperatorDescriptionText() {
  return (
    <>
      <Text
        style={{
          color: T.COLORS.INK,
          fontSize: moderateScale(16),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(10),
        }}
      >
        {Strings.GREYD_TIER_OPERATOR}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.INK,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(5),
        }}
      >
        {Strings.G6_DESCRIPTION.OPERATOR.CONTENT_1}
        <Text style={{ fontSize: moderateScale(13), fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD }}>
          {' '}
          {Strings.GREYD_TIER_OPERATOR}
        </Text>{' '}
        {Strings.G6_DESCRIPTION.OPERATOR.CONTENT_2}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.GREY,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
        }}
      >
        {Strings.G6_DESCRIPTION.OPERATOR.CONTENT_3}
        <Text
          style={{
            fontSize: moderateScale(12),
            fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD,
            color: T.COLORS.INK,
          }}
        >
          {' '}
          {Strings.GREYD_TIER_OPERATOR}{' '}
        </Text>
        {Strings.G6_DESCRIPTION.OPERATOR.CONTENT_4}
      </Text>
    </>
  );
}

function StriverDescriptionText() {
  return (
    <>
      <Text
        style={{
          color: T.COLORS.INK,
          fontSize: moderateScale(16),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(10),
        }}
      >
        {Strings.GREYD_TIER_STRIVER}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.INK,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(5),
        }}
      >
        {Strings.G6_DESCRIPTION.STRIVER.CONTENT_1}
        <Text style={{ fontSize: moderateScale(13), fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD }}>
          {' '}
          {Strings.GREYD_TIER_STRIVER}
        </Text>{' '}
        {Strings.G6_DESCRIPTION.STRIVER.CONTENT_2}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.GREY,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
        }}
      >
        {Strings.G6_DESCRIPTION.STRIVER.CONTENT_3}
        <Text
          style={{
            fontSize: moderateScale(12),
            fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD,
            color: T.COLORS.INK,
          }}
        >
          {' '}
          {Strings.GREYD_TIER_STRIVER}{' '}
        </Text>
        {Strings.G6_DESCRIPTION.STRIVER.CONTENT_4}
      </Text>
    </>
  );
}

function ExplorerDescriptionText() {
  return (
    <>
      <Text
        style={{
          color: T.COLORS.INK,
          fontSize: moderateScale(16),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(10),
        }}
      >
        {Strings.GREYD_TIER_EXPLORER}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.INK,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(5),
        }}
      >
        {Strings.G6_DESCRIPTION.EXPLORER.CONTENT_1}
        <Text style={{ fontSize: moderateScale(13), fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD }}>
          {' '}
          {Strings.GREYD_TIER_EXPLORER}
        </Text>{' '}
        {Strings.G6_DESCRIPTION.EXPLORER.CONTENT_2}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.GREY,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
        }}
      >
        {Strings.G6_DESCRIPTION.EXPLORER.CONTENT_3}
        <Text
          style={{
            fontSize: moderateScale(12),
            fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD,
            color: T.COLORS.INK,
          }}
        >
          {' '}
          {Strings.GREYD_TIER_EXPLORER}{' '}
        </Text>
        {Strings.G6_DESCRIPTION.EXPLORER.CONTENT_4}
      </Text>
    </>
  );
}

function PioneerDescriptionText() {
  return (
    <>
      <Text
        style={{
          color: T.COLORS.INK,
          fontSize: moderateScale(16),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(10),
        }}
      >
        {Strings.GREYD_TIER_PIONEER}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.INK,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          marginBottom: moderateScale(5),
        }}
      >
        {Strings.G6_DESCRIPTION.PIONEER.CONTENT_1}
        <Text style={{ fontSize: moderateScale(13), fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD }}>
          {' '}
          {Strings.GREYD_TIER_PIONEER}
        </Text>{' '}
        {Strings.G6_DESCRIPTION.PIONEER.CONTENT_2}
      </Text>
      <Text
        style={{
          lineHeight: moderateScale(18),
          color: T.COLORS.GREY,
          fontSize: moderateScale(12),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
        }}
      >
        {Strings.G6_DESCRIPTION.PIONEER.CONTENT_3}
        <Text
          style={{
            fontSize: moderateScale(12),
            fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD,
            color: T.COLORS.INK,
          }}
        >
          {' '}
          {Strings.GREYD_TIER_PIONEER}{' '}
        </Text>
        {Strings.G6_DESCRIPTION.PIONEER.CONTENT_4}
      </Text>
    </>
  );
}
function GreydTierDescription({ tierState }) {
  const tierDivider = {
    Giver: <GiverDescriptionText />,
    Artisan: <ArtisanDescriptionText />,
    Operator: <OperatorDescriptionText />,
    Striver: <StriverDescriptionText />,
    Explorer: <ExplorerDescriptionText />,
    Pioneer: <PioneerDescriptionText />,
  };

  const defaultDescription = <GreydTierDescriptionText />;

  return (
    <View style={{ marginHorizontal: horizontalScale(40) }}>
      <View
        style={{
          width: horizontalScale(50),
          height: verticalScale(6),
          backgroundColor: Constants.COLOR_MAIN,
          borderRadius: moderateScale(10),
          marginBottom: moderateScale(10),
        }}
      />
      {tierDivider[tierState] || defaultDescription}
    </View>
  );
}

function TierCondition({
  tierName,
  description,
  profit,
  tierNameColor,
  descriptionColor,
  profitColor,
  opacity,
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(10),
        opacity,
      }}
    >
      <Text
        style={{
          // width: '18%',
          color: tierNameColor,
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          fontSize: moderateScale(14),
        }}
      >
        {tierName}
      </Text>
      <Text
        style={{
          // width: '70%',
          color: descriptionColor,
          textAlign: 'center',
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
          fontSize: moderateScale(12),
        }}
        numberOfLines={2}
      >
        {description}
      </Text>
      <Text
        style={{ color: profitColor, fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD, fontSize: moderateScale(16) }}
      >
        {profit}
      </Text>
    </View>
  );
}

function TierConditions({ tierState }) {
  return (
    <View style={{ marginVertical: moderateScale(30), marginHorizontal: moderateScale(20) }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: verticalScale(10),
        }}
      >
        <Text
          style={{
            color: T.COLORS.GREY,
            fontSize: moderateScale(14),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
          }}
        >
          {Strings.TIER}
        </Text>
        <Text
          style={{
            color: T.COLORS.GREY,
            fontSize: moderateScale(14),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
          }}
        >
          {Strings.DESCRIPTION}
        </Text>
        <Text
          style={{
            color: T.COLORS.GREY,
            fontSize: moderateScale(14),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
          }}
        >
          {Strings.PROFIT}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: T.COLORS.GREY,
          height: 0.5,
          marginBottom: moderateScale(10),
        }}
      />

      <TierCondition
        tierName={Strings.GREYD_TIER_GIVER}
        description={Strings.GIVER_CONDITION}
        profit={'10%'}
        tierNameColor={Constants.COLOR_MAIN}
        descriptionColor={Constants.COLOR_MAIN}
        profitColor={Constants.COLOR_MAIN}
        opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_GIVER ? 1 : 0.4}
      />
      <TierCondition
        tierName={Strings.GREYD_TIER_ARTISAN}
        description={Strings.ARTISAN_CONDITION}
        profit={'8%'}
        tierNameColor={T.COLORS.GREY}
        descriptionColor={
          tierState === Strings.GREYD_TIER_ARTISAN
            ? T.COLORS.INK
            : T.COLORS.GREY
        }
        profitColor={
          tierState === Strings.GREYD_TIER_ARTISAN
            ? T.COLORS.INK
            : T.COLORS.GREY
        }
        opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_ARTISAN ? 1 : 0.4}
      />
      <TierCondition
        tierName={Strings.GREYD_TIER_OPERATOR}
        description={Strings.OPERATOR_CONDITION}
        profit={'6%'}
        tierNameColor={T.COLORS.GREY}
        descriptionColor={
          tierState === Strings.GREYD_TIER_OPERATOR
            ? T.COLORS.INK
            : T.COLORS.GREY
        }
        profitColor={
          tierState === Strings.GREYD_TIER_OPERATOR
            ? T.COLORS.INK
            : T.COLORS.GREY
        }
        opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_OPERATOR ? 1 : 0.4}
      />
      <TierCondition
        tierName={Strings.GREYD_TIER_STRIVER}
        description={Strings.STRIVER_CONDITION}
        profit={'4%'}
        tierNameColor={T.COLORS.GREY}
        descriptionColor={
          tierState === Strings.GREYD_TIER_STRIVER
            ? T.COLORS.INK
            : T.COLORS.GREY
        }
        profitColor={
          tierState === Strings.GREYD_TIER_STRIVER
            ? T.COLORS.INK
            : T.COLORS.GREY
        }
        opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_STRIVER ? 1 : 0.4}
      />
      <TierCondition
        tierName={Strings.GREYD_TIER_EXPLORER}
        description={Strings.EXPLORER_CONDITION}
        profit={'2%'}
        tierNameColor={T.COLORS.GREY}
        descriptionColor={
          tierState === Strings.GREYD_TIER_EXPLORER
            ? T.COLORS.INK
            : T.COLORS.GREY
        }
        profitColor={
          tierState === Strings.GREYD_TIER_EXPLORER
            ? T.COLORS.INK
            : T.COLORS.GREY
        }
        opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_EXPLORER ? 1 : 0.4}
      />
      <TierCondition
        tierName={Strings.GREYD_TIER_PIONEER}
        description={Strings.PIONEER_CONDITION}
        profit={'0%'}
        tierNameColor={T.COLORS.GREY}
        descriptionColor={
          tierState === Strings.GREYD_TIER_PIONEER
            ? T.COLORS.INK
            : T.COLORS.GREY
        } //#7a7a7a
        profitColor={
          tierState === Strings.GREYD_TIER_PIONEER
            ? T.COLORS.INK
            : T.COLORS.GREY
        }
        opacity={!tierState ? 1 : tierState === Strings.GREYD_TIER_PIONEER ? 1 : 0.4}
      />
    </View>
  );
}

function UserPageScreen({ route, navigation }) {
  const [helpBubbleIndex, setHelpBubbleIndex] = useState(null);
  useEffect(() => {
    navigation.setOptions({
      title: route.params.category,
      headerStyle: {
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        borderBottomWidth: 0.4,
        borderBottomColor: Constants.COLOR_BACKGROUND_DARK,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerTintColor: T.COLORS.INK,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });

    Preference.get(`helpBubble[${Constants.HELP_BUBBLE_PAGE_KEY.TIER_GUIDE}]`).then((res) => {
      if (res) {
        setHelpBubbleIndex(+res);
      }
    });
  }, [navigation, route.params.category]);

  // useEffect(() => {
  //   console.log('tierState', tierState);
  // }, [tierState]);

  const [tierState, setTierState] = useState(null);

  return (
    <View style={styles.container}>
      <ScrollView>
        <GreydTierIntro tierState={tierState} setTierState={setTierState} />
        <GreydTierDescription tierState={tierState} />
        <TierConditions tierState={tierState} />
        <HelpBubble
          type={Constants.HELP_BUBBLE_PAGE_KEY.TIER_GUIDE}
          helpBubbleIndex={helpBubbleIndex}
          onPress={() => {
            if (helpBubbleIndex <= 2) {
              Preference.set(
                `helpBubble[${Constants.HELP_BUBBLE_PAGE_KEY.TIER_GUIDE}]`,
                (helpBubbleIndex + 1).toString(),
              );
              setHelpBubbleIndex(helpBubbleIndex + 1);
            }
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  headerContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: horizontalScale(20),
    marginBottom: horizontalScale(20),
    marginVertical: verticalScale(20),
    alignItems: 'center',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    height: verticalScale(38),
  },
  hexagon: (top, left) => ({
    position: 'absolute',
    top: moderateScale(top - 190),
    left: left,
    alignItems: 'center',
    justifyContent: 'center',
  }),
});

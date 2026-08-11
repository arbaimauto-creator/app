import React, { useEffect, useState } from 'react';
import T from '../../Constants/DesignTokens';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from '../../Constants';
import Strings, { getLanguage } from '../../Strings';
import { getMaxima, processData } from '../../utils';
import { moderateScale } from '../../utils/scailing';
import HeaderLeftBackButton from '../headerBackButton/headerLeftBackButton';
// import G6Chart from './G6Chart';
import G6Description from './G6Description';

const G6Chart = React.lazy(() => import('./G6Chart'));

function LazyG6Chart({ innerData, innerMaxima }) {
  return (
    <React.Suspense fallback={<View style={{ height: 300 }} />}>
      <G6Chart innerData={innerData} innerMaxima={innerMaxima} />
    </React.Suspense>
  );
}

function G6ItemButtion({ text, top, left, onPress, currentState }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        ...styles.G6TextContainer,
        top: top,
        left: left,
        borderColor: currentState === text ? Constants.COLOR_MAIN : T.COLORS.INK,
      }}
    >
      <Text style={styles.G6Text}>{text}</Text>
    </TouchableOpacity>
  );
}

function HeaderTitle() {
  return (
    <View style={{ flexDirection: 'row' }}>
      {getLanguage() === 'en' ? (
        <>
          <Text style={{ ...styles.headerTitle, color: Constants.COLOR_MAIN }}> </Text>
          <Text style={{ ...styles.headerTitle, color: T.COLORS.INK }}>
            What Is <Text style={{ ...styles.headerTitle, color: Constants.COLOR_MAIN }}>G6 </Text>(
            {Strings.GREYD_SIX}) ?
          </Text>
        </>
      ) : (
        <>
          <Text style={{ ...styles.headerTitle, color: Constants.COLOR_MAIN }}>G6</Text>
          <Text style={{ ...styles.headerTitle, color: T.COLORS.INK }}>
            ({Strings.GREYD_SIX})란?
          </Text>
        </>
      )}
    </View>
  );
}

function G6Guide({ navigation }) {
  const deviceWidth = Dimensions.get('window').width;

  const [currentState, setState] = useState('');

  const [innerData, setInnerData] = useState(processData(Strings.SCORE_INNER));
  const [innerMaxima, setInnerMaxima] = useState(getMaxima(Strings.SCORE_INNER));

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => HeaderTitle(),
      headerStyle: {
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        borderBottomWidth: 0.4,
        borderBottomColor: Constants.TIER_COLORS.PIONEER,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });
  }, [navigation]);

  const initializeState = () => {
    setState('');
    setInnerData(processData(Strings.SCORE_INNER));
    setInnerMaxima(getMaxima(Strings.SCORE_INNER));
  };

  return (
    <View style={styles.container}>
      <LazyG6Chart innerData={innerData} innerMaxima={innerMaxima} />
      <G6ItemButtion
        currentState={currentState}
        onPress={() => {
          if (currentState === Strings.G_SIX.AUTHENTIC) {
            return initializeState();
          }
          setState(Strings.G_SIX.AUTHENTIC);
          setInnerData(processData(Strings.SCORE_AUTHENTIC));
          setInnerMaxima(getMaxima(Strings.SCORE_AUTHENTIC));
        }}
        text={Strings.G_SIX.AUTHENTIC}
        top={15}
        left={getLanguage() === 'ko' ? deviceWidth / 2 - 30 : deviceWidth / 2 - 42.5}
      />
      <G6ItemButtion
        currentState={currentState}
        onPress={() => {
          if (currentState === Strings.G_SIX.INFORMATIVE) {
            return initializeState();
          }
          setState(Strings.G_SIX.INFORMATIVE);
          setInnerData(processData(Strings.SCORE_INFORMATIVE));
          setInnerMaxima(getMaxima(Strings.SCORE_INFORMATIVE));
        }}
        text={Strings.G_SIX.INFORMATIVE}
        top={85}
        left={getLanguage() === 'ko' ? deviceWidth / 6 - 30 : deviceWidth / 7 - 42.5}
      />
      <G6ItemButtion
        currentState={currentState}
        onPress={() => {
          if (currentState === Strings.G_SIX.CREATIVE) {
            return initializeState();
          }
          setState(Strings.G_SIX.CREATIVE);
          setInnerData(processData(Strings.SCORE_CREATIVE));
          setInnerMaxima(getMaxima(Strings.SCORE_CREATIVE));
        }}
        text={Strings.G_SIX.CREATIVE}
        top={85}
        left={getLanguage() === 'ko' ? deviceWidth / 1.2 - 30 : deviceWidth / 1.16 - 42.5}
      />
      <G6ItemButtion
        currentState={currentState}
        onPress={() => {
          if (currentState === Strings.G_SIX.ATTRACTIVE) {
            return initializeState();
          }
          setState(Strings.G_SIX.ATTRACTIVE);
          setInnerData(processData(Strings.SCORE_ATTRACTIVE));
          setInnerMaxima(getMaxima(Strings.SCORE_ATTRACTIVE));
        }}
        text={Strings.G_SIX.ATTRACTIVE}
        top={190}
        left={getLanguage() === 'ko' ? deviceWidth / 6 - 30 : deviceWidth / 7 - 42.5}
      />
      <G6ItemButtion
        currentState={currentState}
        onPress={() => {
          if (currentState === Strings.G_SIX.AESTHETIC) {
            return initializeState();
          }
          setState(Strings.G_SIX.AESTHETIC);
          setInnerData(processData(Strings.SCORE_AESTHETIC));
          setInnerMaxima(getMaxima(Strings.SCORE_AESTHETIC));
        }}
        text={Strings.G_SIX.AESTHETIC}
        top={190}
        left={getLanguage() === 'ko' ? deviceWidth / 1.2 - 30 : deviceWidth / 1.15 - 42.5}
      />
      <G6ItemButtion
        currentState={currentState}
        onPress={() => {
          if (currentState === Strings.G_SIX.ENTERTAINING) {
            return initializeState();
          }
          setState(Strings.G_SIX.ENTERTAINING);
          setInnerData(processData(Strings.SCORE_ENTERTAINING));
          setInnerMaxima(getMaxima(Strings.SCORE_ENTERTAINING));
        }}
        text={Strings.G_SIX.ENTERTAINING}
        top={265}
        left={getLanguage() === 'ko' ? deviceWidth / 2 - 30 : deviceWidth / 2 - 42.5}
      />
      <G6Description tierState={currentState} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  G6TextContainer: {
    marginTop: 10,
    width: getLanguage() === 'ko' ? 60 : 85,
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: T.COLORS.INK,
    paddingVertical: 2,
    alignItems: 'center',
  },
  G6Text: {
    color: T.COLORS.INK,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    fontSize: 12,
  },
});

export default G6Guide;

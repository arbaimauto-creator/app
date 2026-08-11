import React from 'react';
import T from '../../Constants/DesignTokens';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import IconFontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { VictoryArea, VictoryChart, VictoryGroup, VictoryPolarAxis } from 'victory-native';
import Constants from '../../Constants';
import Strings from '../../Strings';
import { moderateScale } from '../../utils/scailing';
import HeaderLeftBackButton from '../headerBackButton/headerLeftBackButton';

export default function G6UserChart(props) {
  const { context, state } = props.route.params;

  if (!state?.data) {
    return null;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK }}
      contentContainerStyle={{ flex: 1 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ width: '33%' }}>
          <HeaderLeftBackButton navigation={props.navigation} />
        </View>
        <View style={{ width: '33%' }}>
          <Text
            style={{
              textAlign: 'center',
              color: T.COLORS.INK,
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
              fontSize: 20,
            }}
          >
            {Strings.AVERAGE_GRADE}
          </Text>
        </View>
        <View style={{ width: '33%' }} />
      </View>
      <TouchableOpacity
        style={{
          paddingLeft: moderateScale(20),
          paddingTop: moderateScale(30),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => {
          props.navigation.navigate('G6Guide');
        }}
      >
        <Text
          style={{
            color: T.COLORS.INK,
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
            fontSize: 18,
            marginRight: 5,
          }}
        >
          {state.user.name}'s
          <Text style={{ color: Constants.COLOR_MAIN }}> G6</Text>
        </Text>
        <IconFontAwesome5
          name={'question-circle'}
          size={18}
          color={T.COLORS.GREY}
        />
      </TouchableOpacity>

      <View>
        <View style={{ position: 'absolute' }}>
          <View
            style={{
              position: 'absolute',
              top: 100,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: 'black',
                fontFamily: Constants.CUSTOM_FONTS.SCDREAM.BOLD_7,
                fontSize: 22,
              }}
            >
              {state?.user?.g6AvgRatingScore}
            </Text>
          </View>
          <VictoryChart
            style={{ parent: { top: 50 } }}
            startAngle={90}
            endAngle={450}
            polar
            domain={{ y: [0, 1] }}
          >
            <VictoryGroup
              colorScale={['#d5d5d5', 'none']}
              style={{
                data: {
                  fillOpacity: 0.4,
                  strokeWidth: 1,
                },
              }}
            >
              {state.data.map((data, i) => {
                return <VictoryArea key={i} data={data} />;
              })}
            </VictoryGroup>

            {Object.keys(state.maxima).map((key, i) => {
              return (
                <VictoryPolarAxis
                  key={i}
                  style={{
                    axisLabel: {
                      fill: 'none',
                    },
                    axis: { stroke: 'none' },
                    grid: { stroke: 'none' },
                    tickLabels: {
                      fill: T.COLORS.INK,
                      fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
                      fontWeight: '600',
                      fontSize: moderateScale(14),
                      padding: 15,
                    },
                  }}
                  labelPlacement="vertical"
                  label={Strings.G_SIX[key.toUpperCase()]}
                  axisValue={key}
                />
              );
            })}
          </VictoryChart>
        </View>
        <VictoryChart
          style={{ parent: { top: 50 } }}
          startAngle={90}
          endAngle={450}
          polar
          domain={{ y: [0, 1] }}
        >
          <VictoryGroup
            colorScale={[
              Constants.COLOR_MAIN,
              Constants.COLOR_MAIN,
              Constants.COLOR_MAIN,
              Constants.COLOR_MAIN,
              Constants.COLOR_MAIN,
            ]}
          >
            {state.data1.map((data, i) => {
              // console.log(data, i);
              return (
                <VictoryArea
                  key={i}
                  data={data}
                  style={{ data: { fillOpacity: 0, strokeWidth: 1, opacity: 0.2 * (i + 1) } }}
                />
              );
            })}
          </VictoryGroup>

          {Object.keys(state.maxima1).map((key, i) => {
            return (
              <VictoryPolarAxis
                // dependentAxis
                key={i}
                style={{
                  axis: { stroke: 'none' },
                  grid: { stroke: 'none' },
                  tickLabels: {
                    fill: 'none',
                  },
                }}
              />
            );
          })}
        </VictoryChart>
      </View>
    </SafeAreaView>
  );
}

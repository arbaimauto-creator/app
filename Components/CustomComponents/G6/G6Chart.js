import React, { useEffect, useState } from 'react';
import T from '../../Constants/DesignTokens';
import { View } from 'react-native';
import { VictoryArea, VictoryChart, VictoryGroup, VictoryPolarAxis } from 'victory-native';
import Constants from '../../Constants';
import Strings from '../../Strings';
import { getMaxima, processData } from '../../utils';
import { moderateScale } from '../../utils/scailing';
import { Text } from 'react-native';

function G6Chart({ innerData, innerMaxima, isVideoPage }) {
  const outData = processData(Strings.SCORE_OUTLINE);
  const outMaxima = getMaxima(Strings.SCORE_OUTLINE);
  const [scores, setScores] = useState({});

  useEffect(() => {
    let score = {};

    if (innerData) {
      innerData[0].forEach((data) => {
        score[data.x] = Number(data.y).toFixed(2) * 10;
      });
    }

    setScores(score);
  }, [innerData]);

  return (
    innerData &&
    innerMaxima && (
      <View>
        <View style={{ position: 'absolute' }}>
          <VictoryChart
            // padding={{ top: 50, left: 50, bottom: 50, right: 50 }}
            startAngle={90}
            endAngle={450}
            polar
            domain={{ y: [0, 1] }}
          >
            <VictoryGroup
              colorScale={[T.COLORS.AMBER, 'none']}
              style={{
                data: {
                  fillOpacity: 0.4,
                  strokeWidth: 1,
                },
              }}
            >
              {innerData.map((data, i) => {
                const newData = data.map((d, _i) => ({
                  x: `${d.x} (${Number(scores[data[_i].x]).toFixed(1)})`,
                  y: d.y,
                }));

                return <VictoryArea key={i} data={newData} />;
                // return <VictoryArea key={i} data={} labels={scores[data[i].x]} />;
              })}
            </VictoryGroup>

            {Object.keys(innerMaxima).map((key, i) => {
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
                      fill: isVideoPage ? T.COLORS.GREY : 'transparent',
                      fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
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
        <VictoryChart startAngle={90} endAngle={450} polar domain={{ y: [0, 1] }}>
          <VictoryGroup
            colorScale={[
              // Constants.COLOR_MAIN,
              T.COLORS.GREY,
              T.COLORS.GREY,
              T.COLORS.GREY,
              T.COLORS.GREY,
              T.COLORS.GREY,
            ]}
          >
            {outData.map((data, i) => {
              return (
                <VictoryArea
                  key={i}
                  data={data}
                  style={{ data: { fillOpacity: 0, strokeWidth: 1, opacity: 0.2 * (i + 1) } }}
                />
              );
            })}
          </VictoryGroup>

          {Object.keys(outMaxima).map((key, i) => {
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
    )
  );
}

export default React.memo(G6Chart);

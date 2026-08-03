import React from 'react';
import { View } from 'react-native';
import Strings from '../../Strings';
import HorizontalRatingButtons from './HorizontalRatingButtons';

const g6ScoreTitles = [
  'AUTHENTIC',
  'CREATIVE',
  'AESTHETIC',
  'INFORMATIVE',
  'ATTRACTIVE',
  'ENTERTAINING',
];

export default function HorizontalRatingButtonContainer({ context }) {
  return (
    <View style={{ marginHorizontal: 0 }}>
      <View
        style={
          {
            // width: '100%',
            // flexDirection: 'column',
            // justifyContent: 'space-around',
            // alignItems: 'center',
          }
        }
      >
        {g6ScoreTitles.map((scoreTitle, idx) => (
          <HorizontalRatingButtons
            key={scoreTitle + '_' + idx}
            scoreTitle={Strings.G_SIX[scoreTitle]}
            scoreValue={context.state.myG6Rating[[scoreTitle.toLowerCase()]]}
            idx={idx}
            onPress={(value) => {
              context.setState({
                myG6Rating: {
                  ...context.state.myG6Rating,
                  [scoreTitle.toLowerCase()]: value,
                },
              });
            }}
          />
        ))}
      </View>
    </View>
  );
}

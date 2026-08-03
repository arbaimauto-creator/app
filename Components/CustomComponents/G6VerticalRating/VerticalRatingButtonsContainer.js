import React from 'react';
import { View } from 'react-native';
import Strings from '../../Strings';
import VerticalRatingButtons from './VerticalRatingButtons';

const g6ScoreTitles = [
  'AUTHENTIC',
  'CREATIVE',
  'AESTHETIC',
  'INFORMATIVE',
  'ATTRACTIVE',
  'ENTERTAINING',
];

export default function VerticalRatingButtonContainer({ context }) {
  return (
    <View style={{ marginHorizontal: 20 }}>
      <View
        style={{
          marginTop: 20,
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {g6ScoreTitles.map((scoreTitle, idx) => (
          <VerticalRatingButtons
            key={scoreTitle + '_' + idx}
            scoreTitle={Strings.G_SIX[scoreTitle]}
            scoreValue={context.state.myG6Rating[[scoreTitle.toLowerCase()]]}
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

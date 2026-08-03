import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../../Components/Constants';
import HeaderLeftBackButton from '../../Components/CustomComponents/headerBackButton/headerLeftBackButton';
import { moderateScale } from '../../Components/utils/scailing';
import styles from './styles';
import Strings from '../../Components/Strings';
import { CheckBox } from '../../Components/Views';

function MustRead() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
      <FastImage
        source={require('../../Resources/img/icGreydSplashSymbol126.png')}
        style={{ width: 24, height: 24, marginRight: 10 }}
      />
      <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD, fontSize: 20 }}>
        {Strings.MUST_READ}
      </Text>
    </View>
  );
}

export default function MustReadDetail({ navigation, route }) {
  const [checked, setChecked] = useState(route.params.context.state.isRead);

  useEffect(() => {
    navigation.setOptions({
      title: MustRead(),
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });
  }, [navigation]);

  useEffect(() => {
    route.params.context.setState({ isRead: checked });
  }, [checked, route.params.context]);

  return (
    <View style={styles.sectionContainer}>
      <View
        style={{
          ...styles.sectionTitleContainer,
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
              fontSize: 15,
            }}
          >
            {Strings.MUST_READ_DESCRIPTION}
          </Text>
        </View>
      </View>
      <View
        style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, marginRight: 20 }}
      >
        <CheckBox
          value={checked}
          onChanged={(isChecked) => {
            setChecked(isChecked);
            if (isChecked) {
              navigation.goBack();
            }
          }}
        />
        <Text
          style={{ marginLeft: 10, fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD, fontSize: 16 }}
        >
          {Strings.MUST_READ_CHECK}
        </Text>
      </View>
    </View>
  );
}

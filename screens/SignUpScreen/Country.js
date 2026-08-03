import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import CountryPicker, { DEFAULT_THEME } from 'react-native-country-picker-modal';
import FastImage from 'react-native-fast-image';
import Strings from '../../Components/Strings';
import styles from './styles';
import Constants from '../../Components/Constants';

export default function Country({ context }) {
  const [countrySelectorVisible, setCountrySelectorVisible] = useState(false);
  const onSelect = (country) => {
    setCountrySelectorVisible(false);
    context.setState({
      countryCode: country.cca2,
      country: country,
    });
  };
  const onClose = () => {
    setCountrySelectorVisible(false);
  };
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_ORIGIN}</Text>
        <FastImage
          source={require('../../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <Text style={styles.fieldTitleGuidelines}>{Strings.USER_ORIGIN_GUIDELINES}</Text>
      <View style={{ marginVertical: 10 }}>
        {!countrySelectorVisible && !context.state.countryCode ? (
          <Pressable
            onPress={() => {
              setCountrySelectorVisible(true);
            }}
          >
            <View style={styles.selectButtonContainer}>
              <Text style={{ color: Constants.TIER_COLORS.STRIVER, fontSize: 16 }}>
                {Strings.USER_ORIGIN_SELECTION}
              </Text>
              <FastImage
                style={{ width: 20, height: 20 }}
                source={require('../../Resources/img/icCommonSelect20.png')}
              />
            </View>
          </Pressable>
        ) : (
          <CountryPicker
            filterProps={{
              style: { marginVertical: 3 },
              placeholder: Strings.ENTER_USER_ORIGIN,
            }}
            containerButtonStyle={styles.textInput}
            withCountryNameButton={true}
            countryCode={context.state.countryCode}
            withFlag={true}
            withFilter={true}
            onSelect={onSelect}
            onClose={onClose}
            theme={DEFAULT_THEME}
            visible={countrySelectorVisible}
            closeButtonImage={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
            closeButtonImageStyle={{ width: 25, height: 25 }}
          />
        )}
      </View>
    </View>
  );
}

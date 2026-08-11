import React, { Component } from 'react';
import T from './Constants/DesignTokens';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import { moderateScale } from './utils/scailing';

export default class HelpScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.HELP,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerTintColor: T.COLORS.INK,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });
  }
  render() {
    return (
      <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
        <View style={styles.info}>
          <View style={styles.itemContainer}>
            <Text style={styles.itemTitle}>{Strings.BUSINESS_NAME}</Text>
            <Text style={styles.itemValue}>{Strings.BUSINESS_NAME_ARBAIM}</Text>
          </View>
          <View style={styles.itemContainer}>
            <Text style={styles.itemTitle}>{Strings.CEO}</Text>
            <Text style={styles.itemValue}>{Strings.CEO_ARBAIM}</Text>
          </View>
          <View style={styles.itemContainer}>
            <Text style={styles.itemTitle}>{Strings.CONTACT}</Text>
            <Text style={styles.itemValue}>{Strings.CONTACT_ARBAIM}</Text>
          </View>
          <View style={styles.itemContainer}>
            <Text style={styles.itemTitle}>{Strings.ADDRESS}</Text>
            <Text style={styles.itemValue}>{Strings.ADDRESS_ARBAIM}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  info: {
    marginTop: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 6,
  },
  itemTitle: {
    width: 100,
    fontWeight: '600',
    color: T.COLORS.INK,
  },
  itemValue: {
    flex: 1,
    color: T.COLORS.INK,
  },
});

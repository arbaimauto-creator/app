import { StackActions } from '@react-navigation/native';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import Strings from './Strings';
import Constants from './Constants';

export default class RegisterAsSellerSuccessScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.navigation.setOptions({
      title: Strings.REGISTER_SELLER,
    });
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.successText}>{Strings.WAIT_FOR_REGISTER_SELLER}</Text>
        {/* SUCCEED_TO_REGISTER_SELLER */}
        <TouchableNativeFeedback
          onPress={() => {
            this.props.navigation.dispatch(StackActions.popToTop());
            this.props.navigation.navigate('MyStore');
            // this.props.navigation.navigate('Profile');
          }}
        >
          <View style={styles.buttonContainer}>
            <Text style={styles.buttonLabel}>{Strings.SELLER_PAGE}</Text>
            {/* <Text style={styles.buttonLabel}>{Strings.PROFILE}</Text> */}
          </View>
        </TouchableNativeFeedback>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    color: 'white',
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: 26,
    paddingVertical: 10,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgb(42, 42, 42)',
    borderRadius: 44,
    height: 44,
  },
  buttonLabel: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

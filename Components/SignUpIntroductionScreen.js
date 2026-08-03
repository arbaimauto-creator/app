import { CommonActions } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import { Button } from 'react-native-elements';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import APIprovider from './APIprovider';
import Constants from './Constants';
import Strings from './Strings';

export default class SignUpScreen extends React.Component {
  constructor(props) {
    super(props);
    this.userId = null;
    this.state = {
      introduction: '',
      isSubmitting: false,
    };
  }

  componentDidMount() {
    Preference.get('userId').then((value) => {
      this.userId = value;
    });
  }

  onPressSubmitButton() {
    const { introduction } = this.state;
    this.setState({ isSubmitting: true });
    const profile = {
      userId: this.userId,
      introduction: introduction,
    };
    APIprovider.editProfile(profile)
      .then(async (result) => {
        this.props.navigation.navigate('MainBottom');
        this.props.navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{ name: 'MainBottom' }],
          }),
        );
        this.setState({ isSubmitting: false });
      })
      .catch(() => {
        Alert.alert(Strings.FAILED, Strings.TRY_LATER, [{ text: Strings.OK }], {
          cancelable: true,
        });
        this.setState({ isSubmitting: false });
      });
  }

  render() {
    const { navigation } = this.props;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#eee' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <Text style={styles.title}>{Strings.PROFILE_DESCRIPTION}</Text>
              <Text style={{ fontSize: 16, marginBottom: 20 }}>
                {Strings.INPUT_PROFILE_DESCRIPTION}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  style={styles.textInput}
                  maxLength={100}
                  multiline
                  numberOfLines={4}
                  placeholder=""
                  onChangeText={(introduction) => {
                    this.setState({ introduction });
                  }}
                  value={this.state.introduction}
                />
              </View>
              <Text style={{ color: '#999' }}>{this.state.introduction.length}/100</Text>

              <View style={{ flexDirection: 'row' }}>
                <Button
                  title={Strings.SKIP}
                  type="clear"
                  onPress={() => {
                    this.props.navigation.navigate('MainBottom');
                    this.props.navigation.dispatch(
                      CommonActions.reset({
                        index: 1,
                        routes: [{ name: 'MainBottom' }],
                      }),
                    );
                  }}
                  disabled={this.state.isSubmitting}
                  titleStyle={{ color: Constants.COLOR_GREY }}
                  containerStyle={{ width: 140, marginTop: 40 }}
                />
                <Button
                  title={Strings.NEXT}
                  type="solid"
                  disabled={this.state.introduction.length === 0 || this.state.isSubmitting}
                  onPress={this.onPressSubmitButton.bind(this)}
                  titleStyle={{ color: '#eee' }}
                  buttonStyle={{
                    backgroundColor: Constants.COLOR_GREY,
                    borderRadius: 20,
                  }}
                  containerStyle={{ width: 140, marginTop: 40 }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        <View style={styles.headerContainer}>
          <TouchableWithoutFeedback
            onPress={() => {
              this.props.navigation.pop();
            }}
          >
            <IconIonicons name={'arrow-back'} size={30} color={'#000'} />
          </TouchableWithoutFeedback>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  headerContainer: {
    position: 'absolute',
    flex: 1,
    marginTop: 50,
    marginLeft: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    marginVertical: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: Constants.TIER_COLORS.ARTISAN,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 40,
    marginVertical: 10,
  },
});

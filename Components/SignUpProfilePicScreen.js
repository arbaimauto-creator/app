import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import { Button } from 'react-native-elements';
import ImagePicker from 'react-native-image-crop-picker';
import IconAntDesign from 'react-native-vector-icons/AntDesign';
import UserProfilePicView from '../screens/UserPageScreen/UserProfilePicView';
import APIprovider from './APIprovider';
import Constants from './Constants';
import Strings from './Strings';
import Utils from './utils';

export default class SignUpProfilePicScreen extends React.Component {
  constructor(props) {
    super(props);

    this.userId = null;
    this.state = {
      profilePicUri: this.props.route.params.profilePicUrl,
      profilePicType: null,
      isSubmitting: false,
    };
  }

  componentDidMount() {
    Preference.get('userId').then((value) => {
      this.userId = value;
    });
  }

  onPressSubmitButton() {
    const { profilePicUri, profilePicType } = this.state;
    this.setState({ isSubmitting: true });

    APIprovider.editProfile({
      userId: this.userId,
      profilePicUri: profilePicUri,
      profilePicType: profilePicType,
    })
      .then((profile) => {
        if (!profile.profilePicUrl) {
          throw Strings.FAILED_TO_SET_PROFILE_IMAGE;
        }

        Preference.set('userProfilePicUrl', profile.profilePicUrl);
        this.props.route.params.setLogonUserProfilePicUrl(profile.profilePicUrl);
        this.props.navigation.navigate('SignUpIntroduction');
        this.setState({ isSubmitting: false });
      })
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_TO_SET_PROFILE_IMAGE,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.setState({ isSubmitting: false });
      });
  }

  openPicker() {
    ImagePicker.openPicker({
      multiple: false,
      mediaType: 'photo',
    })
      .then((image) => {
        this.setState({
          profilePicUri: image.path,
          profilePicType: image.mime,
        });
      })
      .catch((err) => console.log(err.toString()));
  }

  render() {
    const { navigation } = this.props;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#eee' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.container}
        >
          <Text style={styles.title}>{Strings.PROFILE_IMAGE}</Text>
          <Text style={{ fontSize: 16 }}>{Strings.SET_PROFILE_IMAGE}</Text>

          <TouchableOpacity
            style={{ margin: 20 }}
            onPress={async () => {
              Utils.checkPermissionToAccessGallery()
                .then(() => this.openPicker())
                .catch((err) => Alert.alert(err));
            }}
          >
            <UserProfilePicView
              style={{ width: 80, height: 80, borderRadius: 80 }}
              source={{ uri: this.state.profilePicUri }}
            />
            {!this.state.profilePicUri && (
              <View style={styles.plusProfilePic}>
                <IconAntDesign name={'plus'} size={16} color={Constants.TIER_COLORS.ARTISAN} />
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row' }}>
            <Button
              title={Strings.SKIP}
              type="clear"
              onPress={() => this.props.navigation.navigate('SignUpIntroduction')}
              //                    buttonStyle={{backgroundColor:Constants.COLOR_GREY, borderRadius:20}}
              disabled={this.state.isSubmitting}
              titleStyle={{ color: Constants.COLOR_GREY }}
              containerStyle={{ width: 140, marginTop: 40 }}
            />

            <Button
              title={Strings.NEXT}
              type="solid"
              disabled={!this.state.profilePicUri || this.state.isSubmitting}
              onPress={this.onPressSubmitButton.bind(this)}
              titleStyle={{ color: '#eee' }}
              buttonStyle={{
                backgroundColor: Constants.COLOR_GREY,
                borderRadius: 20,
              }}
              containerStyle={{ width: 140, marginTop: 40 }}
            />
          </View>
        </KeyboardAvoidingView>
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
  plusProfilePic: {
    position: 'absolute',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    borderRadius: 15,
    //    borderWidth: 2,
    //    borderColor: '#666',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

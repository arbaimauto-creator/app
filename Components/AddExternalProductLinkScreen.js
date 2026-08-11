import React, { useState } from 'react';
import T from './Constants/DesignTokens';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DARK_THEME, DEFAULT_THEME } from 'react-native-country-picker-modal';
import { CountryPicker } from 'react-native-country-picker-modal/lib/CountryPicker';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import ModalMenuButton from './ModalMenuButton';
import Strings from './Strings';
import Utils from './utils';

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function ProductTitle({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.PRODUCT_NAME}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <View style={{ marginTop: 10 }}>
        <TextInput
          style={styles.textInput}
          borderRadius={5}
          placeholder={Strings.INPUT_PRODUCT_NAME}
          placeholderTextColor={T.COLORS.GREY}
          onChangeText={(title) => context.setState({ title })}
          value={context.state.title}
          maxLength={Constants.MAX_LENGTH_PRODUCT_TITLE}
        />
      </View>
    </View>
  );
}

function ProductExternalLink({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.URL}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <View style={{ marginTop: 10 }}>
        <TextInput
          style={styles.textInput}
          borderRadius={5}
          placeholder={Strings.INPUT_PRODUCT_INFO_URL}
          placeholderTextColor={T.COLORS.GREY}
          onChangeText={(externalLink) => context.setState({ externalLink })}
          value={context.state.externalLink}
        />
      </View>
    </View>
  );
}

function ProductCategory({ context }) {
  const { product } = context.state;
  let categoryTitle = '';
  for (let i = 0; i < Constants.CATEGORY_LIST.length; i++) {
    if (Constants.CATEGORY_LIST[i].key === context.state.categoryCode) {
      categoryTitle = Constants.CATEGORY_LIST[i].title;
      break;
    }
  }
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.CATEGORY}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <ModalMenuButton
        title={Strings.SELECT_CATEGORY}
        type={'bottomScrollableSelection'}
        menu={context.categoryList}
        buttonView={
          <View style={styles.categorySelectContainer}>
            <Text
              style={{
                color: !context.state.categoryCode
                  ? T.COLORS.GREY
                  : T.COLORS.INK,
                fontSize: 18,
              }}
            >
              {context.state.categoryCode ? categoryTitle : Strings.SELECT_CATEGORY}
            </Text>
            <FastImage
              style={{ width: 20, height: 20 }}
              source={require('../Resources/img/icCommonSelect20.png')}
            />
          </View>
        }
      />
    </View>
  );
}

function ProductCountry({ context }) {
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
        <Text style={styles.fieldTitle}>{Strings.PRODUCT_ORIGIN}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      {!countrySelectorVisible && !context.state.countryCode ? (
        <Pressable
          onPress={() => {
            setCountrySelectorVisible(true);
          }}
        >
          <View style={styles.categorySelectContainer}>
            <Text style={{ color: T.COLORS.GREY, fontSize: 18 }}>
              {Strings.PRODUCT_ORIGIN_SELECTION}
            </Text>
            <FastImage
              style={{ width: 20, height: 20 }}
              source={require('../Resources/img/icCommonSelect20.png')}
            />
          </View>
        </Pressable>
      ) : (
        <CountryPicker
          filterProps={{
            style: { marginVertical: 3 },
            placeholder: Strings.ENTER_USER_ORIGIN,
          }}
          containerButtonStyle={{ marginTop: 5, marginHorizontal: 20 }}
          withCountryNameButton={true}
          countryCode={context.state.countryCode}
          withFlag={true}
          withFilter={true}
          onSelect={onSelect}
          onClose={onClose}
          theme={DEFAULT_THEME}
          visible={countrySelectorVisible}
          closeButtonImage={require('../Resources/img/iconRenewal/icHeaderClose22.png')}
          closeButtonImageStyle={{ width: 25, height: 25 }}
        />
      )}
    </View>
  );
}

function SubmitButton({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <Button
        containerStyle={{
          marginTop: 10,
          marginHorizontal: 20,
        }}
        buttonStyle={{
          backgroundColor: Constants.COLOR_POINT_BLUE,
          height: 45,
        }}
        titleStyle={{
          color: Constants.COLOR_BACKGROUND_DARK,
          fontSize: 18,
          fontWeight: 'bold',
        }}
        title={Strings.REGISTER_PRODUCT_LINK}
        onPress={context.onPressOkButton.bind(context)}
      />
    </View>
  );
}

export default class AddExternalProductLinkScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: '',
      externalLink: '',
      categoryCode: null,
      countryCode: undefined,
    };

    props.navigation.setOptions({
      title: '',
      headerLeft: () => HeaderLeftBackButton({ navigation: props.navigation }),
    });

    this.categoryList = [];
    Constants.CATEGORY_LIST.forEach((category) => {
      this.categoryList.push({
        key: category.key,
        name: category.title,
        onClicked: () => {
          this.setState({
            categoryCode: category.key,
          });
        },
      });
    });

    props.navigation.setOptions({
      title: '',
      headerLeft: () => HeaderLeftBackButton({ navigation: props.navigation }),
    });
  }

  componentDidMount() {}

  componentWillUnmount() {}

  onPressOkButton() {
    Keyboard.dismiss();

    const validation = (condition, message) => {
      if (!condition) {
        Alert.alert(Strings.NEW_EXTERNAL_PRODUCT_LINK, message, [{ text: Strings.OK }], {
          cancelable: true,
        });
        return false;
      }
      return true;
    };

    if (
      !validation(this.state.title !== '', Strings.VALIDATION_MESSAGE_NO_PRODUCT_TITLE) ||
      !validation(this.state.externalLink !== '', Strings.VALIDATION_MESSAGE_NO_LINK_URL) ||
      !validation(
        this.state.countryCode !== undefined,
        Strings.VALIDATION_MESSAGE_NO_PRODUCT_COUNTRYCODE,
      ) ||
      !validation(Utils.isUrl(this.state.externalLink), Strings.WRONG_PRODUCT_INFO_URL) ||
      !validation(this.state.categoryCode !== null, Strings.VALIDATION_MESSAGE_NO_PRODUCT_CATEGORY)
    ) {
      return false;
    }

    let newProduct = {
      title: this.state.title,
      externalLink: this.state.externalLink,
      categoryCode: this.state.categoryCode,
      countryCode: this.state.countryCode,
    };
    this.props.route.params.onAddedExternalProductLink(newProduct);
    this.props.navigation.pop();
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.container}
        >
          <ScrollView>
            <View style={{ marginTop: -10 }} />
            <ProductExternalLink context={this} />
            <ProductTitle context={this} />
            <ProductCategory context={this} />
            <View style={styles.divider} />
            <ProductCountry context={this} />
            <View style={styles.divider} />
            <SubmitButton context={this} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  fieldContainer: {
    flex: 1,
    marginTop: 30,
    marginBottom: 5,
  },
  fieldTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fieldTitle: {
    color: T.COLORS.INK,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: T.COLORS.GREY,
    marginHorizontal: 20,
  },
  count: {
    fontSize: 12,
    color: 'rgb(136, 136, 136)',
  },
  textInput: {
    paddingHorizontal: 10,
    color: T.COLORS.INK,
    fontSize: 14,
    marginHorizontal: 20,
    flex: 1,
    borderWidth: 1,
    borderColor: T.COLORS.INK,
    paddingVertical: 6,
  },
  categorySelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
  },
  requiredIcon: {
    width: 8,
    height: 10,
    marginLeft: 4,
  },
});

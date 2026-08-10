import React, { useState } from 'react';
import {
  Alert,
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { CountryPicker, DARK_THEME } from 'react-native-country-picker-modal/lib/CountryPicker';
import Preference from 'react-native-default-preference';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import ImagePicker from 'react-native-image-crop-picker';
import { KeyboardAwareScrollView as KeyboardAvoidingView } from 'react-native-keyboard-aware-scroll-view';
import ProductIsPromition from '../screens/AddingNewProductScreen/ProductIsPromition';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import ModalMenuButton from './ModalMenuButton';
import Strings from './Strings';
import Utils from './utils';
import { LoadingView } from './Views';
import { moderateScale } from './utils/scailing';

const attachmentImageHeight = 100;

function ProductImages({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.PRODUCT_IMAGE}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <ScrollView horizontal style={styles.attachmentContainer}>
        <View style={{ marginLeft: 20 }}>
          <TouchableNativeFeedback
            onPress={() => {
              ImagePicker.openPicker({
                multiple: true,
                mediaType: 'photo',
                maxFiles: Constants.MAX_NUMBER_PRODUCT_IMAGE,
              }).then((images) => {
                for (let i = 0; i < images.length; i++) {
                  images[i].uri = images[i].path;
                  if (context.state.isEdit) {
                    images[i].change = Constants.ATTACHMENT_CHANGE_ADDED;
                  }
                }
                context.setState({
                  attachmentList: [...context.state.attachmentList, ...images],
                });
              });
            }}
          >
            <View style={styles.addImageAttachmentButton}>
              <FastImage
                style={styles.addImageAttachmentIcon}
                source={require('../Resources/img/icSettingImage24.png')}
              />
              <Text
                style={[
                  styles.count,
                  {
                    color:
                      context.state.attachmentList.length <= Constants.MAX_NUMBER_PRODUCT_IMAGE
                        ? 'rgb(136, 136, 136)'
                        : Constants.COLOR_RED,
                  },
                ]}
              >
                {`${context.state.attachmentList.length}/${Constants.MAX_NUMBER_PRODUCT_IMAGE}`}
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>

        {context.state.attachmentList.map((item, i) => (
          <View key={'productImage_' + i} style={styles.attachmentItemListContainer}>
            <FastImage
              source={{ uri: item.url ? item.url : item.uri }}
              style={styles.attachmentImage}
            />
            <TouchableWithoutFeedback
              onPress={() => {
                context.removeAttachment(item);
              }}
            >
              <FastImage
                style={styles.removeAttachmentButton}
                source={require('../Resources/img/icHeaderSearchCancle16W.png')}
              />
            </TouchableWithoutFeedback>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ProductTitle({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.PRODUCT_NAME}</Text>
        <Text style={styles.count}>
          {context.state.title.length}/{Constants.MAX_LENGTH_PRODUCT_TITLE}
        </Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={{
          ...styles.textInput,
          flex: 1,
          fontSize: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          paddingVertical: 6,
        }}
        borderRadius={5}
        placeholder={Strings.PRODUCT_NAME_INPUT_GUIDE}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(title) => context.setState({ title })}
        value={context.state.title}
        maxLength={Constants.MAX_LENGTH_PRODUCT_TITLE}
      />
    </View>
  );
}

function ProductImageDescription({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.IMAGE_DESCRIPTION}</Text>
      </View>

      <ScrollView horizontal style={styles.attachmentContainer}>
        <View style={{ marginLeft: 20 }}>
          <TouchableNativeFeedback
            onPress={() => {
              ImagePicker.openPicker({
                multiple: true,
                mediaType: 'photo',
                maxFiles: Constants.MAX_NUMBER_PRODUCT_DESCRIPTION_IMAGE,
              }).then((images) => {
                for (let i = 0; i < images.length; i++) {
                  images[i].uri = images[i].path;
                  if (context.state.isEdit) {
                    images[i].change = Constants.ATTACHMENT_CHANGE_ADDED;
                  }
                }
                context.setState({
                  descriptionImageList: [...context.state.descriptionImageList, ...images],
                });
              });
            }}
          >
            <View style={styles.addImageAttachmentButton}>
              <FastImage
                style={styles.addImageAttachmentIcon}
                source={require('../Resources/img/icSettingImage24.png')}
              />
              <Text
                style={[
                  styles.count,
                  {
                    color:
                      context.state.descriptionImageList.length <=
                      Constants.MAX_NUMBER_PRODUCT_DESCRIPTION_IMAGE
                        ? 'rgb(136, 136, 136)'
                        : Constants.COLOR_RED,
                  },
                ]}
              >
                {`${context.state.descriptionImageList.length}/${Constants.MAX_NUMBER_PRODUCT_DESCRIPTION_IMAGE}`}
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>

        {context.state.descriptionImageList.map((item, i) => (
          <View key={'descriptionImage_' + i} style={styles.attachmentItemListContainer}>
            <FastImage
              source={{ uri: item.url ? item.url : item.uri }}
              style={styles.attachmentImage}
            />
            <TouchableWithoutFeedback
              onPress={() => {
                context.removeDescriptionImage(item);
              }}
            >
              <FastImage
                style={styles.removeAttachmentButton}
                source={require('../Resources/img/icHeaderSearchCancle16W.png')}
              />
            </TouchableWithoutFeedback>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ProductTextDescription({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.TEXT_DESCRIPTION}</Text>
        <Text style={styles.count}>
          {context.state.description.length}/{Constants.MAX_LENGTH_PRODUCT_DESCRIPTION}
        </Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={{
          ...styles.textInput,
          textAlignVertical: 'top',
          paddingHorizontal: 10,
          paddingVertical: 5,
          flex: 1,
          fontSize: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          minHeight: 100,
        }}
        borderRadius={5}
        multiline={true}
        scrollEnabled={false}
        placeholder={Strings.PRODUCT_DETAIL_INPUT_GUIDE}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(description) => context.setState({ description })}
        value={context.state.description}
        maxLength={Constants.MAX_LENGTH_PRODUCT_DESCRIPTION}
      />
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
    <View style={{ ...styles.fieldContainer, marginBottom: 3 }}>
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
                color: context.state.categoryCode
                  ? Constants.TIER_COLORS.ARTISAN
                  : 'rgba(255,255,255,0.2)',
                fontSize: 17,
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

function ProductPrice({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.PRICE}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 20,
          borderWidth: 1,
          borderRadius: 5,
          borderColor: 'rgba(255,255,255,0.2)',
        }}
      >
        <Text style={{ color: 'white', fontSize: 17, paddingLeft: 10 }}>￦ </Text>
        <TextInput
          style={{
            ...styles.costTextInput,
            flex: 1,
            paddingVertical: 5,
            textDecorationLine: context.state.isDiscountEnabled ? 'line-through' : 'none',
          }}
          placeholder="0"
          placeholderTextColor={Constants.TIER_COLORS.STRIVER}
          onChangeText={(price) => {
            if (isNaN(price)) {
              return;
            }

            context.setState({ price });
          }}
          value={context.state.price.toString()}
          keyboardType={'decimal-pad'}
        />
      </View>
    </View>
  );
}

function ProductDiscount({ context }) {
  const { product } = context.state;
  const discountRate =
    context.state.price > 0
      ? (((context.state.price - context.state.discountPrice) / context.state.price) * 100).toFixed(
          0,
        )
      : 0;
  return (
    <View style={{ marginHorizontal: 20, marginTop: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={styles.fieldProductOption}>{Strings.DISCOUNT}</Text>
        <Switch
          trackColor={{
            false: 'rgb(39, 39, 39)',
            true: Constants.COLOR_MAIN_DARK,
          }}
          thumbColor={context.state.isDiscountEnabled ? Constants.COLOR_MAIN : 'rgb(113, 113, 113)'}
          ios_backgroundColor="rgb(39, 39, 39)"
          onValueChange={(isDiscountEnabled) => context.setState({ isDiscountEnabled })}
          value={context.state.isDiscountEnabled}
        />
      </View>
      {context.state.isDiscountEnabled && (
        <View>
          <Text style={{ fontSize: 12, color: Constants.COLOR_MAIN }}>
            {Strings.INPUT_DISCOUNTED_PRICE}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 3,
              alignItems: 'center',
              borderWidth: 1,
              borderRadius: 5,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <Text style={{ color: 'white', fontSize: 17, paddingLeft: 10 }}>￦ </Text>
            <TextInput
              style={{
                ...styles.costTextInput,
                flex: 1,
                paddingVertical: 5,
              }}
              placeholder="0"
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              onChangeText={(discountPrice) => context.setState({ discountPrice })}
              value={context.state.discountPrice.toString()}
              keyboardType={'decimal-pad'}
            />
            {context.state.price > 0 && context.state.discountPrice > 0 && discountRate > 0 && (
              <Text style={{ color: 'red', fontSize: 15, marginRight: 20 }}>-{discountRate}%</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function ProductLowestPriceLink({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.LOWEST_PRICE_LINK}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 20,
          borderWidth: 1,
          borderRadius: 5,
          borderColor: 'rgba(255,255,255,0.2)',
        }}
      >
        <TextInput
          style={{
            ...styles.costTextInput,
            flex: 1,
            paddingVertical: 5,
            paddingHorizontal: 10,
          }}
          placeholder={Strings.LOWEST_PRICE_INPUT_PLACEHOLDER}
          placeholderTextColor={Constants.TIER_COLORS.STRIVER}
          onChangeText={(lowestPriceLink) => context.setState({ lowestPriceLink })}
          value={context.state.lowestPriceLink?.toString()}
        />
      </View>
    </View>
  );
}

function ProductShipmentCost_({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.SHIPMENT_COST} (한국)</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 20,
          borderWidth: 1,
          borderRadius: 5,
          borderColor: 'rgba(255,255,255,0.2)',
        }}
      >
        <Text style={{ color: 'white', fontSize: 17, paddingLeft: 10 }}>￦ </Text>
        <TextInput
          style={{
            ...styles.costTextInput,
            flex: 1,
            paddingVertical: 5,
          }}
          placeholder="0"
          placeholderTextColor={Constants.TIER_COLORS.STRIVER}
          onChangeText={(shipmentCost) => context.setState({ shipmentCost })}
          value={context.state.shipmentCost.toString()}
          keyboardType={'decimal-pad'}
        />
      </View>
    </View>
  );
}

function ProductShipmentCost({ context, title, onChangeText, shipmentCost }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{title}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 20,
          borderWidth: 1,
          borderRadius: 5,
          borderColor: 'rgba(255,255,255,0.2)',
        }}
      >
        <Text style={{ color: 'white', fontSize: 17, paddingLeft: 10 }}>￦ </Text>
        <TextInput
          style={{
            ...styles.costTextInput,
            flex: 1,
            paddingVertical: 5,
          }}
          placeholder="0"
          placeholderTextColor={Constants.TIER_COLORS.STRIVER}
          onChangeText={(text) => onChangeText(text)}
          value={shipmentCost.toString()}
          keyboardType={'decimal-pad'}
        />
      </View>
    </View>
  );
}

function FreeShipping({
  context,
  onValueChange,
  isAvailableFreeShipping,
  onChangeText,
  lowestOrderPriceForFreeDelivery,
}) {
  return (
    <View style={{ marginHorizontal: 20, marginTop: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={styles.fieldProductOption}>{Strings.FREE_SHIPPING}</Text>
        <Switch
          trackColor={{
            false: 'rgb(39, 39, 39)',
            true: Constants.COLOR_MAIN_DARK,
          }}
          thumbColor={isAvailableFreeShipping ? Constants.COLOR_MAIN : 'rgb(113, 113, 113)'}
          ios_backgroundColor="rgb(39, 39, 39)"
          onValueChange={onValueChange}
          value={isAvailableFreeShipping}
        />
      </View>
      {isAvailableFreeShipping && (
        <View>
          <Text style={{ fontSize: 12, color: Constants.COLOR_MAIN }}>
            {Strings.INPUT_LOWEST_ORDER_PRICE_FOR_FREE_DELIVERY}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 3,
              alignItems: 'center',
              borderWidth: 1,
              borderRadius: 5,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <Text style={{ color: 'white', fontSize: 17, paddingLeft: 10 }}>￦ </Text>
            <TextInput
              style={{
                ...styles.costTextInput,
                flex: 1,
                paddingVertical: 5,
              }}
              placeholder="0"
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              onChangeText={onChangeText}
              value={lowestOrderPriceForFreeDelivery}
              keyboardType={'decimal-pad'}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function ProductNumberToSale({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.NUMBER_TO_SALE}</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: 20,
        }}
      >
        <Text style={styles.fieldProductOption}>{Strings.NO_LIMIT}</Text>
        <Switch
          trackColor={{
            false: 'rgb(39, 39, 39)',
            true: Constants.COLOR_MAIN_DARK,
          }}
          thumbColor={
            context.state.isNoLimitNumberToSale ? Constants.COLOR_MAIN : 'rgb(113, 113, 113)'
          }
          ios_backgroundColor="rgb(39, 39, 39)"
          onValueChange={(isNoLimitNumberToSale) => {
            context.setState({ isNoLimitNumberToSale });
            if (!isNoLimitNumberToSale && context.textInputItemNumber) {
              context.textInputItemNumber.focus();
            }
          }}
          value={context.state.isNoLimitNumberToSale}
        />
      </View>

      {!context.state.isNoLimitNumberToSale && (
        <View>
          <Text
            style={{
              fontSize: 12,
              color: Constants.COLOR_MAIN,
              marginHorizontal: 20,
            }}
          >
            {Strings.INPUT_ITEM_NUMBER_TO_SALE}
          </Text>
          <TextInput
            ref={(ref) => {
              context.textInputItemNumber = ref;
            }}
            style={{
              ...styles.textInput,
              flex: 1,
              fontSize: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              paddingVertical: 6,
              marginTop: 3,
            }}
            borderRadius={5}
            placeholder="0"
            placeholderTextColor={Constants.TIER_COLORS.STRIVER}
            onChangeText={(availableNumberToSale) => context.setState({ availableNumberToSale })}
            value={context.state.availableNumberToSale.toString()}
            keyboardType={'decimal-pad'}
            editable={!context.state.isNoLimitNumberToSale}
          />
        </View>
      )}
    </View>
  );
}

function ProductAdditionals({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.OPTION}</Text>
      </View>
      {context.renderOptions()}
    </View>
  );
}

function ProductOptions({ context }) {
  const { product } = context.state;
  return <View />;
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
            <Text
              style={{
                color: 'rgba(255,255,255,0.2)',
                fontSize: 17,
                marginBottom: 5,
              }}
            >
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
          containerButtonStyle={{ ...styles.textInput, marginHorizontal: 10 }}
          withCountryNameButton={true}
          countryCode={context.state.countryCode}
          withFlag={true}
          withFilter={true}
          onSelect={onSelect}
          onClose={onClose}
          theme={DARK_THEME}
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
          marginHorizontal: 20,
        }}
        buttonStyle={{
          backgroundColor: Constants.COLOR_MAIN,
          height: 45,
        }}
        titleStyle={{
          color: 'black',
          fontSize: 18,
          fontWeight: 'bold',
        }}
        title={Strings.UPLOAD_PRODUCT_BUTTON_TITLE}
        onPress={context.onPressSubmitButton.bind(context)}
      />
    </View>
  );
}

export default class AddingNewProductScreen extends React.Component {
  constructor(props) {
    super(props);

    const isEdit = props.route.params && props.route.params.product && props.route.params.isEdit;
    const product = isEdit ? props.route.params.product : null;

    this.textInputItemNumber = null;
    this.removedAttachmentList = [];
    this.removedDescriptionImageList = [];
    this.state = {
      productId: isEdit ? product.productId : null,
      title: isEdit ? product.title : '',
      countryCode: isEdit ? product.countryCode : undefined,
      description: isEdit ? product.description : '',
      attachmentList: isEdit ? product.attachmentList : [],
      descriptionImageList: isEdit ? product.descriptionImageList : [],
      thumbnailIndex: 0,
      categoryCode: isEdit ? product.categoryCode : null,
      price: isEdit ? product.price : '',
      discountPrice: isEdit ? product.discountPrice : '',
      lowestPriceLink: isEdit ? product.lowestPriceLink : '',
      shipmentCost: isEdit ? product.shipmentCost : '',

      shipmentCostUS: isEdit ? product.shipmentCostUS : 0,
      isAvailableFreeShippingKR: isEdit ? product.isAvailableFreeShippingKR : false,
      lowestOrderPriceForFreeDeliveryKR: isEdit ? product.lowestOrderPriceForFreeDeliveryKR : '',
      isAvailableFreeShippingUS: isEdit ? product.isAvailableFreeShippingUS : false,
      lowestOrderPriceForFreeDeliveryUS: isEdit ? product.lowestOrderPriceForFreeDeliveryUS : '',

      isAvailableToSale: isEdit ? product.isAvailableToSale : 0,
      availableNumberToSale: isEdit ? product.availableNumberToSale : '',
      checkOptions: isEdit ? product.options.checks : [],
      listOptions: isEdit ? product.options.lists : [],
      promotionAmount: isEdit ? product.promotionAmount : 0,
      promotionTimestampBy: isEdit ? product.promotionTimestampBy : new Date().getTime(),
      isEdit: isEdit ? this.props.route.params.isEdit : false,
      isDiscountEnabled: isEdit && product.discountPrice > 0 ? true : false,
      isPromotionEnabled:
        isEdit && product.promotionTimestampBy > new Date().getTime() ? true : false,
      isShowDatePicker: Platform.OS === 'ios',
      isSubmitting: false,
      isNoLimitNumberToSale: isEdit && product.availableNumberToSale !== -1 ? false : true,
      isPromotion: isEdit && product.isPromotion ? true : false,
      promotionStartDate:
        isEdit && product.isPromotion && product.promotionStartDate
          ? new Date(product.promotionStartDate)
          : new Date(),
      promotionEndDate:
        isEdit && product.isPromotion && product.promotionEndDate
          ? new Date(product.promotionEndDate)
          : new Date(),
    };

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
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      title: this.state.isEdit ? Strings.EDIT_PRODUCT : Strings.REGISTER_PRODUCT,
      headerTitleStyle: {
        marginTop: Platform.OS === 'ios' ? 0 : 10,
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });

    Preference.get('KRW/USD').then((currecyRate) => {
      this.setState({ shipmentCostUS: currecyRate * 20 });
    });

    BackHandler.addEventListener('hardwareBackPress', this._handleBackButton);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this._handleBackButton);
  }

  _handleBackButton = () => {
    if (
      this.state.title !== '' ||
      this.state.description !== '' ||
      this.state.attachmentList.length > 0 ||
      this.state.descriptionImageList.length > 0
    ) {
      Alert.alert(
        Strings.CHANGES_NOT_SAVED_TITLE,
        Strings.CHANGES_NOT_SAVED_MESSAGE,
        [
          { text: Strings.CANCEL, onPress: () => {}, style: 'cancel' },
          {
            text: Strings.DELETE,
            onPress: () => {
              this.props.navigation.pop();
            },
          },
        ],
        { cancelable: true },
      );
      return true;
    }
    return false;
  };

  onPressSubmitButton() {
    Keyboard.dismiss();
    if (this.state.isSubmitting) {
      return;
    }

    console.log({
      title: this.state.title,
      description: this.state.description,
      countryCode: this.state.countryCode,
      price: this.state.price,
      discountPrice: this.state.isDiscountEnabled ? this.state.discountPrice : 0,
      shipmentCost: this.state.shipmentCost,

      shipmentCostUS: this.state.shipmentCostUS,
      isAvailableFreeShippingKR: this.state.isAvailableFreeShippingKR,
      lowestOrderPriceForFreeDeliveryKR: this.state.lowestOrderPriceForFreeDeliveryKR,
      isAvailableFreeShippingUS: this.state.isAvailableFreeShippingUS,
      lowestOrderPriceForFreeDeliveryUS: this.state.lowestOrderPriceForFreeDeliveryUS,

      attachmentList: attachmentList,
      descriptionImageList: descriptionImageList,
      categoryCode: this.state.categoryCode,
      isAvailableToSale: true,
      availableNumberToSale: this.state.isNoLimitNumberToSale
        ? -1
        : this.state.availableNumberToSale,
      options: {
        checks: this.state.checkOptions,
        lists: this.state.listOptions,
      },
      lowestPriceLink: this.state.lowestPriceLink,
    });

    const validation = (condition, message) => {
      if (!condition) {
        Alert.alert(
          this.state.isEdit ? Strings.EDIT_PRODUCT : Strings.REGISTER_PRODUCT,
          message,
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        return false;
      }
      return true;
    };

    if (
      !validation(this.state.title !== '', Strings.VALIDATION_MESSAGE_NO_PRODUCT_TITLE) ||
      !validation(
        this.state.countryCode !== undefined,
        Strings.VALIDATION_MESSAGE_NO_PRODUCT_COUNTRYCODE,
      ) ||
      !validation(
        this.state.description !== '',
        Strings.VALIDATION_MESSAGE_NO_PRODUCT_DESCRIPTION,
      ) ||
      !validation(
        this.state.attachmentList.length > 0,
        Strings.VALIDATION_MESSAGE_NO_PRODUCT_IMAGE,
      ) ||
      !validation(
        this.state.attachmentList.length <= Constants.MAX_NUMBER_PRODUCT_IMAGE,
        Strings.VALIDATION_MESSAGE_TOO_MANY_PRODUCT_IMAGES + Constants.MAX_NUMBER_PRODUCT_IMAGE,
      ) ||
      !validation(
        this.state.descriptionImageList.length <= Constants.MAX_NUMBER_PRODUCT_DESCRIPTION_IMAGE,
        Strings.VALIDATION_MESSAGE_TOO_MANY_IMAGE_DESCRIPTION + Constants.MAX_NUMBER_PRODUCT_IMAGE,
      ) ||
      !validation(
        this.state.price !== '' && this.state.price > 0,
        Strings.VALIDATION_MESSAGE_NO_PRODUCT_PRICE,
      ) ||
      !validation(
        (this.state.discountPrice !== '' && this.state.discountPrice > 0) ||
          !this.state.isDiscountEnabled,
        Strings.VALIDATION_MESSAGE_NO_PRODUCT_DISCOUNT_PRICE,
      ) ||
      !validation(
        (this.state.discountPrice !== '' &&
          parseInt(this.state.discountPrice, 10) < parseInt(this.state.price, 10)) ||
          !this.state.isDiscountEnabled,
        Strings.VALIDATION_MESSAGE_DISCOUNT_PRICE_OVER,
      ) ||
      !validation(
        this.state.categoryCode !== null,
        Strings.VALIDATION_MESSAGE_NO_PRODUCT_CATEGORY,
      ) ||
      !validation(
        this.state.shipmentCost !== '' && this.state.shipmentCost >= 0,
        Strings.VALIDATION_MESSAGE_NO_SHIPMENT_COST,
      ) ||
      !validation(
        this.state.isNoLimitNumberToSale || this.state.availableNumberToSale !== '',
        Strings.VALIDATION_MESSAGE_NO_AVAILABLE_NUMBER_TO_SALE,
      ) ||
      // ||!validation(Utils.isValidURL(this.state.lowestPriceLink), Strings.WRONG_LOWEST_PRICE_LINK)
      (this.state.isPromotion &&
        !validation(
          this.state.promotionStartDate < this.state.promotionEndDate,
          Strings.CHECK_PROMOTION_PERIOD,
        ))
    ) {
      return false;
    }

    for (let i = 0; i < this.state.checkOptions.length; i++) {
      if (
        !validation(
          this.state.checkOptions[i].name !== '',
          Strings.VALIDATION_MESSAGE_NO_OPTION_NAME,
        ) ||
        !validation(
          this.state.checkOptions[i].addition !== '' &&
            Utils.isNumeric(Number(this.state.checkOptions[i].addition)),
          Strings.VALIDATION_MESSAGE_NO_OPITON_ADDITIONAL_PRICE +
            '\n' +
            this.state.checkOptions[i].name,
        )
      ) {
        return false;
      }
    }
    for (let i = 0; i < this.state.listOptions.length; i++) {
      if (
        !validation(
          this.state.listOptions[i].name !== '',
          Strings.VALIDATION_MESSAGE_NO_OPTION_NAME,
        ) ||
        !validation(
          this.state.listOptions[i].items.length > 0,
          Strings.VALIDATION_MESSAGE_NO_OPTION_ITEM + ' : ' + this.state.listOptions[i].name,
        )
      ) {
        return false;
      }
      for (let j = 0; j < this.state.listOptions[i].items.length; j++) {
        if (
          !validation(
            this.state.listOptions[i].items[j].name !== '',
            Strings.VALIDATION_MESSAGE_NO_LIST_OPTION_ITEM_NAME +
              ' : ' +
              this.state.listOptions[i].name,
          ) ||
          !validation(
            this.state.listOptions[i].items[j].addition !== '' &&
              Utils.isNumeric(Number(this.state.listOptions[i].items[j].addition)),
            Strings.VALIDATION_MESSAGE_NO_LIST_OPTION_ITEM_ADDITIONAL_PRICE +
              ' : ' +
              this.state.listOptions[i].name,
          )
        ) {
          return false;
        }
      }
    }

    this.showActivityIndicator();

    // 최종 attachment 추출
    let attachmentList = [];
    if (this.state.isEdit) {
      // Caution! The attachments to be are front
      // Caution! The attachments to be removed are back
      attachmentList = [...this.state.attachmentList, ...this.removedAttachmentList];
    } else {
      attachmentList = this.state.attachmentList;
    }
    let descriptionImageList = [];
    if (this.state.isEdit) {
      // Caution! The attachments to be are front
      // Caution! The attachments to be removed are back
      descriptionImageList = [
        ...this.state.descriptionImageList,
        ...this.removedDescriptionImageList,
      ];
    } else {
      descriptionImageList = this.state.descriptionImageList;
    }

    let newProduct = {
      title: this.state.title,
      description: this.state.description,
      countryCode: this.state.countryCode,
      price: this.state.price,
      discountPrice: this.state.isDiscountEnabled ? this.state.discountPrice : 0,
      shipmentCost: this.state.shipmentCost,

      shipmentCostUS: this.state.shipmentCostUS,
      isAvailableFreeShippingKR: this.state.isAvailableFreeShippingKR,
      lowestOrderPriceForFreeDeliveryKR: this.state.lowestOrderPriceForFreeDeliveryKR,
      isAvailableFreeShippingUS: this.state.isAvailableFreeShippingUS,
      lowestOrderPriceForFreeDeliveryUS: this.state.lowestOrderPriceForFreeDeliveryUS,

      attachmentList: attachmentList,
      descriptionImageList: descriptionImageList,
      categoryCode: this.state.categoryCode,
      isAvailableToSale: true,
      availableNumberToSale: this.state.isNoLimitNumberToSale
        ? -1
        : this.state.availableNumberToSale,
      options: {
        checks: this.state.checkOptions,
        lists: this.state.listOptions,
      },
      lowestPriceLink: this.state.lowestPriceLink,
      isPromotion: this.state.isPromotion,
    };

    if (this.state.isPromotion) {
      newProduct.promotionStartDate = this.state.promotionStartDate;
      newProduct.promotionEndDate = this.state.promotionEndDate;
    }

    if (this.state.isEdit) {
      newProduct.productId = this.state.productId;
      // console.log('editProduct', JSON.stringify(newProduct))
      APIprovider.editProduct(newProduct)
        .then(this.addNewProductCallback.bind(this))
        .catch((err) => {
          this.hideActivityIndicator();
          console.log(err);
          Alert.alert(
            Strings.FAILED_TO_EDIT_PRODUCT,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    } else {
      // console.log('addNewProduct', JSON.stringify(newProduct));
      APIprovider.addNewProduct(newProduct)
        .then(this.addNewProductCallback.bind(this))
        .catch((err) => {
          this.hideActivityIndicator();
          console.log(err);
          Alert.alert(
            Strings.FAILED_TO_REGISTER_PRODUCT,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    }
  }

  showActivityIndicator() {
    this.setState({ isSubmitting: true });
    this.props.navigation.setParams({
      isSubmitting: true,
    });
  }

  hideActivityIndicator() {
    this.setState({
      isSubmitting: false,
    });
    this.props.navigation.setParams({
      isSubmitting: false,
    });
    this.forceUpdate();
  }

  addNewProductCallback(result) {
    // console.log(result);
    this.hideActivityIndicator();
    if (this.state.isEdit) {
      if (this.props.route.params.onUpdatedProduct) {
        this.props.route.params.onUpdatedProduct(result);
      }
    } else {
      if (this.props.route.params.onAddedNewProduct) {
        this.props.route.params.onAddedNewProduct(result);
      }
    }
    this.props.navigation.pop();
  }

  removeAttachment(removeItem) {
    if (this.state.isEdit) {
      this.props.route.params.product.attachmentList.forEach((att) => {
        if (att.url === removeItem.url) {
          att.change = Constants.ATTACHMENT_CHANGE_REMOVED;
          this.removedAttachmentList.push(att);
        }
      });
    }

    let pos = 0;
    for (const att of this.state.attachmentList) {
      if (att === removeItem) {
        this.setState({
          attachmentList: [
            ...this.state.attachmentList.slice(0, pos),
            ...this.state.attachmentList.slice(pos + 1, this.state.attachmentList.length),
          ],
        });
        break;
      }
      pos++;
    }
  }

  removeDescriptionImage(removeItem) {
    if (this.state.isEdit) {
      this.props.route.params.product.descriptionImageList.forEach((att) => {
        if (att.url === removeItem.url) {
          att.change = Constants.ATTACHMENT_CHANGE_REMOVED;
          this.removedDescriptionImageList.push(att);
        }
      });
    }

    let pos = 0;
    for (const att of this.state.descriptionImageList) {
      if (att === removeItem) {
        this.setState({
          descriptionImageList: [
            ...this.state.descriptionImageList.slice(0, pos),
            ...this.state.descriptionImageList.slice(
              pos + 1,
              this.state.descriptionImageList.length,
            ),
          ],
        });
        break;
      }
      pos++;
    }
  }

  renderActivityIndicator() {
    if (this.state.isSubmitting) {
      return <LoadingView />;
    }
  }

  renderOptions() {
    return (
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginHorizontal: 20,
          }}
        >
          <Text style={styles.fieldProductOption}>{Strings.PRODUCT_OPTION_CHECK_TYPE}</Text>
          <Button
            icon={
              <FastImage
                style={{ width: 20, height: 20 }}
                source={require('../Resources/img/icCommonAdd20.png')}
              />
            }
            type="clear"
            onPress={() => {
              this.setState({
                checkOptions: [...this.state.checkOptions, { name: '', addition: 0 }],
              });
            }}
          />
        </View>
        {this.state.checkOptions.map((item, idx) => (
          <View
            key={'checkoption' + idx}
            style={{
              backgroundColor: 'rgb(37, 37, 37)',
              borderRadius: 10,
              marginHorizontal: 20,
              marginVertical: 5,
              paddingBottom: 30,
            }}
          >
            <Button
              icon={
                <FastImage
                  style={{ width: 12, height: 12 }}
                  source={require('../Resources/img/icHeaderSearchDelete12W.png')}
                />
              }
              type="clear"
              containerStyle={{
                alignSelf: 'flex-end',
                marginTop: 10,
                marginRight: 10,
              }}
              onPress={() => {
                this.state.checkOptions.splice(idx, 1);
                this.setState({
                  checkOptions: this.state.checkOptions,
                });
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 20,
              }}
            >
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: 15,
                  marginRight: 15,
                }}
              >
                {Strings.ADDITIONAL_PRODUCT_NAME}
              </Text>
              <TextInput
                style={{
                  ...styles.costTextInput,
                  flex: 1,
                  paddingVertical: 5,
                  fontSize: 14,
                }}
                placeholder={Strings.ADDITIONAL_PRODUCT_NAME_GUIDE}
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                onChangeText={(value) => {
                  this.state.checkOptions[idx].name = value;
                  this.setState({ checkOptions: this.state.checkOptions });
                }}
                value={item.name}
              />
            </View>
            <View style={styles.divider} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 20,
                marginTop: 10,
              }}
            >
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: 15,
                  marginRight: 15,
                }}
              >
                {Strings.PRICE_ADDITION}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginHorizontal: 10,
                }}
              >
                <Text style={{ color: 'white', fontSize: 15 }}>￦ </Text>
                <TextInput
                  style={{
                    ...styles.costTextInput,
                    flex: 1,
                    paddingVertical: 5,
                    fontSize: 15,
                  }}
                  placeholder="0"
                  placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                  onChangeText={(value) => {
                    if (isNaN(value)) {
                      return;
                    }

                    this.state.checkOptions[idx].addition = +value;
                    this.setState({ checkOptions: this.state.checkOptions });
                  }}
                  value={item.addition.toString()}
                  keyboardType={'decimal-pad'}
                />
              </View>
            </View>
            <View style={styles.divider} />
          </View>
        ))}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginHorizontal: 20,
          }}
        >
          <Text style={styles.fieldProductOption}>{Strings.PRODUCT_OPTION_LIST_TYPE}</Text>
          <Button
            icon={
              <FastImage
                style={{ width: 20, height: 20 }}
                source={require('../Resources/img/icCommonAdd20.png')}
              />
            }
            type="clear"
            onPress={() => {
              this.setState({
                listOptions: [
                  ...this.state.listOptions,
                  { name: '', items: [{ name: '', addition: 0 }] },
                ],
              });
            }}
          />
        </View>
        {this.state.listOptions.map((list, idx) => (
          <View
            key={'listoption' + idx}
            style={{
              backgroundColor: 'rgb(37, 37, 37)',
              borderRadius: 10,
              marginHorizontal: 20,
              marginVertical: 5,
              paddingBottom: 20,
            }}
          >
            <Button
              icon={
                <FastImage
                  style={{ width: 12, height: 12 }}
                  source={require('../Resources/img/icHeaderSearchDelete12W.png')}
                />
              }
              type="clear"
              containerStyle={{
                alignSelf: 'flex-end',
                marginTop: 10,
                marginRight: 10,
              }}
              onPress={() => {
                Alert.alert(
                  Strings.DELETE_LIST_OPTION_TITLE,
                  Strings.DELETE_LIST_OPTION_MESSAGE + '\n' + list.name,
                  [
                    {
                      text: Strings.CANCEL,
                      onPress: () => {
                        console.log('Cancel Pressed');
                      },
                      style: 'cancel',
                    },
                    {
                      text: Strings.OK,
                      onPress: () => {
                        this.state.listOptions.splice(idx, 1);
                        this.setState({
                          listOptions: this.state.listOptions,
                        });
                      },
                    },
                  ],
                  { cancelable: false },
                );
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 20,
              }}
            >
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: 15,
                  marginRight: 15,
                }}
              >
                {Strings.LIST_OPTION_NAME}
              </Text>
              <TextInput
                style={{
                  ...styles.costTextInput,
                  flex: 1,
                  paddingVertical: 5,
                  fontSize: 14,
                }}
                placeholder={Strings.INPUT_LIST_OPTION_NAME}
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                onChangeText={(value) => {
                  this.state.listOptions[idx].name = value;
                  this.setState({ listOptions: this.state.listOptions });
                }}
                value={list.name}
              />
            </View>
            <View style={styles.divider} />
            {list.items.map((item, idxItem) => (
              <View key={'listoptionitem' + idxItem}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginHorizontal: 20,
                  }}
                >
                  <FastImage
                    style={{
                      width: 12,
                      height: 12,
                      marginRight: 8,
                      opacity: 0.5,
                    }}
                    source={require('../Resources/img/icCommonOptionRe12W.png')}
                  />
                  <Text
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: 15,
                      marginRight: 15,
                    }}
                  >
                    {Strings.OPTION_LIST_ITEM_NAME}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <TextInput
                      style={{ flex: 1, color: 'white', fontSize: 14 }}
                      placeholder={Strings.INPUT_LIST_OPTION_ITEM_NAME}
                      placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                      onChangeText={(value) => {
                        this.state.listOptions[idx].items[idxItem].name = value;
                        this.setState({ listOptions: this.state.listOptions });
                      }}
                      value={item.name}
                    />
                    <Button
                      icon={
                        <FastImage
                          style={{ width: 16, height: 16 }}
                          source={require('../Resources/img/icHeaderSearchCancle16W.png')}
                        />
                      }
                      type="clear"
                      onPress={() => {
                        this.state.listOptions[idx].items.splice(idxItem, 1);
                        this.setState({
                          listOptions: this.state.listOptions,
                        });
                      }}
                    />
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginHorizontal: 20,
                    marginTop: Platform.OS === 'ios' ? -10 : -15,
                  }}
                >
                  <FastImage
                    style={{ width: 12, height: 12, marginRight: 8, opacity: 0 }}
                    source={require('../Resources/img/icCommonOptionRe12W.png')}
                  />
                  <Text
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: 15,
                      marginRight: 15,
                    }}
                  >
                    {Strings.PRICE_ADDITION}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginHorizontal: 5,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 15 }}>￦ </Text>
                    <TextInput
                      style={{
                        ...styles.costTextInput,
                        flex: 1,
                        paddingVertical: 5,
                        fontSize: 15,
                      }}
                      placeholder="0"
                      placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                      onChangeText={(value) => {
                        if (isNaN(value)) {
                          return;
                        }

                        this.state.listOptions[idx].items[idxItem].addition = +value;
                        this.setState({ listOptions: this.state.listOptions });
                      }}
                      value={item.addition.toString()}
                      keyboardType={'decimal-pad'}
                    />
                  </View>
                </View>
                <View style={styles.divider} />
              </View>
            ))}
            <Button
              title={'+ ' + Strings.ADD_LIST_ITEM_TO_OPTION}
              type="clear"
              titleStyle={{ fontSize: 15 }}
              containerStyle={{ marginRight: 10 }}
              onPress={() => {
                this.state.listOptions[idx].items = [
                  ...this.state.listOptions[idx].items,
                  { name: '', addition: 0 },
                ];
                this.setState({
                  listOptions: this.state.listOptions,
                });
              }}
            />
          </View>
        ))}
      </View>
    );
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.container}
        >
          <ProductTitle context={this} />
          <ProductCategory context={this} />
          <View style={styles.divider} />
          <ProductCountry context={this} />
          <View style={styles.divider} />
          <ProductImages context={this} />
          <ProductImageDescription context={this} />
          <ProductTextDescription context={this} />
          <ProductPrice context={this} />
          <ProductDiscount context={this} />
          {/* <ProductLowestPriceLink context={this} /> */}

          {/* <ProductShipmentCost context={this} /> */}
          <ProductShipmentCost
            title={Strings.SHIPMENT_COST + ` (${Strings.KR})`}
            shipmentCost={this.state.shipmentCost}
            onChangeText={(shipmentCost) => this.setState({ shipmentCost })}
          />
          <FreeShipping
            onValueChange={(isAvailableFreeShippingKR) => {
              this.setState({ isAvailableFreeShippingKR });
            }}
            isAvailableFreeShipping={this.state.isAvailableFreeShippingKR}
            onChangeText={(lowestOrderPriceForFreeDeliveryKR) =>
              this.setState({ lowestOrderPriceForFreeDeliveryKR })
            }
            lowestOrderPriceForFreeDelivery={this.state.lowestOrderPriceForFreeDelivery}
          />

          <ProductShipmentCost
            title={Strings.SHIPMENT_COST + ` (${Strings.US})`}
            shipmentCost={this.state.shipmentCostUS}
            onChangeText={(shipmentCostUS) => this.setState({ shipmentCostUS })}
          />
          <FreeShipping
            onValueChange={(isAvailableFreeShippingUS) => {
              this.setState({ isAvailableFreeShippingUS });
            }}
            isAvailableFreeShipping={this.state.isAvailableFreeShippingUS}
            onChangeText={(lowestOrderPriceForFreeDeliveryUS) =>
              this.setState({ lowestOrderPriceForFreeDeliveryUS })
            }
            lowestOrderPriceForFreeDelivery={this.state.lowestOrderPriceForFreeDeliveryUS}
          />

          <ProductNumberToSale context={this} />
          <ProductAdditionals context={this} />
          <ProductOptions context={this} />
          {/* <ProductIsPromition context={this} /> */}
          <SubmitButton context={this} />
          <View style={{ padding: 20 }} />
        </KeyboardAvoidingView>
        {this.renderActivityIndicator()}
      </SafeAreaView>
    );
  }
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  fieldContainer: {
    flex: 1,
    marginTop: 25,
  },
  fieldTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  fieldTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 16,
    lineHeight: 18,
    marginRight: 6,
  },
  fieldProductOption: {
    color: '#888888',
    fontSize: 16,
    lineHeight: 18,
    marginRight: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
  attachmentContainer: {
    flexDirection: 'row',
    marginTop: -6,
  },
  addImageAttachmentButton: {
    width: 80,
    height: 80,
    borderRadius: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    marginTop: 6,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addImageAttachmentIcon: {
    width: 24,
    height: 24,
  },
  attachmentItemListContainer: {
    marginLeft: 8,
    paddingRight: 6,
    paddingTop: 6,
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  removeAttachmentButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 18,
    height: 18,
  },
  count: {
    fontSize: 12,
    color: 'rgb(136, 136, 136)',
  },
  textInput: {
    paddingHorizontal: 10,
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
    marginHorizontal: 20,
  },
  costTextInput: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 16,
  },
  categorySelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  requiredIcon: {
    width: 8,
    height: 10,
    marginLeft: 4,
  },
  selectButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
});

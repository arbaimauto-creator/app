import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, CheckBox } from 'react-native-elements';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import HeaderLeftBackButton from '../../Components/CustomComponents/headerBackButton/headerLeftBackButton';
import OrderListItemView from '../../Components/OrderListItemView';
import Strings from '../../Components/Strings';

const B2BProductInquiryScreen = ({ navigation, route }) => {
  const { product, KRWPerUSD } = route.params;

  const totalPrice = product.finalPrice || product.price || 0;
  const [formData, setFormData] = useState({
    companyCountry: '',
    companyName: '',
    website: '',
    establishedYear: '',
    licenseNumber: '',
    businessType: {
      online: false,
      offline: false,
    },
    collaborationType: {
      directPurchase: false,
      exclusiveDistribution: false,
      oemOdm: false,
    },
    companySize: {
      revenue: '',
    },
    email: '',
    phone: '',
    moq: '',
    address: '',
    message: '',
  });

  const cartItems = [
    {
      id: product.id || product.productId,
      product: {
        ...product,
        options: {
          checks: [],
          selectedOptions: [],
        },
        price: product.price || 0,
        discountPrice: product.discountPrice,
        finalPrice: product.finalPrice || product.price || 0,
        currency: product.currency || 'KRW',
        quantity: 1,
      },
      quantity: 1,
      options: {
        checks: [],
        selectedOptions: [],
      },
      price: product.price || 0,
      finalPrice: product.finalPrice || product.price || 0,
      totalPrice: totalPrice,
      count: 1,
      numberOfProducts: 1,
    },
  ];

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'B2B Inquiry',
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: 20,
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerStyle: {
        backgroundColor: 'white',
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });
  }, [navigation]);

  const handleSubmit = async () => {
    const requiredFields = [
      'companyName',
      'businessType',
      'collaborationType',
      'companySize',
      'email',
      'phone',
      'address',
    ];

    const missingFields = requiredFields.filter((field) => {
      if (field === 'companySize') {
        return !formData[field].revenue;
      }

      return !formData[field];
    });
    if (missingFields.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.businessType.online && !formData.businessType.offline) {
      Alert.alert('Error', 'Please select at least one business type (Online/Offline)');
      return;
    }

    if (
      !formData.collaborationType.directPurchase &&
      !formData.collaborationType.exclusiveDistribution &&
      !formData.collaborationType.oemOdm
    ) {
      Alert.alert('Warning', 'Please select at least one collaboration type', [
        { text: 'OK', style: 'default' },
      ]);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const result = await APIprovider.sendB2BInquiry(formData);
      console.log('sendB2BInquiry', result);

      Alert.alert(
        'Success',
        'Your inquiry has been submitted successfully. We will contact you soon.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit inquiry');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>{Strings.PRODUCT_DETAILS_TO_MAKE_ORDER}</Text>
            <Text style={styles.requiredFieldsNote}>{Strings.B2B_REQUIRED_FIELDS}</Text>
            <OrderListItemView
              navigation={navigation}
              data={{ cartItems }}
              mode={'making_order'}
              style={{ marginBottom: 10 }}
              KRWPerUSD={KRWPerUSD}
              isB2BInquiry={true}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_COUNTRY}</Text>
              <TextInput
                style={styles.input}
                value={formData.companyCountry}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, companyCountry: text }))}
                placeholder="Enter company country"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_NAME}</Text>
              <TextInput
                style={styles.input}
                value={formData.companyName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, companyName: text }))}
                placeholder="Enter company name"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              />
            </View>

            {/* Website */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_WEBSITE}</Text>
              <TextInput
                style={styles.input}
                value={formData.website}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, website: text }))}
                placeholder="Enter company website"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {/* Established Year */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_ESTABLISHED_YEAR}</Text>
              <TextInput
                style={styles.input}
                value={formData.establishedYear}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, establishedYear: text }))}
                placeholder="Enter year of establishment"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_LICENSE_NUMBER}</Text>
              <TextInput
                style={styles.input}
                value={formData.licenseNumber}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, licenseNumber: text }))}
                placeholder="Enter business license number"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_BUSINESS_TYPE}</Text>
              <View style={styles.businessTypeContainer}>
                <CheckBox
                  title="Online"
                      checkedColor={Constants.COLOR_POINT_BLUE}
                  checked={formData.businessType.online}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      businessType: {
                        ...prev.businessType,
                        online: !prev.businessType.online,
                      },
                    }))
                  }
                  containerStyle={[styles.checkbox, styles.inlineCheckbox]}
                />
                <CheckBox
                  title="Offline"
                      checkedColor={Constants.COLOR_POINT_BLUE}
                  checked={formData.businessType.offline}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      businessType: {
                        ...prev.businessType,
                        offline: !prev.businessType.offline,
                      },
                    }))
                  }
                  containerStyle={[styles.checkbox, styles.inlineCheckbox]}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_INTENDED_COLLABORATION_TYPE}</Text>
              <View style={styles.checkboxContainer}>
              <CheckBox
                  title="Direct Purchase"
                  checked={formData.collaborationType.directPurchase}
                  checkedColor={Constants.COLOR_POINT_BLUE}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      collaborationType: {
                        ...prev.collaborationType,
                        directPurchase: !prev.collaborationType.directPurchase,
                      },
                    }))
                  }
                  containerStyle={styles.checkbox}
                />
                <CheckBox
                  title="Exclusive Distribution"
                  checked={formData.collaborationType.exclusiveDistribution}
                  checkedColor={Constants.COLOR_POINT_BLUE}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      collaborationType: {
                        ...prev.collaborationType,
                        exclusiveDistribution: !prev.collaborationType.exclusiveDistribution,
                      },
                    }))
                  }
                  containerStyle={styles.checkbox}
                />
                <CheckBox
                  title="OEM/ODM Partnership"
                  checked={formData.collaborationType.oemOdm}
                  checkedColor= {Constants.COLOR_POINT_BLUE}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      collaborationType: {
                        ...prev.collaborationType,
                        oemOdm: !prev.collaborationType.oemOdm,
                      },
                    }))
                  }
                  containerStyle={styles.checkbox}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_ANNUAL_REVENUE}</Text>
              <TextInput
                style={styles.input}
                value={formData.companySize.revenue}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    companySize: {
                      ...prev.companySize,
                      revenue: text,
                    },
                  }))
                }
                placeholder="Annual Revenue (e.g., $1M)"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_EMAIL}</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_PHONE}</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
                placeholder="Enter phone number"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_MOQ}</Text>
              <TextInput
                style={styles.input}
                value={formData.moq}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, moq: text }))}
                placeholder="Enter MOQ"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_ADDRESS}</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={formData.address}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, address: text }))}
                placeholder="Enter company address"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{Strings.B2B_COMPANY_MEMO}</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={formData.message}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, message: text }))}
                placeholder="Enter your message or inquiry details"
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            containerStyle={styles.submitButton}
            buttonStyle={{
              backgroundColor: Constants.COLOR_POINT_BLUE,
              height: 54,
            }}
            titleStyle={{
              color: Constants.COLOR_BACKGROUND_DARK,
              fontSize: 18,
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
            }}
            title="Submit B2B Inquiry"
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  requiredFieldsNote: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 12,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    marginBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 6,
    color: 'black',
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
    color: Constants.TIER_COLORS.ARTISAN,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    borderRadius: 8,
    padding: 15,
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 16,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Constants.TIER_COLORS.STRIVER,
  },
  submitButton: {
    borderRadius: 14,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  businessTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  inlineCheckbox: {
    flex: 1,
    maxWidth: '50%',
    paddingVertical: 8,
    marginHorizontal: 0,
  },
});

export default B2BProductInquiryScreen;

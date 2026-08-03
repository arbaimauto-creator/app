import React from 'react';
import {
  BackHandler,
  Text,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import ProductListItemView from '../../Components/ProductListItemView';
import Strings from '../../Components/Strings';
import styles from './styles';

export default function LinkProduct({ context }) {
  const { linkedProduct, logonUserId } = context.props.route.params;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.LINK_PRODUCT}</Text>
        {/* <FastImage
          source={require('../../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        /> */}
      </View>
      {!context.state.linkedProduct && (
        <TouchableNativeFeedback
          onPress={() => {
            BackHandler.removeEventListener('hardwareBackPress', context._handleBackButton);
            context.isBackHandlerEnable = false;
            context.props.navigation.navigate('SearchProduct', {
              onSelected: context.onLinkedProductSelected.bind(context),
            });
          }}
        >
          <View style={styles.moveButtonContainer}>
            <Text style={{ ...styles.textInput, paddingHorizontal: 0, borderWidth: 0 }}>
              {Strings.SEARCH_PRODUCT}
            </Text>
            <FastImage
              source={require('../../Resources/img/icCommonNext18.png')}
              style={styles.moveIcon}
            />
          </View>
        </TouchableNativeFeedback>
      )}
      {context.state.linkedProduct && (
        <View style={{ paddingHorizontal: 20, paddingVertical: 5 }}>
          <ProductListItemView
            navigation={context.props.navigation}
            data={context.state.linkedProduct}
            type={'summary'}
            logonUserId={logonUserId}
          />
          <TouchableWithoutFeedback
            style={{ paddingHorizontal: 5 }}
            onPress={() => {
              context.setState({ linkedProduct: null });
            }}
          >
            <FastImage
              style={styles.removeLinkedProductButton}
              // source={require('../../Resources/img/icHeaderSearchCancle16W.png')}
              source={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
            />
          </TouchableWithoutFeedback>
        </View>
      )}
    </View>
  );
}

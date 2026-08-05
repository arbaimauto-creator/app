import React from 'react';
import {
  LayoutAnimation,
  ScrollView,
  Text,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { launchImageLibrary } from 'react-native-image-picker';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import Utils from '../../Components/utils';
import styles from './styles';

export default function CoverImages({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.ADD_IMAGES}</Text>
      </View>
      <ScrollView
        horizontal
        style={styles.attachmentContainer}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {context.state.thumbnailUri ? (
          <View key={'coverImage'} style={styles.attachmentItemListContainer}>
            <FastImage
              source={{ uri: context.state.thumbnailUri }}
              style={styles.attachmentImage}
            />
            <TouchableWithoutFeedback
              style={{ paddingHorizontal: 5 }}
              onPress={() => {
                context.setState({
                  thumbnailUri: null,
                });
                LayoutAnimation.easeInEaseOut();
              }}
            >
              <FastImage
                style={styles.removeAttachmentButton}
                source={require('../../Resources/img/icHeaderSearchCancle16W.png')}
              />
            </TouchableWithoutFeedback>
          </View>
        ) : (
          <View style={{ marginLeft: 0 }}>
            <TouchableNativeFeedback
              onPress={() => {
                launchImageLibrary({
                  mediaType: 'photo',
                }).then((res) => {
                  // 사용자가 선택을 취소하면 assets가 없다
                  const image = res?.assets?.[0];
                  if (!image) {
                    return;
                  }
                  Utils.compressImage(image.uri).then((imagePath) => {
                    context.setState({
                      thumbnailUri: imagePath,
                      oldThumbnailPath: context.state.isEdit
                        ? context.props.route.params.thumbnailUri
                        : null,
                    });
                    LayoutAnimation.easeInEaseOut();
                  });
                });
              }}
            >
              <View style={styles.addImageAttachmentButton}>
                <FastImage
                  style={styles.addImageAttachmentIcon}
                  source={require('../../Resources/img/icSettingImage24.png')}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: 'rgb(136, 136, 136)' }}>
                    {Strings.REVIEW_COVER_IMAGE}
                  </Text>
                  <FastImage
                    source={require('../../Resources/img/icCommonNe10.png')}
                    style={styles.requiredIcon}
                  />
                </View>
                <Text
                  style={[
                    styles.count,
                    {
                      fontSize: 12,
                      lineHeight: 14,
                      color:
                        context.state.attachmentList.length <= Constants.MAX_NUMBER_REVIEW_IMAGE
                          ? 'rgb(136, 136, 136)'
                          : Constants.COLOR_RED,
                    },
                  ]}
                >
                  {`${context.state.thumbnailUri ? 1 : 0}/1`}
                </Text>
              </View>
            </TouchableNativeFeedback>
          </View>
        )}
        <View style={styles.verticleLine} />
        {context.state.attachmentList.map((item, i) => (
          <View key={'descriptionImage_' + i} style={styles.attachmentItemListContainer}>
            <FastImage
              source={{ uri: item.url ? item.url : item.uri }}
              style={styles.attachmentImage}
            />
            <TouchableWithoutFeedback
              style={{ paddingHorizontal: 5 }}
              onPress={() => {
                context.removeAttachment(item);
                LayoutAnimation.easeInEaseOut();
              }}
            >
              <FastImage
                style={styles.removeAttachmentButton}
                source={require('../../Resources/img/icHeaderSearchCancle16W.png')}
              />
            </TouchableWithoutFeedback>
          </View>
        ))}
        {context.state.attachmentList.length < Constants.MAX_NUMBER_REVIEW_IMAGE && (
          <View style={{ marginLeft: 0 }}>
            <TouchableNativeFeedback
              onPress={() => {
                launchImageLibrary({
                  mediaType: 'photo',
                  selectionLimit: Constants.MAX_NUMBER_PRODUCT_DESCRIPTION_IMAGE,
                }).then((res) => {
                  // 취소 시 assets 없음
                  const images = res?.assets;
                  if (!images || images.length === 0) {
                    return;
                  }
                  for (let i = 0; i < images.length; i++) {
                    if (context.state.isEdit) {
                      images[i].change = Constants.ATTACHMENT_CHANGE_ADDED;
                    }
                  }
                  context.setState({
                    attachmentList: [...context.state.attachmentList, ...images],
                  });
                  LayoutAnimation.easeInEaseOut();
                });
              }}
            >
              <View style={styles.addImageAttachmentButton}>
                <FastImage
                  style={styles.addImageAttachmentIcon}
                  source={require('../../Resources/img/icSettingImage24.png')}
                />
                <Text style={{ fontSize: 12, color: 'rgb(136, 136, 136)' }}>
                  {Strings.ADD_IMAGES}
                </Text>
                <Text
                  style={[
                    styles.count,
                    {
                      fontSize: 12,
                      lineHeight: 14,
                      color:
                        context.state.attachmentList.length <= Constants.MAX_NUMBER_REVIEW_IMAGE
                          ? 'rgb(136, 136, 136)'
                          : Constants.COLOR_RED,
                    },
                  ]}
                >
                  {`${context.state.attachmentList.length}/${Constants.MAX_NUMBER_REVIEW_IMAGE}`}
                </Text>
              </View>
            </TouchableNativeFeedback>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableNativeFeedback,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useDispatch, useSelector } from 'react-redux';
import Constants from '../../Components/Constants';
import { horizontalScale, moderateScale, verticalScale } from '../../Components/utils/scailing';
import { fetchStoreMain } from '../../slices/product';
import Strings from '../../Components/Strings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ActionButton({ renderItem, onPress = () => {} }) {
  return (
    <View>
      <TouchableNativeFeedback
        onPress={() => onPress()}
        background={TouchableNativeFeedback.Ripple('#777', true)}
      >
        <View style={styles.actionButton}>{renderItem}</View>
      </TouchableNativeFeedback>
    </View>
  );
}

const Header = ({ navigation }) => {
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ ...styles.headerContainer, paddingTop: Platform.OS === 'android' ? top : 0 }}>
      <Text style={styles.headerTitle}>{Strings.PRODUCT_CATEGORY}</Text>
      <ActionButton
        renderItem={
          <FastImage
            style={styles.headerButton}
            source={require('../../Resources/img/iconRenewal/search-black.png')}
          />
        }
        onPress={() => navigation.navigate('Search')}
      />
    </View>
  );
};

const B2BPageScreen = ({ navigation, route }) => {
  const { logonUserId } = route.params;
  const dispatch = useDispatch();
  const productMain = useSelector((state) => state.product?.productMain);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Set StatusBar color for Android
    if (Platform.OS !== 'ios') {
      StatusBar.setBackgroundColor(Constants.TIER_COLORS.GIVER);
    }

    navigation.setOptions({
      headerShown: false,
      title: null,
    });

    dispatch(fetchStoreMain());
  }, [dispatch, navigation]);

  const onCategoryPress = (category) => {
    navigation.navigate('B2BProductList', {
      listOf: Constants.PRODUCT_LIST_CATEGORY,
      categoryCode: category,
      logonUserId,
    });
  };

  function sortCategory() {
    if (!productMain?.data?.category) return;

    const categorieObjects = [];
    Object.keys(productMain.data.category).forEach((category) => {
      if (category === 'undefined' || productMain.data.category[category]?.entireCount === 0) {
        return;
      }

      const categoryObject = Constants.CATEGORY_LIST.find((c) => c.key === category);
      const categoryIndex = Constants.CATEGORY_LIST.findIndex((c) => c.key === category);

      if (categoryObject) {
        categorieObjects.push({ index: categoryIndex, category, categoryObject });
      }
    });

    const sortedCategorieObjects = categorieObjects.sort((a, b) => a.index - b.index);
    setCategories(sortedCategorieObjects);
  }

  useEffect(() => {
    if (productMain?.data?.category) {
      sortCategory();
    }
    // sortCategory는 매 렌더 재생성 — productMain 변경 시에만 실행하는 의도
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productMain]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header navigation={navigation} />
        <View style={styles.contentContainer}>
          <Text style={styles.subHeaderText}>{Strings.PRODUCT_CATEGORY_SUB}</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {categories.map(({ category, categoryObject }, index) => (
              <React.Fragment key={`${category}-${index}`}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.categoryItem}>
                  <TouchableOpacity
                    style={styles.categoryButton}
                    onPress={() => onCategoryPress(category)}
                  >
                    <View style={styles.iconContainer}>
                      <FastImage
                        style={styles.categoryIcon}
                        source={categoryObject?.deactiveIcon}
                      />
                    </View>
                    <Text style={styles.categoryTitle}>{categoryObject?.title}</Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Constants.TIER_COLORS.GIVER,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  headerContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 7,
    alignItems: 'center',
    backgroundColor: Constants.TIER_COLORS.GIVER,
  },
  headerTitle: {
    fontSize: moderateScale(24),
    color: Constants.TIER_COLORS.PIONEER,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
  },
  headerButton: {
    width: 24,
    height: 24,
  },
  actionButton: {
    borderRadius: 40,
    width: horizontalScale(44),
    height: verticalScale(44),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subHeaderText: {
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
    color: Constants.TIER_COLORS.ARTISAN,
    opacity: 0.8,
    paddingHorizontal: horizontalScale(20),
    marginTop: verticalScale(8),
  },
  scrollContainer: {
    paddingVertical: verticalScale(20),
  },
  categoryItem: {
    marginHorizontal: horizontalScale(20),
    marginVertical: verticalScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: horizontalScale(15),
    borderRadius: moderateScale(10),
    backgroundColor: Constants.COLOR_BACKGROUND_LIGHT,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: horizontalScale(15),
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: 54,
    height: 54,
  },
  categoryIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  categoryTitle: {
    fontSize: moderateScale(15),
    color: Constants.TIER_COLORS.ARTISAN,
    textAlign: 'left',
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
  },
  divider: {
    height: 1,
    backgroundColor: Constants.TIER_COLORS.ARTISAN,
    opacity: 0.1,
    width: '100%',
  },
});

export default B2BPageScreen;

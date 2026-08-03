import { Dimensions, StyleSheet } from 'react-native';
import { isIphoneX } from 'react-native-iphone-x-helper';
import Constants from '../../Components/Constants';
import { horizontalScale, moderateScale } from '../../Components/utils/scailing';
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  orderHeaderContainer: {
    width: '100%',
    marginTop: isIphoneX() ? 50 : 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 24,
    height: 24,
  },
  mainContainer: {
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cellContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  profileImage: {
    width: horizontalScale(42),
    height: horizontalScale(42),
  },
  titleText: {
    fontSize: moderateScale(16),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  descriptionText: {
    fontSize: moderateScale(16),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    color: '#a0a0a0',
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightViewContainer: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: Constants.COLOR_MAIN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: moderateScale(12),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    color: '#3A3A3A',
  },
  dateText: {
    fontSize: moderateScale(12),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    color: '#a0a0a0',
    marginTop: 8,
  },
});

import { StyleSheet } from 'react-native';
import Constants from '../../Constants';
import { horizontalScale, moderateScale } from '../../utils/scailing';
const styles = StyleSheet.create({
  mainContainer: {
    borderBottomWidth: 0.3,
    borderColor: Constants.TIER_COLORS.ARTISAN,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cellContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  profileImage: {
    width: horizontalScale(64),
    height: horizontalScale(64),
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
export default styles;

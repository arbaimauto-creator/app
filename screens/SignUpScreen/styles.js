import { Platform, StyleSheet } from 'react-native';
import Constants from '../../Components/Constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  descriptionTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    padding: 20,
  },
  fieldContainer: {
    marginTop: 20,
  },
  fieldTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  fieldTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    lineHeight: 18,
    marginRight: 6,
  },
  fieldProfileGuidelines: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    lineHeight: 18,
    marginTop: 3,
    paddingHorizontal: 20,
  },
  fieldTitleGuidelines: {
    color: Constants.COLOR_POINT_BLUE,
    opacity: 0.7,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 5,
    paddingHorizontal: 20,
  },
  fieldTitleError: {
    color: Constants.COLOR_RED,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 3,
    paddingHorizontal: 20,
  },
  textInput: {
    color: 'black',
    fontSize: 16,
    marginHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 15 : 0,
  },
  profilePic: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 120,
  },
  profilePicTitle: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 15,
    alignSelf: 'center',
    marginTop: 10,
  },
  count: {
    fontSize: 15,
    color: 'rgb(136, 136, 136)',
  },
  requiredIcon: {
    width: 10,
    height: 11,
    marginLeft: 3,
    marginTop: -9,
  },
  bottomButtonContainer: {
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 44 : 20,
    marginHorizontal: 20,
  },
  bottomButtonTitle: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Constants.TIER_COLORS.STRIVER,
    marginHorizontal: 20,
  },
  selectButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
});

export default styles;

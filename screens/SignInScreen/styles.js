import { StyleSheet } from 'react-native';
import Constants from '../../Components/Constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Constants.COLOR_BACKGROUND_DARK, //'rgb(72, 69, 61)',
    backgroundColor: '#F4F4F4',
  },
  logoContainer: {
    flex: 10,
    alignSelf: 'center',
    alignItems: 'center',
  },
  ssoTitle: {
    fontSize: 16,
    marginLeft: 20,
    alignSelf: 'center',
  },
  signinText: {
    fontSize: 15,
    lineHeight: 17,
    opacity: 0.6,
    color: 'white',
    alignSelf: 'center',
  },
  signInButtonsContainer: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',

    marginTop: 24,
    // marginBottom: 30,
    alignSelf: 'center',
  },
  guestButtonsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    // marginBottom: 30,
    alignSelf: 'center',
  },
  signInButton: {
    width: 26,
    height: 26,
    alignSelf: 'center',
  },
  signInButtonContainer: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  checkingUpdate: {
    fontSize: 14,
    // color: Constants.COLOR_MAIN,
    color: 'black',
    marginBottom: 20,
  },
  checkingUpdateContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  arbaim: {
    color: Constants.TIER_COLORS.OPERATOR,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
    fontSize: 14,
    alignSelf: 'center',
  },
  logo: {
    marginTop: 20,
  },
  flex4: {
    flex: 4,
  },
  flex6: {
    flex: 6,
  },
});

export default styles;

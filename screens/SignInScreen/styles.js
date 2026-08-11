import { StyleSheet } from 'react-native';
import Constants from '../../Components/Constants';
import T from '../../Components/Constants/DesignTokens';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.COLORS.BG, // 신규 디자인 공통 배경 (게이트·홈과 동일)
  },
  symbol: { width: 84, height: 84, marginBottom: 12 },
  heroTitle: {
    marginTop: 22,
    fontFamily: T.FONT.ExtraBold,
    fontSize: 19,
    color: T.COLORS.INK,
    textAlign: 'center',
  },
  heroSub: {
    ...T.TYPE.SUB,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  arbaimFooter: {
    ...T.TYPE.XS,
    textAlign: 'center',
    paddingBottom: 26,
    letterSpacing: 1,
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
    color: T.COLORS.GREY,
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

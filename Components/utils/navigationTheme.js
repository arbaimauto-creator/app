import { DefaultTheme } from '@react-navigation/native';
import Constants from '../Constants';

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    dark: true,
    primary: 'white',
    background: Constants.COLOR_BACKGROUND_DARK,
    card: 'black',
    text: 'white',
    border: 'black',
    notification: 'red',
    // 바텀 네비게이션 아이콘 배경색을 투명하게
    secondaryContainer: 'transparent',
  },
  headerTintColor: 'cyan',
};

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('navigation contracts', () => {
  test('rating list is registered before its video-page buttons can navigate to it', () => {
    const navigator = read('navigation/stacks/MainDrawerNavigator.js');
    expect(navigator).toContain('name="RatingList"');
    expect(navigator).toContain('component={RatingList}');
  });

  test('B2B inquiry uses the nested B2B navigator', () => {
    const productPage = read('Components/ProductPageScreen.js');
    expect(productPage).toContain("navigation.navigate('B2B', {");
    expect(productPage).toContain("screen: 'B2BProductInquiry'");
    expect(productPage).not.toContain("navigation.navigate('B2BProductInquiry'");
  });

  test('legacy checkout stays behind the commerce feature flag', () => {
    const orderItem = read('Components/OrderListItemView.js');
    const productPage = read('Components/ProductPageScreen.js');
    const videoPage = read('screens/VideoPageScreen/index.js');
    expect(orderItem).toContain('if (!FEATURES.COMMERCE)');
    expect(productPage).toContain('if (!FEATURES.COMMERCE)');
    expect(videoPage).toContain('if (!FEATURES.COMMERCE)');
  });

  test('existing consumer and contract entry points remain registered', () => {
    const rootNavigator = read('navigation/stacks/MainDrawerNavigator.js');
    const tabs = read('navigation/stacks/BottomTabNavigator/index.js');
    for (const route of [
      'InviteGate',
      'NotSignedIn',
      'MainBottom',
      'B2B',
      'FgiSurvey',
      'ReviewLinkSubmit',
      'RewardList',
      'Withdrawal',
    ]) {
      expect(rootNavigator).toContain(`name="${route}"`);
    }
    expect(tabs).toContain('component={BrandDashboard}');
    expect(tabs).toContain('component={BrandReview}');
    expect(tabs).toContain('component={BrandMy}');
  });

  test('disabled commerce deep links cannot reopen retired checkout flows', () => {
    const linking = read('Components/utils/linking.js');
    const allowedList = linking.match(/const ALLOWED_LINK_PREFIXES = \[([^\]]+)\]/s)?.[1] || '';
    expect(allowedList).toContain("'videos/'");
    expect(allowedList).toContain("'users/'");
    expect(allowedList).not.toContain("'orders'");
    expect(allowedList).not.toContain("'myorders'");
    expect(allowedList).not.toContain("'products/'");
  });

  test('about screen links to defined service and privacy policy URLs', () => {
    const about = read('screens/MyScreen/AboutScreen.js');
    const english = read('Components/Strings/eng.js');
    const korean = read('Components/Strings/kor.js');
    expect(about).toContain('Strings.TERMS_URL.SERVICE');
    expect(about).toContain('Strings.TERMS_URL.PRIVACY_POLICY');
    for (const strings of [english, korean]) {
      expect(strings).toMatch(/SERVICE:\s*'https:\/\//);
      expect(strings).toMatch(/PRIVACY_POLICY:\s*'https:\/\//);
    }
  });
});

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

describe('feature flags keep hidden funnels intact', () => {
  const features = read('Components/Constants/Features.js');

  test('invite gate and referral are off, creator onboarding stays on', () => {
    expect(features).toMatch(/INVITE_GATE:\s*false/);
    expect(features).toMatch(/REFERRAL:\s*false/);
    expect(features).toMatch(/CREATOR_ONBOARDING:\s*true/);
  });

  test('gate screens remain registered so a flag flip restores them', () => {
    const navigator = read('navigation/stacks/MainDrawerNavigator.js');
    for (const route of ['InviteGate', 'CreatorOnboarding', 'BrandWelcome']) {
      expect(navigator).toContain(`name="${route}"`);
    }
  });

  test('every InviteGate reset is guarded by the flag', () => {
    const helper = read('screens/SignInScreen/commonHelperFunction.js');
    const withdrawal = read('Components/MembershipWithdrawalPage.js');
    const main = read('Components/MainScreen.js');
    expect(helper).toContain('if (FEATURES.INVITE_GATE) {');
    expect(helper).toContain('FEATURES.CREATOR_ONBOARDING');
    expect(read('navigation/stacks/MainDrawerNavigator.js')).toContain(
      "FEATURES.INVITE_GATE && gatePassed !== 'yes' ? 'InviteGate' : 'NotSignedIn'",
    );
    expect(withdrawal).toContain("FEATURES.INVITE_GATE ? 'InviteGate' : 'NotSignedIn'");
    expect(main).toContain('if (FEATURES.INVITE_GATE)');
  });

  test('referral code cards are behind the flag everywhere', () => {
    for (const file of [
      'screens/MyScreen/index.js',
      'screens/ActivityScreen/MissionDone.js',
      'screens/ActivityScreen/index.js',
    ]) {
      expect(read(file)).toContain('FEATURES.REFERRAL');
    }
  });

  test('onboarding collects the country itself when the gate is off', () => {
    const onboarding = read('screens/InviteGateScreen/CreatorOnboarding.js');
    expect(onboarding).toContain("Preference.get('creatorCountry')");
    expect(onboarding).toContain("Preference.set('creatorCountry', resolvedCountry)");
  });
});

describe('tab navigator does not rewrite its own route params', () => {
  test('nested navigate({ screen }) must not be re-dispatched every render', () => {
    const tabs = read('navigation/stacks/BottomTabNavigator/index.js');
    expect(tabs).not.toMatch(/^\s*route\.params\s*=/m);
    expect(tabs).toContain('...parentParams');
  });
});

describe('ops session without an invite code', () => {
  test('the ops client issues its own session and drops it on 401', () => {
    const client = read('api/opsClient.js');
    expect(client).toContain('export async function ensureOpsSession()');
    expect(client).toContain("request('/auth'");
    expect(client).toContain('dropSessionOn401');
    expect(client).not.toContain(
      "'x-greyd-app-key': OPS_APP_KEY };\n}\n\nasync function authHeaders",
    );
  });
  test('the bridge shares the device id with the client', () => {
    expect(read('api/opsBridge.js')).toContain(
      "import { getGreydAppId, opsGet, opsPost } from './opsClient';",
    );
  });
});

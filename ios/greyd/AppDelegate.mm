#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>
#import <Firebase.h>
// #import <CodePush/CodePush.h>

#import <AuthenticationServices/AuthenticationServices.h>
#import <SafariServices/SafariServices.h>
#import <FBSDKCoreKit/FBSDKCoreKit-Swift.h>
#import <GoogleSignIn/GoogleSignIn.h>
#import <RNKakaoLogins.h>
#import <React/RCTLinkingManager.h>

// AppCenter 제거 — 서비스 자체가 2025-03 종료되어 시작 시 등록·전송이 전부 실패한다.
// 죽은 엔드포인트로의 시작 시 활동은 제거 대상 (재실행 흰 화면 조사 과정에서 정리).

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"greyd";
  self.initialProps = @{};

  // Define UNUserNotificationCenter
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;

  [FIRApp configure];
  [FIRMessaging messaging].autoInitEnabled = YES;

  [[FBSDKApplicationDelegate sharedInstance] application:application
                           didFinishLaunchingWithOptions:launchOptions];

  // 부팅 감시장치: JS가 표시하는 두 마커(bootJsStartedAt / bootNavReadyAt)를
  // 시작 직전에 지우고, 8초 뒤에도 비어 있으면 네이티브 알림으로 진단을 띄운다.
  // JS가 아예 실행되지 못하는 흰 화면(진단 오버레이조차 못 뜨는 경우)을 잡기 위한 장치.
  NSUserDefaults *ud = [NSUserDefaults standardUserDefaults];
  [ud removeObjectForKey:@"bootJsStartedAt"];
  [ud removeObjectForKey:@"bootNavReadyAt"];

  BOOL result = [super application:application didFinishLaunchingWithOptions:launchOptions];

  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(8 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *jsStarted = [defaults stringForKey:@"bootJsStartedAt"];
    NSString *navReady = [defaults stringForKey:@"bootNavReadyAt"];
    if (navReady != nil) {
      return; // 정상 부팅
    }
    NSString *msg = [NSString stringWithFormat:
      @"8초 내 부팅 미완료\nJS 실행: %@\n내비게이션 준비: 안 됨\n이 화면을 캡처해 개발자에게 보내주세요.",
      jsStarted ? @"됨" : @"안 됨(번들 미실행)"];
    UIViewController *rootVC = self.window.rootViewController;
    if (rootVC == nil) { return; }
    UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"greyd 부팅 진단"
                                                                   message:msg
                                                            preferredStyle:UIAlertControllerStyleAlert];
    [alert addAction:[UIAlertAction actionWithTitle:@"확인" style:UIAlertActionStyleDefault handler:nil]];
    [rootVC presentViewController:alert animated:YES completion:nil];
  });

  return result;
}

// // ✅ React Native 0.76.6 필수 메서드 추가!
// - (NSURL *)bundleURL
// {
// #if DEBUG
//   return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
// #else
//   return [CodePush bundleURL];
// #endif
// }

// // ✅ sourceURLForBridge를 bundleURL을 호출하도록 수정
// - (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
// {
//   return [self bundleURL];
// }

// ✅ RN 0.76 표준 구현.
// 릴리스에서는 반드시 앱 번들에 동봉된 main.jsbundle을 쓴다.
//
// 이전 구현은 DEBUG 구분 없이 jsBundleURLForBundleRoot:를 호출했다.
// 릴리스 빌드에서는 RCT_DEV_MENU=0이라 RCTBundleURLProvider가 "패키저가 살아있는지"
// 확인하는 코드(isPackagerRunning)를 컴파일에서 제외한다. 따라서 NSUserDefaults에
// RCT_jsLocation 키가 남아 있으면 릴리스 앱이 http://<host>:8081/index.bundle 을
// 그대로 로드하려 들고, 응답이 없으므로 JS가 영원히 실행되지 않는다
// (= 크래시·JS 예외 없는 흰 화면). Xcode 디버그 빌드가 깔려 있던 기기를
// TestFlight로 덮어쓰면 앱 컨테이너가 유지되어 이 키가 그대로 남는다.
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

// ... 나머지 메서드들은 그대로 유지

// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
 [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Required for the notification event.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
 [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}

// Required for localNotification event
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  [RNCPushNotificationIOS didReceiveNotificationResponse:response];
}

//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
}

// ✅ 완전 수정된 openURL 메서드
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
                                                options:(NSDictionary<NSString *,id> *)options {
  // KakaoTalk 로그인 처리
  if ([RNKakaoLogins isKakaoTalkLoginUrl:url]) {
      return [RNKakaoLogins handleOpenUrl: url];
  }

  // Facebook SDK 처리
  if ([[FBSDKApplicationDelegate sharedInstance] application:application openURL:url options:options]) {
    return YES;
  }

  // Google SignIn 처리
  if ([[GIDSignIn sharedInstance] handleURL:url]) {
    return YES;
  }

  // React Native Linking 처리
  if ([RCTLinkingManager application:application openURL:url options:options]) {
    return YES;
  }

  return NO;
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

@end

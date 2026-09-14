#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLog.h>
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


// ── 진단 오버레이 (2026-09-15, TestFlight 흰 화면 추적용 임시 장치) ──
// 릴리스에서 JS가 조용히 실패하면(번들 로드 실패·JS 예외·등록 실패) 흰 화면만 남고 로그는 기기 밖으로 못 나온다.
// RN 네이티브 로그를 메모리에 모아 실행 5초 뒤 최상위 UIWindow에 그대로 띄운다. 알림·alert와 달리 가려지지 않는다.
// 원인 확인 후 제거 대상.
static NSMutableArray<NSString *> *gGreydBootLog = nil;
static UIWindow *gGreydDiagWindow = nil;

static void GreydAppendBootLog(NSString *line) {
  @synchronized(gGreydBootLog) {
    if (gGreydBootLog.count < 300) {
      [gGreydBootLog addObject:line];
    }
  }
}

static void GreydShowDiagOverlay(void) {
  if (gGreydDiagWindow != nil) { return; }
  NSUserDefaults *ud = [NSUserDefaults standardUserDefaults];
  NSString *jsStarted = [ud stringForKey:@"bootJsStartedAt"] ?: @"(없음)";
  NSString *navReady = [ud stringForKey:@"bootNavReadyAt"] ?: @"(없음)";
  NSURL *bundleURL = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  NSMutableString *text = [NSMutableString string];
  [text appendFormat:@"greyd 부팅 진단 (%@ build %@)
",
    [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"],
    [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"]];
  [text appendFormat:@"main.jsbundle: %@
", bundleURL ? @"있음" : @"없음"];
  [text appendFormat:@"JS 시작 마커: %@
내비 준비 마커: %@
", jsStarted, navReady];
  UIViewController *rootVC = [UIApplication sharedApplication].delegate.window.rootViewController;
  UIView *rootView = rootVC.view;
  [text appendFormat:@"rootVC: %@
rootView 자식 수: %lu, 배경: %@
",
    NSStringFromClass([rootVC class]), (unsigned long)rootView.subviews.count, rootView.backgroundColor];
  UIView *first = rootView.subviews.firstObject;
  if (first) {
    [text appendFormat:@"첫 자식: %@ frame=%@ 자식 %lu
", NSStringFromClass([first class]),
      NSStringFromCGRect(first.frame), (unsigned long)first.subviews.count];
  }
  [text appendString:@"
── RN 로그 ──
"];
  @synchronized(gGreydBootLog) {
    [text appendString:[gGreydBootLog componentsJoinedByString:@"
"]];
  }
  [text appendString:@"

이 화면을 캡처해 개발자에게 보내주세요. (위쪽 '닫기'로 닫힘)"];

  UIWindow *w = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  w.windowLevel = UIWindowLevelAlert + 100;
  w.backgroundColor = [UIColor colorWithWhite:0.08 alpha:0.96];
  UIViewController *vc = [UIViewController new];
  vc.view.backgroundColor = [UIColor clearColor];
  w.rootViewController = vc;

  UIButton *close = [UIButton buttonWithType:UIButtonTypeSystem];
  close.frame = CGRectMake(0, 44, w.bounds.size.width, 44);
  [close setTitle:@"닫기" forState:UIControlStateNormal];
  close.titleLabel.font = [UIFont boldSystemFontOfSize:17];
  [close setTitleColor:[UIColor colorWithRed:1 green:0.72 blue:0.19 alpha:1] forState:UIControlStateNormal];
  [close addTarget:[UIApplication sharedApplication].delegate action:@selector(greydHideDiag) forControlEvents:UIControlEventTouchUpInside];
  [vc.view addSubview:close];

  UITextView *tv = [[UITextView alloc] initWithFrame:CGRectMake(8, 92, w.bounds.size.width - 16, w.bounds.size.height - 110)];
  tv.editable = NO;
  tv.backgroundColor = [UIColor clearColor];
  tv.textColor = [UIColor whiteColor];
  tv.font = [UIFont monospacedSystemFontOfSize:11 weight:UIFontWeightRegular];
  tv.text = text;
  [vc.view addSubview:tv];

  gGreydDiagWindow = w;
  [w makeKeyAndVisible];
}

@implementation AppDelegate

- (void)greydHideDiag
{
  gGreydDiagWindow.hidden = YES;
  gGreydDiagWindow = nil;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"greyd";
  self.initialProps = @{};

  // 진단: RN 네이티브 로그를 전부 모은다(번들 로드·JS 예외·등록 실패가 여기에 찍힌다)
  gGreydBootLog = [NSMutableArray array];
  RCTLogFunction prevLog = RCTGetLogFunction() ?: RCTDefaultLogFunction;
  RCTSetLogFunction(^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
    NSString *lvl = level >= RCTLogLevelError ? @"E" : (level == RCTLogLevelWarning ? @"W" : @"I");
    GreydAppendBootLog([NSString stringWithFormat:@"[%@%@] %@", lvl, source == RCTLogSourceJavaScript ? @"/js" : @"", [message length] > 600 ? [message substringToIndex:600] : message]);
    prevLog(level, source, fileName, lineNumber, message);
  });
  GreydAppendBootLog(@"[I] didFinishLaunching");
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    GreydShowDiagOverlay();
  });

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

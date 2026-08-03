//
//  AppUtilsModule.h
//  greyd
//
//  Created by Noah on 7/27/25.
//

#ifndef AppUtilsModule_h
#define AppUtilsModule_h

#import "AppUtilsModule.h"
#import <React/RCTLog.h>
#import <UIKit/UIKit.h>

@implementation AppUtilsModule

// ✅ React Native에서 이 모듈을 사용할 수 있도록 등록
RCT_EXPORT_MODULE();

// ✅ minimizeApp 메서드를 React Native에서 호출 가능하도록 export
RCT_EXPORT_METHOD(minimizeApp) {
  dispatch_async(dispatch_get_main_queue(), ^{
    // iOS에서 앱을 백그라운드로 보내기
    [[UIApplication sharedApplication] performSelector:@selector(suspend)];
    
    // 0.1초 후 실제 백그라운드 전환
    [NSThread sleepForTimeInterval:0.1];
    exit(0);
  });
}

// ✅ 앱 재시작 메서드 (추가 옵션)
RCT_EXPORT_METHOD(restartApp) {
  dispatch_async(dispatch_get_main_queue(), ^{
    // 앱 재시작 로직
    exit(0);
  });
}

// ✅ Promise를 사용한 비동기 메서드 예시
RCT_REMAP_METHOD(minimizeAppAsync,
                 minimizeAppWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      [[UIApplication sharedApplication] performSelector:@selector(suspend)];
      [NSThread sleepForTimeInterval:0.1];
      resolve(@"App minimized successfully");
      exit(0);
    } @catch (NSException *exception) {
      reject(@"minimize_failed", @"Failed to minimize app", nil);
    }
  });
}

@end


#endif /* AppUtilsModule_h */

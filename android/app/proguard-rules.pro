# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-keep class com.arthenica.mobileffmpeg.Config {
    native <methods>;
    void log(long, int, byte[]);
    void statistics(long, int, float, float, long , int, double, double);
}

-keep class com.arthenica.mobileffmpeg.AbiDetect {
    native <methods>;
}

-keep class com.kakao.sdk.**.model.* { <fields>; }
-keep class * extends com.google.gson.TypeAdapter

-keep public class com.horcrux.svg.** {*;}
-keep class com.facebook.react.turbomodule.** { *; }

# ====================================================
# ✅ Fresco 라이브러리 규칙 추가
# ====================================================

# Fresco - 메인 패키지
-keep class com.facebook.drawee.** { *; }
-keep interface com.facebook.drawee.** { *; }

# Fresco - 이미지 파이프라인
-keep class com.facebook.imagepipeline.** { *; }
-keep interface com.facebook.imagepipeline.** { *; }
-dontwarn com.facebook.imagepipeline.**

# Fresco - 애니메이션
-keep class com.facebook.fresco.animation.** { *; }
-keep interface com.facebook.fresco.animation.** { *; }

# Fresco - WebP 트랜스코더 (중요!)
-keep class com.facebook.imagepipeline.nativecode.WebpTranscoder { *; }
-keep class com.facebook.imagepipeline.nativecode.WebpTranscoderImpl { *; }
-keep class com.facebook.imagepipeline.nativecode.Bitmaps { *; }
-keep class com.facebook.imagepipeline.nativecode.NativeMemoryChunk { *; }

# Fresco - 이미지 캐시 (R8 컴파일 에러 해결)
-keep class com.facebook.imagepipeline.cache.AnimatedCache { *; }
-keep class com.facebook.imagepipeline.cache.AnimationFrames { *; }
-keep class com.facebook.imagepipeline.cache.** { *; }
-keep interface com.facebook.imagepipeline.cache.** { *; }

# Fresco - Common
-keep class com.facebook.common.** { *; }
-keep interface com.facebook.common.** { *; }
-dontwarn com.facebook.common.**

# Fresco - Soloader (Native 라이브러리 로더)
-keep class com.facebook.soloader.** { *; }
-keep interface com.facebook.soloader.** { *; }

# Fresco - Memory (Bitmap 메모리 관리)
-keep class com.facebook.imagepipeline.memory.** { *; }
-keep interface com.facebook.imagepipeline.memory.** { *; }

# ====================================================
# React Native Fresco 초기화
# ====================================================
-keep class com.facebook.react.modules.fresco.** { *; }
-keep class com.facebook.imagepipeline.backends.okhttp3.OkHttpNetworkFetcher { *; }

# ====================================================
# OkHttp3 (Fresco와 함께 사용)
# ====================================================
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
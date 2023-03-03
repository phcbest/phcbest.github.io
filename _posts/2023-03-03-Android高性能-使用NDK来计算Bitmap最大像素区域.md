---
layout: article
title: Android高性能-使用NDK来计算Bitmap最大像素区域
tags: Android
---

之前在项目需求中有一个要求，输入一张Bitmap，该Bitmap可能是A8的透明通道位图，也可能是8888的PNG图片，要求我计算出该位图中包含像素的最小面积，比如一张100x100的图片左上角（1，1）和中间（50，50）有像素，其他地方都是透明的，需要输出一个Rect，为left 1，top 1，right 50，bottom 50

 这个问题就类似OpenCV中的连通域计算一样，我当时是使用RenderScript来实现的，但是后面我换了一台Android 13的设备，发现之前编写的RS脚本已经不是用GPU计算了，用CPU来进行计算，这样下来本来30ms计算出来的东西，现在可能要20s左右才能出结果，迫不得已需要寻找更通用的解决方案

## NDK集成到项目

NDK集成还是那个老生常谈，环境是使用CMake

1. 在main目录下创建一个名叫cpp的文件夹，然后右键 -> new -> CMakeList.text 创建一个CMake的描述文件

   ```cmake
   cmake_minimum_required(VERSION 3.22.1)
   
   #这个参数是用来声明和明明项目的
   project("linkzoom")
   
   #创建并命名一个库，将其设置为 STATIC 或 SHARED，并提供其源代码的相对路径。您可以定义多个库，CMake 会为您构建它们。 Gradle 会自动将共享库与您的 APK 打包在一起。
   add_library(#设置库的名字
           linkzoom
           #设置为共享库
           SHARED
           #源文件的相对路径
           MinPixelArea.cpp)
           
   #搜索指定的预构建库并将路径存储为变量。由于 CMake 默认在搜索路径中包含系统库，因此您只需指定要添加的公共 NDK 库的名称。 CMake 在完成构建之前验证库是否存在。
   find_library(
   	    # 设置路径变量的名称。
           log-lib
           # 指定您希望 CMake 定位的 NDK 库的名称。
           log)
           
   #指定库 CMake 应该链接到你的目标库。您可以链接多个库，例如您在此构建脚本中定义的库、预构建的第三方库或系统库。
   target_link_libraries(#指定目标库。
           linkzoom
           jnigraphics
           #将目标库链接到 NDK 中包含的日志库。这里可以理解调用了上面的find_library的库
           ${log-lib})
   ```

   

2. 在cpp文件夹中创建一个cpp文件夹，名字随便，我这里用的是`MinPixelArea.cpp`

3. 在app层的build.gradle文件Android层级中配置外部Native配置

   ```groovy
   externalNativeBuild {
           cmake {
               path file('src/main/cpp/CMakeLists.txt')
               version '3.22.1'
           }
       }	
   ```

## 功能实现

### Nativie部分代码

代码比较简单，主要就是在jni中调用java对象有点繁琐，目前没有使用算法，是暴力遍历实现的，后期可以结合算法来减少计算时间

```c++
#include <jni.h>
#include <string>
#include <cstdint>
#include <android/bitmap.h>
#include <android/log.h>

#define  LOG_TAG    "native-dev"
#define  LOGI(...)  __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...)  __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

#define max(a, b) ((a) > (b) ? (a) : (b))
#define min(a, b) ((a) < (b) ? (a) : (b))

//这个方法没啥用，HelloWord用的
extern "C" JNIEXPORT jstring JNICALL
Java_com_example_linkzoom_MainActivity_stringFromJNI(
        JNIEnv *env,
        jobject /* this */) {
    std::string hello = "Hello from C++";
    return env->NewStringUTF(hello.c_str());
}

/** 这个是计算rect的方法 */
extern "C"
JNIEXPORT jobject JNICALL
Java_com_example_linkzoom_MainActivity_getHasPixelRectSize(JNIEnv *env, jobject thiz,
                                                           jobject bitmap) {
    //rect java类
    jclass rectClass = env->FindClass("android/graphics/Rect");
    //无参ID
    jmethodID id = env->GetMethodID(rectClass, "<init>", "()V");
    //Rect对象
    jobject rect = env->NewObject(rectClass, id);

    AndroidBitmapInfo info;
    //获得bitmap的信息
    AndroidBitmap_getInfo(env, bitmap, &info);
    //快乐位图在这里↓
    void *bitmapPixels;
    //🔒内存
    uint32_t width = info.width;
    uint32_t height = info.height;
    AndroidBitmap_lockPixels(env, bitmap, &bitmapPixels);
    int left = (int32_t) width;
    int top = (int32_t) height;
    int right = 0;
    int bottom = 0;

    if (info.format == ANDROID_BITMAP_FORMAT_A_8) { //是透明通道图
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                void *pixel = ((uint8_t *) bitmapPixels) + y * width + x;//计算像素的指针位置
                uint8_t v = *((uint8_t *) pixel); //指针转数值
                if (v > 0) {
                    left = min(left, x);
                    top = min(top, y);
                    right = max(right, x);
                    bottom = max(bottom, y);
                }
            }
        }
    } else if (info.format == ANDROID_BITMAP_FORMAT_RGBA_8888) {//是PNG图
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                void *pixel = ((uint32_t *) bitmapPixels) + y * width + x;//计算像素的指针位置
                uint32_t v = *((uint32_t *) pixel); //指针转数值
                int alpha = ((int32_t) v >> 24) & 0xff;
                if (alpha > 0) {
                    left = min(left, x);
                    top = min(top, y);
                    right = max(right, x);
                    bottom = max(bottom, y);
                }
            }
        }
    } else {
        left = 0;
        top = 0;
        right = (int32_t) width;
        bottom = (int32_t) height;
    }
    if (left == (int32_t) width && top == (int32_t) height && right == 0 && bottom == 0) {
        left = 0;
        top = 0;
        right = (int32_t) width;
        bottom = (int32_t) height;
    }
    LOGI("left%d,top%d,right%d,bottom%d", left, top, right, bottom);
    //解🔒内存
    AndroidBitmap_unlockPixels(env, bitmap);

    env->CallVoidMethod(rect, env->GetMethodID(rectClass, "set", "(IIII)V"), left, top, right,
                        bottom);
    return rect;
}
```

### Java层调用

Application Init的时候就要加载so库

```kotlin
System.loadLibrary("linkzoom")
```

Native接口定义

```kotlin
private external fun getHasPixelRectSize(bitmap: Bitmap): Rect
```

调用

```kotlin
        val bitmap = BitmapFactory.decodeStream(inputStream)
        val time = System.currentTimeMillis()
        val rect = getHasPixelRectSize(bitmap)
        Log.i("TAG", "onCreate: 耗时${System.currentTimeMillis() - time}")
        Log.i("TAG", "onCreate: ${Rect(0, 0, bitmap.width, bitmap.height)}")
        Log.i("TAG", "onCreate: $rect")
        val ret: Bitmap =
            Bitmap.createBitmap(bitmap, rect.left, rect.top, rect.width(), rect.height())
        binding.sampleImageView.setImageBitmap(ret)
```

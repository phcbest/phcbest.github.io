---
layout: article
title: 记录一次ffmpeg-kit的本机编译
tags: Android
---

## 项目地址

[ffmepg-kit](https://github.com/arthenica/ffmpeg-kit)是一个适用于移动端的ffmpeg框架

## 环境

本次编译采用的虚拟机进行,系统是Ubuntu 22.0.4

在编译之前首先需要安装open-jdk环境,这里采用的是17

```shell
sudo apt install openjdk-17-jdk
```

之后需要安装各做所需的环境,按照ffmpeg-kit的文档

```
autoconf automake libtool pkg-config curl cmake gcc gperf texinfo yasm nasm bison autogen git wget autopoint meson ninja
```

注意,这里的ninja在Ubunut下叫`ninja-build`,使用`ninja-build`包名可以安装成功

接下来便是配置Android的SDK和NDK的环境变量

注意这里SDK版本无限制,NDK版本采用r22b要求带有LLDB和CMake,最后输出的配置的环境变量如下

```shell
phc@phc-virtual-machine:~$ echo $ANDROID_SDK_ROOT
/home/phc/AndroidSDK
phc@phc-virtual-machine:~$ echo $ANDROID_NDK_ROOT
/home/phc/AndroidSDK/ndk/22.0.7026061
```

为了防止找不到SDK的情况出现,我配置了ANDROID_SDK_ROOT和ANDROID_HOME

在`~/.bashrc`文件的最后配置这些参数

```shell
export ANDROID_NDK_ROOT=/home/phc/AndroidSDK/ndk/22.0.7026061
export ANDROID_SDK_ROOT=/home/phc/AndroidSDK
#export ANDROID_SDK_ROOT=/home/phc/AndroidSDK/platforms/android-21
export ANDROID_SDK_HOME=/home/phc/AndroidSDK
#export ANDROID_SDK_HOME=/home/phc/AndroidSDK/platforms/android-21
export ANDROID_HOME=/home/phc/AndroidSDK
export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"
```

我配置这么多完全是因为Android Archives的过程给我爆太多错了,之后每个都配置了以下,不是经常用Linux,不太了解环境变量的相关配置

之后确认环境变量的配置立即生效

```shell
source ~/.bashrc
```

**一开始我采用snap的androidsdk包来进行SDK和NDK的下载,其实采用sdkmanager也是一样的,也可以直接下载AndroidStudioLinuxVersion来下载SDK之后配置进环境变量,推荐采用AndroidStudio来进行下载,这样更方便**

AndroidSDK是需要允许许可的,采用`androidsdk ----licenses `之后全yes就可以了

环境变量和依赖软件配置好了之后,就可以进行编译了

## 编译

首先说一下,因为这边网络能拉github,但是因为网络较差,需要较长时间,我这边对git全局配置了一个很长的超时时间,编译过程中脚本会自动下载相关依赖

```shell
  git config --global http.postBuffer 524288000  
  git config --global https.postBuffer 524288000
```

### 帮助文档

```shell
phc@phc-virtual-machine:~/Desktop/ffmpeg/ffmpeg-kit$ ./android.sh --help

'android.sh' builds FFmpegKit for Android platform. By default five Android architectures (armeabi-v7a, armeabi-v7a-neon, arm64-v8a, x86 and x86_64) are built without any external libraries enabled. Options can be used to disable architectures and/or enable external libraries. Please note that GPL libraries (external libraries with GPL license) need --enable-gpl flag to be set explicitly. When compilation ends an Android Archive (AAR) file is created under the prebuilt folder.

Usage: ./android.sh [OPTION]... [VAR=VALUE]...

Specify environment variables as VARIABLE=VALUE to override default build options.

Options:
  -h, --help			display this help and exit
  -v, --version			display version information and exit
  -d, --debug			build with debug information
  -s, --speed			optimize for speed instead of size
  -f, --force			ignore warnings
  -l, --lts			build lts packages to support API 16+ devices
      --api-level=api		override Android api level
      --no-ffmpeg-kit-protocols	disable custom ffmpeg-kit protocols (saf)

Licensing options:
  --enable-gpl			allow building GPL libraries, created libs will be licensed under the GPLv3.0 [no]

Architectures:
  --disable-arm-v7a		do not build arm-v7a architecture [yes]
  --disable-arm-v7a-neon	do not build arm-v7a-neon architecture [yes]
  --disable-arm64-v8a		do not build arm64-v8a architecture [yes]
  --disable-x86			do not build x86 architecture [yes]
  --disable-x86-64		do not build x86-64 architecture [yes]

Libraries:
  --full			enables all external libraries
  --enable-android-media-codec	build with built-in Android MediaCodec support [no]
  --enable-android-zlib		build with built-in zlib support [no]
  --enable-chromaprint		build with chromaprint [no]
  --enable-dav1d		build with dav1d [no]
  --enable-fontconfig		build with fontconfig [no]
  --enable-freetype		build with freetype [no]
  --enable-fribidi		build with fribidi [no]
  --enable-gmp			build with gmp [no]
  --enable-gnutls		build with gnutls [no]
  --enable-kvazaar		build with kvazaar [no]
  --enable-lame			build with lame [no]
  --enable-libaom		build with libaom [no]
  --enable-libass		build with libass [no]
  --enable-libiconv		build with libiconv [no]
  --enable-libilbc		build with libilbc [no]
  --enable-libtheora		build with libtheora [no]
  --enable-libvorbis		build with libvorbis [no]
  --enable-libvpx		build with libvpx [no]
  --enable-libwebp		build with libwebp [no]
  --enable-libxml2		build with libxml2 [no]
  --enable-opencore-amr		build with opencore-amr [no]
  --enable-openh264		build with openh264 [no]
  --enable-openssl		build with openssl [no]
  --enable-opus			build with opus [no]
  --enable-sdl			build with sdl [no]
  --enable-shine		build with shine [no]
  --enable-snappy		build with snappy [no]
  --enable-soxr			build with soxr [no]
  --enable-speex		build with speex [no]
  --enable-srt			build with srt [no]
  --enable-tesseract		build with tesseract [no]
  --enable-twolame		build with twolame [no]
  --enable-vo-amrwbenc		build with vo-amrwbenc [no]
  --enable-zimg			build with zimg [no]

GPL libraries:
  --enable-libvidstab		build with libvidstab [no]
  --enable-rubberband		build with rubber band [no]
  --enable-x264			build with x264 [no]
  --enable-x265			build with x265 [no]
  --enable-xvidcore		build with xvidcore [no]

Custom libraries:
  --enable-custom-library-[n]-name=value			name of the custom library []
  --enable-custom-library-[n]-repo=value			git repository of the source code []
  --enable-custom-library-[n]-repo-commit=value			git commit to download the source code from []
  --enable-custom-library-[n]-repo-tag=value			git tag to download the source code from []
  --enable-custom-library-[n]-package-config-file-name=value	package config file installed by the build script []
  --enable-custom-library-[n]-ffmpeg-enable-flag=value	library name used in ffmpeg configure script to enable the library []
  --enable-custom-library-[n]-license-file=value		licence file path relative to the library source folder []
  --enable-custom-library-[n]-uses-cpp				flag to specify that the library uses libc++ []

Advanced options:
  --reconf-LIBRARY		run autoreconf before building LIBRARY [no]
  --redownload-LIBRARY		download LIBRARY even if it is detected as already downloaded [no]
  --rebuild-LIBRARY		build LIBRARY even if it is detected as already built [no]
  --no-archive			do not build Android archive [no]

```

### 帮助文档翻译版

```shell
'android.sh'用于构建Android平台上的FFmpegKit。默认情况下，将构建五种Android架构（armeabi-v7a、armeabi-v7a-neon、arm64-v8a、x86和x86_64），且不启用任何外部库。可以使用选项禁用某些架构或启用外部库。请注意，GPL库（具有GPL许可的外部库）需要显式设置--enable-gpl标志。当编译完成后，会在prebuilt文件夹下创建一个Android Archive (AAR)文件。

使用方法：./android.sh [OPTION]... [VAR=VALUE]...

将环境变量指定为VARIABLE=VALUE以覆盖默认构建选项。

选项：
-h, --help 显示帮助信息并退出
-v, --version 显示版本信息并退出
-d, --debug 使用调试信息进行构建
-s, --speed 优化速度而不是大小
-f, --force 忽略警告
-l, --lts 构建lts包以支持API 16+设备
--api-level=api 覆盖Android API级别
--no-ffmpeg-kit-protocols 禁用自定义ffmpeg-kit协议（saf）

许可选项：
--enable-gpl 允许构建GPL库，创建的库将根据GPLv3.0许可授权 [no]

架构选项：
--disable-arm-v7a 不构建arm-v7a架构 [yes]
--disable-arm-v7a-neon 不构建arm-v7a-neon架构 [yes]
--disable-arm64-v8a 不构建arm64-v8a架构 [yes]
--disable-x86 不构建x86架构 [yes]
--disable-x86-64 不构建x86-64架构 [yes]

库选项：
--full 启用所有外部库
--enable-android-media-codec 使用内置的Android MediaCodec支持进行构建 [no]
--enable-android-zlib 使用内置的zlib支持进行构建 [no]
--enable-chromaprint 使用chromaprint进行构建 [no]
--enable-dav1d 使用dav1d进行构建 [no]
--enable-fontconfig 使用fontconfig进行构建 [no]
--enable-freetype 使用freetype进行构建 [no]
--enable-fribidi 使用fribidi进行构建 [no]
--enable-gmp 使用gmp进行构建 [no]
--enable-gnutls 使用gnutls进行构建 [no]
--enable-kvazaar 使用kvazaar进行构建 [no]
--enable-lame 使用lame进行构建 [no]
--enable-libaom 使用libaom进行构建 [no]
--enable-libass 使用libass进行构建 [no]
--enable-libiconv 使用libiconv进行构建 [no]
--enable-libilbc 使用libilbc进行构建 [no]
--enable-libtheora 使用libtheora进行构建 [no]
--enable-libvorbis 使用libvorbis进行构建 [no]
--enable-libvpx 使用libvpx进行构建 [no]
--enable-libwebp 使用libwebp进行构建 [no]
--enable-libxml2 使用libxml2进行构建 [no]
--enable-opencore-amr 使用opencore-amr进行构建 [no]
--enable-openh264 使用openh264进行构建 [no]
--enable-openssl 使用openssl进行构建 [no]
--enable-opus 使用opus进行构建 [no]
--enable-sdl 使用sdl进行构建 [no]
--enable-shine 使用shine进行构建 [no]
--enable-snappy 使用snappy进行构建 [no]
--enable-soxr 使用soxr进行构建 [no]
--enable-speex 使用speex进行构建 [no]
--enable-srt 使用srt进行构建 [no]
--enable-tesseract 使用tesseract进行构建 [no]
--enable-twolame 使用twolame进行构建 [no]
--enable-vo-amrwbenc 使用vo-amrwbenc进行构建 [no]
--enable-zimg 使用zimg进行构建 [no]

GPL库：
--enable-libvidstab 使用libvidstab进行构建 [no]
--enable-rubberband 使用rubber band进行构建 [no]
--enable-x264 使用x264进行构建 [no]
--enable-x265 使用x265进行构建 [no]
--enable-xvidcore 使用xvidcore进行构建 [no]

自定义库：
--enable-custom-library-[n]-name=value 自定义库的名称 []
--enable-custom-library-[n]-repo=value 源代码的git仓库 []
--enable-custom-library-[n]-repo-commit=value 从git下载源代码的提交 []
--enable-custom-library-[n]-repo-tag=value 从git下载源代码的标签 []
--enable-custom-library-[n]-package-config-file-name=value 构建脚本安装的软件包配置文件 []
--enable-custom-library-[n]-ffmpeg-enable-flag=value 在ffmpeg配置脚本中启用库的名称 []
--enable-custom-library-[n]-license-file=value 相对于库源文件夹的许可文件路径 []
--enable-custom-library-[n]-uses-cpp 指定库是否使用libc++ []

高级选项：
--reconf-LIBRARY 在构建LIBRARY之前运行autoreconf [no]
--redownload-LIBRARY 即使检测到LIBRARY已下载，也重新下载LIBRARY [no]
--rebuild-LIBRARY 即使检测到LIBRARY已构建，也重新构建LIBRARY [no]
--no-archive 不构建Android存档 [no]

请注意，选项中的[n]代表一个整数值，可用于指定多个自定义库。例如，--enable-custom-library-1-name=library_name将指定第一个自定义库的名称。
```



### 执行

在ffmpeg-kit路径下执行

```shell
./android.sh --disable-arm-v7a-neon --disable-x86 --disable-x86-64 --enable-android-media-codec --enable-android-zlib --enable-libvidstab --enable-x264 --enable-x265 --enable-xvidcore --enable-gpl --lts --redownload-LIBRARY --rebuild-LIBRARY
```

我这里配置不使用`arm-v7a-neon` `x86`  `x86-64` 

启用`android-media-codec` `android-zlib` `libvidstab` `x264` `x265 ` `xvidcore`

然后开启gpl依赖的允许,编译lts版本

等编译跑完即可

```
Building ffmpeg-kit LTS library for Android

Architectures: arm-v7a, arm64-v8a
Libraries: android-zlib, android-media-codec, x264, xvidcore, x265, libvidstab
Rebuild: LIBRARY
Redownload: LIBRARY

Downloading sources: ok

Building arm-v7a platform on API level 16

x264: already built
xvidcore: already built
x265: already built
libvidstab: already built
cpu-features: already built

ffmpeg: ok

Building arm64-v8a platform on API level 21

x264: already built
xvidcore: already built
x265: already built
libvidstab: already built
cpu-features: already built

ffmpeg: ok

ffmpeg-kit: ok


Creating Android archive under prebuilt: failed
```

到这里的话编译就已经跑完了,这里Android archive失败,是因为命令行下执行编译,**没有debug keystore导致的**

这里我们采用https://stackoverflow.com/a/76093078/13264619 这个解决方案

是因为配置的**ANDROID_SDK_HOME**环境变量下没有./.android/debug.keystore

采用下方命令生成一个debug密钥

```shell
keytool -genkey -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
```

然后使用cp命令拷贝到环境变量的目录下,之后重新编译就可以编译成功了

```shell
phc@phc-virtual-machine:~/AndroidSDK$ pwd
/home/phc/AndroidSDK
phc@phc-virtual-machine:~/AndroidSDK$ cp /home/phc/.android/debug.keystore .
```

最后生成的aar路径在**prebuilt**文件夹下

当然,可也直接使用**Android Studio**打开`/ffmpeg-kit/android`路径,基本上像个正常Android项目一样gradle打个assemble包就可以了,最后的aar在子项目`/ffmpeg-kit/android/ffmpe-kit-android-lib`**build**的**output**路径下

最后注意一点,打出来的包需要依赖`Smart Exception `库,详情可看说明 https://github.com/tanersener/ffmpeg-kit/wiki/Smart-Exception-Dependency

如果不添加依赖的话也是可以正常打包出来的,但是运行会报错,如果是MavenCenter的就不用,因为pom声明了依赖,AS自己会下载

```
java.lang.NoClassDefFoundError: Failed resolution of: Lcom/arthenica/smartexception/java/Exceptions;
at com.arthenica.ffmpegkit.FFmpegKitConfig.(FFmpegKitConfig.java:90)
```



最后打出来的包和ffmpeg-kit-min-gpl的对比如下,体积还是减少了不少的,也能够满足项目需求![image-20230723130428956](https://raw.githubusercontent.com/phcbest/PicBed/main/img/image-20230723130428956.png)
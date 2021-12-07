---
layout: article
title: Android与OpenCv结合使用
tags: Android
---

## 项目配置

在opencv官网下载sdkhttps://opencv.org/releases/

项目解压后，需要用到的目录大致如下

```
│OPENCV-4.5.2-ANDROID-SDK\OPENCV-ANDROID-SDK
├─samples
└─sdk
    ├─etc
    ├─java
    ├─libcxx_helper
    └─native
        ├─3rdparty
        ├─jni
        ├─libs
        │  ├─arm64-v8a
        │  ├─armeabi-v7a
        │  ├─x86
        │  └─x86_64
        └─staticlibs
```

需要向项目导入module的文件夹为`/sdk/java` 该目录下文件情况如下

```
├─javadoc
├─res
├─src
└─AndroidManifest.xml
```

在AndroidStudio中创建一个NDK项目，项目编译完成后使用`File->New->Import Module...` 将OpenCV的SDK`/sdk/java` 导入

之后要修改SDK的`build.gradle` 配置

```groovy
//apply plugin: 'com.android.application'
//注意 这里需要以库的方式导入项目
apply plugin: 'com.android.library'

android {
	//这个编译SDK版本和构建工具版本要与主项目的相同
    compileSdkVersion 30
    buildToolsVersion "30.0.3"

    defaultConfig {
        //因为不是app所以不需要application id
//        applicationId "org.opencv"
		//这个最小sdk版本和目标sdk版本要与主项目的相同
        minSdkVersion 23
        targetSdkVersion 30
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.txt'
        }
    }
}
```

修改主项目add的`build.gradle` 配置，主要是添加一个过滤器，添加一个配置指定so库的目录

```groovy
plugins {
    id 'com.android.application'
}
android {
    compileSdkVersion 30
    buildToolsVersion "30.0.3"
    defaultConfig {
        applicationId "com.phc.opencv_demo_fuck"
        minSdkVersion 23
        targetSdkVersion 30
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        externalNativeBuild {
            cmake {
                cppFlags "-std=c++14"
				//添加如下两行
                abiFilters 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
                arguments '-DANDROID_STL=c++_shared'
            }
        }
        //这个路径要配置为so库存放的位置
        sourceSets {
            main {
                jniLibs.srcDirs = ['src/main/jniLibs']
            }
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
            version "3.10.2"
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}
dependencies {
    implementation 'androidx.appcompat:appcompat:1.2.0'
    implementation 'com.google.android.material:material:1.2.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.0.4'
    implementation project(path: ':java_opencv_sdk')
    testImplementation 'junit:junit:4.+'
    androidTestImplementation 'androidx.test.ext:junit:1.1.2'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.3.0'
}
```

将SDK中的so库放到指定的目录下(`src/main/jniLibs`)没有目录就创建

> so库位于opencv-4.5.2-android-sdk\OpenCV-android-sdk\sdk\native\libs路径下

**之后将SDK模块依赖于主项目** 

到这一步，OpenCV的SDK导入完成了



## 官方色块检测Sample

- 清单文件

- ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <manifest xmlns:android="http://schemas.android.com/apk/res/android"
      package="com.phc.opencv_demo_fuck">
  
      <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
      <uses-permission android:name="android.permission.CAMERA" />
  
      <uses-feature
          android:name="android.hardware.camera"
          android:required="false" />
      <uses-feature
          android:name="android.hardware.camera.autofocus"
          android:required="false" />
      <uses-feature
          android:name="android.hardware.camera.front"
          android:required="false" />
      <uses-feature
          android:name="android.hardware.camera.front.autofocus"
          android:required="false" />
  
      <supports-screens
          android:anyDensity="true"
          android:largeScreens="true"
          android:normalScreens="true"
          android:resizeable="true"
          android:smallScreens="true" />
      <application
          android:allowBackup="true"
          android:icon="@mipmap/ic_launcher"
          android:label="@string/app_name"
          android:roundIcon="@mipmap/ic_launcher_round"
          android:supportsRtl="true"
          android:theme="@style/Theme.Opencv_demo_fuck">
          <activity
              android:name=".colorBlob.ColorBlobDetectionActivity"
              android:configChanges="keyboardHidden|orientation"
              android:screenOrientation="landscape" />
          <activity android:name=".MainActivity">
              <intent-filter>
                  <action android:name="android.intent.action.MAIN" />
  
                  <category android:name="android.intent.category.LAUNCHER" />
              </intent-filter>
  
          </activity>
      </application>
  
  </manifest>
  ```

- xml ui文件

- ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
      android:layout_width="match_parent"
      android:layout_height="match_parent"
      android:gravity="center"
      android:orientation="vertical">
  
      <org.opencv.android.JavaCameraView
          android:id="@+id/jcv_view"
          android:layout_width="match_parent"
          android:layout_height="match_parent" />
  </LinearLayout>
  ```

- java逻辑文件

- ```java
  package com.phc.opencv_demo_fuck.colorBlob;
  
  import android.os.Bundle;
  import android.util.Log;
  import android.view.MotionEvent;
  import android.view.SurfaceView;
  import android.view.View;
  import android.view.View.OnTouchListener;
  import android.view.Window;
  import android.view.WindowManager;
  
  import com.phc.opencv_demo_fuck.R;
  
  import org.opencv.android.BaseLoaderCallback;
  import org.opencv.android.CameraActivity;
  import org.opencv.android.CameraBridgeViewBase;
  import org.opencv.android.CameraBridgeViewBase.CvCameraViewFrame;
  import org.opencv.android.CameraBridgeViewBase.CvCameraViewListener2;
  import org.opencv.android.LoaderCallbackInterface;
  import org.opencv.android.OpenCVLoader;
  import org.opencv.core.Core;
  import org.opencv.core.CvType;
  import org.opencv.core.Mat;
  import org.opencv.core.MatOfPoint;
  import org.opencv.core.Rect;
  import org.opencv.core.Scalar;
  import org.opencv.core.Size;
  import org.opencv.imgproc.Imgproc;
  
  import java.util.Collections;
  import java.util.List;
  
  
  public class ColorBlobDetectionActivity extends CameraActivity implements OnTouchListener, CvCameraViewListener2 {
      private static final String TAG = "OCVSample::Activity";
  
      private boolean mIsColorSelected = false;
      private Mat mRgba;
      private Scalar mBlobColorRgba;
      private Scalar mBlobColorHsv;
      private ColorBlobDetector mDetector;
      private Mat mSpectrum;
      private Size SPECTRUM_SIZE;
      private Scalar CONTOUR_COLOR;
  
      private CameraBridgeViewBase mOpenCvCameraView;
  
      private BaseLoaderCallback mLoaderCallback = new BaseLoaderCallback(this) {
          @Override
          public void onManagerConnected(int status) {
              switch (status) {
                  case LoaderCallbackInterface.SUCCESS: {
                      Log.i(TAG, "OpenCV loaded successfully");
                      mOpenCvCameraView.enableView();
                      mOpenCvCameraView.setOnTouchListener(ColorBlobDetectionActivity.this);
                  }
                  break;
                  default: {
                      super.onManagerConnected(status);
                  }
                  break;
              }
          }
      };
  
      public ColorBlobDetectionActivity() {
          Log.i(TAG, "Instantiated new " + this.getClass());
      }
  
      /**
       * Called when the activity is first created.
       */
      @Override
      public void onCreate(Bundle savedInstanceState) {
          Log.i(TAG, "called onCreate");
          super.onCreate(savedInstanceState);
          requestWindowFeature(Window.FEATURE_NO_TITLE);
          getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  
          setContentView(R.layout.activity_color_blod);
  
          mOpenCvCameraView = (CameraBridgeViewBase) findViewById(R.id.jcv_view);
          mOpenCvCameraView.setVisibility(SurfaceView.VISIBLE);
          mOpenCvCameraView.setCvCameraViewListener(this);
      }
  
      @Override
      public void onPause() {
          super.onPause();
          if (mOpenCvCameraView != null) {
              mOpenCvCameraView.disableView();
          }
      }
  
      @Override
      public void onResume() {
          super.onResume();
          if (!OpenCVLoader.initDebug()) {
              Log.d(TAG, "Internal OpenCV library not found. Using OpenCV Manager for initialization");
              OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION_3_0_0, this, mLoaderCallback);
          } else {
              Log.d(TAG, "OpenCV library found inside package. Using it!");
              mLoaderCallback.onManagerConnected(LoaderCallbackInterface.SUCCESS);
          }
      }
  
      @Override
      protected List<? extends CameraBridgeViewBase> getCameraViewList() {
          return Collections.singletonList(mOpenCvCameraView);
      }
  
      @Override
      public void onDestroy() {
          super.onDestroy();
          if (mOpenCvCameraView != null) {
              mOpenCvCameraView.disableView();
          }
      }
  
      @Override
      public void onCameraViewStarted(int width, int height) {
          mRgba = new Mat(height, width, CvType.CV_8UC4);
          mDetector = new ColorBlobDetector();
          mSpectrum = new Mat();
          mBlobColorRgba = new Scalar(255);
          mBlobColorHsv = new Scalar(255);
          SPECTRUM_SIZE = new Size(200, 64);
          CONTOUR_COLOR = new Scalar(255, 0, 0, 255);
      }
  
      @Override
      public void onCameraViewStopped() {
          mRgba.release();
      }
  
      @Override
      public boolean onTouch(View v, MotionEvent event) {
          int cols = mRgba.cols();
          int rows = mRgba.rows();
  
          int xOffset = (mOpenCvCameraView.getWidth() - cols) / 2;
          int yOffset = (mOpenCvCameraView.getHeight() - rows) / 2;
  
          int x = (int) event.getX() - xOffset;
          int y = (int) event.getY() - yOffset;
  
          Log.i(TAG, "Touch image coordinates: (" + x + ", " + y + ")");
  
          if ((x < 0) || (y < 0) || (x > cols) || (y > rows)) {
              return false;
          }
  
          Rect touchedRect = new Rect();
  
          touchedRect.x = (x > 4) ? x - 4 : 0;
          touchedRect.y = (y > 4) ? y - 4 : 0;
  
          touchedRect.width = (x + 4 < cols) ? x + 4 - touchedRect.x : cols - touchedRect.x;
          touchedRect.height = (y + 4 < rows) ? y + 4 - touchedRect.y : rows - touchedRect.y;
  
          Mat touchedRegionRgba = mRgba.submat(touchedRect);
  
          Mat touchedRegionHsv = new Mat();
          Imgproc.cvtColor(touchedRegionRgba, touchedRegionHsv, Imgproc.COLOR_RGB2HSV_FULL);
  
          // Calculate average color of touched region
          mBlobColorHsv = Core.sumElems(touchedRegionHsv);
          int pointCount = touchedRect.width * touchedRect.height;
          for (int i = 0; i < mBlobColorHsv.val.length; i++) {
              mBlobColorHsv.val[i] /= pointCount;
          }
  
          mBlobColorRgba = convertScalarHsv2Rgba(mBlobColorHsv);
  
          Log.i(TAG, "Touched rgba color: (" + mBlobColorRgba.val[0] + ", " + mBlobColorRgba.val[1] +
                  ", " + mBlobColorRgba.val[2] + ", " + mBlobColorRgba.val[3] + ")");
  
          mDetector.setHsvColor(mBlobColorHsv);
  
          Imgproc.resize(mDetector.getSpectrum(), mSpectrum, SPECTRUM_SIZE, 0, 0, Imgproc.INTER_LINEAR_EXACT);
  
          mIsColorSelected = true;
  
          touchedRegionRgba.release();
          touchedRegionHsv.release();
  
          return false; // don't need subsequent touch events
      }
  
      @Override
      public Mat onCameraFrame(CvCameraViewFrame inputFrame) {
          mRgba = inputFrame.rgba();
  
          if (mIsColorSelected) {
              mDetector.process(mRgba);
              List<MatOfPoint> contours = mDetector.getContours();
              Log.i(TAG, "Contours count: " + contours.size());
              Imgproc.drawContours(mRgba, contours, -1, CONTOUR_COLOR);
  
              Mat colorLabel = mRgba.submat(4, 68, 4, 68);
              colorLabel.setTo(mBlobColorRgba);
  
              Mat spectrumLabel = mRgba.submat(4, 4 + mSpectrum.rows(), 70, 70 + mSpectrum.cols());
              mSpectrum.copyTo(spectrumLabel);
          }
  //        Core.rotate(mRgba, mRgba, Core.ROTATE_90_CLOCKWISE);
          return mRgba;
      }
  
      private Scalar convertScalarHsv2Rgba(Scalar hsvColor) {
          Mat pointMatRgba = new Mat();
          Mat pointMatHsv = new Mat(1, 1, CvType.CV_8UC3, hsvColor);
          Imgproc.cvtColor(pointMatHsv, pointMatRgba, Imgproc.COLOR_HSV2RGB_FULL, 4);
  
          return new Scalar(pointMatRgba.get(0, 0));
      }
  }
  
  ```

- 色块检测器

- ```java
  package com.phc.opencv_demo_fuck.colorBlob;
  
  import org.opencv.core.Core;
  import org.opencv.core.CvType;
  import org.opencv.core.Mat;
  import org.opencv.core.MatOfPoint;
  import org.opencv.core.Scalar;
  import org.opencv.imgproc.Imgproc;
  
  import java.util.ArrayList;
  import java.util.Iterator;
  import java.util.List;
  
  public class ColorBlobDetector {
      // Lower and Upper bounds for range checking in HSV color space
      private Scalar mLowerBound = new Scalar(0);
      private Scalar mUpperBound = new Scalar(0);
      // Minimum contour area in percent for contours filtering
      private static double mMinContourArea = 0.1;
      // Color radius for range checking in HSV color space
      private Scalar mColorRadius = new Scalar(25, 50, 50, 0);
      private Mat mSpectrum = new Mat();
      private List<MatOfPoint> mContours = new ArrayList<MatOfPoint>();
  
      // Cache
      Mat mPyrDownMat = new Mat();
      Mat mHsvMat = new Mat();
      Mat mMask = new Mat();
      Mat mDilatedMask = new Mat();
      Mat mHierarchy = new Mat();
  
      public void setColorRadius(Scalar radius) {
          mColorRadius = radius;
      }
  
      public void setHsvColor(Scalar hsvColor) {
          double minH = (hsvColor.val[0] >= mColorRadius.val[0]) ? hsvColor.val[0] - mColorRadius.val[0] : 0;
          double maxH = (hsvColor.val[0] + mColorRadius.val[0] <= 255) ? hsvColor.val[0] + mColorRadius.val[0] : 255;
  
          mLowerBound.val[0] = minH;
          mUpperBound.val[0] = maxH;
  
          mLowerBound.val[1] = hsvColor.val[1] - mColorRadius.val[1];
          mUpperBound.val[1] = hsvColor.val[1] + mColorRadius.val[1];
  
          mLowerBound.val[2] = hsvColor.val[2] - mColorRadius.val[2];
          mUpperBound.val[2] = hsvColor.val[2] + mColorRadius.val[2];
  
          mLowerBound.val[3] = 0;
          mUpperBound.val[3] = 255;
  
          Mat spectrumHsv = new Mat(1, (int) (maxH - minH), CvType.CV_8UC3);
  
          for (int j = 0; j < maxH - minH; j++) {
              byte[] tmp = {(byte) (minH + j), (byte) 255, (byte) 255};
              spectrumHsv.put(0, j, tmp);
          }
  
          Imgproc.cvtColor(spectrumHsv, mSpectrum, Imgproc.COLOR_HSV2RGB_FULL, 4);
      }
  
      public Mat getSpectrum() {
          return mSpectrum;
      }
  
      public void setMinContourArea(double area) {
          mMinContourArea = area;
      }
  
      public void process(Mat rgbaImage) {
          Imgproc.pyrDown(rgbaImage, mPyrDownMat);
          Imgproc.pyrDown(mPyrDownMat, mPyrDownMat);
  
          Imgproc.cvtColor(mPyrDownMat, mHsvMat, Imgproc.COLOR_RGB2HSV_FULL);
  
          Core.inRange(mHsvMat, mLowerBound, mUpperBound, mMask);
          Imgproc.dilate(mMask, mDilatedMask, new Mat());
  
          List<MatOfPoint> contours = new ArrayList<MatOfPoint>();
  
          Imgproc.findContours(mDilatedMask, contours, mHierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE);
  
          // Find max contour area
          double maxArea = 0;
          Iterator<MatOfPoint> each = contours.iterator();
          while (each.hasNext()) {
              MatOfPoint wrapper = each.next();
              double area = Imgproc.contourArea(wrapper);
              if (area > maxArea) {
                  maxArea = area;
              }
          }
  
          // Filter contours by area and resize to fit the original image size
          mContours.clear();
          each = contours.iterator();
          while (each.hasNext()) {
              MatOfPoint contour = each.next();
              if (Imgproc.contourArea(contour) > mMinContourArea * maxArea) {
                  Core.multiply(contour, new Scalar(4, 4), contour);
                  mContours.add(contour);
              }
          }
      }
  
      public List<MatOfPoint> getContours() {
          return mContours;
      }
  }
  ```

  


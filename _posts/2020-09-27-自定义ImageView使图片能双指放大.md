---
tags: Android
title: 自定义ImageView使图片能够双指放大

---



# 自定义ImageView使图片能够双指放大



```java
package com.lenovo.smarttraffic.ui.diyImageView;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Matrix;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.util.Log;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.ImageView;

public class ZoomImageView extends android.support.v7.widget.AppCompatImageView implements View.OnTouchListener, ScaleGestureDetector.OnScaleGestureListener, ViewTreeObserver.OnGlobalLayoutListener {

    //手势检测
    ScaleGestureDetector scaleGestureDetector = null;
    //矩阵对象
    Matrix scaleMatrix = new Matrix();


    //处理矩阵数值
    public ZoomImageView(Context context) {
        this(context, null);
    }

    public ZoomImageView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public ZoomImageView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        setScaleType(ScaleType.MATRIX);
        scaleGestureDetector = new ScaleGestureDetector(context, this);
        this.setOnTouchListener(this);
        //图片放在中间
    }

    @Override
    public boolean onTouch(View v, MotionEvent event) {
        return scaleGestureDetector.onTouchEvent(event);
    }

    @Override
    public boolean onScale(ScaleGestureDetector detector) {
        float scaleFactor = detector.getScaleFactor();
        if (getDrawable() == null) return true;
        scaleMatrix.postScale(scaleFactor, scaleFactor, getWidth() / 2, getHeight() / 2);
        setImageMatrix(scaleMatrix);
        return true;
    }

    @Override
    public boolean onScaleBegin(ScaleGestureDetector detector) {
        return true;
    }

    @Override
    public void onScaleEnd(ScaleGestureDetector detector) {

    }
//===================以下代码是保证imageview居中======================
    boolean once = true;

    @Override
    public void onGlobalLayout() {
        if (!once) {
            return;
        }
        Drawable drawable = getDrawable();
        if (drawable == null) {
            return;
        }
        //imagview宽高
        int width = getWidth();
        int height = getHeight();
        //图片宽高
        int imgWidth = drawable.getIntrinsicWidth();
        int imgHeight = drawable.getIntrinsicHeight();

        float scale = 1.0f;
        //将图片放到imagveiw中间

        //如果图片大于view
        if (imgWidth > width && imgHeight <= height)
            scale = (float) width / imgWidth;
        if (imgHeight > height && imgWidth <= width)
            scale = (float) height / imgHeight;
        //如果图片宽高都大于屏幕，按比例缩小
        if (imgWidth > width && imgHeight > height)
            scale = Math.min((float) imgWidth / width, (float) imgHeight / height);
        //移动图片
        scaleMatrix.postTranslate((width - imgWidth) / 2, (height - imgHeight) / 2);
        scaleMatrix.postScale(scale, scale, getWidth() / 2, getHeight() / 2);
        setImageMatrix(scaleMatrix);
        once = false;
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        getViewTreeObserver().addOnGlobalLayoutListener(this::onGlobalLayout);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        getViewTreeObserver().removeOnGlobalLayoutListener(this::onGlobalLayout);
    }
}
```
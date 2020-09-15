---

layout: article
title: MPAndroidChart的画图方式
tags: android
---

# MPAndroidChart的画图方式

study by https://www.cnblogs.com/r-decade/p/6241693.html	https://blog.csdn.net/u014136472/article/details/50298213

- LineChart
-  BarChart
-  ScatterChart
-  CandleStickChart
-  PieChart
- BubbleChart or RadarChart 

## 刷新api

- invalidate() : 在chart中调用会使其刷新重绘

- notifyDataSetChanged() : 让chart知道它依赖的基础数据已经改变，并执行所有必要的重新计算（比如偏移量，legend，最大值，最小值 …）。在动态添加数据时需要用到。

## 基本的chart风格

```xml
		<!--折线图,layout的背景色为 #bdbdbd 灰-->
        <com.github.mikephil.charting.charts.LineChart
            android:id="@+id/line_chart"
            android:layout_width="match_parent"
            android:layout_height="300dp"
            android:background="#ffffff"
            android:layout_margin="16dp"/>
```

## chart 也可以使用java代码改变风格

- setBackgroundColor(int color): 设置背景颜色，将覆盖整个图表视图。
- `setDescription(String desc)` : 设置图表的描述文字，会显示在图表的右下角。
- `setDescriptionColor(int color)` : 设置描述文字的颜色。
- `setDescriptionPosition(float x, float y)` : 自定义描述文字在屏幕上的位置（单位是像素）。
- `setDescriptionTypeface(Typeface t)` : 设置描述文字的 Typeface。
- `setDescriptionTextSize(float size)` : 设置以像素为单位的描述文字，最小6f，最大16f。
- `setNoDataTextDescription(String desc)` : 设置当 chart 为空时显示的描述文字。
- `setDrawGridBackground(boolean enabled)` : 如果启用，chart 绘图区后面的背景矩形将绘制。
- `setGridBackgroundColor(int color)` : 设置网格背景应与绘制的颜色。
- `setDrawBorders(boolean enabled)` : 启用/禁用绘制图表边框（chart周围的线）。
- `setBorderColor(int color)` : 设置 chart 边框线的颜色。
- `setBorderWidth(float width)` : 设置 chart 边界线的宽度，单位 dp。
- `setMaxVisibleValueCount(int count)` : 设置最大可见绘制的 chart count 的数量。 只在 `setDrawValues()` 设置为 `true` 时有效。

## 手势交互

- `setTouchEnabled(boolean enabled)` : 启用/禁用与图表的所有可能的触摸交互。

- `setDragEnabled(boolean enabled)` : 启用/禁用拖动（平移）图表。

- `setScaleEnabled(boolean enabled)` : 启用/禁用缩放图表上的两个轴。

- `setScaleXEnabled(boolean enabled)` : 启用/禁用缩放在x轴上。

- `setScaleYEnabled(boolean enabled)` : 启用/禁用缩放在y轴。

- `setPinchZoom(boolean enabled)` : 如果设置为true，捏缩放功能。 如果false，x轴和y轴可分别放大。

- `setDoubleTapToZoomEnabled(boolean enabled)` : 设置为false以禁止通过在其上双击缩放图表。

- `setHighlightPerDragEnabled(boolean enabled)` : 设置为true，允许每个图表表面拖过，当它完全缩小突出。 默认值：true

- `setHighlightPerTapEnabled(boolean enabled)` : 设置为false，以防止值由敲击姿态被突出显示。 值仍然可以通过拖动或编程方式突出显示。 默认值：true

  ### 图表的 抛掷/减速

  - `setDragDecelerationEnabled(boolean enabled)` : 如果设置为true，手指滑动抛掷图表后继续减速滚动。 默认值：true。
  - `setDragDecelerationFrictionCoef(float coef)` : 减速的摩擦系数在[0; 1]区间，数值越高表示速度会缓慢下降，例如，如果将其设置为0，将立即停止。 1是一个无效的值，会自动转换至0.9999。

  ## 高亮

  - `highlightValues(Highlight[] highs)` : 高亮显示值，高亮显示的点击的位置在数据集中的值。 设置null或空数组则撤消所有高亮。
  - `highlightValue(int xIndex, int dataSetIndex)` : 高亮给定xIndex在数据集的值。 设置xIndex或dataSetIndex为-1撤消所有高亮。
  - `getHighlighted()` : 返回一个 `Highlight[]` 其中包含所有高亮对象的信息，xIndex和dataSetIndex。

## 坐标轴

**在文档中，AxisBase是XAxis和YAxis的父类**

- XAxis是x轴的标签设置，只使用setter方法修改，不要直接访问公共变量
- YAxis是y轴的标签设置，只使用setter方法修改，不要直接访问公共变量

**控制轴的哪个部分会被绘制**

- setEnabled(boolean enabled)` : 设置轴启用或禁用。如果false，该轴的任何部分都不会被绘制（不绘制坐标轴/便签等）
- `setDrawGridLines(boolean enabled)` : 设置为true，则绘制网格线。
- `setDrawAxisLine(boolean enabled)` : 设置为true，则绘制该行旁边的轴线（axis-line）。
- `setDrawLabels(boolean enabled)` : 设置为true，则绘制轴的标签。

---

## 设置数据

**ChartData类**

`ChartData` 类是所有数据类的基类，比如 `LineData`，`BarData` 等，它是用来为 `Chart` 提供数据的，通过 `setData(ChartData data){...}` 方法。 

**Styling data**

- `setDrawValues(boolean enabled)` : 启用/禁用 绘制所有 `DataSets` 数据对象包含的数据的值文本。
- `setValueTextColor(int color)` : 设置 `DataSets` 数据对象包含的数据的值文本的颜色。
- `setValueTextSize(float size)` : 设置 `DataSets` 数据对象包含的数据的值文本的大小（单位是dp）。



# 详细使用的过程

## 线性图

1. 创建布局

   ```xml
   <com.github.mikephil.charting.charts.LineChart
               android:id="@+id/line_chart"
               android:layout_width="match_parent"
               android:layout_height="300dp"
               android:background="#ffffff"
               android:layout_margin="16dp"/>
   ```

2. 实例化然后得到对象

3. 准备线性图的点阵数据，可以存入显示多个折线图，只需要后面添加的时候加进去，**Entry**对象的变量第一个是轴坐标，第二个是y轴坐标

   ```java
   //这个是点的数据
           ArrayList<Entry> values1 = new ArrayList<>();
           //这个是点，将点的数据存入
           values1.add(new Entry(4, 10));
           values1.add(new Entry(6, 15));		
           values1.add(new Entry(9, 20));
   ```

4. 折线对象

   ```java
           LineDataSet set1;
   ```

5. 判断表中是否有数据，有就不改变**对象地址**的情况下追加

   ```java
   if (mLineCTable.getData() != null && mLineCTable.getData().getDataSetCount() > 0) {
               set1 = (LineDataSet) mLineCTable.getData().getDataSetByIndex(0);//0是指代第一条线
               set1.setValues(values1);
               //刷新数据
               mLineCTable.getData().notifyDataChanged();
               mLineCTable.notifyDataSetChanged();
           }
   ```

6. 没有数据就向折线对象中添加参数，并且实例化折线

   ```java
   set1 = new LineDataSet(values1,"测试使用");
   ```

7. 给折线对象设置一些杂七杂八的

   ```java
               //实例化折线对象，第一个参数是线的数据，第二个参数是线的标签
               set1 = new LineDataSet(values1,"温度");
               set1.setColor(Color.BLACK);
               set1.setCircleColor(Color.BLACK);//设置圆圈颜色
               set1.setLineWidth(1f);//设置线宽
               set1.setCircleRadius(3f);//设置焦点圆心的大小
   //            set1.enableDashedHighlightLine(10f, 5f, 0f);//点击后的高亮线的显示样式
   //            set1.setHighlightLineWidth(2f);//设置点击交点后显示高亮线宽
   //            set1.setHighlightEnabled(true);//是否禁用点击高亮线
   //            set1.setHighLightColor(Color.RED);//设置点击交点后显示交高亮线的颜色
               set1.setValueTextSize(20f);//设置显示值的文字大小
               set1.setDrawFilled(false);//设置禁用范围背景填充
   ```

8. 设置x轴和y轴的显示

   ```java
   /**
    * 进行x轴和y轴的修改
    */
   XAxis xAxis = mLineCTable.getXAxis();
   YAxis axisRight = mLineCTable.getAxisRight();
   //x轴的显示位置
   xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
   axisRight.setEnabled(false);
   // x轴辅助线设置不显示
   xAxis.setDrawGridLines(false);
   ```

9. 格式化数据显示

   ```java
   //格式化显示数据
               final DecimalFormat mFormat = new DecimalFormat("###,###,##0");
               //设置数据格式器
               set1.setValueFormatter(new IValueFormatter() {
                   @Override
                   public String getFormattedValue(float value, Entry entry, int dataSetIndex, ViewPortHandler viewPortHandler) {
                       //将参数转换为10进制
                       return mFormat.format(value);
                   }
               });
               //设置填充颜色
               if (Utils.getSDKInt() >= 18) {
                   // fill drawable only supported on api level 18 and above
                   Drawable drawable = ContextCompat.getDrawable(this.getContext(), R.drawable.bg_splash);
                   set1.setFillDrawable(drawable);//设置范围背景填充
               } else {
                   set1.setFillColor(Color.BLACK);
               }
   ```

10. 将线对象存入表中

   ```java
   //保存LineDataSet集合
   ArrayList<ILineDataSet> dataSets = new ArrayList<>();
   dataSets.add(set1); // add the datasets
   ```

11. ```java
    //创建LineData对象 属于LineChart折线图的数据集合
    LineData data = new LineData(dataSets);
    // 添加到图表中
    mLineCTable.setData(data);
    //绘制图表
    mLineCTable.invalidate();
    ```

## 有关布局刷新的一些注意点

```java
  private ArrayList<Entry> values1 = new ArrayList<>();
 //获取到这线的个对象
```

向线的对象中进行操作，追加点或者是删除点

```java
							values1.clear();
                            for (int i1 = 0; i1 < allData.size(); i1++) {
                                SensorDataBean sensorDataBean = allData.get(i1);
                                Log.i("123456", "run: " + sensorDataBean.getDate());
                                Float yfloat = Float.valueOf(sensorDataBean.getCo2());
                                Float xflot = (float) i1;
//                                需要去除x轴时间的精度
                                values1.add(new Entry(xflot, yfloat));
                            }
```

更新视图

```java
//需要更新视图
                            set1.notifyDataSetChanged();
                            mLineCTable.getLineData().notifyDataChanged();
  	                        mLineCTable.getData().notifyDataChanged();
                            mLineCTable.notifyDataSetChanged();
                            //注意！！！！！！！！！！！千万不能从子线程中更新视图，会报错
//                            android.view.ViewRootImpl$CalledFromWrongThreadException: Only the original thread that created a view hierarchy can touch its views.
                            Message message = new Message();
                            message.what =813;
                            handler.sendMessage(message);
						//handle中执行了	mLineCTable.invalidate();

```

**一定要注意刷新不能放在子线程中，我简直是脑淤血了写在线程中**

## 关于X轴的格式化

其实很容易，只需要

```java
//x轴格式转换
xAxis.setValueFormatter(new IAxisValueFormatter() {
    @Override
    public String getFormattedValue(float value, AxisBase axis) {
        //这里绘制输入线的对应x轴的参数，需要返回x的显示参数
        if (xTime.size()== 21){
            return xTime.get((int) value);
        }else {
            return "刻度失效";
        }
    }
});
```

这里我把数据库的时间数据给提取出来了，并且给一起循环添加进了集合中

```java
for (int i1 = 0; i1 < allData.size(); i1++) {
                                SensorDataBean sensorDataBean = allData.get(i1);
                                Float yfloat = Float.valueOf(sensorDataBean.getCo2());
                                Float xflot = (float) i1;
                                String dateFormat = new SimpleDateFormat("HH:mm:ss").format(sensorDataBean.getDate());
                                //将时间数据存入数组中
                                xTime.add(dateFormat);
//                                需要去除x轴时间的精度
                                values1.add(new Entry(xflot, yfloat));
                            }
```

绘制的时候会回调getFormattedValue拿到对应刻度

---

# 全部的代码

```java
package com.lenovo.smarttraffic.ui.fragment;

import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.Fragment;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.AxisBase;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.IAxisValueFormatter;
import com.github.mikephil.charting.formatter.IValueFormatter;
import com.github.mikephil.charting.interfaces.datasets.ILineDataSet;
import com.github.mikephil.charting.utils.Utils;
import com.github.mikephil.charting.utils.ViewPortHandler;
import com.lenovo.smarttraffic.R;
import com.lenovo.smarttraffic.mapping.SensorDataBean;
import com.lenovo.smarttraffic.ui.activity.ActivityWork1Activity;

import org.litepal.LitePal;

import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import lecho.lib.hellocharts.model.Axis;

public class FragmentWork2VP extends Fragment {
    private static final String TAG = "FragmentWork2VP";
    private LineChart mLineCTable;
    private boolean flag = true;
    private ArrayList<Entry> values1 = new ArrayList<>();
    private LineDataSet set1;
    private ArrayList<ILineDataSet> dataSets;
    private Handler handler;
    private ArrayList<String> xTime = new ArrayList<>();
    private String tableName = "光照度";


    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, Bundle savedInstanceState) {
        View inflate = inflater.inflate(R.layout.adapter_work2_vp, container, false);
        initView(inflate);
        initData();
        return inflate;
    }

    private void initData() {
        getLineData();
        GetDataByDb();
        handler = new Handler(new Handler.Callback() {
            @Override
            public boolean handleMessage(Message msg) {
                //ou pause Here
                if (msg.what == 813) {
                    mLineCTable.invalidate();
                }
                return false;
            }
        });


    }

    private void GetDataByDb() {
        //数据库读取出来
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                for (int i = 0; i < Integer.MAX_VALUE; i++) {
                    if (flag) {
                        List<SensorDataBean> allData = LitePal.findAll(SensorDataBean.class);
                        if (allData != null && allData.size() != 0) {
//                            Log.i("123456", "run: " + allData.toString());
                            values1.clear();
                            xTime.clear();
                            for (int i1 = 0; i1 < allData.size(); i1++) {
                                SensorDataBean sensorDataBean = allData.get(i1);
                                Float yfloat = Float.valueOf(sensorDataBean.getCo2());
                                Float xflot = (float) i1;
                                String dateFormat = new SimpleDateFormat("HH:mm:ss").format(sensorDataBean.getDate());
                                //将时间数据存入数组中
                                xTime.add(dateFormat);
//                                需要去除x轴时间的精度
                                values1.add(new Entry(xflot, yfloat));
                            }
                            //需要更新视图
                            Log.i(TAG, "runq3123: " + values1.size());
                            if (values1.size() == allData.size()) {
                                set1.notifyDataSetChanged();
                                mLineCTable.getLineData().notifyDataChanged();
                                mLineCTable.notifyDataSetChanged();
                                //注意！！！！！！！！！！！千万不能从子线程中更新视图，会报错
//                            android.view.ViewRootImpl$CalledFromWrongThreadException: Only the original thread that created a view hierarchy can touch its views.
                                Message message = new Message();
                                message.what = 813;
                                handler.sendMessage(message);
                            }

                        }
                    }
                    try {
                        Thread.sleep(3000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });
        thread.start();
    }


    /**
     */
    private void getLineData() {
        //可以多点，但是我只需要一个点的数据
        //这个是点的数据
        values1.add(new Entry(0, 0));
        //这个是一条连接线
        //判断图标中是否有数据
        if (mLineCTable.getData() != null && mLineCTable.getData().getDataSetCount() > 0) {
            set1 = (LineDataSet) mLineCTable.getData().getDataSetByIndex(0);//0是指代第一条线
            set1.setValues(values1);
            //刷新数据
            mLineCTable.getData().notifyDataChanged();
            mLineCTable.notifyDataSetChanged();
        } else {
            //实例化折线对象，第一个参数是线的数据，第二个参数是线的标签
            set1 = new LineDataSet(values1, tableName);
            set1.setColor(Color.GRAY);
            set1.setValueTextColor(Color.BLACK);
            set1.setCircleColor(Color.GRAY);//设置圆圈颜色
            set1.setLineWidth(3f);//设置线宽
            set1.setCircleRadius(5f);//设置焦点圆心的大小
//            set1.enableDashedHighlightLine(10f, 5f, 0f);//点击后的高亮线的显示样式
//            set1.setHighlightLineWidth(2f);//设置点击交点后显示高亮线宽
//            set1.setHighlightEnabled(true);//是否禁用点击高亮线
//            set1.setHighLightColor(Color.RED);//设置点击交点后显示交高亮线的颜色
            set1.setValueTextSize(15f);//设置显示值的文字大小
            set1.setDrawFilled(false);//设置禁用范围背景填充
            /**
             * 进行x轴和y轴的修改
             */
            XAxis xAxis = mLineCTable.getXAxis();
            xAxis.setTextSize(15);
            xAxis.setTextColor(Color.GRAY);
//            xAxis.setAvoidFirstLastClipping(true);//让刻度显示全
            xAxis.setLabelRotationAngle(+45);//反转刻度90度
            xAxis.setLabelCount(21);//设置显示的标签数量
            //x轴的显示位置
            xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
            // x轴辅助线设置不显示
            xAxis.setDrawGridLines(false);

            YAxis yAxis = mLineCTable.getAxisLeft();
            yAxis.setTextSize(15);
            yAxis.setTextColor(Color.GRAY);
            //y右轴的设置
            mLineCTable.getAxisRight().setEnabled(false);

            // TODO: 2020/9/15 这里需要进行数据格式转换 https://weeklycoding.com/mpandroidchart-documentation/formatting-data-values/

            /**
             * 格式化数据显示
             */
            //设置线上的数据显示格式
            final DecimalFormat mFormat = new DecimalFormat("###,###,##0");
            //设置数据格式器
            set1.setValueFormatter(new IValueFormatter() {
                @Override
                public String getFormattedValue(float value, Entry entry, int dataSetIndex, ViewPortHandler viewPortHandler) {
                    //将参数转换为10进制
                    return mFormat.format(value);
                }
            });


//
//            final DecimalFormat mxFormat = new DecimalFormat("###,###,##0");
            //x轴格式转换
            xAxis.setValueFormatter(new IAxisValueFormatter() {
                @Override
                public String getFormattedValue(float value, AxisBase axis) {
                    //这里绘制输入线的对应x轴的参数，需要返回x的显示参数
                    if (xTime.size()== 21){
                        return xTime.get((int) value);
                    }else {
                        return "刻度失效";
                    }
                }
            });


            //设置填充颜色
            if (Utils.getSDKInt() >= 18) {
                // fill drawable only supported on api level 18 and above
                Drawable drawable = ContextCompat.getDrawable(this.getContext(), R.drawable.bg_splash);
                set1.setFillDrawable(drawable);//设置范围背景填充
            } else {
                set1.setFillColor(Color.BLACK);
            }

            //将线存入表中
            //保存LineDataSet集合
            dataSets = new ArrayList<>();
            dataSets.add(set1); // add the datasets

            //创建LineData对象 属于LineChart折线图的数据集合
            LineData data = new LineData(dataSets);
            // 添加到图表中
            mLineCTable.setData(data);
            //绘制图表
            mLineCTable.invalidate();
        }
    }

    private void initView(View inflate) {
        mLineCTable = (LineChart) inflate.findViewById(R.id.lineC_table);
    }
}
```
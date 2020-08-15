# android 补间动画

> study drom  https://www.jianshu.com/p/c0ad225a30c0?tdsourcetag=s_pctim_aiomsg
>
> view动画方是由一个参数到另一个参数，在一定时间内的转变，可以理解为pr中的两个关键帧

## 平移动画	 缩放动画 	选中动画	透明度动画

> 1. 通过xml设置属性，在主方法中引用
>    
> >  src下新增一个anim文件夹 ，在其中新建一个头文件是set的xml文件
> >
> >  在其中设置一系列参数 ，
> >
> >  ​	根据动画类型可以自己设置to from
> >  ​	android:duration="2000"   //持续时间
> >  ​    android:fillAfter="false"	 //动画播放完毕是否停止在播放状态
> >  ​    android:fillBefore="true"	//动画播放完毕是否恢复原始状态
> >  ​    android:fillEnabled="true"	//是否应用android:fillEnabled的值
> >  ​    android:fromXDelta="0"	//水平初始数值
> >  ​    android:fromYDelta="0"	//竖直初始竖直
> >  ​    android:repeatCount="0"	//重复次数，设置infinite为无限
> >  ​    android:repeatMode="restart"	//播放动画的顺序，正反和反放
> >  ​    android:startOffset="1000"	//动画延迟多久开始
> >  ​    android:toXDelta="520"	//水平反向结束值
> >  ​    android:toYDelta="520	//竖直反向结束值
> >
> >  ​	android:fromXScale="1" //x轴初始缩放倍数
> >  ​    android:fromYScale="1"	//y轴初始缩放倍数
> >  ​    android:pivotX="50%"	//缩放轴点x坐标
> >  ​    android:pivotY="50%"	//缩放轴点y坐标
> >  ​    android:toXScale="2.5"	//x轴结束缩放倍数
> >  ​    android:toYScale="2.5"	//y轴结束缩放倍数
> >
> >  ​	 android:fromDegrees="0"	//动画开始时候的旋转度数
> >  ​	android:pivotX="50%"	//旋转轴点x坐标
> >  ​	android:pivotY="50%"	//旋转轴点y坐标
> >  ​	android:toDegrees="360"	//旋转结束的度数
> >
> >  ​	android:startOffset="0"	//动画开始时的透明度
> >​	android:toAlpha="1.0"	//动画结束时的透明度
>
> 2. 直接创建一个动画方法



 
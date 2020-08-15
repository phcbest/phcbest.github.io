[TOC]

# Android 学习笔记

*day 3 month 3 year 2020*

------



1. 在线性布局中靠右靠右可以通过添加空白布局完成，权重高

2. 让textview文字长度可长于显示范围:*android:singleLine="true"*现在已经废弃，使用*android:lines="1"* lines设置字能显示几行

3. 控制文字过长时候如何显示*android:ellipsize="参数"*”start”—–省略号显示在开头；”end”——省略号显示在结尾；”middle”—-省略号显示在中间；”marquee” ——以跑马灯的方式显示(动画横向移动)

4. android:marqueeRepeatLimit="marquee_forever"设置跑马灯一直滚动 如果跑马灯还需要在java文件中调用该组件后setSelected

5. 让组件可以获得点水波纹效果android:background="?android:attr/selectableItemBackground"（有边界效果）或者android:backgroundTint="?android:attr/selectableItemBackgroundBorderless”(无边界效果)

6. button的背景设置水波纹特效可以设置为android:background="?android:attr/selectableItemBackground"这是有界的，android:background="?android:attr/selectableItemBackgroundBorderless"这是无界的

7. 强制activity横屏或者竖屏运行 android:screenOrientation="portrait" 

8. 关闭状态栏getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,WindowManager.LayoutParams.FLAG_FULLSCREEN);

9. 如果获取的到的屏幕状态不是横屏，就强制横屏：LANDSCAPE  竖屏：PORTRAIT
   if (getRequestedOrientation()!= ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE){
       setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
   } 
   
10. 关闭顶栏
       if (getSupportActionBar() != null){
       getSupportActionBar().hide();
       }
    
11. 圆角属性corners android:radius=``"105dip"

12. 返回键重写  写在主方法外
     @Override  public void onBackPressed() {}
    
13. 详细的有关Dialog的使用方法https://www.jianshu.com/p/4712652fb313

14. 解决ListView与button的共存问题，我们需要给填充布局中的按钮添加`android:focusable="false"`让他丧失焦点，然后在填充布局的最外层添加`android:descendantFocusability="blocksDescendants"`

15. listview的点击事件通过`setOnItemClickListener`实现

16. `listView.setOnCreateContextMenuListener(new View.OnCreateContextMenuListener() ` 可以直接实现长按上下文菜单

17. 上下文菜单点击事件要重写`onContextItemSelected`方法

18. 获取listview中的item中的参数，可以在点击事件`setOnItemClickListener`中用view给全局view参数赋值实现

19. sqlite存储图片路径可以直接存入int类型的R.drawable.image ，使用的时候直接set就可以了

20. 设置listview的item的背景可以通过setBackgroundColor的方法，颜色方法为`Color.parseColor("#00000000")` 

21. `checkBox.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener()`可以设置checkbox的选中状态

22. `editText.setFilters(new InputFilter[]{new InputFilter.LengthFilter(3)});`限制输入的最大位数为3位

23. 在单独的java方法中做跳转或者关闭activity，context是从activity中传递进来的

    ```java
    Intent intent = new Intent(context,recharge.class);
    context.startActivity(intent);
    ((Activity)context).finish();
    ```

24. 设置菜单可以重写`onCreateOptionsMenu` ，然后重写`onOptionsItemSelected`方法写点击事件

25. 通常修改数据库后会进行更新listview的操作，详细操作应该先`clear`数据集合，然后`.addAll`导入新的数据，之后调用`notifyDataSetChanged();`即可更新，如果直接将集合赋值，listview不会认为有了数据变化

26. activity动画 `startActivity(new Intent(this, Main2Activity.class), ActivityOptions.makeSceneTransitionAnimation(this).toBundle());` 
    第二个avtivity中设置

    ```java
        getWindow().setEnterTransition(new Explode().setDuration(2000));
        getWindow().setExitTransition(new Explode().setDuration(2000));
    ```
    激活切换动画``
    `<item name="android:windowContentTransitions">true</item> `
    
27. RecyclerView的点击事件似乎只能在适配器中写

28. list.get(ViewHolder.getAdapterPosition());可以在recyclerView适配器中获得点击位置

29. RecyclerView的startActivity事件因为适配器不是上下文环境，所以需要v.getcontext.startActivity

30. 使用getIntent().getStringExtra("key")来得到传递intent传递过来的参数

31. 在应用中的分享可以使用意图实现，设置setType("text/plain"); ，setAction(Intent.ACTION_SEND);用putExter(Intent.EXTRA_TEXT,"text")传递参数就行了

32. view的适配器PagerAdapter需要重写4个方法，分别是 得到item数量的getCount()，判断对象和视图是否匹配的isViewFromObject，添加视图的instantiateItem，删除视图的destroyItem

33. ViewPager的页面更改监听器使用addOnPageChangeListener

34. LayoutParams可以在java中设置组件的布局

35. ViewPager的自动切换

    ```java
     indexPoint=viewpage.getCurrentItem() + 1;
     viewpage.setCurrentItem(indexPoint);
    ```

36. ViewPager需要无限滚动时候，需要在适配器中给一个最大整数Integer.MAX_VALUE，然后参数适配的时候将当前的position除以数据源的大小，取余为当前页面的详细位置list.get(position%list.size());

37. fragmentViewPager的适配器有两种，FragmentPagerAdapter//在碎片不多的情况下使用，页面不可见时，view可能会被销毁，FragmentStatePagerAdapter//在碎片多的情况下使用，view不可见时，fragment的实例可能会被销毁，但是状态会被保存

38. 倒计时类**CountDownTimer**、

39.   在本地数据的读取，
       在main目录下创建一个assets文件夹，可以在该文件夹下存储一些项目中需要用到的但是没必要放在资源目录下的文件。
       使用`文件夹管理器AssetManager am = context.getResources().getAssets();`
       来得到对应的文件夹，然后使用`  文件夹管理器.open方法来得到对应的文件输入流InputStream is = am.open(fileName);`
       之后循环读取文件输入流，读入缓冲区，并且返回缓冲区的字节数` hasRead = is.read(buf);`
       循环判断返回的字节数是否为-1，如果为-1，就已经读取完成，退出无限循环；
       将读取的参数写入内存流中
       ` ByteArrayOutputStream baos = new ByteArrayOutputStream(); baos.write(buf,0,hasRead);`
       其中buf为数据，0为关闭数据中的起始偏移量hasRead为要写入的字节数，
       最后用toString将baos转换为string。
       位图的读取获得输入流后直接用位图工厂的decodeStream方法将输入流转换为位图,就可以了
      
40.  使用gson解析json ，
       使用gson 的 fromJson方法来解析json` jsonbean jsonBeanInfo = gson.fromJson(json, jsonbean.class);`
     参数中 json为接受到的json文本，jsonbean.class为json转化为的实体类；
       之后调用实体类中的得到集合的方法，就获得了数据集，图片在这里是String的格式存储了当前位图的路径，需要传给适配器后适配器解析文件夹和位图后使用
     
41. 沉浸状态栏的介绍https://blog.csdn.net/qq_34882418/article/details/80989232

42. 绘制view，新建一个类继承于View，重写两个构造方法，一个是带context参数的构造，一个是带context和AttributeSet参数的构造，主要是在布局中可以更好的引入，然后使用Paint制作画笔，onMeasure中写显示宽高，onDraw绘制  参考链接https://www.jianshu.com/p/b183e69b98f6?tdsourcetag=s_pctim_aiomsg|||||https://www.jianshu.com/p/afa06f716ca6?tdsourcetag=s_pctim_aiomsg

43. 自定义view 设置画笔颜色，和样式` paint.setColor(Color.parseColor("#000000"));` 设置画笔抗锯齿` paint.setAntiAlias(true);` 设置样式 ` paint.setStyle(Paint.Style.STROKE);` 设置view的尺寸 ---重写onMeasure方法 

44. spinner的设置https://www.jianshu.com/p/ad0e97042045

45. android:usesCleartextTraffic="true" 允许明文流量

46.  去除动画
      getActivity().overridePendingTransition(0,0);
     
47. android清单文件对照表http://tools.jb51.net/table/AndroidManifest

48. > 使用明文流量android:usesCleartextTraffic=""






















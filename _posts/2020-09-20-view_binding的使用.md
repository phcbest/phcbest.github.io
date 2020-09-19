---
layout: article
title: View_binding----简单实现组件的依赖注入
tags: Android

---

**以前一直都是在用黄油刀，最近发现黄油刀的作者说不维护了，转战View_Binding**

## Activity使用方法

`setContentView` 本质是将根视图绑定在上下文中，无需提供view就可以进行 FindViewById

使用黄油刀也是根据传入的上下文来代理增强 实例化对象

使用View_Binding 的步骤十分简单

1. 将Android studio 升级到3.6以上

2. 在gradel文件的android标签中开启视图绑定

   ```
   //构建功能
   buildFeatures {
       //设置开启view-binding
       viewBinding true
   }
   ```

3. 忽略布局请给布局添加标签

   ```xml
   <LinearLayout
               ...
               tools:viewBindingIgnore="true" >
           ...
   </LinearLayout>
   ```

4. 使用过程

   1. 框架自动将xml文件转换为一个**驼峰命名法的布局名+Binding**的对象

      ```java
      ActivityMainBinding  mBind = ActivityMainBinding.inflate(getLayoutInflater());
      ```

   2. 拿到view对象并设置进上下文

      ```java
      View view = mBind.getRoot();
      setContentView(view);
      ```

   3. 可以直接使用bind对象来进行操作

      ```java
      //我在布局文件中创建了一个id为text的TextView,这里是通过id的驼峰命名法找到控件的
      mBind.text.setText("ababab");
      ```



## Fragment的使用方法

 `onCreateView()` 方法中执行以下步骤

1. ```java
       private ResultProfileBinding binding;
   
       @Override
       public View onCreateView (LayoutInflater inflater,
                                 ViewGroup container,
                                 Bundle savedInstanceState) {
           binding = ResultProfileBinding.inflate(inflater, container, false);
           View view = binding.getRoot();
           return view;
       }
   
       @Override
       public void onDestroyView() {
           super.onDestroyView();
           binding = null;
       }
   ```

2. 使用方法也非常简单

   ```java
   binding.button.setOnClickListener(new View.OnClickListener() {
           viewModel.userClicked()
       });
   ```

   
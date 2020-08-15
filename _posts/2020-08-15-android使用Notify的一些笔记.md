---
title: android使用Notify的一些笔记
tags: Android
---



首先一个很重要的一点，google在Android8以后加入了通知渠道功能，可以方便用户更好的管控通知类型。

# **带NotificationChannel的使用方法如下**

```java
//拿到NotificationManager对象，因为是在fragment中写的需要getContext，
//拿到的对象需要强转成NotificationManager
mNotificationManager = (NotificationManager)
                        getContext().getSystemService(Context.NOTIFICATION_SERVICE);
                       
```

```java
//创建通知渠道对象 1：通知id 	2：通知渠道名	 3：通知渠道重要程度
NotificationChannel mNotificationChannel = new NotificationChannel
                        ("1", "普通通知", NotificationManager.IMPORTANCE_HIGH);
```

```java
//通知管理 创建 通知渠道
mNotificationManager.createNotificationChannel(mNotificationChannel);
```
```java
//实例化通知兼容对象，
Notification mBuilder = new NotificationCompat.Builder(getContext(), "1")
                        .setContentTitle("快回去，不用上班啦！！！！")
                        .setContentText("骗你的")
                        .setSmallIcon(R.drawable.ic_github)
                        //这个使用了位图工程将图片资源转换为位图
                        .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_notify))
                        .build();
```
```java
//使用通知管理者发送通知 1：通知的唯一标识符   2：实例化的通知兼容对象
mNotificationManager.notify(1, mBuilder);
```
```java
//取消|清空 通知
mNotificationManager.cancel(1);
```

# 通知的高级使用方法
**使用大视图的通知和带加载的通知**
```java
//首先要将new NotificationCompat.Builder给单独抽出来
NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), "1");
//将builder抽出来
builder.setContentTitle("快回去，不用上班啦！！！！");
builder.setContentText("骗你的");
builder.setProgress(100,1,true);
builder.setSmallIcon(R.drawable.ic_github);
builder.setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_notify));                
//创建一个样式对象
NotificationCompat.InboxStyle inboxStyle = new NotificationCompat.InboxStyle();
//给这个信箱样式对象进行参数填充
inboxStyle.addLine("江西");
                inboxStyle.addLine("北京");
                inboxStyle.addLine("上海");
                inboxStyle.addLine("广州");        
//应用样式    
builder.setStyle(inboxStyle);       
//build通知兼容
Notification mBuilder = builder.build();
     
```
# 使用自定义的notify

使用自定义的notify比较容易，只需要对一个对象有所了解，`RemoteViews()翻译为远程视图`
**RemoteViews 这个对象与其他的view不同没有继承view而是继承于parcelable，这是一个可以跨进程显示view的类，一般用于自定义离开app页面的相关视图，如桌面小部件，通知**

```java
//实例化RemoteViews对象，第一个参数是当前活动的包名，第二个参数是自定义的layout
RemoteViews remoteViews = new RemoteViews(getActivity().getPackageName(), R.layout.notify);
//使用该布局（已过时）
mBuilder.bigContentView = remoteViews;
//使用该布局（推荐）
builder.setCustomBigContentView(remoteViews);
```

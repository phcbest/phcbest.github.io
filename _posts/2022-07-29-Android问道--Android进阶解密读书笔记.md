---
layout: article
title: Android问道--Android进阶解密读书笔记
tags: Android
---

## Android系统启动流程

Android启动和Android的很多系统组件相关联,如应用启动流程,四大组件的原理,AMS,ClassLoager

**Android系统中用户空间启动的第一个进程是init,进程号为1**

init进程是Android系统启动的一个关键步骤,有很多重大职责,init是多个源文件共同组成的,文件位于源码`system/core/init`

### Android启动流程前几步

1. 启动电源和系统启动

   当电源按下后引导芯片代码从ROM开始执行,加载BootLoader到RAM中

2. 引导程序BootLoader

   作用为拉起系统OS并运行

3. Linux内核启动

   完成内核系设置(设置缓存,被保护存储器,计划列表,加载驱动)后,寻找init.rc文件,启动init进程

4. init进程启动

   初始化和启动属性服务

### init的main函数

位于`system/core/init/init.cpp`

**作用:** 

- 在开始的时候创建和挂载启动所需的文件目录
- `property_init`属性初始化
- `start_property_servic`启动属性服务
- `signal_handler_init`设置子信号处理函数,用来防止init进程的子进程变成僵尸进程,系统在子进程暂停和终止的时候发出**SIGCHLD**信号,*signal_handler_init*函数就是接收该信号的.如果init的子进程停止了,该函数还可以通过调用`handle_signal`函数来移除僵尸进程和保活

### 什么是init.rc


---
layout: article
title: Android问道--Android进阶解密读书笔记
tags: Android
---

# Android系统启动流程

Android启动和Android的很多系统组件相关联,如应用启动流程,四大组件的原理,AMS,ClassLoager

**Android系统中用户空间启动的第一个进程是init,进程号为1**

init进程是Android系统启动的一个关键步骤,有很多重大职责,init是多个源文件共同组成的,文件位于源码`system/core/init`

## Android启动流程前几步

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

#### 什么是init.rc

是一个配置文件,由Android Init Language编写的脚本,路径位于`system/core/rootdir`

该脚本由5种类型的语句组成

- **action行动**
- **command命令**
- **service服务**
- **option操作**
- **import导入**

**举例**

*init.rc*中

```
on init
    sysclktz 0

    # Mix device-specific information into the entropy pool
    copy /proc/cmdline /dev/urandom
    copy /system/etc/prop.default /dev/urandom

    symlink /proc/self/fd/0 /dev/stdin
    symlink /proc/self/fd/1 /dev/stdout
    symlink /proc/self/fd/2 /dev/stderr

    # Create energy-aware scheduler tuning nodes
    mkdir /dev/stune/foreground
    mkdir /dev/stune/background
    mkdir /dev/stune/top-app
    mkdir /dev/stune/rt
```

其中on init 是action类型的语句

>  on		<触发器>
>
> > <触发以后执行的命令>



*init.zygote64.rc*中

```
service zygote /system/bin/app_process64 -Xzygote /system/bin --zygote --start-system-server
    class main
    priority -20
    user root
    group root readproc reserved_disk
    socket zygote stream 660 root system
    socket usap_pool_primary stream 660 root system
    onrestart exec_background - system system -- /system/bin/vdc volume abort_fuse
    onrestart write /sys/power/state on
    onrestart restart audioserver
    onrestart restart cameraserver
    onrestart restart media
    onrestart restart netd
    onrestart restart wificond
    writepid /dev/cpuset/foreground/tasks
```

这一段是service类型的语句

> service	<service的名字>	<执行程序路径>	<执行参数>
>
> > <对于service的修饰,影响什么时候,如何启动service>

这一段service的含义为通知init创建名为zygote的进程



### 属性服务

类似Windows平台上的注册表管理器,注册表的内容**使用键值对记录使用信息**,这样的话电脑重启后还能根据注册表记录进行**初始化工作**

init进程启动时会启动属性服务,并且给属性服务分配内存,用来存储属性

在`system/core/init/property_service.cpp`的`property_init`方法中使用`__system_property_area_init()`方法来初始化属性内存区域

在`start_property_service`方法中创建了一个非阻塞的socket

```c++
  property_set_fd = create_socket(PROP_SERVICE_NAME, SOCK_STREAM | SOCK_CLOEXEC | SOCK_NONBLOCK,
                                    0666, 0, 0, NULL);
```

同时也使用`listen(property_set_fd, 8);`对创建出来是socket进行监听

这样创建的Socket就成为了server,也就是属性服务`listen`函数的第二个参数为8.意味着可以同时为8个想要设置属性的用户提供服务

使用`register_epoll_handler(property_set_fd, handle_property_set_fd);`将该server放入了epoll中,使用epoll来监听socket,当数据到来的时候,init进程会调用`handle_property_set_fd`来进行处理

> tips:新的linux内核中,epoll是用来替换select的,是linux内核为了处理大批量的文件描述符进行改进的poll,是一个多路复用的IO接口poll的增强版,epoll显著提高了程序在大量并发连接中只有少量活跃情况下的CPU使用率

**`handle_property_set_fd`函数的作用:**

- Android7中只是用来处理客户端请求
- Android8中的源码添加了`        handle_property_set(socket, prop_value, prop_value, true);`来做进一步封装处理

`handle_property_set`函数功能:

- 检查系统属性的种类*(`  if (android::base::StartsWith(name, "ctl.")) `如果以ctl.开头就是控制属性)*
- 检查客户端权限
- 设置控制属性

系统属性分为两种类型,一种是**普通属性**,一种是**控制属性**,控制属性用来执行一些命令,开机动画就是使用了控制属性

之后调用`property_set`函数,该函的作用为

- 判断属性是否合法` if (!is_legal_property_name(name))`
- 从属性存储空间查找该属性`prop_info* pi = (prop_info*) __system_property_find(name.c_str());`
- 如果属性存在并且不是以**ro.**开头(只读)`android::base::StartsWith(name, "ro.")`
- 属性存在就更新数值`__system_property_update(pi, value.c_str(), valuelen)`
- 属性如何不存在就添加属性`int rc = __system_property_add(name.c_str(), name.size(), value.c_str(), valuelen)`
- 如果属性是**persist.**开头,进行相应处理` write_persistent_property(name.c_str(), value.c_str());`

### init启动总结

- 创建和挂载启动所需的文件目录
- 初始化和启动属性服务
- 解析init.rc配置文件并启动Zygote进程

## Zygote进程启动过程

Zygote是init进程启动时创建的进程

### 什么是Zygote

DVM或ART,应用程序进程和系统关键服务的ServiceServer进程都是由Zogote来进行创建的,所以Zygote也叫孵化器,通过**fock**(复制)命令来创建应用程序进程和SystemServer进程

Zygote进程启动的时候会创建DVM或ART,所以fock创建出来的进程可以在内部获取一个DVM或ART的副本

### Zygote启动脚本

路径位于`system/core/rootdir`

在init.rc中使用Import来引入Zygote启动脚本`import /init.${ro.zygote}.rc`,这些脚本也同样是Android Init Languare编写的

init.rc并没有直接引用一个固定的文件,是根据**属性ro.zygote**的内容来引用不同的文件,这里使用ro.zygote属性是是用来控制使用不用的zygote脚本,多个脚本主要是分为32位环境和64位环境的区别,一共有4个**init.zygote.rc**文件

>  四个文件分别是`init.zygote32.rc仅支持32位模式` `init.zygote32_64.rc主模式为32位,辅模式为64位` `init.zygote64.rc仅支持64位` `init.zygote64_32.rc主模式为64位,辅模式为32位`

双模式下的脚本会启动两个Zygote进程,一个作为主模式,一个是辅模式

### Zygote启动过程

init启动Zygote主要是调用app_main.cpp的main函数中的AppRuntime的start方法来启动的

app_main.cpp位于`frameworks/base/cmds/app_process`

Zygote是通过fock自身来创建子进程的,所以Zygote和他的子线程都能执行**app_main.cpp**的main函数,所以在main函数中要区分当前运行在哪个进程,会执行以下判断

```c++
 		if (strcmp(arg, "--zygote") == 0) {
            zygote = true;
            niceName = ZYGOTE_NICE_NAME;
        } else if (strcmp(arg, "--start-system-server") == 0) {
            startSystemServer = true;
        } else if (strcmp(arg, "--application") == 0) {
            application = true;
        } else if (strncmp(arg, "--nice-name=", 12) == 0) {
            niceName.setTo(arg + 12);
        } else if (strncmp(arg, "--", 2) != 0) {
            className.setTo(arg);
            break;
        } else {
            --i;
            break;
        }	
```

后续会判断zygote变量的值,如果==true就会执行`runtime.start("com.android.internal.os.ZygoteInit", args, zygote);`进行AppRuntime的start

runtime.start会调用位于`frameworks/base/core/jni`的**AndroidRuntime.cpp**中的`void AndroidRuntime::start`方法,这个方法拉起了JVM,从C++层到了Java层,整体流程为

- `startVm(&mJavaVM, &env, zygote)`	启动JVM虚拟机
- `startReg(env)` 为虚拟机注册JNI方法
- `    classNameStr = env->NewStringUTF(className);` 得到className *也就是ZygoteInit对应的包名路径*
- `    char* slashClassName = toSlashClassName(className);` 将className路径的.替换为/
- `    jclass startClass = env->FindClass(slashClassName);`找到ZygoteInit 
- `jmethodID startMeth = env->GetStaticMethodID(startClass, "main",
              "([Ljava/lang/String;)V");` 找到ZygoteInit类的main方法
- ` env->CallStaticVoidMethod(startClass, startMeth, strArray);` 使用JNI调用ZygoteInit的main方法

这里调用到了ZygoteInit的main方法,ZygoteInit.java这个文件位于

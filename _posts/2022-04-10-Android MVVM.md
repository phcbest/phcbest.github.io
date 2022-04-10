---
layout: article
title: MVVM框架解读
tags: Android
---

## 历史渊源

### MVC架构

最开始Android开发的时候,流行的是MVC架构,这种架构是从后端演变过来的(Model-View-Controller)

- View : Activity,Fragment的XML视图
- Controller : 就是Activity/Fragment的实现,进行绑定UI和处理业务
- Model : 数据获取存储和更新 

Controller会持有对View的引用   View通过接口来调用Controller的实现

Controller会持有对Model的引用   Model通过接口来返回数据给Controller

#### 优点

View没有持有Model,二者进行了隔离,View更换以后,Model不受影响,一个View可以有多个Model,且Model可以复用

#### 缺点

并不适合在Android开发中使用,会造成Controller过于臃肿,View相关的内容和Controller都写在了一起



### MVP架构

将MVC中的V和C进行解耦,剥离出Activity和Fragment的一种架构,将大量的逻辑代码抽取到了Presenter层

- View : Activity,Fragment
- Presenter : 逻辑层
- Model : 数据处理层

主要的行为是调用Presenter的方法和更新UI

View层持有Presenter层的引用,从而调用Presenter中的方法

Presenter更新UI应该在View层获取或创建Presenter的时候,将实现好的接口传递给Presenter,Presenter通过调用接口来更新UI

#### 优点

解耦了View和Controller,解决了复杂业务下Activity过于庞大的问题

#### 缺点

更新UI需要注意是否在主线程,注意UI控件是否已经被销毁

如果多个View使用同一个Presenter,会有一个接口冗余



## MVVM架构

MVVM是一种关注点分离的架构方式,允许将用户界面逻辑和业务逻辑分离,目标是实现 *保持UI代码简单并且没有程序逻辑,以使其更容易管理*

### MVVM主要分层

1. Model 

   代表程序的数据和业务逻辑,推荐实现策略是**通过可观察对象公开数据**,可以和ViewModel完全解耦

2. ViewModel

   ViewModel和Model交互,准备好可以被View观察到的Observable,在其中可选择和View挂钩并将Event传递给Model,重要的实现策略是**将其和View解耦,也就是ViewModel不应该知道和那个View交互**

3. View

   视图的角色是一个**观察者**观测ViewModel对象来获取数据,从而更新UI

   

   ![img](E:\GitHub\phcbest.github.io\_posts\2022-04-10-Android MVVM.assets\1BpxMFh7DdX0_hqX6ABkDgw-16495849177752.png)

### LiveData

为了实现上述的架构,我们需要引入**LiveData**库,LiveData是一个可被观察到的数据持有者,允许应用程序中的的组件观察LiveData对象发生的变化,**从而无需让生产者和消费者耦合,可以让其完全分离**

LiveData尊重Android的生命周期,只有在处于活跃状态(onStart但没onStop)的Activity/Fragment才会调用观察者的回调

### ViewModel

是Android新引入的UI架构组件之一,提供了一个名为ViewModel的类,该类负责为UI/View**准备数据**

ViewModel类为MVVM中的ViewModel提供了一个很好的基类,**该类的拓展类在配置更改期间自动保留持有的数据**,在配置更改后,该类持有的数据立即可以用于下一个Activity/Fragment

**ViewModel类的生命周期**

![img](E:\GitHub\phcbest.github.io\_posts\2022-04-10-Android MVVM.assets\1uWXunt0A6fKUFU8PsTLkfA.png)

### MVVM实现的重要原则

- ViewModel不会也不能直接引用View,如果这样做,ViewModel的生命周期可能会操作View的生命周期,可能发生内存泄漏
- 建议Model和ViewModel使用LiveData公开数据
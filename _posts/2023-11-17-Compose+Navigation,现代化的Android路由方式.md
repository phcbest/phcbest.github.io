---
layout: article
title: Compose+Navigation,现代化的Android路由方式
tags: Android
---

## 闲话

说实话,我真的受够了Android传统开发中的页面跳转传参,Activity跳转Activity,Fragment跳转Fragment,各种不同层级的页面相互跳转,有的时候需要上一级页面的相关数据来上报埋点,有的时候需要上报的埋点数据甚至需要传递五层,加上代码中写死的String Key,我的天哪,看起来就像是地狱一样,最近我打算从0开始开发一个视频剪辑的APP,打算用Compose来进行简单的页面搭建,用原生方法进行复杂以及需要高性能的页面搭建

Navigation以前就知道了,是Google想要倡导单Activity,Navigation控制Fragment的一个库(虽然Google自己的官方Demo也没遵守这一点),这个东西在传统View时期还是挺有局限性的,但是当我将Navigation和Compose一起使用,我就感觉挺合适的,有一种写前端的爽感

## 接入

接入很简单,引入一个依赖

```groovy
implementation "androidx.navigation:navigation-compose:2.7.5"
```

## 使用

使用方面我暂时只用到了最简单的页面切换,先记录一下,后面有更深层次的使用还会更新文章

### 页面跳转

在setContent中引入路由

```kotlin
override fun initView() {
    setContent {
        HCVideoStudioTheme {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                RootPage()
            }
        }
    }
}
```

路由的Composable如下

```kotlin
@Composable
fun RootPage(
) {
    AppNavHost()
}
```

在路由里面我注册了两个界面

```kotlin
@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController()
) {
    NavHost(navController = navController, startDestination = RouteConfig.MainPage) {

        composable(RouteConfig.MainPage) {
            HomePage(navController)
        }

        composable(RouteConfig.MediaSelectPage) {
            MediaPickerPage(navController)
        }
    }
}
```

按照 [状态提升](https://developer.android.com/jetpack/compose/state?hl=zh-cn#state-hoisting)的原则 ,我在根页面注册的路由,并且下发给每个页面,HomePage,和MediaPickerPage都下发了路由控制器

接下来只需要使用路由控制器触发路由切换页面就行了

```kotlin
navController.navigate(RouteConfig.MediaSelectPage)
```

RouteConfig中的是变量,可以自己定义,就是String形态的路由键

### 在页面跳转中添加动画

通常来说Activity之间跳转都是可以设置动画的,NavigationCompose当然也可以,这是`2.7.0`版本的新特性

在路由NavHost中定义路由动画即可,代码如下

```kotlin
composable(
    "${RouteConfig.MediaSelectPage}/{mediaType}", arguments = listOf(navArgument("mediaType") { NavType.StringType }),
    enterTransition = {
        slideIntoContainer(
            AnimatedContentTransitionScope.SlideDirection.Up,
            animationSpec = tween(500)
        )
    },
    exitTransition = {
        slideOutOfContainer(
            AnimatedContentTransitionScope.SlideDirection.Down,
            animationSpec = tween(500)
        )
    }
) {
    val type = it.arguments?.getString("mediaType")
    MediaPickerPage(navController, type?.toIntOrNull() ?: -1)
}
```

该效果配置路由的进入和退出动画 `enterTransition` `exitTransition` 这些属性名都是自解释的,很好理解

**有坑注意**

**跳转的页面必须要有全屏的宽高,不然动画不会生效,比如我要跳转到MediaPickerPage这个Compose,我需要至少配置一个根组件宽高为填充满**

```kotlin
Box(modifier = Modifier.fillMaxSize())
```

不然的话**上级页面的退出动画只会执行一个Scale到1px的效果,不会按照目标页面的`enterTransition`来走**

<img src="https://raw.githubusercontent.com/phcbest/PicBed/main/img/202311270006361.png" alt="image-20231127000622329" style="zoom: 33%;" />

正确生效的应该是下面的截图这样的

<img src="https://raw.githubusercontent.com/phcbest/PicBed/main/img/202311270009845.png" alt="image-20231127000952808" style="zoom:33%;" />


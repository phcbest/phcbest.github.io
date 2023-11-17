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
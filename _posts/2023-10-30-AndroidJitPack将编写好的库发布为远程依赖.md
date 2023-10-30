---
layout: article
title: AndroidJitPack将编写好的库发布为远程依赖
tags: Android
---

## 发布流程

### 仓库地址

[![](https://jitpack.io/v/phcbest/ffmpeg-kit-android-lib.svg)](https://jitpack.io/#phcbest/ffmpeg-kit-android-lib)


### 特别感谢

感谢Youtuber `@Mikes-Code` 制作的视频 [Publish Your Android Library (AAR) to JitPack.io Repository \| Android Studio](https://www.youtube.com/watch?v=6XugK4Sin6w)

### 代码与库配置

在AndroidStudio创建一个新项目，这个项目需要包含所需发布到JitPack的功能实现库

我这个项目的结构如图下所示

![image-20231030222410647](https://raw.githubusercontent.com/phcbest/PicBed/main/img/202310302224668.png)

我们需要发布的库是该项目下的`ffmpeg-kit-android-lib`，这是一个基于FFmpegKit二次编译满足我的需求的库

该库已经发布在github上，地址为[ffmpeg-kit-android-lib](https://github.com/phcbest/ffmpeg-kit-android-lib)

在该库中，我们仅需配置一个`jitpack.yml`文件,而这个yml文件中仅指定了编译jdk版本

```yml
jdk:
  - openjdk17
```

ffmpeg-kit-android-lib是一个需要Gradle 8.0编译的项目,而JitPack默认使用open jdk11,这样肯定是没法过编的,所以我们指定了openjdk17

到这里就已经完成了最终要的代码部分了,下面就是在网页上进行操作了

### GitHub配置

为了发布在JitPackCenter上,GitHub需要有一个Release版本,能够让JitPack读取到Release版,由于我已经发布了1.0.0版,还需要发布1.0.1版本就需要创建一个Release

![image-20231030223905500](https://raw.githubusercontent.com/phcbest/PicBed/main/img/202310302239559.png)

来到Release界面,创建一个1.0.1版本的Tag,Title和Describe都可以随便写,不影响最后发布的,之后Publish release即可

**重点!Github仓库的名字要与你需要发布的Model代码中的名字是相同的**

就像我上方展示的项目结构图中所示,我的Model名是 **ffmpeg-kit-android-lib** 那么我的Github仓库名也是 **ffmpeg-kit-android-lib** 这一点很重要!不然JitPack无法找到你需要打包的库

### JitPack打包为远程依赖

JitPack的注册和登录就不多说了,登录后在主界面能够看到项目列表,点击对应的项目就可以开始编译了

![image-20231030225002190](https://raw.githubusercontent.com/phcbest/PicBed/main/img/202310302250266.png)

如果按照我所描述的操作进行,那么稍等一会Log就会变为绿色,绿色就是成功了,如果是红色的就是失败了,可以查看详细日志来解决具体问题,不过我一次性成功了,如果失败了也别气馁,每个人项目版本,依赖,SDK不同,当然不会有同样的结果

### 使用

最后的使用就是很简单了,在依赖库解析管理中添加jitpack库源

```groovy
dependencyResolutionManagement {
		repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
		repositories {
			mavenCentral()
			maven { url 'https://jitpack.io' }
		}
	}
```

之后就可以使用远程依赖了

```groovy
implementation 'com.github.phcbest:ffmpeg-kit-android-lib:1.0.0'
```
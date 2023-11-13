---
layout: article
title: GradleDSL,使用build-logic来管理项目
tags: Android
---

## 序言

随着项目越来越庞大,为了更好的解耦代码,肯定会需要将不同的UI,功能,抽离为模块,一些大公司会将模块抽的非常细致,一来是为了防止过度耦合带来的难以维护,二来是为了简化Build时间,一个功能编译一个功能的Model即可,而不需要全量编译,Android的模块化开发与相关的模块管理是成为资深Android开发的必修课,笔者在现在并没有可以称得上是资深的技术能力,但是该篇文章也仅仅是我对与Gradle的一些自己的看法

该篇文章中的流程是我按照官方模板项目 [Now in Android](https://github.com/android/nowinandroid) 来进行分析的

## KotlinDSL

DSL即*domain-specific language*是在特定场景下的开发语言,与之对应的是通用开发语言

在我接触的很多项目中,都是采用[Groovy](https://zh.wikipedia.org/zh-hans/Groovy)来进行开发的,即使是KotlinDSL 也是最近才变成了Google官方的首选推荐

然而在大部分项目Gradle做的工作都是相对简单的,比如定义打包命名规则,指定打包路径,抽离公共配置,这些功能虽然简单,但是在迁移到KotlinDSL后却完全换了一种写法,以前都是写在`.gradle`后缀的文件中,现在可以直接写在kt中了,这样可读性和维护性就大大提高了

配置

使用Build-Logic来配置项目是比较繁琐的,下面我们一步一步来

首先就是创建一个buidl-logic模块,项目结构如下图所示

![image-20231113224506120](https://raw.githubusercontent.com/phcbest/PicBed/main/img/202311132245206.png)

一步一步来,先不用管里面的Plugin文件,先修改build-logic的 ` settings.gradle.kts `文件

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
    versionCatalogs {
        create("libs") {
            from(files("../gradle/libs.versions.toml"))
        }
    }
}

rootProject.name = "build-logic"
include(":convention")
```

这里我们是对该库进行了一些基本定义,比如导入子库convention,定义project名字,然后我们在项目中启用了****,这个Catalogs是用来进行所有的版本库依赖管理的,下面我们先不说Catalogs,我们先解析`convention`库

```kotlin
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    `kotlin-dsl`
}
group = "com.gowowtech.hcvideostudio.buildlogic"

//将构建逻辑插件配置为面向 JDK 17
//这与用于生成项目的 JDK 匹配，并且与设备上运行的内容无关。
java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

tasks.withType<KotlinCompile>().configureEach {
    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }
}
//插件依赖
dependencies {
    compileOnly(libs.android.gradlePlugin)
    compileOnly(libs.android.tools.common)
    compileOnly(libs.kotlin.gradlePlugin)
    compileOnly(libs.ksp.gradlePlugin)
}
gradlePlugin {
    plugins {
        register("androidApplication") {
            id = "hcvideostudio.android.application"
            implementationClass = "AndroidApplicationConventionPlugin"
        }

        register("androidLibrary") {
            id = "hcvideostudio.android.library"
            implementationClass = "AndroidLibraryConventionPlugin"
        }
    }
}
```

这个group是组名字,不重要,目前没有用到的地方

plugins标签里面注明开启kotlin-dsl

编译任务指明使用jdk 17 

插件依赖中表明我们采用这些依赖,这些依赖同样是Catalogs

gradlePlugin中我们引入自己定义的两个插件,id是索引,implementationClass是在convention路径下的类名

下面我们来解析一下**AndroidLibraryConventionPlugin.kt**,app的插件AndroidApplicationConventionPlugin.kt因为目前还没有用到就不解析了

```kotlin
import com.android.build.api.variant.LibraryAndroidComponentsExtension
import com.android.build.gradle.LibraryExtension
import com.gowow.convention.configureKotlinAndroid
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.dependencies
import org.gradle.kotlin.dsl.kotlin

class AndroidLibraryConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) {
        with(target) {
            with(pluginManager) {
                apply("com.android.library")
                apply("org.jetbrains.kotlin.android")
            }

            extensions.configure<LibraryExtension> {
                configureKotlinAndroid(this)
                defaultConfig.targetSdk = 34
                defaultConfig {
                    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
                    consumerProguardFiles("consumer-rules.pro")
                }

                buildTypes {
                    release {
                        isMinifyEnabled = false
                        proguardFiles(
                            getDefaultProguardFile("proguard-android-optimize.txt"),
                            "proguard-rules.pro"
                        )
                    }
                }
            }
            extensions.configure<LibraryAndroidComponentsExtension> {

            }
            dependencies {

            }
        }
    }

}
```

这里可以看到,写法和kts的写法大差不差,就不做解析了,这几段代码是我从now in android 里面复制的,想看详细代码可以去github上看看https://github.com/android/nowinandroid/tree/main/build-logic/convention/src/main/kotlin

**libs.versions.toml**

在项目的根目录下的gradle下创建一个该文件,我这边的依赖如下所示

```toml
[versions]
# AGP 和工具应一起更新
activityCompose = "1.8.0"
androidGradlePlugin = "8.1.2"
androidTools = "31.1.2"
coreKtx = "1.12.0"
espressoCore = "3.5.1"
ffmpegKitAndroidLib = "1.0.0.0-bate"
junit = "4.13.2"
junitVersion = "1.1.5"
kotlin = "1.9.10"
ksp = "1.9.10-1.0.13"
agp = "8.1.2"
lifecycleRuntimeKtx = "2.6.2"
org-jetbrains-kotlin-android = "1.8.10"
appcompat = "1.6.1"
material = "1.10.0"
utilcodex = "1.31.1"


[libraries]
activity-compose = { module = "androidx.activity:activity-compose", version.ref = "activityCompose" }
android-gradlePlugin = { group = "com.android.tools.build", name = "gradle", version.ref = "androidGradlePlugin" }
android-tools-common = { group = "com.android.tools", name = "common", version.ref = "androidTools" }
core-ktx = { module = "androidx.core:core-ktx", version.ref = "coreKtx" }
espresso-core = { module = "androidx.test.espresso:espresso-core", version.ref = "espressoCore" }
ext-junit = { module = "androidx.test.ext:junit", version.ref = "junitVersion" }
ffmpeg-kit-android-lib = { module = "com.github.phcbest:ffmpeg-kit-android-lib", version.ref = "ffmpegKitAndroidLib" }
junit = { module = "junit:junit", version.ref = "junit" }
kotlin-gradlePlugin = { group = "org.jetbrains.kotlin", name = "kotlin-gradle-plugin", version.ref = "kotlin" }
ksp-gradlePlugin = { group = "com.google.devtools.ksp", name = "com.google.devtools.ksp.gradle.plugin", version.ref = "ksp" }
appcompat = { group = "androidx.appcompat", name = "appcompat", version.ref = "appcompat" }
lifecycle-runtime-ktx = { module = "androidx.lifecycle:lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
material = { group = "com.google.android.material", name = "material", version.ref = "material" }
utilcodex = { module = "com.blankj:utilcodex", version.ref = "utilcodex" }

[plugins]
#此项目定义的插件
hcvideostudio-android-application = { id = "hcvideostudio.android.application", version = "unspecified" }
hcvideostudio-android-library = { id = "hcvideostudio.android.library", version = "unspecified" }
com-android-library = { id = "com.android.library", version.ref = "agp" }
org-jetbrains-kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "org-jetbrains-kotlin-android" }
```

到这里为止,build-logic库就准备的差不多了

**在项目的根目录的setting.gradle.kts下标明启用build-logic**

```kotlin
pluginManagement {
    includeBuild("build-logic")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven("https://jitpack.io")
    }
}

rootProject.name = "HCVideoStudio"
include(":app")
include(":HCFFmpegVE")
include(":BaseModule")
```

比较重要的是    `includeBuild("build-logic")` 其他地方都无变化

## 使用

app主项目我并没有采用该方法配置,一方面是我学艺不精,并没有完全吃透,第二是主项目的相关版本我更习惯在单独的build.gradle.kts中进行配置,后面可以使用build-logic来对主项目进行打包之类的配置

目前我将功能模块接入了build-logic,在功能模块的`build.gradle.kts`中我们只需要进行简单的配置即可,其他的配置是复用插件中的

```kotlin
@Suppress("DSL_SCOPE_VIOLATION") // TODO: Remove once KTIJ-19369 is fixed
plugins {
    alias(libs.plugins.hcvideostudio.android.library)
}

android {
    namespace = "com.gowow.hcffmpegve"
}

dependencies {
    implementation(libs.core.ktx)
    implementation(libs.ffmpeg.kit.android.lib)

    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)

}
```

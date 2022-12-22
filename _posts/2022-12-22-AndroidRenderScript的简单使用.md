---
layout: article
title: AndroidRenderScript的简单使用
tags: Androidd
---

## 配置环境

Android官方好像说RenderScript已经停止维护了，但是相比较[Vulkan](https://developer.android.com/guide/topics/renderscript/migrate#scripts)我感觉RenderScript的学习成本更低，因为RS脚本更像C语言，使用起来简单方便，在图片处理的速度上也不亚于NDK,一些简单的图片处理需求使用RS脚本还是比较方便的

我使用的RS脚本是AndroidX库里面的，没有使用support库是因为打包以后的体积更大

根据[官网](https://developer.android.com/guide/topics/renderscript/compute)的描述，我们首先在模块级的Gradle文件下添加以下配置

```groovy
        android {
            compileSdkVersion(28)

            defaultConfig {
                minSdkVersion(9)
                targetSdkVersion(19)

                renderscriptTargetApi = 18
                renderscriptSupportModeEnabled = true
            }
        }
        
```

renderscriptTargetApi的有效值是11到最新发布的Api

renderscriptSupportModeEnabled 指定如果生成的字节码不支持当前设备自动回退到兼容版本

因为core内自带对AndroidX RS脚本的支持，所以无需导入依赖

## 使用

### RS脚本的创建

首先在`app\src\main` 路径下创建**rs**文件夹，这个文件夹是专门用来放置**.rs** 文件的

我在这里创建了一个**ImageSize.rs**文件，其内容是

```c
#pragma version(1)
#pragma rs java_package_name(org.phcbest.koutudemo)



int xx = 100;
int h = 0;
int w = 0;

int data[4];

typedef struct TestS{
    int num;
    int age;
}Test;

Test ttss;

uchar4 RS_KERNEL invert(uchar4 in, uint32_t x, uint32_t y) {
    uchar4 out = in;
    out.r = 255 - in.r;
    out.g = 255 - in.g;
    out.b = 255 - in.b;
    if (x == w-1 && y == h-1){
        data[0] = 123123;
        data[1] = 111113;
        data[2] = x+1;
        data[3] = y+1;
        ttss.num = 10;
        ttss.age = 100;
        rsSendToClient(11,&ttss,sizeof(ttss));
        rsSendToClient(10,data,sizeof(data));
        //rsSendToClient(xx);
    }
    return out;
}
```

这种语言和C99很像

这个demo中完成的内容是将输入的像素反色，并且使用`rsSendToClient`和Android层通信

脚本功能不难理解，我们需要理解的内容是上面两行`pragma`

- ```
  #pragma version(1)
  ```

  这个用于声明此脚本中使用的 RenderScript 内核语言的版本。目前，1 是唯一有效的值。

- ```
  #pragma rs java_package_name(org.phcbest.koutudemo)
  ```

  这个是用来指明生成的中间层文件的位置，前半部分使用固定格式，括号内填写应用的包名

### 在Android层中使用

```kotlin
private fun testGetImageSizeByRs(kato: Bitmap) {
        val rs = RenderScript.create(this)
        val imageSize = ScriptC_ImageSize(rs)
        val inputAllocation = Allocation.createFromBitmap(rs, kato)
        rs.messageHandler = object : RenderScript.RSMessageHandler() {
            override fun run() {
                when (mID) {
                    11 -> {
                        Log.i("TAG", "mid is : $mID")
                        Log.i("TAG", "mData is : $${mData[0]}")
                        Log.i("TAG", "mData is : $${mData[1]}")
                        Log.i("TAG", "mData is : $mLength")
                    }
                    10 -> {
                        Log.i("TAG", "mid is : $mID")
                        Log.i("TAG", "mData is : $${mData[0]}")
                        Log.i("TAG", "mData is : $${mData[1]}")
                        Log.i("TAG", "mData is : $${mData[2]}")
                        Log.i("TAG", "mData is : $${mData[3]}")
                        Log.i("TAG", "mData is : $mLength")
                    }
                    else -> {}
                }
            }
        }
        imageSize._h = kato.height
        imageSize._w = kato.width
        val outputType = Type.Builder(rs, Element.RGBA_8888(rs))
            .setX(kato.width)
            .setY(kato.height)
        val outputAllocation = Allocation.createTyped(rs, outputType.create())
        val outputBitmap = Bitmap.createBitmap(kato.width, kato.height, kato.config)
        imageSize.forEach_invert(inputAllocation, outputAllocation)
        outputAllocation.copyTo(outputBitmap)
    
    	inputAllocation.destroy()
        outputAllocation.destroy()
        rs.destroy()
    }
```

Android层面的代码量也很少，使用起来特别方便，我们来梳理一下流程

- 创建使用上下文创建RS对象
- ScriptC_ImageSize是AndroidStudio自动给我们生成的中间层类，只要编写完RS脚本之后编译就会自动生成，我们初始化该类
- 初始化输入分配
- 给rs设置`RSMessageHandler`，这个配置是和 `rsSendToClient`配套的，在`rsSendToClient`发送的消息在`RSMessageHandler`中接收
  - mID为`rsSendToClient`方法的第一个参数，是我们自定义的消息唯一ID
  - mData是一个Int数组，是传输的载荷，就算我们RS脚本中传递的是结构体，Android层收到的也只是Int数组
  - mLength是载荷的大小，RS层中使用`sizeof(data)`来获得载荷的大小，这一点和C99一样
- 接下来就是设置一些RS里面的全局变量
- 初始化输出类型，使用`Type.Builder`来创建
- 初始化输出分配
- 调用RS脚本，使用forEach_invert，invert是rs脚本中的方法，forEach_是固定的调用格式
- 释放资源

这些就是简单的RS脚本使用，还有RS层和Android层通信的一些接口，还有一些需要注意的，RS脚本中使用`rsDebug`来打印日志，如果需要控制台显示日志需要在创建RenderScript对象的时候使用DEBUG模式，不然控制台不会打印信息，因为RS脚本是并行计算的，打印log会拖慢其图片处理的速度

```
val rs = RenderScript.create(this,RenderScript.ContextType.DEBUG)
```


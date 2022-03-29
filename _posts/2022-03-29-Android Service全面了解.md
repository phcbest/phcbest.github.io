---
layout: article
title: Service全面了解
tags: Android
---

## Service的两种类型

### 本地服务(显式启动)

依附在主线程上的service,本地服务和主线程是在同一个进程上面,节约了系统资源,也不需要IPC和AIDL进行跨进程通信bindService会方便好多,主进程被kill以后,本地服务也会被kill,多用在音乐播放器这种不需要常驻的功能,**服务和启动服务的activity在同一个进程中**

### 远程服务(隐式启动)

远程服务独立于进程运行,进程上的Activity被kill的时候,并不会带着Service一起kill,通信使用IPC和AIDL,这种是常驻的,为多个进程提供服务有较高的灵活性



## Service的两种状态

### 启动状态

当应用组件通过**startService**启动时,服务就会处于启动状态,但是一旦启动,服务就会在后台无限期运行,就算启动服务的组件被销毁了也不影响,手动调用才能停止服务,一般用于单一执行,不会将调用结果返回给调用方

### 绑定状态

应用组件通过**bindService**绑定到服务,服务处于绑定状态,绑定服务提供了一个**客户-服务的接口**,允许组件和服务进行交互,**多个组件可以同时绑定到一个服务**,全部取消绑定后,该服务会被销毁



## 清单文件参数

| 参数                    |                             含义                             |
| :---------------------- | :----------------------------------------------------------: |
| android:enabled         |                     表示是否启用这个服务                     |
| android:permission      |                           权限声明                           |
| android:process         | 是否需要在单独的进程中运行,当设置为android:process=”:remote”时，代表Service在单独的进程中运行。注意“：”很重要，它的意思是指要在当前进程名称前面附加上当前的包名，所以“remote”和”:remote”不是同一个意思，前者的进程名称为：remote，而后者的进程名称为：App-packageName:remote。 |
| android:isolatedProcess | 设置 true 意味着，服务会在一个特殊的进程下运行，这个进程与系统其他进程分开且没有自己的权限。与其通信的唯一途径是通过服务的API(bind and start)。 |
| android:exported        |      表示是否允许除了当前程序之外的其他程序访问这个服务      |



## 生命周期解析

在第一次启动服务的时候,会执行service中的onCreate还有onStartCommend,如不是第一次启动,只会单独调用onSatrtCommend

- onBind()
    当另一个组件想通过调用 bindService() 与服务绑定（例如执行 RPC）时，系统将调用此方法。在此方法的实现中，必须返回 一个IBinder 接口的实现类，供客户端用来与服务进行通信。无论是启动状态还是绑定状态，此方法必须重写，但在启动状态的情况下直接返回 null。
- onCreate()
    首次创建服务时，系统将调用此方法来执行一次性设置程序（在调用 onStartCommand() 或onBind() 之前）。如果服务已在运行，则不会调用此方法，该方法只调用一次
- onStartCommand()
    当另一个组件（如 Activity）通过调用 startService() 请求启动服务时，系统将调用此方法。一旦执行此方法，服务即会启动并可在后台无限期运行。 如果自己实现此方法，则需要在服务工作完成后，通过调用 stopSelf() 或 stopService() 来停止服务。（在绑定状态下，无需实现此方法。）
- onDestroy()
    当服务不再使用且将被销毁时，系统将调用此方法。服务应该实现此方法来清理所有资源，如线程、注册的侦听器、接收器等，这是服务接收的最后一个调用。



## Service绑定服务

如果通过**startService**启动service,虽然服务在活动中,但是启动服务后Service和Activty就没什么关系了,没法很好地控制Service,需要使用bindService来对Service进行更加精确的控制

**实现精准控制的方法有以下三种**

- 扩展Binder类        在service中添加一个Binder的内部类,通过前台进行绑定后,前台调用Binder中封装好的接口来对Service进行控制
- 使用Messenger        执行进程间通信(IPC)的最简单方法,在单一**线程**中创建了所有的请求队列,用串行的方法处理前台发来的消息
- 使用AIDL        让服务拥有同时处理多个请求的能力,**服务设计应该有多线程和线程安全**

### 使用Binder

1. 创建binder子类,提供给前台
2. service中的onBind方法返回Binder实例
3. 前台onServiceConnected接收返回binder的实例

*后台代码*

```kotlin
package org.phcbest.neteasymusic.service
import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Binder
import android.os.IBinder
import android.util.Log
import org.phcbest.neteasymusic.presenter.PresenterManager
import org.phcbest.neteasymusic.utils.Constant
import kotlin.math.log

private const val TAG = "MusicPlayService"

/**
 * 播放音乐的服务
 */
class MusicPlayService : Service(), MediaPlayer.OnPreparedListener {
    //音频播放器
    private val mediaPlayer = MediaPlayer()
    //操作器
    private var myBinder: MyBinder? = null
    override fun onCreate() {
        super.onCreate()
        //获取歌曲ID
        Log.i(TAG, "onCreate: ")
        init()
    }
    /**
     * seavice的启动命令,用于设置启动状态
     * @return 如果service被kill,系统会带着最后一次传入的intent参数重新启动
     */
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_REDELIVER_INTENT
    }
    override fun onDestroy() {
        super.onDestroy()
        myBinder?.release()
    }
    override fun onBind(intent: Intent): IBinder {
        myBinder = MyBinder(intent)
        return myBinder!!
    }
    private fun init() {
        mediaPlayer.setAudioAttributes(
            AudioAttributes.Builder().setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()
        )
        mediaPlayer.setOnPreparedListener(this)
    }
    inner class MyBinder(val intent: Intent) : Binder() {

        fun play(songID: String) {
            try {
                PresenterManager.getInstance().getMainPresenter()
                    .getSongDownLoadUrl(songID, success = { songUrlBean ->
                        Log.i(TAG, "play: 加载音乐")
                        mediaPlayer.setDataSource(songUrlBean.data[0].url)
                        mediaPlayer.prepareAsync()
                    }, error = { throwable ->

                    })
            } catch (e: Exception) {
                Log.e(TAG, "play: 准备阶段资源加载出错", e)
            }
        }
        fun pause() {
            if (mediaPlayer.isPlaying) {
                mediaPlayer.pause()
            }
        }
        fun resume() {
            if (!mediaPlayer.isPlaying) {
                mediaPlayer.start()
            }
        }
        fun stop() {
            mediaPlayer.stop()
        }
        fun release() {
            mediaPlayer.release()
        }
    }
    override fun onPrepared(mp: MediaPlayer?) {
        Log.i(TAG, "onPrepared: 开始播放")
        mp!!.start()
    }
}	
```

*前台代码*

```kotlin
var conn = object : ServiceConnection {
    override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
        var bind: MusicPlayService.MyBinder = service as MusicPlayService.MyBinder
        bind.play("29732992")
    }
	//系统会在和服务的连接意外中断的时候调用这个方法,但是  !!!客户端自己取消绑定是不会调用这个方法的!!!
    override fun onServiceDisconnected(name: ComponentName?) {
        Log.i(TAG, "onServiceDisconnected: 服务断开")
    }
}
//ContextWrapper提供的一个接口
bindService(
    Intent(baseContext, MusicPlayService::class.java),
    conn,
    Service.BIND_AUTO_CREATE
)
//取消绑定的方法
//unbindService(conn)
```



## 服务和线程的区别

### 概念

- Thread是程序执行的最小单元,是分配cpu的最小单位
- 服务是Android的一种机制,服务是运行在主线程上的,由系统进程托管,是一种轻量级的IPC,通信的载体是binder,是在linux交换信息的一种IPC,Service后台任务只是一个没有UI的组件

### 执行差异

- Android中的线程是工作线程,主线程是一种特殊的工作线程,负责将事件分发给相对应的用户界面,为了保证UI的响应能力,不能将耗时的任务放入主线程,会造成ANR
- 服务是系统的组件,正常情况下运行在主线程中,在其中也是不能执行耗时操作的,服务只是没有UI而已,用户无法感知,执行耗时程序还是应该开启单线程

### 使用场景

- 耗时的异步操作需要放入Thread中
- 需要在后台长期运行,并且不需要交互的功能使用服务,如音乐播放



## 保证Service不会被kill

- 重写服务的`override fun onStartCommand`方法中返回`START_STICKY`或者`START_REDELIVER_INTENT` 当Service在内存不足的时候被Kill,当内存空闲后,系统会重启创建该Service,创建成功后会回调OnStartCommand,但是使用`START_STICKY`的话传入的intent一定是null,`START_REDELIVER_INTENT`会传入最后一次传入的intent,`START_STICKY`更加适合无期限运行等待作业命令的媒体播放器

- 提高Service的优先级

  ```xml
  <service
              android:name=".service.MusicPlayService"
              android:enabled="true"
              android:exported="false" >
              <intent-filter android:priority="1000" />
  </service>
  ```

  

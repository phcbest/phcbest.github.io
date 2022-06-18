---
layout: article
title: Service和MediaSession实现音乐播放器
tags: Android
---

## 前言

就Android的音乐播放器来说,大致有两种不同的实现方案
- 构建一个Service来进行音乐数据获取和音乐控制,需要自定义状态数值和回调接口,通过广播等方式完成Android和Service之间的沟通,让用户在Activity上的操作能在Service上做出响应,我是使用BindService后通过设置LiveData的Observe来完成的,这样的做法不但繁琐耦合度高,后期更改需求就像是砍到了大动脉
- Google在Android5.0之后添加了MediaSession框架,用来解决媒体播放时界面和Service的通讯问题,使用这个框架可以减少一些复杂的代码,让代码的耦合度降低,提升代码的可读性



## Service实现

```kotlin
package org.phcbest.neteasymusic.service  
  
import android.app.Notification  
import android.app.Service  
import android.content.Intent  
import android.media.AudioManager  
import android.media.MediaPlayer  
import android.media.session.MediaSession  
import android.nfc.Tag  
import android.os.*  
import android.support.v4.media.session.MediaSessionCompat  
  
  
import android.util.Log  
import androidx.annotation.RequiresApi  
import androidx.lifecycle.MutableLiveData  
import org.phcbest.neteasymusic.R  
import org.phcbest.neteasymusic.bean.SongEntity  
import org.phcbest.neteasymusic.presenter.PresenterManager  
import org.phcbest.neteasymusic.utils.MMKVStorageUtils  
  
private const val TAG = "MusicPlayService"  
  
/**  
 * 播放音乐的服务  
 */  
class MusicPlayerService : Service() {  
  
    var mPlaylist: MutableLiveData<MutableList<SongEntity>> = MutableLiveData(arrayListOf())  
    private lateinit var mMediaPlayer: MediaPlayer  
    private var mCurrentSongIndex: Int = 0  
  
  
    @RequiresApi(Build.VERSION_CODES.O)  
    override fun onCreate() {  
        super.onCreate()  
        //初始化播放器  
        mMediaPlayer = MediaPlayer()  
        mMediaPlayer.setWakeMode(applicationContext, PowerManager.PARTIAL_WAKE_LOCK);  
        mMediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);  
        //初始化mediaPlayer的事件  
        initMediaPlayerEvent()  
    }  
  
    //改变播放位置  
    fun seekTo(position: Float) {  
        if (!this::mMediaPlayer.isInitialized) return  
        //计算播放位置  
        val duration = mMediaPlayer.duration  
        val newPosition = (position * duration).toInt()  
        mMediaPlayer.seekTo(newPosition)  
    }  
  
    data class SongProgress(val currentProgress: Int, val fullProgress: Int)  
  
    var playProgressLD: MutableLiveData<SongProgress> = MutableLiveData()  
  
    /**  
     *  控制发送进度给外部  
     */  
    private var mProgressHandler: Handler = object : Handler(Looper.myLooper()!!) {  
        override fun handleMessage(msg: Message) {  
            super.handleMessage(msg)  
            //获得当前播放的进度  
            if (this@MusicPlayerService::mMediaPlayer.isInitialized) {  
  
//                Log.i(TAG,  
//                    "handleMessage: 歌曲长度${mMediaPlayer.duration}  当前位置${mMediaPlayer.currentPosition}")  
                //将进度推出  
                if (mMediaPlayer.duration <= 0 || mMediaPlayer.duration <= 0) {  
                    playProgressLD.postValue(null)  
                } else {  
                    //100F * mMediaPlayer.currentPosition / mMediaPlayer.duration  
                    playProgressLD.postValue(SongProgress(mMediaPlayer.currentPosition,  
                        mMediaPlayer.duration))  
                }  
                sendEmptyMessageDelayed(0, 1000)  
            }  
        }  
    }  
//        progressHandler.sendEmptyMessage(0)  
  
  
    var currentSongEntityLD: MutableLiveData<SongEntity> = MutableLiveData()  
  
    private fun initMediaPlayerEvent() {  
        //播放加载完成的回调  
        mMediaPlayer.setOnPreparedListener {  
            //取消消息  
            mProgressHandler.removeMessages(0)  
            //准备加载,进行播放  
            playControl(2)  
            currentSongEntityLD.postValue(mPlaylist.value?.get(mCurrentSongIndex))  
        }  
        mMediaPlayer.setOnCompletionListener {  
            //播放完成回调,切换下一首  
            switchSongNOP(true)  
        }  
        mMediaPlayer.setOnInfoListener { mp, what, extra ->  
            Log.i(TAG,  
                "initMediaPlayerEvent OnInfoListener: isplayin= ${mp.isPlaying} what = $what")  
            false  
        }  
        //设置错误监听为已经处理,就不会在切歌的时候触发完成回调  
        mMediaPlayer.setOnErrorListener { mediaPlayer: MediaPlayer, what: Int, extra: Int ->  
            Log.i(TAG, "initMediaPlayerEvent: OnErrorListener what = $what")  
            false  
        }  
    }  
  
  
    //true为播放,false为暂停  
    var isPlayerLD: MutableLiveData<Boolean> = MutableLiveData(false)  
  
    /**  
     * 播放控制  
     * 1=pause 将当前音乐暂停，保持进度  
     * 2=start 开始播放 如果在pause后调用就是恢复播放  
     * 3=stop 停止播放是如果stop后调用start会从头开始播放  
     */  
    fun playControl(controlCode: Int) {  
        when (controlCode) {  
            1 -> {  
                if (mMediaPlayer.isPlaying) {  
                    mMediaPlayer.pause()  
                }  
            }  
            2 -> {  
                if (!mMediaPlayer.isPlaying) {  
                    mMediaPlayer.start()  
                }  
            }  
            3 -> {  
                mMediaPlayer.stop()  
            }  
            else -> Log.i(TAG, "playControl: 控制代码$controlCode 没有符合的")  
        }  
        isPlayerLD.postValue(mMediaPlayer.isPlaying)  
        //设置进度推出  声音渐弱和渐强  
        if (mMediaPlayer.isPlaying) {  
            mProgressHandler.sendEmptyMessage(0)  
        } else {  
            mProgressHandler.removeMessages(0)  
        }  
    }  
  
  
    fun setPlayListSync() {  
//        playlist.tracks.map {  
//            this.mPlaylist.add(SongEntity(  
//                it.id.toString(),  
//                it.name,  
//                it.id.toString(),  
//                it.al.picUrl,  
//                if (it.ar!!.isEmpty()) {  
//                    "未知歌手"  
//                } else {  
//                    val sj = StringJoiner("-")  
//                    it.ar.map { ar -> sj.add(ar.name) }  
//                    sj.toString()  
//                }  
//            ))  
//        }  
        MMKVStorageUtils.newInstance().getPlayList().let {  
            this.mPlaylist.postValue(it as MutableList<SongEntity>?)  
        }  
    }  
  
    //添加歌曲到播放列表  
    fun addSongToList(songEntity: SongEntity, playWhenAppend: Boolean) {  
        //歌曲列表不包含当前歌曲,添加到当前播放的歌曲后面  
        mPlaylist.value!!.add(mCurrentSongIndex + 1, songEntity)  
        //存储当前歌单到mmkv  
        MMKVStorageUtils.newInstance().storagePlayList(mPlaylist.value!!)  
        this.mPlaylist.postValue(mPlaylist.value)  
        //加载歌曲  
        if (playWhenAppend) {  
            mCurrentSongIndex++  
            aSyncLoadSong()  
        }  
    }  
  
    private fun aSyncLoadSong() {  
        //复位播放器  
        mMediaPlayer.reset()  
        //网络请求获得播放地址  
        Log.i(TAG, "aSyncLoadSong: 加载音乐的下标 $mCurrentSongIndex")  
        PresenterManager.getInstance().getSongInfoPresenter()  
            .getSongDownLoadUrl(mPlaylist.value!![mCurrentSongIndex].songId, {  
                if (it.data.isNotEmpty()) {  
                    mMediaPlayer.setDataSource(it.data[0].url)  
                    mMediaPlayer.prepareAsync()  
                    //将当前播放音乐的数据传递出去  
                }  
            }, { it.printStackTrace() })  
    }  
  
    /**  
     * 切换歌曲,按照index  
     */    
    fun switchSongByPosition(index: Int) {  
        if (index in mPlaylist.value!!.indices) {  
            mCurrentSongIndex = index  
            aSyncLoadSong()  
        }  
    }  
  
    /**  
     * 切换上下首  
     * @param nextOrPrevious 为true是下一首,false是上一首  
     */  
    fun switchSongNOP(nextOrPrevious: Boolean) {  
        Log.i(TAG, "switchSongNOP 切换为 ${  
            if (nextOrPrevious) {  
                "下一首"  
            } else {  
                "上一首"  
            }  
        } ")  
        if (nextOrPrevious) {  
            //判断最后一首  
            if (mCurrentSongIndex >= mPlaylist.value!!.size - 1) {  
                mCurrentSongIndex = 0  
            } else {  
                mCurrentSongIndex++  
            }  
  
        } else {  
            //判断第一首  
            if (mCurrentSongIndex == 0) {  
                mCurrentSongIndex = mPlaylist.value!!.size - 1  
            } else {  
                mCurrentSongIndex--  
            }  
  
        }  
        aSyncLoadSong()  
    }  
  
  
    //=============================binder相关==============================  
    private val mBinder = MyBinder()  
  
    override fun onBind(intent: Intent?): IBinder {  
        return mBinder  
    }  
  
    inner class MyBinder() : Binder() {  
        fun getService(): MusicPlayerService {  
            return this@MusicPlayerService  
        }  
    }  
}
```

这里我们可以看到,这一套代码 逻辑混乱,状态混乱,可读性差. 在和MediaPlayer一起使用的时候,经常出现上下曲切换的Bug,不能精准的切换上下首


## MediaSession的使用

MediaSession的核心类有4个
- **MediaBrowser**  
	**媒体浏览器**,用来连接MediaBrowserService和订阅数据,通过这个类的回调接口可以得到Service的连接状态和获取**Service**种异步获得的音乐数据,这个类一般在客户端实例化(负责控制音乐播放的界面)

- **MediaBrowserService**  
	**媒体浏览器服务**,提供了`onGetRoot()`方法来控制客户端和MediaBrowser的连接请求,通过返回值来决定是否允许该客户端连接到播放服务,提供了`onLoadChildren()`当Mediaborwser向Service发送数据时进行回调,执行异步获得数据的操作,MediaBrowserService也作为`媒体播放器ExoPlayer,MediaPlayer`的载体和MediaSession的容器
	
- **MediaSession**  
	**媒体会话**,`受控端`,通过设置`MediaSessionCompat.Callback`回调来接收`MediaController`发送的指令,收到指令后会触发Callback中的各种回调方法(播放器的操作例如暂停,切换歌曲),`Session`一般是在Service.OnCreate中创建,最后调用setSessionToken方法来设置和控制器配对的令牌并**通知MediaBrowserService连接成功**

- **MediaController**  
	**媒体控制器** 在客户端中不但可以使用Controller向Service中受控端发送指令,还可以设置`MediaControllerCompat.Callback`回调方法来接收受控端的状态改变,从而更新ui


### 我们可以归纳一下这四个成员类之间的关系

**Activity**层面有**MediaBrowser**  **MediaController**  *UI*

**MediaBrowserServices**层面有**MediaBrowserService** **MediaSession** *Player*

Activity的MediaBrowser控制Service的MediaBrowserService

Service的MediaBrowserService回调Activity的MediaController

### 其他的类
- PlaybackState 封装各种播放状态
- MediaMetadata 通过键值对保存媒体信息
- MediaItem MediaBrowser和MediaBrowserService之间交换数据

### MediaSessionDemo

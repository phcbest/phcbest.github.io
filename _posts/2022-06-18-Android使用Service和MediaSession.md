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

服务端代码  
```kotlin
package org.phcbest.neteasymusic.service  
  
import android.media.MediaMetadata  
import android.media.MediaPlayer  
import android.media.browse.MediaBrowser  
import android.media.session.MediaSession  
import android.media.session.PlaybackState  
import android.net.Uri  
import android.os.Bundle  
import android.service.media.MediaBrowserService  
import android.util.Log  
import org.phcbest.neteasymusic.utils.MMKVStorageUtils  
import java.io.IOException  
  
class MusicPlayerMediaSession : MediaBrowserService() {  
  
    private var mPlaybackState: PlaybackState? = null  
    private var mSession: MediaSession? = null  
  
    //媒体播放器  
    private var mMediaPlayer: MediaPlayer? = null  
  
    companion object {  
        private const val TAG = "MusicPlayerMediaSession"  
  
        val MEDIA_ID_ROOT: String = "root"  
    }  
  
    /**  
     * 初始化MediaSession,设置标志位等参数  
     */  
    override fun onCreate() {  
        super.onCreate()  
        //设置播放状态  
        mPlaybackState = PlaybackState.Builder()  
            //设置播放状态,开始位置,和播放速度  
            .setState(PlaybackState.STATE_NONE, 0, 1.0f)  
            .build()  
  
        //初始化MediaSession  
        mSession = MediaSession(this, "MusicPlayerMediaSession")  
        //设置回调  
        mSession?.setCallback(mediaSessionCallback)  
        //设置标志位  
        mSession?.setFlags(MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS)  
        //设置播放状态  
        mSession?.setPlaybackState(mPlaybackState)  
  
        //MediaBrowserService的Token  
        sessionToken = mSession?.sessionToken  
  
        //初始化MediaPlayer  
        mMediaPlayer = MediaPlayer()  
        mMediaPlayer?.setOnPreparedListener(preparedListener)  
        mMediaPlayer?.setOnCompletionListener(completionListener)  
    }  
  
    /**  
     * 当播放器准备好后调用  
     */  
    private val preparedListener = MediaPlayer.OnPreparedListener {  
        mMediaPlayer?.start()  
        mPlaybackState = PlaybackState.Builder()  
            .setState(PlaybackState.STATE_PLAYING, 0, 1.0f)  
            .build()  
        mSession?.setPlaybackState(mPlaybackState)  
    }  
  
    /**  
     * 当播放器播放完成后调用  
     */  
    private val completionListener = MediaPlayer.OnCompletionListener {  
        mPlaybackState = PlaybackState.Builder()  
            .setState(PlaybackState.STATE_NONE, 0, 1.0f)  
            .build()  
        mSession?.setPlaybackState(mPlaybackState)  
        mMediaPlayer?.reset()  
    }  
  
    /**  
     * 设置响应控制器指令的回调  
     */  
    private val mediaSessionCallback = object : MediaSession.Callback() {  
        //响应MediaController.TransportControls.play()指令  
        override fun onPlay() {  
            Log.i(TAG, "onPlay: ")  
            if (mPlaybackState?.state == PlaybackState.STATE_PAUSED) {  
                mMediaPlayer?.start()  
                mPlaybackState = PlaybackState.Builder()  
                    .setState(PlaybackState.STATE_PLAYING, 0, 1.0f)  
                    .build()  
                mSession?.setPlaybackState(mPlaybackState)  
            }  
        }  
  
        //响应MediaController.TransportControls.pause()指令  
        override fun onPause() {  
            Log.i(TAG, "onPause: ")  
            if (mPlaybackState?.state == PlaybackState.STATE_PLAYING) {  
                mMediaPlayer?.pause()  
                mPlaybackState = PlaybackState.Builder()  
                    .setState(PlaybackState.STATE_PAUSED, 0, 1.0f)  
                    .build()  
                mSession?.setPlaybackState(mPlaybackState)  
            }  
        }  
  
        //响应MediaController.TransportControls.playFromUri()指令  
        override fun onPlayFromUri(uri: Uri?, extras: Bundle?) {  
            Log.i(TAG, "onPlayFromUri: ")  
            try {  
                when (mPlaybackState?.state) {  
                    PlaybackState.STATE_PLAYING, PlaybackState.STATE_PAUSED -> {}  
                    PlaybackState.STATE_NONE -> {  
                        mMediaPlayer?.reset()  
                        mMediaPlayer?.setDataSource(this@MusicPlayerMediaSession, uri!!)  
                        mMediaPlayer?.prepare()  
                        mPlaybackState = PlaybackState.Builder()  
                            .setState(PlaybackState.STATE_CONNECTING, 0, 1.0f)  
                            .build()  
                        mSession?.setPlaybackState(mPlaybackState)  
                        //保存当前播放音乐的信息,方便客户端刷新UI  
                        mSession?.setMetadata(  
                            MediaMetadata.Builder()  
                                .putString(MediaMetadata.METADATA_KEY_TITLE,  
                                    extras?.getString("title"))  
                                .build()  
                        )  
                    }  
                }  
            } catch (e: IOException) {  
                e.printStackTrace()  
            }  
        }  
  
        override fun onPlayFromSearch(query: String?, extras: Bundle?) {  
            super.onPlayFromSearch(query, extras)  
        }  
    }  
  
  
    override fun onGetRoot(  
        clientPackageName: String,  
        clientUid: Int,  
        rootHints: Bundle?,  
    ): BrowserRoot {  
        Log.i(TAG, "======================onGetRoot======================")  
        return BrowserRoot(MEDIA_ID_ROOT, null)  
    }  
  
    override fun onLoadChildren(  
        parentId: String,  
        result: Result<MutableList<MediaBrowser.MediaItem>>,  
    ) {  
        Log.i(TAG, "======================onLoadChildren======================")  
        //将此消息从当前线程中分离出来，并允许稍后发生sendResult调用  
        result.detach()  
        //创建媒体项目列表  
        val mediaItems = mutableListOf<MediaBrowser.MediaItem>()  
        MMKVStorageUtils.newInstance().getPlayList().let { list ->  
            list?.forEach { item ->  
                val mediaMetadata = MediaMetadata.Builder()  
                    .putString(MediaMetadata.METADATA_KEY_TITLE, item.name)  
                    .putString(MediaMetadata.METADATA_KEY_AUTHOR, item.author)  
                    .putString(MediaMetadata.METADATA_KEY_MEDIA_ID, item.songId)  
                    .putString(MediaMetadata.METADATA_KEY_MEDIA_URI, item.songId)  
                    .build()  
                mediaItems.add(MediaBrowser.MediaItem(mediaMetadata.description,  
                    MediaBrowser.MediaItem.FLAG_PLAYABLE))  
            }  
        }  
        //发送结果  
        result.sendResult(mediaItems)  
    }  
}	
```

客户端代码
```kotlin
package org.phcbest.neteasymusic.service  
  
import android.content.ComponentName  
import android.media.browse.MediaBrowser  
import android.media.session.MediaController  
import android.os.Bundle  
import android.util.Log  
import androidx.appcompat.app.AppCompatActivity  
  
class SimulateClientActivity : AppCompatActivity() {  
  
    companion object {  
        private const val TAG = "SimulateClientActivity"  
    }  
  
    private var mBrowser: MediaBrowser? = null  
    private var mController: MediaController? = null  
  
    override fun onCreate(savedInstanceState: Bundle?) {  
        super.onCreate(savedInstanceState)  
        mBrowser = MediaBrowser(this, ComponentName(this, MusicPlayerMediaSession::class.java),  
            browserConnectionCallback, null)  
    }  
  
    /**  
     * 连接状态的回调接口  
     */  
    private var browserConnectionCallback = object : MediaBrowser.ConnectionCallback() {  
        override fun onConnected() {  
            super.onConnected()  
            Log.i(TAG, "onConnected: ")  
            //进行订阅操作  
            if (!mBrowser?.isConnected!!) return  
            //运行连接会正常返回值,不允许连接会返回null  
            val mediaId = mBrowser?.root!!  
            //注册回调  
            mController = MediaController(this@SimulateClientActivity, mBrowser!!.sessionToken)  
            mController?.registerCallback(controllerCallback)  
            //browser通过订阅的方式向Service请求数据,发起订阅需要mediaId参数  
            mBrowser?.unsubscribe(mediaId)  
            mBrowser?.subscribe(mediaId, browserSubscriptionCallback)  
        }  
  
        override fun onConnectionFailed() {  
            super.onConnectionFailed()  
            Log.i(TAG, "onConnectionFailed: 连接失败")  
        }  
    }  
  
    //播放状态改变的回调  
    private val controllerCallback = object : MediaController.Callback() {  
  
    }  
    /**  
     * 向MediaBrowserService发起数据订阅请求后的回调接口  
     */  
    private var browserSubscriptionCallback = object : MediaBrowser.SubscriptionCallback() {  
        override fun onChildrenLoaded(  
            parentId: String,  
            children: MutableList<MediaBrowser.MediaItem>,  
        ) {  
            Log.i(TAG, "onChildrenLoaded: ")  
            //service发送回来的媒体数据集合  
            for (child in children) {  
                Log.i(TAG, "onChildrenLoaded: ${child.description.title.toString()}")  
            }  
            //执行ui刷新  
  
        }  
    }  
  
    override fun onStart() {  
        super.onStart()  
        //发送连接请求  
        mBrowser?.connect()  
    }  
  
    override fun onStop() {  
        super.onStop()  
        //断开连接  
        mBrowser?.disconnect()  
    }  
}
```
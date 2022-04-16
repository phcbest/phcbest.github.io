---
layout: article
title: MVVM Demo解析
tags: Android
---

## DEMO地址

[phcbest/MVVM-Demo](https://github.com/phcbest/MVVM-Demo)



## 项目依赖版本

```groovy
	implementation "org.jetbrains.kotlin:kotlin-stdlib:$kotlin_version"
    implementation 'androidx.core:core-ktx:1.7.0'
    implementation 'androidx.appcompat:appcompat:1.4.1'
    implementation 'com.google.android.material:material:1.5.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.3'
    implementation 'androidx.legacy:legacy-support-v4:1.0.0'
    testImplementation 'junit:junit:4.+'
    androidTestImplementation 'androidx.test.ext:junit:1.1.3'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.4.0'

    //观测生命周期
    annotationProcessor "androidx.lifecycle:lifecycle-compiler:$project.arch"
    implementation "androidx.lifecycle:lifecycle-runtime:$project.arch"
    implementation "androidx.lifecycle:lifecycle-extensions:$project.arch"

    // Retrofit
    implementation "com.squareup.retrofit2:retrofit:$project.retrofit"
    implementation "com.squareup.retrofit2:converter-gson:$project.retrofit"


    // Dagger 注意要使用Kapt而不是annotationProcessor,不然不会自动生成Component或者dagger类
    kapt "com.google.dagger:dagger-android-processor:$dagger_version"
    kapt "com.google.dagger:dagger-compiler:$dagger_version"
    implementation "com.google.dagger:dagger:$project.dagger_version"
    implementation "com.google.dagger:dagger-android:$project.dagger_version"
    implementation "com.google.dagger:dagger-android-support:$project.dagger_version"

project.ext {
    support = "1.0.0"
    constraintlayout = "2.0.0-alpha2"
    arch = "2.0.0"
    retrofit = "2.0.2"
    constraintLayout = "1.0.2"
    dagger_version = "2.38.1"
}
```



## DEMO说明

该demo是一个基于MVVM思想,通过 *Dagger2,LifeCycle,LiveData,DataBinding,Retrofit2* 等开发工具实现,主要的难点是Dagger2的学习和使用,这种基于Kapt的工具有时总是Inject不成功,下面详细描述一下Dagger2的配置过程



## Dagger2的配置

依赖注入-dependency injection 以下简称之di 

di在后端开发中十分常见,对象的实例化由Factory来解决,让开发者在写代码的时候不用写太多的*New*这样的模板代码,也更加方便管理

### 依赖配置

```groovy
	kapt "com.google.dagger:dagger-android-processor:$dagger_version"
    kapt "com.google.dagger:dagger-compiler:$dagger_version"
    implementation "com.google.dagger:dagger:$project.dagger_version"
    implementation "com.google.dagger:dagger-android:$project.dagger_version"
    implementation "com.google.dagger:dagger-android-support:$project.dagger_version"
```

需要注意的是,因为项目采用Kotlin编写,所以要使用*Kapt*来引用依赖,不能使用*annotationProcessor*,不然的话不会生成对应的apt类,项目采用**Dagger 2.38.1**版本

在App的 build.gradle 文件中,要对 plugins 标签添加参数

```groovy
plugins {
    id 'com.android.application'
    id 'kotlin-android'
    //添加kotlin注释处理器,注意要改变项目jdk11才能用kapt
    id 'kotlin-kapt'
    id 'kotlin-parcelize'
}
```



### 清单文件

清单文件中要修改**application**标签的**name**属性,设置为自定义的Application

```kotlin
import android.app.Application
import dagger.android.AndroidInjector
import dagger.android.DispatchingAndroidInjector
import dagger.android.HasAndroidInjector
import org.phcbest.mvvm_demo.di.AppInjector
import javax.inject.Inject

/**
 * dagger 2.23 版本后,将Has*Injector替换为了HasAndroidInjector
 */
class MVVMApplication : Application(), HasAndroidInjector {

    private val TAG = "MVVMApplication"

    @Inject
    lateinit var dispatchingAndroidInjector: DispatchingAndroidInjector<Any>

    override fun onCreate() {
        super.onCreate()
        AppInjector.init(this)
    }

    override fun androidInjector(): AndroidInjector<Any> {
        return dispatchingAndroidInjector
    }
}
```

在该类中,我继承了Application,实现了HasAndroidInjector,Activity也要实现HasAndroidInjector,为了方便实现注入的时候作为标记



### MainActivity

```kotlin
class MainActivity : AppCompatActivity(), HasAndroidInjector {
    @Inject
    lateinit var dispatchingAndroidInjector: DispatchingAndroidInjector<Any>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        //添加列表Fragment
        if (savedInstanceState == null) {
            val projectListFragment = ProjectListFragment()
            supportFragmentManager.beginTransaction()
                .add(R.id.fragment_container, projectListFragment, ProjectListFragment.TAG).commit()
        }
    }

    /**
     * 切换为显示详情的Fragment
     */
    fun show(project: Project) {
        val projectFragment = ProjectFragment.forProject(project.name)
        supportFragmentManager.beginTransaction().addToBackStack("project")
            .replace(R.id.fragment_container, projectFragment, null).commit()
    }

    override fun androidInjector(): AndroidInjector<Any> = dispatchingAndroidInjector
}
```



### AppInjector

在Application中,进行了`AppInjector.init(this)`目的是初始化注入器

```kotlin
import android.app.Activity
import android.app.Application
import android.os.Bundle
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.FragmentManager
import dagger.android.AndroidInjection
import dagger.android.HasAndroidInjector
import dagger.android.support.AndroidSupportInjection
import org.phcbest.mvvm_demo.MVVMApplication

/**
 * 初始化注入器
 */
class AppInjector {

    companion object {
        fun init(mvvmApplication: MVVMApplication) {
            DaggerAppComponent.builder().application(mvvmApplication).build()
                .inject(mvvmApplication)
            mvvmApplication.registerActivityLifecycleCallbacks(object :
                Application.ActivityLifecycleCallbacks {
                override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
                    handleActivity(activity)
                }
                override fun onActivityStarted(activity: Activity) {                }
                override fun onActivityResumed(activity: Activity) {                }
                override fun onActivityPaused(activity: Activity) {                }
                override fun onActivityStopped(activity: Activity) {                }
                override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {                }
                override fun onActivityDestroyed(activity: Activity) {                }
            })
        }

        private fun handleActivity(activity: Activity) {
            //如果类继承了HasAndroidInjector
            if (activity is HasAndroidInjector) {
                //实现注入
                AndroidInjection.inject(activity)
            }
            //如果是Activity的实现
            if (activity is FragmentActivity) {
                //设置fragment的生命周期监听
                activity.supportFragmentManager.registerFragmentLifecycleCallbacks(object :
                    FragmentManager.FragmentLifecycleCallbacks() {
                    override fun onFragmentCreated(
                        fm: FragmentManager,
                        f: Fragment,
                        savedInstanceState: Bundle?
                    ) {
                        //如果fragment继承Injectable,实现注入
                        if (f is Injectable) {
                            AndroidSupportInjection.inject(f)
                        }
                    }
                }, true)
            }
        }
    }
}
```

`DaggerAppComponent` 是由apt自动生成的,我在di文件夹下创建了`AppComponent`类,后续调用的`.application().build().inject()`都来源于该类的实现

之后调用我们自定义的MVVMApplication注册活动生命周期回调,在`onActivityCreated()`当活动创建完成时,会处理Activity,如果该Activity继承于`HasAndroidInjector`,直接使用`AndroidInjection.inject(activity)`注入该activity

而当该activity继承于`FragmentActivity //FragmentAcivity派生于Activity,功能上和Activity一样,但是添加了旧版本安卓的兼容//`获得该Activity的FragmentManager,注册Fragment生命周期回调,当`onFragmentCreated`被调用的时候,我们判断该Fragment是否实现了我们写的接口`Injectable`,如果实现了,就将依赖使用`AndroidSupportInjection.inject(f)`注入该Fragment

```kotlin
interface Injectable {}
```

我们创建`Injectable`接口仅仅是用于让Fragment实现,作为标记,方便控制注入或不注入



### DaggerAppComponent

这个类是apt通过我们编写的`AppComponent`接口来实现的

```kotlin
import android.app.Application
import dagger.BindsInstance
import dagger.Component
import dagger.android.AndroidInjectionModule
import org.phcbest.mvvm_demo.MVVMApplication
import javax.inject.Singleton

@Singleton
@Component(modules = [AndroidInjectionModule::class, AppModule::class, MainActivityModel::class])
interface AppComponent {

    /**
     * 者接口是用于创建构造器的
     */
    @Component.Builder
    interface Builder {
        @BindsInstance
        fun application(application: Application): Builder
        fun build(): AppComponent
    }

    fun inject(mvvmApplication: MVVMApplication?)
}
```

该接口的写法基本是模板写法,照着打,修改一些参数就行

接口使用`Component`注解标记为一个组件,参数中设置了一些模块`AndroidInjectionModule::class, AppModule::class, MainActivityModel::class`,其中AndroidInjectionModule是apt生成的,AppModule和MainActivityModel自己编写的

使用`Singleton`注解声明为单例模式

该接口内包含了一个Builder接口,接口使用`@Component.Builder`注解标记,标记的接口可以使用`DaggerAppComponent.builder()`来进行调用,接口内实现了application和build方法,联调使用`DaggerAppComponent.builder().application(mvvmApplication).build().inject(mvvmApplication)`



### AppModule

```kotlin
import androidx.lifecycle.ViewModelProvider
import dagger.Module
import dagger.Provides
import org.phcbest.mvvm_demo.service.respository.GitHubService
import org.phcbest.mvvm_demo.viewmodel.ProjectViewModelFactory
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module(subcomponents = [ViewModelSubComponent::class])
class AppModule {

    /**
     * 单例并且设置为依赖提供者
     */
    @Singleton
    @Provides
    fun provideGithubService(): GitHubService {
        return Retrofit.Builder().baseUrl(GitHubService.HTTPS_API_GITHUB_URL)
            .addConverterFactory(GsonConverterFactory.create()).build()
            .create(GitHubService::class.java)

    }

    /**
     * 要求返回一个viewmodel提供者的工厂
     */
    @Singleton
    @Provides
    fun provideViewModelFactory(viewModelSubComponent: ViewModelSubComponent.Builder): ViewModelProvider.Factory {
        return ProjectViewModelFactory(viewModelSubComponent.build())
    }

}
```

该类使用Module注解表明是一个模块,拥有一个子模块是`ViewModelSubComponent`

类中实现了两个方法,都是提供者`Provides`的实现,并且是单例模式

provideGithubService方法提供了Retrofit的接口实现,用于网络请求

provideViewModelFactory提供了一个ViewModel工厂的实现,参数ViewModelSubComponent是子组件,该子组件在`@Module`中有提及



### MainActivityModel

```kotlin
import dagger.Module
import dagger.android.ContributesAndroidInjector
import org.phcbest.mvvm_demo.view.ui.MainActivity

@Module
abstract class MainActivityModel {

    @ContributesAndroidInjector(modules = [FragmentBuildersModule::class])
    abstract fun contributeMainActivity(): MainActivity
}
```

使用`@Module`标记为模块

`ContributesAndroidInjector`为此方法的返回类型生成一个 {@link AndroidInjector}。注入器是用 {@link dagger.Subcomponent} 实现的，将是 {@link dagger.Module} 组件的子组件。 

此注解必须应用于 {@link dagger.Module} 中的抽象方法，该方法返回具体的 Android 框架类型（例如 {@code FooActivity}、{@code BarFragment}、{@code MyService} 等）

注解携带modules参数,如下

```kotlin
@Module
abstract class FragmentBuildersModule {
    /**
     * 提供Android 项目Fragment
     */
    @ContributesAndroidInjector
    abstract fun contributeProjectFragment(): ProjectFragment?

    @ContributesAndroidInjector
    abstract fun contributeProjectListFragment(): ProjectListFragment?
}
```



## MVVM流程详解

从ProjectListFragment开始梳理逻辑的流程

```kotlin
class ProjectListFragment : Fragment(), Injectable {

    private lateinit var binding: FragmentProjectListBinding
    private lateinit var projectAdapter: ProjectAdapter


    @Inject
    lateinit var viewModelProvider: ViewModelProvider.Factory

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = DataBindingUtil.inflate(
            inflater,
            R.layout.fragment_project_list,
            container,
            false
        ) as FragmentProjectListBinding
        projectAdapter = ProjectAdapter(projectClickCallback)
        binding.projectList.adapter = projectAdapter
        binding.isLoading = true
        return binding.root
    }

    /**
     * adapter item 的点击事件
     */
    private var projectClickCallback = object : ProjectClickCallback {
        override fun onClick(project: Project) {
            // 切换为项目Fragment
            if (lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)) {
                (activity as MainActivity).show(project)
            }
        }
    }

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)
        //使用ViewModel提供者提供个ViewModel对象
        val viewModel =
            ViewModelProviders.of(
                this,
                viewModelProvider
            )[ProjectListViewModel::class.java]

        observeViewModel(viewModel)
    }

    /**
     * 观测ViewModel
     */
    private fun observeViewModel(viewModel: ProjectListViewModel) {
        //当观测到这个数据发生改变时，执行以下操作
        viewModel.getProjectListObservable()
            .observe(this.viewLifecycleOwner, object : Observer<List<Project>> {
                override fun onChanged(t: List<Project>?) {
                    if (t != null) {
                        binding.isLoading = false
                        projectAdapter.setProjectListParam(t)
                    }
                }
            })
    }


    companion object {
        const val TAG = "ProjectListFragment"

    }
}
```

viewModelProvider是系统提供的lifecycle包内的ViewModel提供者

在onActivityCreated中使用`ViewModelProviders.of`方法来创建了一个ProjectListViewModel的ViewModel

```kotlin
class ProjectListViewModel : AndroidViewModel {

    //UI可以直接观测该参数
    private lateinit var projectListObservable: LiveData<List<Project>>

    /**
     * 在构造的时候进行了网络请求,获得list
     */
    @Inject
    constructor(
        projectRepository: ProjectRepository,
        application: Application
    ) : super(application) {
        this.projectListObservable = projectRepository.getProjectList(application.getString(R.string.userid))
    }

    //UI可以直接观测该参数
    fun getProjectListObservable(): LiveData<List<Project>> {
        return projectListObservable
    }

}
```

该ViewModel创建了一个`LiveData<List<Project>>`类型的变量,构造方法是使用注入器提供参数,构造的时候进行网络请求,将返回的参数set给`projectListObservable`

提供了一个`getProjectListObservable`方法用来观测数据的变化

当数据发生变化的时候会调用`ProjectListFragment`中的`observeViewModel`方法
---
layout: article
title: MiniRetrofit---手动实现一个Retrofit
tags: Android
---

## 使用效果
- 定义API接口
```kotlin
interface AppService {  
    @GET("/artist/songs")  
    fun doNetWork(@Field("id") id: String): YepHttpCall  
}
```
- 初始化并执行请求
```kotlin
val miniRetrofit = MiniRetrofit.Builder().baseUrl("http://192.168.1.108:3000").build()  
val appService = miniRetrofit.create(AppService::class.java)  
appService.doNetWork("6452").enqueue(object : CallBack {  
    override fun failure(e: Exception) {  
        Log.i(TAG, "failure: 失败")  
    }  
  
    override fun response(response: Response) {  
        Log.i(TAG, "response: 成功${response.body()?.string()}")  
    }  
  
})
```

## 定义注解部分
- 作用域在*VALUE_PARAMETER*   是一个作用在方法参数上的注解
```kotlin
@MustBeDocumented  
@Target(AnnotationTarget.VALUE_PARAMETER)  
@Retention(AnnotationRetention.RUNTIME)  
annotation class Field(val value: String)
```
- 作用域在*FUNCTION*   是一个作用在方法上的注解
```kotlin
@MustBeDocumented  
@Target(AnnotationTarget.FUNCTION)  
@Retention(AnnotationRetention.RUNTIME)  
annotation class GET(val value: String = "")
```

## MiniRetrofit类
这个类实现了MiniRetrofit的初始化
- 通过`MiniRetrofit.Builder().baseUrl("http://192.168.1.108:3000").build()`来设置baseurl并且使用构造器来获得实例化的MiniRetrofit对象
- 通过`miniRetrofit.create(AppService::class.java)`来增强AppService接口,返回一个实例化的AppService对象
	- `create`方法中实现了动态代理(在运行时，动态创建一组指定的接口的实现类对象),也就是实现了AOP

```kotlin
  
import java.lang.IllegalArgumentException  
import java.lang.reflect.InvocationHandler  
import java.lang.reflect.Method  
import java.lang.reflect.Proxy  
import java.util.concurrent.ConcurrentHashMap  
  
  
/**  
 * 这个类是仿照retrofit的实现方法来进行开发的一个网络框架  
 */  
class MiniRetrofit {  
  
    //使用map缓存retrofit解析后的方法,也就是缓存增强后的接口文件的  
    private val servicesMethodCache: MutableMap<Method, ServiceMethod> = ConcurrentHashMap()  
  
    private var baseURl: String? = null  
  
    constructor(baseURl: String) {  
        this.baseURl = baseURl  
    }  
  
    fun getBaseUrl(): String {  
        return this.baseURl ?: ""  
    }  
  
    /**  
     * retrofit的构建类  
     */  
    class Builder {  
        private var baseUrl: String? = null  
  
        public fun baseUrl(baseUrl: String): Builder {  
            this.baseUrl = baseUrl  
            return this  
        }  
  
        public fun build(): MiniRetrofit {  
            //只需要判null,因为存在baseurl为空的情况  
            if (baseUrl == null) {  
                throw IllegalArgumentException("baseurl required")  
            }  
            return MiniRetrofit(baseUrl!!)  
        }  
    }  
  
    /**  
     * 构建接口实例  
     * @param method 接口的接口方法  
     * @param args 方法参数内容  
     */  
    private fun loadServiceMethod(method: Method, args: Array<Any>): ServiceMethod {  
        var result = servicesMethodCache[method]  
        if (result != null) {  
            return result  
        }  
        //锁住servicesMethodCache  
        synchronized(servicesMethodCache) {  
            result = servicesMethodCache[method]  
            if (result == null) {  
                //使用ServiceMethod内置的构造器来创建一个新的method  
                result = ServiceMethod.Builder(this, method, args).build()  
                //将创建出来的新的method添加到数组中  
                servicesMethodCache[method] = result!!  
            }  
        }  
        return result!!  
    }  
  
  
    /**  
     * 构建接口实例  
     */  
    fun <T> create(sercice: Class<T>): T {  
        //动态代理  
        return Proxy.newProxyInstance(sercice.classLoader, arrayOf<Class<*>>(sercice),  
            //动态代理的实际处理  
            object : InvocationHandler {  
                override fun invoke(proxy: Any?, method: Method?, args: Array<Any>?): Any {  
                    //1 验证是否接口  
                    require(sercice.isInterface) {  
                        throw IllegalArgumentException("API declarations must be interfaces.")  
                    }  
                    //2 进行构建接口实例  
                    val serviceMethod = loadServiceMethod(method!!, args!!)  
                    //3 调用http框架进行处理  
                    val yepHttpCall = YepHttpCall(serviceMethod)  
                    //该回调函数的返回  
                    return yepHttpCall  
                }  
            }) as T  
    }  
  
}
```


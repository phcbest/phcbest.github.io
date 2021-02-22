---
layout: article
title: SpringBoot拦截器的使用
tags: springboot
---

# SpringBoot拦截器的使用

*拦截器是aop面向切面编程的应用之一，与之相同的还有过滤器，不过过滤器会在拦截器之前执行*

添加拦截器配置文件

```java
@Configuration
public class InterceptorConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        InterceptorRegistration interceptorRegistration = registry.addInterceptor(new TestInterceptor());
        //配置拦截所有
        interceptorRegistration.addPathPatterns("/**");
    }
}
```

编写拦截器规则TestInterceptor

```java
@Slf4j
@Component
public class TestInterceptor extends HandlerInterceptorAdapter {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String servletPath = request.getServletPath();

        log.info(servletPath);
        //使用正则来匹配请求url
        if (servletPath.matches(".*interceptor.*")) {
            //在这里匹配到拦截器后可以进行权限判断
            log.info("匹配到拦截器");
        } else {
            log.info("没有匹配到拦截器");

        }
        return super.preHandle(request, response, handler);
    }
}
```

这个demo 中,当我访问 `@GetMapping("/interceptor/{name}")` 时，会打印匹配到拦截器
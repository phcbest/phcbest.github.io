---
layout: article
title: Spring结合oss进行云存储
tags: SpringCloud
---

## oss介绍

oss是使用api存储文件的服务，是阿里云提供的一种存储服务，但是，oss的api文档特别烂，根本就无法理解，捏麻麻滴，本来我是打算采用客户端请求服务器签名后文件带着签名上传oss的直传模式，但是api文档特别烂，我已经解决了服务器下发签名，但是没有找到客户端带签名上传oss的api文档 ，于是我换了一种简单直接一点的方法，就是客户端请求服务端，将MultipartFile上传到服务器后，服务器上传到oss，也算是解决了，这种方法对服务器带宽占用很大，我这个项目没有多少并发，所以采用了这种方法。

## 服务器端的开发

- `callback.setCallbackBody(StringEscapeUtils.escapeJava(s));`    这个写法是要将json的string进行一个转义，不然oss会报request错误
- 在回调的接口也需要返回一个json，不能是void返回，不然oss会爆repsonse错误

### pom文件

```xml
<!--        阿里云oss的依赖sdk-->
<dependency>
    <groupId>com.aliyun.oss</groupId>
    <artifactId>aliyun-sdk-oss</artifactId>
    <version>3.10.2</version>
</dependency>
```

### controller

```java
@PostMapping("/postFile/{euid}")
public R postFile(@PathVariable("euid") String euid, @RequestParam("file") MultipartFile multipartFile) {
    return coverErrorService.postFileByEuid(euid, multipartFile);
}

/**
 * oss上传完成的回调
 */
@PostMapping("/putoss/callback")
public R putOssCallBack(@RequestBody Map<String, String> respondBody) {
    return coverErrorService.putOssCallBack(respondBody);
}
```

### serviceImpl

```java
@SneakyThrows
@Override
public R postFileByEuid(String euid, MultipartFile multipartFile) {
    CoverErrorEntity errorByEuid = findErrorByEuid(euid);
    if (errorByEuid != null) {
        OSS ossClient = ossClientUtils.getOssClient();
        String data = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        String[] split = multipartFile.getOriginalFilename().split("\\.");
        String info = String.format("%s/%s/%s.%s", data, errorByEuid.getUid(), UUID.randomUUID(), split[split.length - 1]);
        //设置回调
        PutObjectRequest putObjectRequest = new PutObjectRequest("cover-safety", info,
                multipartFile.getInputStream());
        Callback callback = new Callback();
        callback.setCallbackUrl(callBackUrl);
        log.info("请求链接:" + callBackUrl);
        HashMap<String, String> cb = new HashMap<>();
        cb.put("statue", "success");
        cb.put("url", "https://cover-safety.oss-cn-hangzhou.aliyuncs.com/" + info);
        cb.put("euid", errorByEuid.getUid());
        String s = new ObjectMapper().writeValueAsString(cb);
        callback.setCallbackBody(StringEscapeUtils.escapeJava(s));
        callback.setCalbackBodyType(Callback.CalbackBodyType.JSON);
        putObjectRequest.setCallback(callback);
        //上传
        ossClient.putObject(putObjectRequest);
        ossClient.shutdown();
    } else {
        return R.error().put(Constant.REASON, "没有对应的EUID");
    }
    return R.ok();
}

@Override
public R putOssCallBack(Map<String, String> respondBody) {
    log.info("存储成功{}", respondBody);
    //进行一个数据库的存储
    CoverErrorEntity euid = findErrorByEuid(respondBody.get("euid"));
    if (euid != null) {
        //存储路径地址
        UpdateWrapper<CoverErrorEntity> updateWrapper = new UpdateWrapper<>();
        updateWrapper.eq("uid", euid.getUid());
        euid.setErrorImage(respondBody.get("url"));
        this.baseMapper.update(euid, updateWrapper);
    }
    return R.ok();
}
```

### oss工具类

```java
package com.xyxy.coversafety.coversafetywork.work.tools.utils;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.common.utils.BinaryUtil;
import com.aliyun.oss.model.MatchMode;
import com.aliyun.oss.model.PolicyConditions;
import com.xyxy.coversafety.coversafetywork.work.entity.CoverErrorEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * @Author: PengHaiChen
 * @Description:
 * @Date: Create in 12:51 2021/10/15
 * 在业务逻辑中，需要客户端请求服务端的签名后上传到oss，不然本地服务器载荷太大了
 */
@Component
@Slf4j
public class OssClientUtils {

    @Value("${oss.endpoint}")
    private String endpoint;
    @Value("${oss.access-key}")
    private String accessKeyId;
    @Value("${oss.secret-key}")
    private String accessKeySecret;

    private Map<String, String> respMap;

    public OSS getOssClient() {
        log.info(endpoint, accessKeyId, accessKeySecret);
        return new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
    }

    public Map<String, String> generatePostPolicy(CoverErrorEntity coverErrorEntity) {
        String bucket = "cover-safety"; // 请填写您的 bucketname 。
        String host = "https://" + bucket + "." + endpoint; // host的格式为 bucketname.endpoint
        // callbackUrl为上传回调服务器的URL，请将下面的IP和Port配置为您自己的真实信息。
//        String callbackUrl = "http://88.88.88.88:8888";
        String format = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        String dir = String.format("%s/%s/", format, coverErrorEntity.getUid());// 用户上传文件时指定的前缀。

        // 创建OSSClient实例。
        OSS ossClient = getOssClient();
        try {
            long expireTime = 180;
            long expireEndTime = System.currentTimeMillis() + expireTime * 1000;
            Date expiration = new Date(expireEndTime);
            PolicyConditions policyConds = new PolicyConditions();
            policyConds.addConditionItem(PolicyConditions.COND_CONTENT_LENGTH_RANGE, 0, 10485760);
            policyConds.addConditionItem(MatchMode.StartWith, PolicyConditions.COND_KEY, dir);

            String postPolicy = ossClient.generatePostPolicy(expiration, policyConds);
            byte[] binaryData = postPolicy.getBytes("utf-8");
            String encodedPolicy = BinaryUtil.toBase64String(binaryData);
            String postSignature = ossClient.calculatePostSignature(postPolicy);

            respMap = new LinkedHashMap<String, String>();

            respMap.put("accessid", accessKeyId);
            respMap.put("policy", encodedPolicy);
            respMap.put("signature", postSignature);
            respMap.put("dir", dir);
            respMap.put("host", host);
            respMap.put("expire", String.valueOf(expireEndTime / 1000));
            // respMap.put("expire", formatISO8601Date(expiration));
        } catch (Exception e) {
            // Assert.fail(e.getMessage());
            log.info(e.getMessage());
        } finally {
            ossClient.shutdown();
        }
        return respMap;
    }
}
```

### ossyml配置

```yml
oss:
  secret-key: ****
  access-key: ****
  endpoint: oss-cn-hangzhou.aliyuncs.com
  callback-url: http://119.3.40.236:23333/work/covererror/putoss/callback
```

---
layout: article
title: SpringBoot使用MQQTT协议与物联网设备通信
tags: SpringCloud
---

## 提前准备

这个是使用RabbitMQ作为中间件，在消息队列中以订阅者的身份工作，在服务器中安装好docker，之后在docker 安装rabbitmq:3.9-management

```bash
docker run -d --name rabbitmq -p 1883:1883 -p 5671:5671 -p 5672:5672 -p 4369:4369 -p 25672:25672 -p 15671:15671 -p 15672:15672 rabbitmq:3.9-management
```

*端口15672是管理用的前端端口，1883是mqtt消息的收发端口*

这个东西安装好后，使用下方命令进入docker

```bash
docker exec -it rabbitmq /bin/bash
```

docker中的rabbitmq需要启动一个mqtt的plugins，所以进入容器后执行

```
rabbitmq-plugins enable rabbitmq_mqtt
```

rabbitmq默认的用户名和密码是guest

## 后端接收物联网设备发送的mqtt消息

项目添加依赖

```xml
        <dependency>
            <groupId>org.springframework.integration</groupId>
            <artifactId>spring-integration-mqtt</artifactId>
        </dependency>
```

因为是spring族的依赖，所以不需要使用版本号，已经指定了parent的版本号

```xml
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.5.3</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
```

添加完后编写配置文件

```yml
mqtt:
  enabled: true
  username: ******
  password: ******
  url: tcp://119.3.40.236:1883 #mqttServerAddress pwd is cover.123456
  clientId: f1819e99-9e9d-4a89-ae0a-65612afac6c4 #mqtt server client id (can also be understood as queue id)
  topic: cover.queue1 #The mqtt server subscribes to the topic (that is, the routing key)
```

这配置文件并不是与框架整合的，我们这里只是编写一个默认的变量，方便后面编写配置类的时候使用，首先是编写mqtt的基础config

```java
package com.xyxy.coversafety.coversafetywork.work.mqtt2;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;

/**
 * @Author: PengHaiChen
 * @Description:
 * @Date: Create in 19:04 2021/8/27
 * @ConditionalOnProperty 控制类bean 是否生效
 */
@Configuration
@ConditionalOnProperty(value = "mqtt.enabled", havingValue = "true")
public class MqttBaseConfig {

    @Value("${mqtt.url}")
    private String mqttHost;
    @Value("${mqtt.username}")
    private String mqttUserName;
    @Value("${mqtt.password}")
    private String mqttPwd;

    /**
     * setCleanSession 用于设置时候每次连接上去都是一个新的会话
     * 
     * @return
     */
    @Bean
    public MqttPahoClientFactory factory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setUserName(mqttUserName);
        options.setPassword(mqttPwd.toCharArray());
        options.setCleanSession(false);
        options.setServerURIs(new String[]{mqttHost});
        factory.setConnectionOptions(options);
        return factory;
    }
}
```

然后是编写一个连接的配置类，然后要将消息的处理者注册为服务激活器模式`ServiceActivator`，用于使用指定的clientId来进入mqtt的exchange

```java
package com.xyxy.coversafety.coversafetywork.work.mqtt2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

/**
 * @Author: PengHaiChen
 * @Description:
 * @Date: Create in 08:35 2021/8/29
 */
@Configuration
@ConditionalOnProperty(value = "mqtt.enabled", havingValue = "true")
public class MqttInConfig {
    private final MqttMessageReceiver mqttMessageReceiver;


    @Value("${mqtt.clientId}")
    private String clientId;


    public MqttInConfig(MqttMessageReceiver mqttMessageReceiver) {
        this.mqttMessageReceiver = mqttMessageReceiver;
    }

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    /**
     * 任何能够向MessageChannel发送消息的组件的基本接口。
     * setManualAcks就是手动ack
     * @param mqttInputChannel
     * @param factory
     * @return
     */
    @Bean
    public MessageProducer channelInBound(MessageChannel mqttInputChannel, MqttPahoClientFactory factory) {
        MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(clientId, factory, "cover.queue1");
        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(2);
        adapter.setManualAcks(true);
        adapter.setOutputChannel(mqttInputChannel);
        return adapter;
    }

    /**
     * mqtt入站消息处理工具
     *
     * @return
     */
    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler mqttMessageHandler() {
        return this.mqttMessageReceiver;
    }


}
```

然后就是消息处理的类，用于处理接收到了mqtt消息，这里接收到了mqtt消息后，交给了mqtt的Service的impl层来处理

```java
package com.xyxy.coversafety.coversafetywork.work.mqtt2;

import com.xyxy.coversafety.coversafetywork.work.service.ObjectMqttService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.MessagingException;
import org.springframework.stereotype.Component;

/**
 * 入栈消息处理
 *
 * @Author: PengHaiChen
 * @Description:
 * @Date: Create in 10:12 2021/8/29
 */
@Component
@ConditionalOnProperty(value = "mqtt.enabled", havingValue = "true")
@Slf4j
public class MqttMessageReceiver implements MessageHandler {

    @Autowired
    private ObjectMqttService objectMqttService;

    /**
     * mqtt有保留消息机制，broker会存有最后一条消息，这条消息不会显示在queue中，
     * 如需删除保留消息，以retain推送一条空消息即可
     *
     * @param message
     * @throws MessagingException
     */
    @Override
    public void handleMessage(Message<?> message) throws MessagingException {
        //收到的消息交给逻辑层处理
        objectMqttService.handlerMessage(message);
    }
}
```

收到消息后的逻辑处理方法

```java
package com.xyxy.coversafety.coversafetywork.work.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xyxy.coversafety.coversafetywork.work.entity.CoverInfoEntity;
import com.xyxy.coversafety.coversafetywork.work.entity.ObjectMqttEntity;
import com.xyxy.coversafety.coversafetywork.work.service.CoverInfoService;
import com.xyxy.coversafety.coversafetywork.work.service.ObjectMqttService;
import com.xyxy.coversafety.coversafetywork.work.tools.CodeUtils;
import com.xyxy.coversafety.coversafetywork.work.tools.R;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.StaticMessageHeaderAccessor;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Service;

/**
 * @Author: PengHaiChen
 * @Description:
 * @Date: Create in 02:38 2021/8/30
 */
@Slf4j
@Service("objectMqttService")
public class ObjectMqttServiceImpl implements ObjectMqttService {

    @Autowired
    private CoverInfoService coverInfoService;

    @Override
    public void handlerMessage(Message<?> message) {
        log.info("{}消息", message.getPayload());
        try {
            ObjectMqttEntity objectMqttEntity = new ObjectMapper().readValue(message.getPayload().toString(), ObjectMqttEntity.class);
            if (objectMqttEntity.dataType == 0 ||
                    objectMqttEntity.getLongLat() == null ||
                    objectMqttEntity.getBatter() == null ||
                    objectMqttEntity.getPowerLevel() == null ||
                    objectMqttEntity.getFlammableGas() == null) {
                log.info("{}消息没有包含必要信息", message.getHeaders().getId());
            }
            //比对数据库中是否存在一个uuid相同的井盖
            R byUUId = coverInfoService.getByUUId(objectMqttEntity.getUuid());
            if ("没有该条数据".equals(byUUId.get("reason"))) {
                log.info("不存在该uuid对应的井盖");
            }
            CoverInfoEntity coverInfoEntity = new CoverInfoEntity();
            coverInfoEntity.setUid(objectMqttEntity.uuid);
            switch (objectMqttEntity.dataType) {
                case 1:
                    double[] longLat = CodeUtils.isLongLat(objectMqttEntity.longLat);
                    if (StringUtils.isEmpty(objectMqttEntity.getLongLat()) &&
                            longLat == null) {
                        log.info("传递经纬度，但是未包含经纬度信息");
                    } else {
                        log.info("传递经纬度");
                        coverInfoEntity.setCoverLongLat(longLat[0] + "-" + longLat[1]);
                    }
                    break;
                case 2:
                    if (StringUtils.isEmpty(objectMqttEntity.getPowerLevel())) {
                        log.info("传递电量，但是未包含电量信息");
                    }
                    break;
                case 3:
                    if (StringUtils.isEmpty(objectMqttEntity.getBatter())) {
                        log.info("传递倾斜度，但是未包含倾斜度信息");
                    } else {
                        log.info("传递倾斜度");
                        Integer integer = Integer.valueOf(objectMqttEntity.getBatter());
                        coverInfoEntity.setCoverSensorStatus(integer);
                    }
                case 4:
                    if (StringUtils.isEmpty(objectMqttEntity.getFlammableGas())) {
                        log.info("传递依然气体，但是未包含易燃气体信息");
                    } else {
                        log.info("传递依然气体");
                        Integer integer = Integer.valueOf(objectMqttEntity.getFlammableGas());
                        coverInfoEntity.setCoverGasStatus(integer);
                    }
                    break;
                default:
                    break;
            }
            R request = coverInfoService.upCoverInfoDateByUuid(coverInfoEntity);
            log.info("{}",request);

        } catch (JsonProcessingException e) {
            log.info("{}消息解析失败，非指定格式", message.getHeaders().getId());
            AckMessage(message);
        }
    }

    private void AckMessage(Message<?> message) {
        StaticMessageHeaderAccessor.getAcknowledgment(message).acknowledge();
    }
}
```
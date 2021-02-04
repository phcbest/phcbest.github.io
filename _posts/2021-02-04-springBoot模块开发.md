---
layout: article
title: SpringBoot模块化开发
tags: springboot
---



## SpringBoot模块化开发

*在一个可持续性的后端项目中，分模块开发是很有必要的。通常是按照业务不同开发不同的模块*

下方示例一个我搭建的spring boot cli 并没有按照功能模块开发，而是按照mvc分层开发

### 父级依赖

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>org.phcbest</groupId>
    <artifactId>multi-page</artifactId>
    <packaging>pom</packaging>
    <version>1.0-SNAPSHOT</version>
    <modules>
        <module>start</module>
        <module>multi-controller</module>
        <module>multi-service</module>
    </modules>

    <!--限定java版本-->
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <!--这个存储库的目的是管理所有的spring依赖，防止版本对不上，
        下方springboot的依赖不需要加上版本了-->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.5.0-SNAPSHOT</version>
    </parent>
    <!--两个核心依赖-->
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!--web依赖-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--数据库-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>2.1.4</version>
        </dependency>
    </dependencies>

    <!-- 编译设置-->
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
    <!--配置项目的远程仓库-->
    <repositories>
        <repository>
            <id>spring-milestones</id>
            <name>Spring Milestones</name>
            <url>https://repo.spring.io/milestone</url>
        </repository>
        <repository>
            <id>spring-snapshots</id>
            <name>Spring Snapshots</name>
            <url>https://repo.spring.io/snapshot</url>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </repository>
    </repositories>
    <!-- 配置插件的远程仓库-->
    <pluginRepositories>
        <pluginRepository>
            <id>spring-milestones</id>
            <name>Spring Milestones</name>
            <url>https://repo.spring.io/milestone</url>
        </pluginRepository>
        <pluginRepository>
            <id>spring-snapshots</id>
            <name>Spring Snapshots</name>
            <url>https://repo.spring.io/snapshot</url>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </pluginRepository>
    </pluginRepositories>

</project>
```

### 启动模块

- 注意程序入口不能在java类下面，会引发扫不到包的错
- 因为是多模块，程序入口需要配置mapper 的扫描路径 @MapperScan("org.phcbest.multi.dao")
- xml中mybatis扫描xml需要使用 classpath*:mapper/*.xml
- 因为需要扫描到控制器组件，启动模块要依赖控制器模块

### 控制器模块

- 控制层代码正常写
- 控制器层需要调用服务层，所以要依赖服务层模块

### 服务层模块

- 写逻辑接口，并且实现接口逻辑
- 如果没做启动模块的xml扫描和mapper扫描，服务层会跑不通

## 文件结构

```
E:.
│  multi-page.iml
│  pom.xml
│
├─.idea
│  │  .gitignore
│  │  compiler.xml
│  │  dataSources.local.xml
│  │  dataSources.xml
│  │  encodings.xml
│  │  jarRepositories.xml
│  │  misc.xml
│  │  uiDesigner.xml
│  │  workspace.xml
│  │
│  ├─dataSources
│  │  │  27ea877a-3d6b-4207-9fb3-96c23e87b0b4.xml
│  │  │
│  │  └─27ea877a-3d6b-4207-9fb3-96c23e87b0b4
│  │      └─storage_v2
│  │          └─_src_
│  │              └─schema
│  │                      information_schema.FNRwLQ.meta
│  │
│  ├─EasyCodeConfig
│  │      match-mch_customer.json
│  │
│  └─inspectionProfiles
│          Project_Default.xml
│
├─multi-controller
│  │  multi-controller.iml
│  │  pom.xml
│  │
│  ├─src
│  │  ├─main
│  │  │  ├─java
│  │  │  │  └─org
│  │  │  │      └─phcbest
│  │  │  │          └─multi
│  │  │  │              └─controller
│  │  │  │                      MchCustomerController.java
│  │  │  │                      TestController.java
│  │  │  │
│  │  │  └─resources
│  │  └─test
│  │      └─java
│  └─target
│      ├─classes
│      │  ├─META-INF
│      │  │      multi-controller.kotlin_module
│      │  │
│      │  └─org
│      │      └─phcbest
│      │          └─multi
│      │              └─controller
│      │                      MchCustomerController.class
│      │                      TestController.class
│      │
│      └─generated-sources
│          └─annotations
├─multi-service
│  │  multi-service.iml
│  │  pom.xml
│  │
│  ├─src
│  │  ├─main
│  │  │  ├─java
│  │  │  │  └─org
│  │  │  │      └─phcbest
│  │  │  │          └─multi
│  │  │  │              ├─dao
│  │  │  │              │      MchCustomerDao.java
│  │  │  │              │
│  │  │  │              ├─entity
│  │  │  │              │      MchCustomer.java
│  │  │  │              │
│  │  │  │              └─service
│  │  │  │                  │  MchCustomerService.java
│  │  │  │                  │
│  │  │  │                  └─impl
│  │  │  │                          MchCustomerServiceImpl.java
│  │  │  │
│  │  │  └─resources
│  │  │      └─mapper
│  │  │              MchCustomerDao.xml
│  │  │
│  │  └─test
│  │      └─java
│  └─target
│      ├─classes
│      │  ├─mapper
│      │  │      MchCustomerDao.xml
│      │  │
│      │  └─org
│      │      └─phcbest
│      │          └─multi
│      │              ├─dao
│      │              │      MchCustomerDao.class
│      │              │
│      │              ├─entity
│      │              │      MchCustomer.class
│      │              │
│      │              └─service
│      │                  │  MchCustomerService.class
│      │                  │
│      │                  └─impl
│      │                          MchCustomerServiceImpl.class
│      │
│      └─generated-sources
│          └─annotations
├─src
│  ├─main
│  │  ├─java
│  │  └─resources
│  └─test
│      └─java
└─start
    │  pom.xml
    │  start.iml
    │
    ├─src
    │  ├─main
    │  │  ├─java
    │  │  │  └─org
    │  │  │      └─phcbest
    │  │  │          └─multi
    │  │  │                  MultiApplication.java
    │  │  │
    │  │  └─resources
    │  │          application.yml
    │  │
    │  └─test
    │      └─java
    └─target
        │  start-1.0-SNAPSHOT.jar
        │  start-1.0-SNAPSHOT.jar.original
        │
        ├─classes
        │  │  application.yml
        │  │
        │  ├─META-INF
        │  │      start.kotlin_module
        │  │
        │  └─org
        │      └─phcbest
        │          └─multi
        │                  MultiApplication.class
        │
        ├─generated-sources
        │  └─annotations
        ├─generated-test-sources
        │  └─test-annotations
        ├─maven-archiver
        │      pom.properties
        │
        └─maven-status
            └─maven-compiler-plugin
                ├─compile
                │  └─default-compile
                │          inputFiles.lst
                │
                └─testCompile
                    └─default-testCompile
                            inputFiles.lst
```



## springboot cli github 链接

- https://github.com/phcbest/SB_MVC_CLI.git
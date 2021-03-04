---
layout: article
title: 搭建代理池
tags: other
---

# 使用redis和docker来搭建一个代理池

搭建代理池的初始动力是因为我的自动打卡服务器项目的ip被蘑菇钉给封了，那没办法只能搭建代理池来解决这个问题

代理池不是自己购买的，是通过爬虫在网上抓取的，github项目地址

https://github.com/jhao104/proxy_pool

直接使用docker 来安装会非常的方便

```
docker pull jhao104/proxy_pool
```

使用docker 命令来运行代理池项目，db改为0，直接将爬取的数据存入redis 的第0个数据库

```
docker run --env DB_CONN=redis://:password@ip:port/db -p 5010:5010 jhao104/proxy_pool:latest
```

- Api

启动web服务后, 默认配置下会开启 [http://127.0.0.1:5010](http://127.0.0.1:5010/) 的api接口服务:

| api         | method | Description      | arg  |
| ----------- | ------ | ---------------- | ---- |
| /           | GET    | api介绍          | None |
| /get        | GET    | 随机获取一个代理 | None |
| /get_all    | GET    | 获取所有代理     | None |
| /get_status | GET    | 查看代理数量     | None |
| /delete     | GET    | 删除代理         |      |

这个项目只要跑通了docker和redis 连接，就没有这么多问题了，使用起来也很方便，调api就是了
---
layout: article
title: Netty Demo
tags: 网络编程
---

1. 依赖

   ```xml
   <dependency>
       <groupId>io.netty</groupId>
       <artifactId>netty-all</artifactId>
       <version>4.1.66.Final</version>
   </dependency>
   ```

2. 编写服务端

   1. 服务

      ```java
      package com.phcyz.toolboxserver.nettyServer;
      
      import io.netty.bootstrap.ServerBootstrap;
      import io.netty.channel.ChannelFuture;
      import io.netty.channel.ChannelInitializer;
      import io.netty.channel.ChannelOption;
      import io.netty.channel.nio.NioEventLoopGroup;
      import io.netty.channel.sctp.nio.NioSctpServerChannel;
      import io.netty.channel.socket.SocketChannel;
      import io.netty.channel.socket.nio.NioServerSocketChannel;
      import lombok.extern.slf4j.Slf4j;
      
      
      /**
       * @Author: PengHaiChen
       * @Description:
       * @Date: Create in 16:11 2021/7/28
       */
      @Slf4j
      public class ServerTest {
          /**
           * 端口
           */
          private int port;
      
          public ServerTest(int port) {
              this.port = port;
          }
      
          /**
           * 开启服务的方法
           */
          public void StartNetty() {
              /*
              创建两个 eventLoop 组 是netty接受请求和处理io请求的线程
      
              NioEventLoopGroup是一个处理I/O操作的多线程事件循环
              Netty为不同类型的传输提供了各种EventLoopGroup实现。
              在本例中，我们正在实现一个服务器端应用程序，因此将使用两个NioEventLoopGroup。
              第一个，通常称为“boss”，接受传入的连接。
              第二个，通常称为“worker”，当boss接受连接并注册被接受的连接到worker时，处理被接受连接的流量。
              使用了多少线程以及如何将它们映射到创建的通道取决于EventLoopGroup实现，甚至可以通过构造函数进行配置。
               */
      
              log.info("netty start service success");
              NioEventLoopGroup acceptor = new NioEventLoopGroup();
              NioEventLoopGroup worker = new NioEventLoopGroup();
      
              //创建启动类
              ServerBootstrap bootstrap = new ServerBootstrap();
              //配置启动参数,将循环线程组给进去，前者处理客户端连接事件，后者处理网络io
              bootstrap.group(acceptor, worker);
              //Socket的标准参数
              bootstrap.option(ChannelOption.SO_BACKLOG, 1024);
              //创建一个SocketChannel工厂
              bootstrap.channel(NioServerSocketChannel.class);
              //创建一个处理器处理request
              bootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
                  @Override
                  protected void initChannel(SocketChannel ch) throws Exception {
                      //注册处理器
                      ch.pipeline().addLast(new SimpleServerHandler());
                  }
              });
              //绑定端口，接收进来的连接
              try {
                  ChannelFuture f = bootstrap.bind(port).sync();
                  f.channel().closeFuture().sync();
              } catch (InterruptedException e) {
                  e.printStackTrace();
              } finally {
                  acceptor.shutdownGracefully();
                  worker.shutdownGracefully();
              }
          }
      
      }
      ```

   2. 服务器的数据的处理器

      ```java
      package com.phcyz.toolboxserver.nettyServer;
      
      import io.netty.buffer.ByteBuf;
      import io.netty.channel.ChannelHandler;
      import io.netty.channel.ChannelHandlerContext;
      import io.netty.channel.ChannelInboundHandlerAdapter;
      import io.netty.util.concurrent.EventExecutorGroup;
      import lombok.extern.slf4j.Slf4j;
      
      /**
       * @Author: PengHaiChen
       * @Description:
       * @Date: Create in 16:28 2021/7/28
       */
      @Slf4j
      public class SimpleServerHandler extends ChannelInboundHandlerAdapter {
      
          /**
           * 用于读取客户端发送的信息
           */
          @Override
          public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
              log.info("SimpleServerHandler.channelRead");
              ByteBuf result = (ByteBuf) msg;
              //创建一个大小为msg可读字节大小的byte数组
              byte[] result1 = new byte[result.readableBytes()];
              //将数据读取到创建的byte数组中
              result.readBytes(result1);
              String resultStr = new String(result1);
              //打印客户端的信息
              log.info("Client said" + resultStr);
              //释放资源
              result.release();
      
              //向客户端发送消息
              String response = "netty response";
              ByteBuf encoder = ctx.alloc().buffer(4 * response.length());
              encoder.writeBytes(response.getBytes());
              ctx.write(encoder);
              ctx.flush();
      
          }
      
          /***
           * 异常处理的方法
           */
          @Override
          public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
              cause.printStackTrace();
              ctx.close();
          }
      
          /**
           * 信息获取完毕后的操作
           */
          @Override
          public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
              ctx.flush();
          }
      }
      ```

3. 编写客户端

   1. 服务

      ```java
      package com.phcyz.toolboxserver.nettyServer.nettyClient;
      
      import io.netty.bootstrap.Bootstrap;
      import io.netty.channel.ChannelFuture;
      import io.netty.channel.ChannelInitializer;
      import io.netty.channel.ChannelOption;
      import io.netty.channel.nio.NioEventLoopGroup;
      import io.netty.channel.socket.SocketChannel;
      import io.netty.channel.socket.nio.NioSocketChannel;
      import lombok.extern.slf4j.Slf4j;
      import sun.rmi.runtime.Log;
      
      /**
       * @Author: PengHaiChen
       * @Description:
       * @Date: Create in 09:13 2021/7/29
       */
      @Slf4j
      public class ClientTest {
      
          public void connect(String ip, int port) {
              log.info("netty start client success");
              NioEventLoopGroup worker = new NioEventLoopGroup();
              Bootstrap b = new Bootstrap();
              //设置引导程序的group
              b.group(worker);
              //构造socketChannel工厂
              b.channel(NioSocketChannel.class);
              //参数选项，固定参数
              b.option(ChannelOption.SO_KEEPALIVE, true);
              //客户端处理器
              b.handler(new ChannelInitializer<SocketChannel>() {
                  @Override
                  protected void initChannel(SocketChannel ch) throws Exception {
                      //添加处理器
                      ch.pipeline().addLast(new SimpleClientHandler());
                  }
              });
              //开启客户端监听
              ChannelFuture f = b.connect(ip, port);
              //等待数据直到客户端关闭
              try {
                  f.channel().closeFuture().sync();
              } catch (InterruptedException e) {
                  e.printStackTrace();
              } finally {
                  worker.shutdownGracefully();
              }
          }
      
      }
      ```

   2. 服务端数据处理器

      ```java
      package com.phcyz.toolboxserver.nettyServer.nettyClient;
      
      import io.netty.buffer.ByteBuf;
      import io.netty.channel.ChannelHandler;
      import io.netty.channel.ChannelHandlerContext;
      import io.netty.channel.ChannelInboundHandlerAdapter;
      import io.netty.util.concurrent.EventExecutorGroup;
      import lombok.extern.slf4j.Slf4j;
      
      /**
       * @Author: PengHaiChen
       * @Description:
       * @Date: Create in 09:36 2021/7/29
       */
      @Slf4j
      public class SimpleClientHandler extends ChannelInboundHandlerAdapter {
          /**
           * 接受服务端发过来的消息
           *
           * @param ctx
           * @param msg
           * @throws Exception
           */
          @Override
          public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
              log.info("SimpleClientHandler.channelRead");
              ByteBuf result = (ByteBuf) msg;
              byte[] result1 = new byte[result.readableBytes()];
              result.readBytes(result1);
              log.info("service said" + new String(result1));
              result.release();
      
          }
      
          /**
           * 异常处理
           *
           * @param ctx
           * @param cause
           * @throws Exception
           */
          @Override
          public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
              cause.printStackTrace();
              ctx.close();
          }
      
          /**
           * 向服务器发送消息
           *
           * @param ctx
           * @throws Exception
           */
          @Override
          public void channelActive(ChannelHandlerContext ctx) throws Exception {
              String msg = "hello server this is client";
              ByteBuf encode = ctx.alloc().buffer(4 * msg.length());
              encode.writeBytes(msg.getBytes());
              ctx.write(encode);
              ctx.flush();
          }
      }
      ```




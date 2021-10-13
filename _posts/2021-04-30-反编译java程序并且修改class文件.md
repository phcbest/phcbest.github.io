---
layout: article
title: 反编译jar包并且修改cless字节码文件
tags: other
---

## 使用jd-gui即可反编译jar包

http://java-decompiler.github.io/

## 使用jclasslib 可以阅读class文件

https://github.com/ingokegel/jclasslib

## 使用jclasslib修改class文件

- 引入 `jclasslib` 安装路径`lib` 文件夹下的所有 jar包

- 使用工具类来修改字节码对应的常量

- ```java
  import java.io.*;
  
  import org.gjt.jclasslib.io.ClassFileWriter;
  import org.gjt.jclasslib.structures.ClassFile;
  import org.gjt.jclasslib.structures.Constant;
  import org.gjt.jclasslib.structures.InvalidByteCodeException;
  import org.gjt.jclasslib.structures.constants.ConstantUtf8Info;
  
  /**
   * @Author: PengHaiChen
   * @Description:
   * @Date: Create in 14:22 2021/4/30
   */
  public class test {
      public static void main(String[] args) throws IOException, InvalidByteCodeException {
          String filePath = "F:\\decompilation\\AuthInterceptor.class";
          FileInputStream fis = new FileInputStream(filePath);
          DataInput di = new DataInputStream(fis);
          ClassFile cf = new ClassFile();
          cf.read(di);
          Constant[] infos = cf.getConstantPool();
  
          int count = infos.length;
          for (int i = 0; i < count; i++) {
              if (infos[i] != null) {
                  System.out.print(i);
                  System.out.print(" = ");
                  System.out.print(infos[i].getVerbose());
                  System.out.print(" \n");
                  //System.out.println(infos[i].getConstantType().toString());
                  if (i == 49) {//刚刚找到的是49位置
                      ConstantUtf8Info uInfo = (ConstantUtf8Info) infos[i]; //刚刚那里是CONSTANT_Utf-8_info所以这里要用这个
                      uInfo.setString("2999-04-30 24:00:00");
                      infos[i] = uInfo;
                  }
              }
          }
          //这种方式也可以，一样的
        /*    if(infos[count] != null) {
              ConstantUtf8Info uInfo = (ConstantUtf8Info) infos[i]; //刚刚那里是CONSTANT_Utf-8_info所以这里要用这个
              uInfo.setBytes("baidu".getBytes());
             infos[count] = uInfo;
          }*/
  
          cf.setConstantPool(infos);
          fis.close();
          File f = new File(filePath);
          ClassFileWriter.writeToFile(f, cf);
  
      }
  }
  ```
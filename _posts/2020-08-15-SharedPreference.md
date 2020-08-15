# SharedPreference

写入

```java
//可以创建一个新的SharedPreference来对储存的文件进行操作
SharedPreferences sp=context.getSharedPreferences("名称", Context.MODE_PRIVATE);
//像SharedPreference中写入数据需要使用Editor
SharedPreference.Editor editor = sp.edit();
//类似键值对
editor.putString("name", "string");
editor.putInt("age", 0);
editor.putBoolean("read", true);
//editor.apply();
editor.commit();
```

读取

```java
SharedPreference sp=context.getSharedPreferences("名称", Context.MODE_PRIVATE);
//第一个参数是键名，第二个是默认值
String name=sp.getString("name", "暂无");
int age=sp.getInt("age", 0);
boolean read=sp.getBoolean("isRead", false);
```

删除

```java
SharedPreference sp=getSharedPreferences("名称", Context.MODE_PRIVATE);
SharedPrefence.Editor editor=sp.edit();
editor.clear();
editor.commit();
```

检索

```java
SharedPreferences sp=context.getSharedPreferences("名称", Context.MODE_PRIVATE);
//检查当前键是否存在
boolean isContains=sp.contains("key");

//使用getAll可以返回所有可用的键值
//Map<String,?> allMaps=sp.getAll();
```
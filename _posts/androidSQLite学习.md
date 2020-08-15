[toc]

# AndroidSQLite学习

## 创建数据库与数据库升级

- 写一个类去继承*SqliteOpenhelper* ,实现其中的方法，创建构造方法，填写构造参数。
- 创建该类的子类对象，然后调用getReadableBata()或者getWirteableDatabase()方法，就可以创建数据库
- 当我需要去创建字段的时候，我需要在类的回调方法*onCreate*中去执行Sql语句，该语句只会在创建数据库的时候调用一次
- 当我需要去更新字段的时候，我需要在回调方法*onUpgrade*中使用switch来判断版本，并且选择更新数据库

## 数据库的增删改查

### 增加数据

- 




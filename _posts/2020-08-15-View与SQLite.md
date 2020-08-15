---
title: view通过sqlite进行数据填充
tags: Android
---

# view通过sqlite进行数据填充

这次的项目主要是有适配器和数据库和listview操作。

> *项目中需要注意的地方有listview的长按操作，不能与点击操作搞混，还有上下文菜单的重写需要写在主方法的外边，如果listview的 item中有butoon，可能会覆盖点击操作，这个需要注意*

充分运用dialog界面来进行信息收集

源码界面 

**主界面**

``` java
package com.phc.a2020_03_22;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import android.accounts.Account;
import android.annotation.SuppressLint;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.os.Bundle;
import android.util.Log;
import android.view.ContextMenu;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.phc.a2020_03_22.dao.dataSql;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    private List<javaBeanAdapter> adapters_data = new ArrayList<javaBeanAdapter>();
    private ListView listView;
    private Button add , search;
    private EditText searchName, searchMoney;
    private TextView listviewId, listviewName, listviewMoney;

    private void modle() {
        listView = (ListView) findViewById(R.id.list_view);
        add = (Button) findViewById(R.id.add);
        search = (Button) findViewById(R.id.search);
        searchName = (EditText) findViewById(R.id.search_name);
        searchMoney = (EditText) findViewById(R.id.search_money);
    }

    //添加重写的数据库帮助类
    private dataSql sqlite = new dataSql(this);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        modle();
        //添加的按钮事件
        add.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                tapAdd();
            }
        });
        //搜索的按钮事件
        search.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!"".equals(searchName.getText().toString()) || !"".equals(searchMoney.getText().toString())){
                    if (!"".equals(searchName.getText().toString()) && !"".equals(searchMoney.getText().toString())){
                        SQLiteDatabase db = sqlite.getReadableDatabase();
                        Cursor query = db.query(constants.PRODUCTINFORMATIONDATASHEET, null, "name like '%"+searchName.getText().toString()+"%' and money like '%"+searchMoney.getText().toString()+"%'"
                                , null, null, null, null);
                        while (query.moveToNext()){
                            String id = query.getString(0);
                            String name = query.getString(1);
                            String money = query.getString(2);

                            Log.d("test", "商品名称"+id+name+money);
                        }
                        query.close();
                        db.close();
                    }else {
                        if ("".equals(searchName.getText().toString()) && !"".equals(searchMoney.getText().toString())){
                            SQLiteDatabase db = sqlite.getReadableDatabase();
                            Cursor query = db.query(constants.PRODUCTINFORMATIONDATASHEET, null, "money like '%" + searchMoney.getText().toString() + "%'"
                                , null, null, null, null);
                                while (query.moveToNext()) {
                                    String id = query.getString(0);
                                    String name = query.getString(1);
                                    String money = query.getString(2);
                                    Log.d("test", "商品名称" + id + name + money);
                                }
                            query.close();
                            db.close();
                        }else {
                            SQLiteDatabase db = sqlite.getReadableDatabase();
                            Cursor query = db.query(constants.PRODUCTINFORMATIONDATASHEET, null, "name like '%" + searchName.getText().toString() + "%'"
                                    , null, null, null, null);
                            while (query.moveToNext()) {
                                String id = query.getString(0);
                                String name = query.getString(1);
                                String money = query.getString(2);
                                Log.d("test", "商品名称" + id + name + money);
                            }
                            query.close();
                            db.close();
                        }

                    }
                }else {
                    Toast.makeText(MainActivity.this, "无关键字", Toast.LENGTH_SHORT).show();
                }
            }
        });
        //适配器调用方法
        adaptationMethod();
        //长按事件调用
        longTouch();

    }

    /**
     * 长按事件
     */
    private void longTouch(){
        listView.setOnItemLongClickListener(new AdapterView.OnItemLongClickListener() {
            @Override
            public boolean onItemLongClick(AdapterView<?> parent, View view, int position, long id) {
                listviewId = (TextView) view.findViewById(R.id.id);
                listviewName = (TextView) view.findViewById(R.id.name);
                listviewMoney = (TextView) view.findViewById(R.id.money);
//                listview上下文菜单
                listView.setOnCreateContextMenuListener(new View.OnCreateContextMenuListener() {
                    @Override
                    public void onCreateContextMenu(ContextMenu menu, View v, ContextMenu.ContextMenuInfo menuInfo) {
                        menu.add(1, 1, 1, "复制");
                        menu.add(1, 2, 1, "修改");
                        menu.add(1, 3, 1, "删除");
                    }
                });
                return false;
            }
        });
    }
    /**
     * 重写上下文点击事件
     *
     * @param item 上下文带单
     * @return 布尔值返回false以允许正常的上下文菜单处理*继续，返回true以在此处使用它。
     */
    @Override
    public boolean onContextItemSelected(@NonNull MenuItem item) {

        final SQLiteDatabase readableDatabase = sqlite.getReadableDatabase();
        switch (item.getItemId()) {
            case 1:
                Toast.makeText(this, "copy功能还在开发", Toast.LENGTH_SHORT).show();
                break;
            case 2:
                Toast.makeText(this, "update", Toast.LENGTH_SHORT).show();
                //自定义dialog
                View view = LayoutInflater.from(this).inflate(R.layout.dialog,null);
                final EditText name = (EditText) view.findViewById(R.id.dialog_name);
                final EditText money = (EditText) view.findViewById(R.id.dialog_money);
                AlertDialog.Builder builder = new AlertDialog.Builder(this).setTitle("请输入您要更改的参数")
                        .setView(view)
                        .setPositiveButton("修改", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                if (!"".equals(name.getText().toString()) && !"".equals(money.getText().toString())){
                                    ContentValues contentValues = new ContentValues();
                                    contentValues.put("name",name.getText().toString());
                                    contentValues.put("money",money.getText().toString());
                                    readableDatabase.update(constants.PRODUCTINFORMATIONDATASHEET,contentValues,"_id="+listviewId.getText(),null);
                                    adaptationMethod();
                                    readableDatabase.close();
                                    Toast.makeText(MainActivity.this, "更新成功", Toast.LENGTH_SHORT).show();
                                }else {
                                    Toast.makeText(MainActivity.this, "不允许空参数,本次记录不进入数据库", Toast.LENGTH_SHORT).show();
                                }
                            }
                        })
                        .setNegativeButton("取消", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                dialog.dismiss();
                            }
                        });
                builder.create().show();
                break;
            case 3:
                Toast.makeText(this, "delete", Toast.LENGTH_SHORT).show();
                final AlertDialog.Builder deleteDialog = new AlertDialog.Builder(this);
                deleteDialog.setTitle("您确定删除吗");
                deleteDialog.setPositiveButton("yes", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        readableDatabase.delete(constants.PRODUCTINFORMATIONDATASHEET, "_id="+listviewId.getText(), null);
                        readableDatabase.close();
                        adaptationMethod();
                    }
                })
                        .setNegativeButton("no", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                dialog.dismiss();
                            }
                        });
                deleteDialog.show();
                break;
            default:
                Toast.makeText(this, "不可能会缺", Toast.LENGTH_SHORT).show();
        }

        return super.onContextItemSelected(item);
    }

    /**
     * 点击添加按钮后的事件，生成一个dialog
     */
    private void tapAdd() {
        @SuppressLint("InflateParms") View view = LayoutInflater.from(MainActivity.this).inflate(R.layout.dialog, null);
        final EditText name = (EditText) view.findViewById(R.id.dialog_name);
        final EditText money = (EditText) view.findViewById(R.id.dialog_money);
        AlertDialog.Builder builder = new AlertDialog.Builder(MainActivity.this).setView(view)
                .setTitle("请输入商品的名称与价格")
                .setIcon(R.drawable.icon)
                .setPositiveButton("提交", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {

                        if ((!"".equals(name.getText().toString())) && !"".equals(money.getText().toString())) {
                            Toast.makeText(MainActivity.this, "登记的商品\n名称：" + name.getText() + "\n金额：" + money.getText(), Toast.LENGTH_SHORT).show();
                            //芜湖，启动数据库
                            SQLiteDatabase db = sqlite.getReadableDatabase();
                            ContentValues contentValues = new ContentValues();
                            contentValues.put("name", name.getText().toString());
                            contentValues.put("money", Integer.parseInt(money.getText().toString()));
                            db.insert(constants.PRODUCTINFORMATIONDATASHEET, null, contentValues);
                            db.close();
                            adaptationMethod();
                        } else {
                            Toast.makeText(MainActivity.this, "不允许空参数,本次记录不会记录数据库", Toast.LENGTH_SHORT).show();
                        }
                    }
                })
                .setNegativeButton("取消", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        //解散dialog
                        dialog.dismiss();
                        Toast.makeText(MainActivity.this, "已经取消", Toast.LENGTH_SHORT).show();
                    }
                });
        builder.create().show();
    }

    /**
     * 适配器调用方法
     *
     * @return 返回当前的数值
     */
    private List<javaBeanAdapter> adaptationMethod() {
        //清空适配器原来的数值，然后重新写入
        adapters_data.clear();
        //第一次启动数据库，如果没有数据表就创建数据表
        SQLiteDatabase db = sqlite.getReadableDatabase();
        db = sqlite.getReadableDatabase();
        Cursor cursor = db.query(false, constants.PRODUCTINFORMATIONDATASHEET, null, null, null
                , null, null, null, null);
        //读取数据库
        while (cursor.moveToNext()) {
            //适配器读取数据库
            javaBeanAdapter jba = new javaBeanAdapter(cursor.getString(0)
                    , cursor.getString(1)
                    , cursor.getString(2));
            adapters_data.add(jba);
        }
        myAdapter myAdapter_ = new myAdapter(adapters_data, this);
        listView.setAdapter(myAdapter_);
        return adapters_data;
    }
}

```

**常量参数**

```java
package com.phc.a2020_03_22;

/**
 * @author PengHaiChen
 */
public class constants {
    public static final int DATABASE_VERSION = 1;
    public static final String PRODUCTINFORMATIONDATASHEET = "product_information_sheet";
    public static final String BASEDATABASE = "database.db";


}
```

**实体类**

``` java
package com.phc.a2020_03_22;

public class javaBeanAdapter {
    public String id ;
    public String name;
    public String money;

    public javaBeanAdapter(String id, String name, String money) {
        this.id = id;
        this.name = name;
        this.money = money;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getMoney() {
        return money;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setMoney(String money) {
        this.money = money;
    }
}

```

**适配器方法**

```java
package com.phc.a2020_03_22;

import android.content.Context;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.TextView;

import java.util.List;

public class myAdapter extends BaseAdapter {


    modle  md = new modle();

    private List<javaBeanAdapter> studentData;
    private Context context ;
    /**
     * @param studentData 传递进来的数据
     * @param context  传递进来的上下文
     */
    public myAdapter(List<javaBeanAdapter> studentData, Context context) {
        this.studentData = studentData;
        this.context = context;

    }

     class modle{
        TextView id , name , money ;
        Button up , down ;
    }

    @Override
    public int getCount() {
        return studentData.size();
    }

    @Override
    public Object getItem(int position) {
        return studentData.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
//        if (convertView == null){
            convertView = LayoutInflater.from(context).inflate(R.layout.list_content,null);
            md.id = (TextView) convertView.findViewById(R.id.id);
            md.name = (TextView) convertView.findViewById(R.id.name);
            md.money = (TextView) convertView.findViewById(R.id.money);
            md.up = (Button) convertView.findViewById(R.id.up);
            md.down = (Button) convertView.findViewById(R.id.down);
            convertView.setTag(md);
            Log.d("liatview", "!!!!!!!! ");
//        } else {
//            md = (modle) convertView.getTag() ;
//        }
        //进行数据填充
        md.id.setText(studentData.get(position).id);
        md.name.setText(studentData.get(position).name);
        md.money.setText(studentData.get(position).money);
        return convertView;
    }
}

```

**数据库创建**

```java
package com.phc.a2020_03_22.dao;


import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import com.phc.a2020_03_22.constants;
import androidx.annotation.Nullable;

/**
 * 该类用于操作增删改查
 * @author PengHaiChen
 */
public class dataSql extends SQLiteOpenHelper {

    private String TAG = "dataSql";

    /**
     *
     * @ context 上下文
     * @ name 数据库名
     * @ factory 游标工厂
     * @ version  版本
     */
    public dataSql(@Nullable Context context ) {
        super(context, constants.BASEDATABASE, null, constants.DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("create table "+constants.PRODUCTINFORMATIONDATASHEET+"(_id integer primary key autoincrement,name nvarchar,money integer)");
        Log.d(TAG, "创建了数据表");

    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {

    }
}
```




```java
NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
                String id="channel_1";
                String name=getString(R.string.app_name);
                NotificationChannel notificationChannel=new NotificationChannel(id,name,NotificationManager
                        .IMPORTANCE_HIGH);
                manager.createNotificationChannel(notificationChannel);
                android.app.Notification notification = new NotificationCompat
                        .Builder(this, id)
                        .setContentText("道路警告")
                        .setContentTitle("当前值"+DR+"/阈值"+dr)
                        .setWhen(System.currentTimeMillis())
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .build();
                // 发送通知
                manager.notify(1, notification);
               
```


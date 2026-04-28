package expo.modules.blocksrunningnotification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

class RunningNotificationService : Service() {
  companion object {
    const val ACTION_START = "expo.modules.blocksrunningnotification.START"
    const val ACTION_UPDATE = "expo.modules.blocksrunningnotification.UPDATE"
    const val ACTION_STOP = "expo.modules.blocksrunningnotification.STOP"

    const val EXTRA_STARTED_AT_MS = "startedAtMs"
    const val EXTRA_ENDS_AT_MS = "endsAtMs"
    const val EXTRA_ACTIVITY_NAME = "activityName"
    const val EXTRA_COLOR_HEX = "colorHex"
    const val EXTRA_HALF = "half"

    private const val CHANNEL_ID = "blocks-running"
    private const val CHANNEL_NAME = "Running timer"
    private const val NOTIFICATION_ID = 1742
  }

  private var lastActivityName: String = "Block"
  private var lastColorHex: String = "#22c55e"

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val action = intent?.action ?: ACTION_START

    if (action == ACTION_STOP) {
      ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }

    val endsAtMs = intent?.getLongExtra(EXTRA_ENDS_AT_MS, 0L) ?: 0L
    val half = intent?.getIntExtra(EXTRA_HALF, 1) ?: 1
    if (action == ACTION_START) {
      lastActivityName = intent?.getStringExtra(EXTRA_ACTIVITY_NAME) ?: lastActivityName
      lastColorHex = intent?.getStringExtra(EXTRA_COLOR_HEX) ?: lastColorHex
    }

    ensureChannel()
    val notification = buildNotification(lastActivityName, lastColorHex, endsAtMs, half)
    startForegroundCompat(notification)
    return START_NOT_STICKY
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      CHANNEL_NAME,
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "Shows the active block countdown."
      setShowBadge(false)
      setSound(null, null)
      enableVibration(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(
    activityName: String,
    colorHex: String,
    endsAtMs: Long,
    half: Int,
  ): android.app.Notification {
    val color = parseColor(colorHex)
    val halfLabel = if (half == 2) "Second half" else "First half"

    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    val contentPendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent ?: Intent(),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(getSmallIconResId())
      .setContentTitle(activityName)
      .setContentText(halfLabel)
      .setColor(color)
      .setColorized(true)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setShowWhen(true)
      .setWhen(endsAtMs)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
      .setContentIntent(contentPendingIntent)
      .build()
  }

  private fun parseColor(hex: String): Int {
    return try {
      Color.parseColor(hex)
    } catch (_: IllegalArgumentException) {
      Color.parseColor("#22c55e")
    }
  }

  private fun getSmallIconResId(): Int {
    val byName = resources.getIdentifier("notification_icon", "drawable", packageName)
    if (byName != 0) return byName
    val mipmapLauncher = resources.getIdentifier("ic_launcher", "mipmap", packageName)
    if (mipmapLauncher != 0) return mipmapLauncher
    return android.R.drawable.ic_dialog_info
  }

  private fun startForegroundCompat(notification: android.app.Notification) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      ServiceCompat.startForeground(
        this,
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ServiceCompat.startForeground(
        this,
        NOTIFICATION_ID,
        notification,
        0,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }
}

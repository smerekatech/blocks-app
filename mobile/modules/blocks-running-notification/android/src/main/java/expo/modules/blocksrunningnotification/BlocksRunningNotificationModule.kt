package expo.modules.blocksrunningnotification

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class BlocksRunningNotificationStartArgs : Record {
  @Field var startedAtMs: Double = 0.0
  @Field var endsAtMs: Double = 0.0
  @Field var activityName: String = ""
  @Field var colorHex: String = "#22c55e"
  @Field var half: Int = 1
}

class BlocksRunningNotificationUpdateArgs : Record {
  @Field var startedAtMs: Double = 0.0
  @Field var endsAtMs: Double = 0.0
  @Field var half: Int = 1
}

class BlocksRunningNotificationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("BlocksRunningNotification")

    AsyncFunction("start") { args: BlocksRunningNotificationStartArgs ->
      val intent = Intent(context, RunningNotificationService::class.java).apply {
        action = RunningNotificationService.ACTION_START
        putExtra(RunningNotificationService.EXTRA_STARTED_AT_MS, args.startedAtMs.toLong())
        putExtra(RunningNotificationService.EXTRA_ENDS_AT_MS, args.endsAtMs.toLong())
        putExtra(RunningNotificationService.EXTRA_ACTIVITY_NAME, args.activityName)
        putExtra(RunningNotificationService.EXTRA_COLOR_HEX, args.colorHex)
        putExtra(RunningNotificationService.EXTRA_HALF, args.half)
      }
      ContextCompat.startForegroundService(context, intent)
    }

    AsyncFunction("update") { args: BlocksRunningNotificationUpdateArgs ->
      val intent = Intent(context, RunningNotificationService::class.java).apply {
        action = RunningNotificationService.ACTION_UPDATE
        putExtra(RunningNotificationService.EXTRA_STARTED_AT_MS, args.startedAtMs.toLong())
        putExtra(RunningNotificationService.EXTRA_ENDS_AT_MS, args.endsAtMs.toLong())
        putExtra(RunningNotificationService.EXTRA_HALF, args.half)
      }
      ContextCompat.startForegroundService(context, intent)
    }

    AsyncFunction<Unit>("end") {
      val intent = Intent(context, RunningNotificationService::class.java).apply {
        action = RunningNotificationService.ACTION_STOP
      }
      // Use startService (not startForegroundService) for stop — the service will stop itself.
      context.startService(intent)
    }
  }
}

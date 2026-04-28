import ActivityKit
import ExpoModulesCore
import Foundation

struct BlocksLiveActivityStartArgs: Record {
  @Field var startedAtMs: Double = 0
  @Field var endsAtMs: Double = 0
  @Field var activityName: String = ""
  @Field var colorHex: String = "#22c55e"
  @Field var half: Int = 1
}

struct BlocksLiveActivityUpdateArgs: Record {
  @Field var startedAtMs: Double = 0
  @Field var endsAtMs: Double = 0
  @Field var half: Int = 1
}

public class BlocksLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BlocksLiveActivity")

    AsyncFunction("start") { (args: BlocksLiveActivityStartArgs, promise: Promise) in
      Task {
        if #available(iOS 16.1, *) {
          guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            promise.reject("LA_DISABLED", "Live Activities are disabled in Settings")
            return
          }

          for activity in Activity<BlocksActivityAttributes>.activities {
            await activity.end(dismissalPolicy: .immediate)
          }

          let attributes = BlocksActivityAttributes(
            activityName: args.activityName,
            colorHex: args.colorHex
          )
          let state = BlocksActivityAttributes.ContentState(
            startedAt: Date(timeIntervalSince1970: args.startedAtMs / 1000.0),
            endsAt: Date(timeIntervalSince1970: args.endsAtMs / 1000.0),
            half: args.half
          )

          do {
            if #available(iOS 16.2, *) {
              let content = ActivityContent(state: state, staleDate: nil)
              _ = try Activity<BlocksActivityAttributes>.request(
                attributes: attributes,
                content: content,
                pushType: nil
              )
            } else {
              _ = try Activity<BlocksActivityAttributes>.request(
                attributes: attributes,
                contentState: state,
                pushType: nil
              )
            }
            promise.resolve(nil)
          } catch {
            promise.reject("LA_REQUEST_FAILED", "\(error)")
          }
        } else {
          promise.reject("LA_UNAVAILABLE", "iOS 16.1+ required")
        }
      }
    }

    AsyncFunction("update") { (args: BlocksLiveActivityUpdateArgs, promise: Promise) in
      Task {
        if #available(iOS 16.1, *) {
          guard let activity = Activity<BlocksActivityAttributes>.activities.first else {
            promise.reject("LA_NOT_RUNNING", "No active Live Activity")
            return
          }
          let state = BlocksActivityAttributes.ContentState(
            startedAt: Date(timeIntervalSince1970: args.startedAtMs / 1000.0),
            endsAt: Date(timeIntervalSince1970: args.endsAtMs / 1000.0),
            half: args.half
          )
          if #available(iOS 16.2, *) {
            await activity.update(ActivityContent(state: state, staleDate: nil))
          } else {
            await activity.update(using: state)
          }
          promise.resolve(nil)
        } else {
          promise.reject("LA_UNAVAILABLE", "iOS 16.1+ required")
        }
      }
    }

    AsyncFunction("end") { (promise: Promise) in
      Task {
        if #available(iOS 16.1, *) {
          for activity in Activity<BlocksActivityAttributes>.activities {
            await activity.end(dismissalPolicy: .immediate)
          }
        }
        promise.resolve(nil)
      }
    }
  }
}

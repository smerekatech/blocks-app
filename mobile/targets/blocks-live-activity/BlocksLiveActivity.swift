import ActivityKit
import SwiftUI
import WidgetKit

@main
struct BlocksLiveActivityBundle: WidgetBundle {
  var body: some Widget {
    BlocksLiveActivity()
  }
}

@available(iOS 16.1, *)
struct BlocksLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: BlocksActivityAttributes.self) { context in
      LockScreenView(
        attributes: context.attributes,
        state: context.state
      )
      .activityBackgroundTint(Color.black.opacity(0.85))
      .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIslandView.dynamicIsland(
        attributes: context.attributes,
        state: context.state
      )
    }
  }
}

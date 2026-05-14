import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
struct DynamicIslandView {
  static func dynamicIsland(
    attributes: BlocksActivityAttributes,
    state: BlocksActivityAttributes.ContentState
  ) -> DynamicIsland {
    let tint = Color(hex: attributes.colorHex) ?? .green

    return DynamicIsland {
      DynamicIslandExpandedRegion(.leading) {
        HStack(spacing: 8) {
          Circle()
            .fill(tint)
            .frame(width: 10, height: 10)
          Text(attributes.activityName)
            .font(.system(size: 14, weight: .semibold))
            .lineLimit(1)
        }
        .padding(.leading, 4)
      }
      DynamicIslandExpandedRegion(.trailing) {
        Text(timerInterval: state.startedAt...state.endsAt, countsDown: true)
          .font(.system(size: 18, weight: .semibold, design: .rounded))
          .monospacedDigit()
          .multilineTextAlignment(.trailing)
          .frame(minWidth: 70)
      }
      DynamicIslandExpandedRegion(.bottom) {
        Text(state.half == 1 ? "First half" : "Second half")
          .font(.system(size: 12))
          .foregroundColor(.secondary)
      }
    } compactLeading: {
      Circle()
        .fill(tint)
        .frame(width: 12, height: 12)
    } compactTrailing: {
      EmptyView()
    } minimal: {
      Circle()
        .fill(tint)
        .frame(width: 12, height: 12)
    }
  }
}

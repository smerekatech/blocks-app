import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
struct LockScreenView: View {
  let attributes: BlocksActivityAttributes
  let state: BlocksActivityAttributes.ContentState

  var body: some View {
    HStack(alignment: .center, spacing: 12) {
      Circle()
        .fill(Color(hex: attributes.colorHex) ?? .green)
        .frame(width: 12, height: 12)

      VStack(alignment: .leading, spacing: 2) {
        Text(attributes.activityName)
          .font(.system(size: 15, weight: .semibold))
          .foregroundColor(.white)
          .lineLimit(1)
        Text(state.half == 1 ? "First half" : "Second half")
          .font(.system(size: 12, weight: .regular))
          .foregroundColor(.white.opacity(0.6))
      }

      Spacer()

      Text(timerInterval: state.startedAt...state.endsAt, countsDown: true)
        .font(.system(size: 28, weight: .semibold, design: .rounded))
        .monospacedDigit()
        .foregroundColor(.white)
        .multilineTextAlignment(.trailing)
        .frame(minWidth: 80)
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 14)
  }
}

extension Color {
  init?(hex: String) {
    var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if s.hasPrefix("#") { s.removeFirst() }
    guard s.count == 6, let v = UInt64(s, radix: 16) else { return nil }
    let r = Double((v >> 16) & 0xFF) / 255.0
    let g = Double((v >> 8) & 0xFF) / 255.0
    let b = Double(v & 0xFF) / 255.0
    self.init(red: r, green: g, blue: b)
  }
}

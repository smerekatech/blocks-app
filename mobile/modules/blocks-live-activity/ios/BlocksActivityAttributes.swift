import ActivityKit
import Foundation

@available(iOS 16.1, *)
public struct BlocksActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public let startedAt: Date
    public let endsAt: Date
    public let half: Int

    public init(startedAt: Date, endsAt: Date, half: Int) {
      self.startedAt = startedAt
      self.endsAt = endsAt
      self.half = half
    }
  }

  public let activityName: String
  public let colorHex: String

  public init(activityName: String, colorHex: String) {
    self.activityName = activityName
    self.colorHex = colorHex
  }
}

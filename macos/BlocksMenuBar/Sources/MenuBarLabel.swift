import AppKit
import SwiftUI

struct MenuBarLabel: View {
    @Environment(AppState.self) private var state
    @Environment(\.colorScheme) private var colorScheme

    private var dark: Bool { colorScheme == .dark }

    var body: some View {
        switch state.mode {
        case .idle:
            BlocksLogoIcon()
        case .running:
            HStack(spacing: 5) {
                Circle()
                    .fill(Color.activityDot(state.currentActivity?.color, dark: dark))
                    .frame(width: 7, height: 7)
                Text("\(state.currentLabel) · \(formatRemaining(state.remainingMs))")
                    .monospacedDigit()
            }
        case .awaitingChoice:
            HStack(spacing: 5) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color.activityDot(state.currentActivity?.color, dark: dark))
                Text(state.currentLabel)
            }
        }
    }

    private func formatRemaining(_ ms: Double) -> String {
        let total = max(0, Int(ms / 1000))
        let m = total / 60
        let s = total % 60
        return String(format: "%d:%02d", m, s)
    }
}

struct BlocksLogoIcon: View {
    var size: CGFloat = 16

    var body: some View {
        Image(nsImage: Self.templateImage(size: size))
    }

    private static func templateImage(size: CGFloat) -> NSImage {
        let image = NSImage(size: NSSize(width: size, height: size), flipped: true) { _ in
            let s = size / 20.0
            NSColor.black.setFill()
            NSColor.black.setStroke()

            NSBezierPath(
                roundedRect: NSRect(x: 2 * s, y: 3 * s, width: 16 * s, height: 6 * s),
                xRadius: 1.5 * s, yRadius: 1.5 * s
            ).fill()

            let bottom = NSBezierPath(
                roundedRect: NSRect(x: 2 * s, y: 11 * s, width: 16 * s, height: 6 * s),
                xRadius: 1.5 * s, yRadius: 1.5 * s
            )
            bottom.lineWidth = 1.6 * s
            bottom.stroke()

            NSBezierPath(
                roundedRect: NSRect(x: 2 * s, y: 11 * s, width: 8 * s, height: 6 * s),
                xRadius: 1.5 * s, yRadius: 1.5 * s
            ).fill()

            return true
        }
        image.isTemplate = true
        return image
    }
}

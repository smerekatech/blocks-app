import SwiftUI

struct MenuBarLabel: View {
    @Environment(AppState.self) private var state

    var body: some View {
        switch state.mode {
        case .idle:
            BlocksLogoIcon()
        case .running:
            HStack(spacing: 5) {
                Circle()
                    .fill(Color(hex: state.currentActivity?.color ?? "#10b981"))
                    .frame(width: 7, height: 7)
                Text(state.currentLabel)
                Text(formatRemaining(state.remainingMs))
                    .monospacedDigit()
            }
        case .awaitingChoice:
            HStack(spacing: 5) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color(hex: state.currentActivity?.color ?? "#10b981"))
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
        Canvas { context, canvasSize in
            let s = min(canvasSize.width, canvasSize.height) / 20.0
            let top = Path(roundedRect: CGRect(x: 2 * s, y: 3 * s, width: 16 * s, height: 6 * s), cornerRadius: 1.5 * s)
            let bottom = Path(roundedRect: CGRect(x: 2 * s, y: 11 * s, width: 16 * s, height: 6 * s), cornerRadius: 1.5 * s)
            let half = Path(roundedRect: CGRect(x: 2 * s, y: 11 * s, width: 8 * s, height: 6 * s), cornerRadius: 1.5 * s)
            context.fill(top, with: .style(.foreground))
            context.stroke(bottom, with: .style(.foreground), lineWidth: 1.6 * s)
            context.fill(half, with: .style(.foreground))
        }
        .frame(width: size, height: size)
    }
}

import SwiftUI

struct MenuBarLabel: View {
    @Environment(AppState.self) private var state

    var body: some View {
        switch state.mode {
        case .idle:
            Image(systemName: "square.grid.2x2")
        case .running:
            if let activity = state.currentActivity {
                Text("\(formatRemaining(state.remainingMs))  \(activity.name)")
                    .monospacedDigit()
            } else {
                Text(formatRemaining(state.remainingMs))
                    .monospacedDigit()
            }
        case .awaitingChoice:
            HStack(spacing: 6) {
                Image(systemName: "checkmark.circle.fill")
                if let activity = state.currentActivity {
                    Text(activity.name)
                } else {
                    Text("Done?")
                }
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

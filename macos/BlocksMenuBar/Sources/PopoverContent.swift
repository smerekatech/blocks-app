import SwiftUI
import AppKit

struct PopoverContent: View {
    @Environment(AppState.self) private var state
    @Environment(\.colorScheme) private var colorScheme
    @State private var customMode = false
    @State private var customName = ""

    private var dark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if !state.isSignedIn {
                signInView
                    .padding(12)
            } else {
                Group {
                    switch state.mode {
                    case .idle:
                        idleView
                    case .running:
                        runningView
                    case .awaitingChoice:
                        finishedView
                    }
                }
                .padding(12)

                Divider()

                todayView
                    .padding(12)

                Divider()

                actionsView
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
            }
            if let err = state.lastError {
                Text(err)
                    .font(.caption2)
                    .foregroundStyle(.red)
                    .lineLimit(2)
                    .padding(.horizontal, 12)
                    .padding(.bottom, 8)
            }
        }
        .frame(width: 300)
        .onChange(of: state.popoverOpen) { _, open in
            if !open {
                customMode = false
                customName = ""
            }
        }
    }

    // MARK: - Sign in

    private var signInView: some View {
        VStack(spacing: 8) {
            Text("Blocks").font(.title3.bold())
            Text("Sign in with Google to start tracking")
                .font(.caption)
                .foregroundStyle(.secondary)
            Button("Sign in with Google") { state.signIn() }
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - Idle

    private var idleView: some View {
        VStack(alignment: .leading, spacing: 6) {
            sectionHeader("Start timer")
                .padding(.horizontal, 10)

            let activeActivities = state.activities.filter { $0.archivedAt == nil }

            if customMode {
                HStack(spacing: 6) {
                    TextField("One-off block", text: $customName)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { submitCustom() }
                    Button {
                        submitCustom()
                    } label: {
                        Image(systemName: "checkmark")
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(customName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    Button {
                        customMode = false
                        customName = ""
                    } label: {
                        Image(systemName: "xmark")
                    }
                    .buttonStyle(.bordered)
                }
                .padding(.horizontal, 10)
            } else {
                if activeActivities.isEmpty {
                    Text("No activities yet. Create one in the web app.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 10)
                } else {
                    VStack(alignment: .leading, spacing: 1) {
                        ForEach(activeActivities) { activity in
                            ActivityRow(activity: activity) {
                                Task { await state.startTimer(activityId: activity.id) }
                            }
                        }
                    }
                }

                Divider().padding(.horizontal, 10)

                CustomRow {
                    customMode = true
                }
            }
        }
    }

    private func submitCustom() {
        let name = customName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        Task { await state.startCustomTimer(name: name) }
        customMode = false
        customName = ""
    }

    // MARK: - Running

    private var runningView: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                Circle()
                    .fill(Color.activityDot(state.currentActivity?.color, dark: dark))
                    .frame(width: 10, height: 10)
                Text(state.currentLabel)
                    .font(.system(size: 14, weight: .semibold))
                Spacer()
            }

            HStack(spacing: 14) {
                ProgressRing(
                    fraction: remainingFraction,
                    color: Color.activityDot(state.currentActivity?.color, dark: dark)
                )
                .frame(width: 50, height: 50)

                Text(formatTime(state.remainingMs))
                    .font(.system(size: 32, weight: .regular))
                    .monospacedDigit()
                    .foregroundStyle(.primary)

                Spacer()

                Button {
                    Task { await state.stopTimer() }
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 32, height: 32)
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.white)
                            .frame(width: 10, height: 10)
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Finished (awaiting choice)

    private var finishedView: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center, spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.activityDot(state.currentActivity?.color, dark: dark))
                        .frame(width: 36, height: 36)
                    Image(systemName: "checkmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.currentLabel)
                        .font(.system(size: 14, weight: .semibold))
                    Text("\(formatTime(state.config.halfDurationMs)) · finished just now")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }

            HStack(spacing: 6) {
                Button {
                    Task { await state.secondHalf() }
                } label: {
                    Text("Start next")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.regular)

                Button {
                    Task { await state.stopTimer() }
                } label: {
                    Text("Start another")
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .controlSize(.regular)

            }
        }
    }

    // MARK: - Today

    private var todayTotal: Double {
        state.entries.reduce(0) { $0 + $1.blocks }
    }

    private var todayView: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                sectionHeader("Today")
                Spacer()
                if !state.entries.isEmpty {
                    Text("\(formatBlocks(todayTotal)) \(todayTotal == 1 ? "block" : "blocks")")
                        .font(.system(size: 10, weight: .semibold))
                        .tracking(0.6)
                        .foregroundStyle(.secondary)
                        .monospacedDigit()
                }
            }
            .padding(.horizontal, 10)

            if state.entries.isEmpty {
                Text("Nothing logged yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 10)
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(state.entries) { entry in
                        let activity = state.activities.first { $0.id == entry.activityId }
                        HStack(spacing: 10) {
                            Circle()
                                .fill(Color.activityDot(activity?.color, dark: dark))
                                .frame(width: 8, height: 8)
                            Text(activity?.name ?? entry.name ?? "—")
                                .font(.system(size: 13))
                                .lineLimit(1)
                                .foregroundStyle(.primary)
                            Spacer()
                            Text(formatBlocks(entry.blocks))
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                        .padding(.horizontal, 10)
                    }
                }
            }
        }
    }

    // MARK: - Actions

    private var actionsView: some View {
        HStack(spacing: 6) {
            Button {
                state.openWebApp()
            } label: {
                Text("Open in browser")
                    .font(.system(size: 11))
                    .lineLimit(1)
            }
            .buttonStyle(.bordered)
            .controlSize(.small)

            Spacer()

            Menu {
                Button("Refresh") { Task { await state.refreshAll() } }
                Button("Sign out") { state.signOut() }
                Divider()
                Button("Quit Blocks") { NSApp.terminate(nil) }
            } label: {
                Image(systemName: "sun.max")
                    .font(.system(size: 12))
            }
            .menuStyle(.button)
            .menuIndicator(.hidden)
            .buttonStyle(.bordered)
            .controlSize(.small)
            .fixedSize()

            Button {
                state.signOut()
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 12))
            }
            .buttonStyle(.bordered)
            .controlSize(.small)
        }
    }

    // MARK: - Helpers

    private func sectionHeader(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.system(size: 10, weight: .semibold))
            .tracking(0.6)
            .foregroundStyle(.secondary)
    }

    private var remainingFraction: Double {
        let total = state.config.halfDurationMs
        guard total > 0 else { return 0 }
        return min(1, max(0, state.remainingMs / total))
    }

    private func formatTime(_ ms: Double) -> String {
        let total = max(0, Int(ms / 1000))
        let m = total / 60
        let s = total % 60
        return String(format: "%d:%02d", m, s)
    }

    private func formatBlocks(_ b: Double) -> String {
        b == floor(b) ? String(format: "%.0f", b) : String(format: "%.1f", b)
    }
}

// MARK: - Activity row

private struct ActivityRow: View {
    let activity: Activity
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme
    @State private var hovered = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Circle()
                    .fill(Color.activityDot(activity.color, dark: colorScheme == .dark))
                    .frame(width: 8, height: 8)
                Text(activity.name)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(hovered ? Color.white : Color.primary)
                Spacer()
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(hovered ? Color.accentColor : Color.clear)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hovered = $0 }
    }
}

// MARK: - Custom row

private struct CustomRow: View {
    let action: () -> Void
    @State private var hovered = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: "plus")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(hovered ? Color.white : Color.accentColor)
                    .frame(width: 8, height: 8)
                Text("Custom…")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(hovered ? Color.white : Color.primary)
                Spacer()
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(hovered ? Color.accentColor : Color.clear)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hovered = $0 }
    }
}

// MARK: - Progress ring

private struct ProgressRing: View {
    let fraction: Double
    let color: Color

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.secondary.opacity(0.18), lineWidth: 5)
            Circle()
                .trim(from: 0, to: max(0.001, fraction))
                .stroke(color, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}


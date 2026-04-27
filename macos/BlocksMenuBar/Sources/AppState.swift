import Foundation
import SwiftUI
import AppKit

@MainActor
@Observable
final class AppState {
    var isSignedIn: Bool = false
    var activities: [Activity] = []
    var entries: [Entry] = []
    var timer: ApiTimer? = nil
    var config: TimerConfig = TimerConfig(halfDurationMs: 45 * 60 * 1000, halfBlockMinMs: 20 * 60 * 1000)
    var now: Date = Date()
    var lastError: String? = nil

    var popoverOpen: Bool = false {
        didSet { if popoverOpen != oldValue { restartPolling() } }
    }

    private var bootstrapped = false
    private var pollTask: Task<Void, Never>? = nil
    private var tickTask: Task<Void, Never>? = nil
    private var completing = false

    func bootstrap() {
        guard !bootstrapped else {
            isSignedIn = (Auth.shared.loadCookie() != nil)
            return
        }
        bootstrapped = true
        isSignedIn = (Auth.shared.loadCookie() != nil)
        startTicker()
        if isSignedIn {
            startPolling()
            Task { await refreshAll() }
        }
    }

    func handleAuthCallback(_ url: URL) {
        if Auth.shared.handleCallback(url) {
            isSignedIn = true
            lastError = nil
            startPolling()
            Task { await refreshAll() }
        }
    }

    func signIn() {
        Auth.shared.startGoogleAuth()
    }

    func signOut() {
        Auth.shared.clearCookie()
        isSignedIn = false
        timer = nil
        entries = []
        activities = []
        pollTask?.cancel()
    }

    func openWebApp() {
        NSWorkspace.shared.open(BlocksConfig.baseURL)
    }

    // MARK: - Derived

    var mode: TimerMode {
        guard let t = timer else { return .idle }
        if t.half == 1 && t.firstEntryId != nil { return .awaitingChoice }
        return .running
    }

    var elapsedMs: Double {
        guard let t = timer else { return 0 }
        return max(0, now.timeIntervalSince(t.startedAt) * 1000)
    }

    var remainingMs: Double {
        max(0, config.halfDurationMs - elapsedMs)
    }

    var currentActivity: Activity? {
        guard let t = timer else { return nil }
        return activities.first { $0.id == t.activityId }
    }

    // MARK: - Tickers

    private func startTicker() {
        tickTask?.cancel()
        tickTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                guard let self else { return }
                self.now = Date()
                await self.maybeAutoComplete()
            }
        }
    }

    private func restartPolling() {
        guard isSignedIn else { return }
        startPolling()
    }

    private func startPolling() {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            // Initial fast refresh
            await self?.refreshTimer()
            while !Task.isCancelled {
                guard let self else { return }
                let interval: UInt64 = self.popoverOpen ? 1_000_000_000 : 5_000_000_000
                try? await Task.sleep(nanoseconds: interval)
                guard !Task.isCancelled else { return }
                await self.refreshTimer()
                if self.popoverOpen {
                    await self.refreshEntries()
                }
            }
        }
    }

    // MARK: - Network

    func refreshAll() async {
        await refreshActivities()
        await refreshEntries()
        await refreshTimer()
    }

    func refreshActivities() async {
        do {
            activities = try await BlocksAPI.shared.get("/api/activities")
        } catch APIError.unauthorized {
            isSignedIn = false
        } catch {
            lastError = describe(error)
        }
    }

    func refreshEntries() async {
        let date = Self.todayString()
        do {
            entries = try await BlocksAPI.shared.get("/api/entries", query: [
                URLQueryItem(name: "from", value: date),
                URLQueryItem(name: "to", value: date)
            ])
        } catch APIError.unauthorized {
            isSignedIn = false
        } catch {
            lastError = describe(error)
        }
    }

    func refreshTimer() async {
        do {
            let res: TimerResponse = try await BlocksAPI.shared.get("/api/timer")
            self.config = res.config
            self.timer = res.timer
        } catch APIError.unauthorized {
            isSignedIn = false
        } catch {
            lastError = describe(error)
        }
    }

    // MARK: - Actions

    struct StartBody: Encodable { let activityId: Int; let startedDate: String }

    func startTimer(activityId: Int) async {
        do {
            let _: EmptyResponse = try await BlocksAPI.shared.post(
                "/api/timer/start",
                body: StartBody(activityId: activityId, startedDate: Self.todayString())
            )
            await refreshTimer()
            await refreshEntries()
        } catch APIError.unauthorized {
            isSignedIn = false
        } catch {
            lastError = describe(error)
        }
    }

    func stopTimer() async {
        do {
            let _: EmptyResponse = try await BlocksAPI.shared.post("/api/timer/stop")
            await refreshTimer()
            await refreshEntries()
        } catch APIError.unauthorized {
            isSignedIn = false
        } catch {
            lastError = describe(error)
        }
    }

    func secondHalf() async {
        do {
            let _: EmptyResponse = try await BlocksAPI.shared.post("/api/timer/second-half")
            await refreshTimer()
        } catch APIError.unauthorized {
            isSignedIn = false
        } catch {
            lastError = describe(error)
        }
    }

    private func maybeAutoComplete() async {
        guard let t = timer, !completing else { return }
        let elapsed = now.timeIntervalSince(t.startedAt) * 1000
        guard elapsed >= config.halfDurationMs else { return }
        let needsComplete = (t.half == 1 && t.firstEntryId == nil) || t.half == 2
        guard needsComplete else { return }
        completing = true
        defer { completing = false }
        do {
            let result: CompleteResult = try await BlocksAPI.shared.post("/api/timer/complete")
            if let firstId = result.firstEntryId {
                let name = activities.first { $0.id == timer?.activityId }?.name
                Chime.notify(firstEntryId: firstId, completed: result.state == "completed", activityName: name)
            }
            await refreshTimer()
            await refreshEntries()
        } catch APIError.unauthorized {
            isSignedIn = false
        } catch {
            lastError = describe(error)
        }
    }

    // MARK: - Helpers

    private func describe(_ error: Error) -> String {
        if let api = error as? APIError {
            switch api {
            case .notSignedIn: return "Not signed in"
            case .unauthorized: return "Session expired"
            case .http(let code, let body): return "HTTP \(code): \(body.prefix(200))"
            case .decoding(let e): return "Decode: \(e.localizedDescription)"
            case .transport(let e): return "Network: \(e.localizedDescription)"
            }
        }
        return error.localizedDescription
    }

    static func todayString() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone.current
        return f.string(from: Date())
    }
}

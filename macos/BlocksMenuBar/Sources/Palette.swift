import Foundation
import SwiftUI

// Mirrors shared/palette.ts: a 12-swatch palette built in OKLCH.
// The web app stores palette ids ("slate", "emerald", …) on each activity;
// older data may still carry legacy hex strings.

enum SwatchId: String, CaseIterable {
    case slate, red, orange, amber, lime, emerald, teal, sky, blue, indigo, violet, pink

    var hue: Double {
        switch self {
        case .slate: return 250
        case .red: return 25
        case .orange: return 55
        case .amber: return 85
        case .lime: return 125
        case .emerald: return 155
        case .teal: return 190
        case .sky: return 230
        case .blue: return 260
        case .indigo: return 285
        case .violet: return 310
        case .pink: return 350
        }
    }

    var isNeutral: Bool { self == .slate }
}

struct Swatch {
    let id: SwatchId
    let dot: Color
    let dotDark: Color
    let border: Color
    let borderDark: Color

    static func of(_ id: SwatchId) -> Swatch {
        let c = id.isNeutral ? 0.015 : 0.09
        let cBorder = id.isNeutral ? 0.02 : 0.12
        let h = id.hue
        return Swatch(
            id: id,
            dot: oklchColor(L: 0.72, C: c, h: h),
            dotDark: oklchColor(L: 0.78, C: c, h: h),
            border: oklchColor(L: 0.65, C: cBorder, h: h),
            borderDark: oklchColor(L: 0.7, C: cBorder * 0.9, h: h)
        )
    }

    func dot(dark: Bool) -> Color { dark ? dotDark : dot }
    func border(dark: Bool) -> Color { dark ? borderDark : border }
}

// Legacy hex → swatch id, mirroring shared/palette.ts so historical
// data renders sensibly without forcing a backfill.
private let HEX_TO_SWATCH: [String: SwatchId] = [
    "6366f1": .indigo,
    "0ea5e9": .sky,
    "22c55e": .emerald,
    "f59e0b": .amber,
    "ef4444": .red,
    "8b5cf6": .violet,
    "a855f7": .violet,
    "ec4899": .pink,
    "f43f5e": .pink,
    "f97316": .orange,
    "eab308": .amber,
    "84cc16": .lime,
    "10b981": .emerald,
    "14b8a6": .teal,
    "06b6d4": .teal,
    "3b82f6": .blue,
    "64748b": .slate,
    "78716c": .slate
]

enum Palette {
    static func swatch(for color: String?) -> Swatch {
        guard let raw = color, !raw.isEmpty else { return .of(.slate) }
        if let id = SwatchId(rawValue: raw) { return .of(id) }
        let hex = raw.replacingOccurrences(of: "#", with: "").lowercased()
        let key = String(hex.prefix(6))
        if let id = HEX_TO_SWATCH[key] { return .of(id) }
        return .of(.slate)
    }
}

extension Color {
    /// Resolves a server-provided color (palette id or legacy hex) to the
    /// dot/chip color appropriate for the current scheme.
    static func activityDot(_ color: String?, dark: Bool) -> Color {
        Palette.swatch(for: color).dot(dark: dark)
    }

    static func activityBorder(_ color: String?, dark: Bool) -> Color {
        Palette.swatch(for: color).border(dark: dark)
    }
}

// MARK: - OKLCH → sRGB

private func oklchColor(L: Double, C: Double, h: Double) -> Color {
    let (r, g, b) = oklchToSRGB(L: L, C: C, h: h)
    return Color(.sRGB, red: r, green: g, blue: b, opacity: 1)
}

private func oklchToSRGB(L: Double, C: Double, h: Double) -> (Double, Double, Double) {
    let hRad = h * .pi / 180.0
    let a = C * cos(hRad)
    let b = C * sin(hRad)

    let l_ = L + 0.3963377774 * a + 0.2158037573 * b
    let m_ = L - 0.1055613458 * a - 0.0638541728 * b
    let s_ = L - 0.0894841775 * a - 1.2914855480 * b

    let lc = l_ * l_ * l_
    let mc = m_ * m_ * m_
    let sc = s_ * s_ * s_

    let rLinear = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc
    let gLinear = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc
    let bLinear = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc

    return (gammaEncode(rLinear), gammaEncode(gLinear), gammaEncode(bLinear))
}

private func gammaEncode(_ v: Double) -> Double {
    let clamped = max(0, min(1, v))
    return clamped <= 0.0031308
        ? 12.92 * clamped
        : 1.055 * pow(clamped, 1.0 / 2.4) - 0.055
}

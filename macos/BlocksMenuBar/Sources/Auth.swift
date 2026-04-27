import Foundation
import Security
import AppKit

@MainActor
final class Auth {
    static let shared = Auth()
    private init() {}

    func loadCookie() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: BlocksConfig.keychainService,
            kSecAttrAccount as String: BlocksConfig.keychainAccount,
            kSecUseDataProtectionKeychain as String: true,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess,
              let data = item as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        return value
    }

    @discardableResult
    func saveCookie(_ value: String) -> OSStatus {
        let data = Data(value.utf8)
        let baseQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: BlocksConfig.keychainService,
            kSecAttrAccount as String: BlocksConfig.keychainAccount,
            kSecUseDataProtectionKeychain as String: true
        ]
        let updateStatus = SecItemUpdate(baseQuery as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if updateStatus == errSecSuccess { return errSecSuccess }
        if updateStatus == errSecItemNotFound {
            var addQuery = baseQuery
            addQuery[kSecValueData as String] = data
            let addStatus = SecItemAdd(addQuery as CFDictionary, nil)
            if addStatus != errSecSuccess {
                NSLog("Auth.saveCookie SecItemAdd failed: \(addStatus)")
            }
            return addStatus
        }
        NSLog("Auth.saveCookie SecItemUpdate failed: \(updateStatus)")
        return updateStatus
    }

    func clearCookie() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: BlocksConfig.keychainService,
            kSecAttrAccount as String: BlocksConfig.keychainAccount,
            kSecUseDataProtectionKeychain as String: true
        ]
        SecItemDelete(query as CFDictionary)
    }

    func startGoogleAuth() {
        let url = BlocksConfig.baseURL.appendingPathComponent("/auth/menubar-start")
        NSWorkspace.shared.open(url)
    }

    @discardableResult
    func handleCallback(_ url: URL) -> Bool {
        guard url.scheme == BlocksConfig.urlScheme else { return false }
        guard let comps = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let session = comps.queryItems?.first(where: { $0.name == "session" })?.value,
              !session.isEmpty else {
            return false
        }
        let status = saveCookie(session)
        return status == errSecSuccess
    }
}

import Foundation

enum BlocksConfig {
    static let baseURL = URL(string: "https://blocks.smerekalabs.com")!
    static let urlScheme = "blocks-menubar"
    static let keychainService = "com.smerekatech.blocks.menubar"
    static let keychainAccount = "nuxt-session"
    static let cookieName = "nuxt-session"
}

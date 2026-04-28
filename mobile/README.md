# Blocks — Mobile

React Native (Expo) companion to the Blocks web app. Syncs with the existing Nuxt API at `https://blocks.smerekalabs.com` via the same `nuxt-session` cookie used by web and the macOS menubar app.

## Run on iOS Simulator

```sh
# from mobile/
pnpm install            # already covered by root pnpm install (workspace member)
pnpm build:palette      # regenerates src/theme/palette.generated.ts from shared/palette.ts
pnpm ios                # expo prebuild + build + open simulator
```

To point at a different backend for local development:

```sh
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 pnpm ios
```

(Simulator can reach `localhost`; physical devices cannot — use your Mac's LAN IP and run the Nuxt dev server with `--host`.)

## Auth flow (M1)

- `/auth/mobile-start` on the server sets a short-lived `mobile_auth=1` cookie, then redirects through Google OAuth.
- The Google callback (`server/routes/auth/google.get.ts`) sees the cookie and redirects to `blocks-mobile://auth/callback?session=<sealed-value>`.
- The mobile app captures the deep link via `expo-web-browser`'s `openAuthSessionAsync`, stores the session value in iOS Keychain via `expo-secure-store`, and injects `Cookie: nuxt-session=<value>` on every API request.

This mirrors the existing macOS menubar pattern (`macos/BlocksMenuBar/`).

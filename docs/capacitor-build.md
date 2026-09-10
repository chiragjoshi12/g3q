# Capacitor Build Guide (APK & iOS)

Quick reference for generating Android (APK) and iOS (iPhone) builds for the `client/` app using Capacitor.

All commands must be executed from the `client/` directory:

```bash
cd client
```

---

## 1. Android (APK)

### Commands
- **Debug APK (Fast preview)**:
  ```bash
  npm run apk
  ```
- **Release APK**:
  ```bash
  npm run apk:release
  ```
- **Open in Android Studio**:
  ```bash
  npm run cap:open
  ```

### Output Location
- **Debug APK**: `client/android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `client/android/app/build/outputs/apk/release/app-release-unsigned.apk` (or `app-release.apk`)

---

## 2. iOS (iPhone)

### Commands
- **Sync & Launch Simulator**:
  ```bash
  npm run ios
  ```
- **Open in Xcode**:
  ```bash
  npm run ios:open
  ```

### Output Location
- Xcode Project Workspace: `client/ios/App/App.xcworkspace`
- Archived IPA / Build output: Generated inside Xcode (`Product -> Archive`) or standard Xcode build output (`~/Library/Developer/Xcode/DerivedData/`).

---

## 3. General Capacitor Commands

- **Sync Web Assets to Native Projects**:
  ```bash
  npm run cap:sync
  ```
- **Generate Native Icons & Splash Screens**:
  ```bash
  npm run cap:assets
  ```

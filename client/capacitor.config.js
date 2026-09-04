/**
 * Capacitor preview app for the live Vercel client:
 * https://g3q.vercel.app/
 *
 * This file must live next to package.json so `npx cap` can find it.
 * Native projects: android/ and ios/. Shared offline page: android/www.
 */

/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: "in.g3q.preview",
  appName: "G3Q",
  webDir: "android/www",
  backgroundColor: "#2C6698",
  android: {
    allowMixedContent: false,
    backgroundColor: "#2C6698",
    webContentsDebuggingEnabled: true,
    appendUserAgent: " G3QPreview/1.0",
  },
  ios: {
    backgroundColor: "#2C6698",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "G3Q",
    appendUserAgent: " G3QPreview/1.0",
  },
  server: {
    url: "https://g3q.vercel.app",
    androidScheme: "https",
    iosScheme: "https",
    errorPath: "offline.html",
    allowNavigation: [
      "g3q.vercel.app",
      "*.vercel.app",
      "g3q-backend.azurewebsites.net",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#2C6698",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#2C6698",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

module.exports = config;

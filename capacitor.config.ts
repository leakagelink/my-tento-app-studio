import type { CapacitorConfig } from "@capacitor/cli";

// MyTento Android app. The phone loads the bundled web build from ./www
// (created by `npm run build:mobile`). No server.url, so the app works offline-first
// and always shows the code that was built.
const config: CapacitorConfig = {
  appId: "com.mytento.app",
  appName: "MyTento",
  webDir: "www",
  android: {
    allowMixedContent: false,
  },
};

export default config;

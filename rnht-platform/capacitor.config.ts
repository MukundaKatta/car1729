import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.rnht.app',
  appName: 'RNHT Temple',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#FFF8F0',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // 'DARK' = light (white) status-bar icons, required for legibility on
      // the dark maroon bar. ('LIGHT' would mean dark icons on dark maroon.)
      style: 'DARK',
      backgroundColor: '#2A0612',
    },
  },
};

export default config;

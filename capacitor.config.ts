import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orangegroove.app',
  appName: 'Orange Groove',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

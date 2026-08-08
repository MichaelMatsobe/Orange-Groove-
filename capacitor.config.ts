import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orangegroove.app',
  appName: 'Orange Groove',
  webDir: 'dist',
  server: {
    // During development you can point to your Vite server
    // androidScheme: 'https',
  },
  plugins: {
    // Future: Bluetooth, background audio, etc.
  },
};

export default config;

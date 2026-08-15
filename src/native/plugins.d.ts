/**
 * Ambient types for optional Capacitor plugins.
 *
 * These plugins are NOT installed for web builds — the app dynamically
 * imports them only on native (Capacitor) platforms and degrades
 * gracefully when they are absent. vite.config.ts aliases them to
 * src/utils/empty.ts so the web bundle resolves without the packages.
 * Install the real packages when packaging the native apps, then remove
 * these declarations.
 */
declare module '@capacitor-community/keep-awake' {
  export const KeepAwake: {
    keepAwake: () => Promise<void>;
  };
}

declare module '@capacitor/app' {
  export const App: unknown;
}

declare module 'capacitor-native-settings' {
  export const NativeSettings: {
    openAndroid: (options: { option: string }) => Promise<void>;
  };
  export const AndroidSettings: {
    TetherProvisioning: string;
  };
}

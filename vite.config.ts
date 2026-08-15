import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // GitHub Pages project site needs base '/Orange-Groove-/'; Vercel/Netlify use '/'
  const base = env.VITE_BASE || process.env.VITE_BASE || '/';

  // Native (Capacitor) builds must bundle the real plugin packages so
  // keep-awake / native-settings work inside the WebView. Web builds swap
  // them for empty stubs to keep the bundle lean and avoid native-only code.
  // Use: vite build --mode native  (see package.json "build:native")
  const isNativeBuild = mode === 'native';
  const emptyStub = path.resolve(__dirname, 'src/utils/empty.ts');
  const nativePluginAliases = isNativeBuild
    ? {}
    : {
        '@capacitor/core': emptyStub,
        '@capacitor-community/keep-awake': emptyStub,
        '@capacitor/app': emptyStub,
        'capacitor-native-settings': emptyStub,
      };

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'cross-fetch': path.resolve(__dirname, 'src/utils/native-fetch.ts'),
        'isomorphic-fetch': path.resolve(__dirname, 'src/utils/native-fetch.ts'),
        'node-fetch': path.resolve(__dirname, 'src/utils/native-fetch.ts'),
        'whatwg-fetch': emptyStub,
        firebase: emptyStub,
        'firebase/app': emptyStub,
        'firebase/database': emptyStub,
        mqtt: emptyStub,
        '@waku/sdk': emptyStub,
        '@supabase/supabase-js': emptyStub,
        ...nativePluginAliases,
      },
    },
    server: {
      port: 3000,
      host: true,
      // HMR off by default: Freebuff's managed preview requires it disabled.
      // Opt in locally with: ENABLE_HMR=true npm run dev
      hmr: process.env.ENABLE_HMR === 'true',
    },
    preview: {
      port: 4173,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'es2022',
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});

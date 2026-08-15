import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // GitHub Pages project site needs base '/Orange-Groove-/'; Vercel/Netlify use '/'
  const base = env.VITE_BASE || process.env.VITE_BASE || '/';

  return {
    base,
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'cross-fetch': path.resolve(__dirname, 'src/utils/native-fetch.ts'),
        'isomorphic-fetch': path.resolve(__dirname, 'src/utils/native-fetch.ts'),
        'node-fetch': path.resolve(__dirname, 'src/utils/native-fetch.ts'),
        'whatwg-fetch': path.resolve(__dirname, 'src/utils/empty.ts'),
        firebase: path.resolve(__dirname, 'src/utils/empty.ts'),
        'firebase/app': path.resolve(__dirname, 'src/utils/empty.ts'),
        'firebase/database': path.resolve(__dirname, 'src/utils/empty.ts'),
        mqtt: path.resolve(__dirname, 'src/utils/empty.ts'),
        '@waku/sdk': path.resolve(__dirname, 'src/utils/empty.ts'),
        '@supabase/supabase-js': path.resolve(__dirname, 'src/utils/empty.ts'),
        // Optional Capacitor plugins — dynamically imported only on native platforms
        '@capacitor-community/keep-awake': path.resolve(__dirname, 'src/utils/empty.ts'),
        '@capacitor/app': path.resolve(__dirname, 'src/utils/empty.ts'),
        'capacitor-native-settings': path.resolve(__dirname, 'src/utils/empty.ts'),
      },
    },
    server: {
      port: 3000,
      host: true,
      hmr: process.env.DISABLE_HMR !== 'true',
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

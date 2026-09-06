

// `defineConfig` from 'vitest/config' re-exports Vite's own defineConfig
// (dev/build behavior is unchanged) and additionally types the `test` field
// below — this is the standard way to add Vitest without a separate config
// file, so the existing path aliases are reused automatically instead of
// being duplicated into a second config.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react';
import  path from 'path';

//import './src/index.css';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  test: {
    environment: 'jsdom',
  },
})

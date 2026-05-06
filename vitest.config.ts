import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // server-only e' uma proteção de bundling do Next; em vitest (Node)
      // resolvemos para um modulo vazio para nao quebrar import de helpers
      // RSC sob teste.
      'server-only': path.resolve(__dirname, './src/test/server-only-shim.ts'),
    },
  },
});

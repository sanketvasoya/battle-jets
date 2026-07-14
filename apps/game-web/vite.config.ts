import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    alias: {
      '@battle-jets/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@battle-jets/physics': path.resolve(__dirname, '../../packages/physics/src'),
      '@battle-jets/game-engine': path.resolve(__dirname, '../../packages/game-engine/src'),
    }
  }
});

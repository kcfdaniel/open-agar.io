import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'client',
  build: {
    emptyOutDir: true,
    rollupOptions: {  // TODO: remove this?
      external: ['express', 'socket.io', 'sat', 'sqlite3', 'uuid']
    }
  },
  server: {
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),  // TODO: change path
    },
  },
});
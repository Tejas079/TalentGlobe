import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8082,
    open: false,
    host: true
  },
  build: {
    target: 'esnext'
  }
});

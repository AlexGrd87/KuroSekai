import { defineConfig } from 'vite';

export default defineConfig({
  // En prod (GitHub Pages) : base = /NomDuRepo/
  // En dev : base = /
  base: process.env.VITE_BASE_PATH ?? '/',

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

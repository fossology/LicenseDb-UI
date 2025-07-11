import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.', // default
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html', // Avoid scanning unwanted HTML files
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});


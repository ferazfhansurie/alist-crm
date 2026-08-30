import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: '/assets/alist_crm/alist/',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../alist_crm/public/alist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith('.css') ? 'app.css' : '[name]-[hash][extname]'
      }
    }
  }
});

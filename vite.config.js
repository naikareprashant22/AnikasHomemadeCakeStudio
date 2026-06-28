import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // No base: needed for Firebase Hosting (only needed for GitHub Pages)
  root: '.',
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'src/pages/index.html'),
        about:      resolve(__dirname, 'src/pages/about.html'),
        gallery:    resolve(__dirname, 'src/pages/gallery.html'),
        reviews:    resolve(__dirname, 'src/pages/reviews.html'),
        contact:    resolve(__dirname, 'src/pages/contact.html'),
        adminLogin: resolve(__dirname, 'src/pages/admin/index.html'),
        adminDash:  resolve(__dirname, 'src/pages/admin/dashboard.html'),
      }
    }
  },

  server: {
    port: 5173,
    // Mirrors Firebase Hosting rewrites so /admin works locally too
    open: '/src/pages/index.html',
  }
});
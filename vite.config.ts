import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [checker({ typescript: true })],
  worker: {},
  build: {
    sourcemap: true,
    assetsInlineLimit: 0, // Don't inline any assets
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three', 'stats.js', 'lil-gui'],
          three: ['three/examples/jsm/loaders/FontLoader.js', 'three/examples/jsm/geometries/TextGeometry.js'],
        }
      }
    },
    // Ensure assets are properly handled
    outDir: 'dist',
    emptyOutDir: true,
    // Copy needed files
    copyPublicDir: true,
  },
  server: {
    open: true,
    port: 1234,
    host: "0.0.0.0",
    cors: true,
  },
  preview: {
    port: 1234,
    host: "0.0.0.0",
    cors: true,
  },
  // Important for asset loading
  base: '/',
  publicDir: 'public',
  resolve: {
    alias: {
      // Ensure three.js and its submodules are properly resolved
      'three': 'three',
      '@': '/src',
    }
  },
  assetsInclude: ['**/*.glb', '**/*.jpg', '**/*.png', '**/*.json', '**/*.woff'],
});

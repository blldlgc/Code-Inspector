import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    watch: {
      usePolling: true, // Docker içinde dosya değişikliklerini algılamak için
    },
    host: true, // Container dışından erişime izin ver
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      fs: path.resolve(__dirname, "./src/empty-module.js")
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: "[name].[ext]", // WASM dosyalarının doğru işlenmesi için
      },
    },
  },
  optimizeDeps: {
    exclude: ["web-tree-sitter"], // Vite'nin önceden optimize etmesini engelle
  },
  assetsInclude: ['**/*.wasm'],
});

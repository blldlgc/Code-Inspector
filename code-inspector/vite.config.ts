import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      fs: false, // fs modülünü tarayıcı ortamında devre dışı bırak
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
});

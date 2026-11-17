import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Adutha Bus",
        short_name: "Adutha Bus",
        description: "Bus timings between Coimbatore and Tiruppur",
        theme_color: "#0f766e",
        background_color: "#fafafa",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,mjs,css,html,svg,png}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  lint: {
    ignorePatterns: [
      "**/dist/**",
      "**/node_modules/**",
      "src/routeTree.gen.ts",
      "src/generated/**",
    ],
  },
  fmt: {
    ignorePatterns: [
      "**/dist/**",
      "src/routeTree.gen.ts",
      "src/generated/**",
      "pnpm-lock.yaml",
      "*.md",
    ],
  },
});

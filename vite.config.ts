import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative base so the static build works from any host/sub-path (e.g. GitHub Pages).
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "בר-אילן אוטו-פיילוט",
        short_name: "אוטו-פיילוט",
        description: "ניווט אוטומטי לכיתה הבאה בבר-אילן",
        lang: "he",
        dir: "rtl",
        display: "standalone",
        start_url: ".",
        theme_color: "#0a0a0a",
        background_color: "#ffffff",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "happy-dom", include: ["tests/**/*.test.ts"] },
});

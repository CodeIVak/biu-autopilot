import { readFileSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";
import { BOOKMARKLET_FILE } from "./src/bookmarklet/loader";

/** Publishes the built bookmarklet next to the app, where the short loader bookmarklet fetches it. */
function hostedBookmarklet(): Plugin {
  return {
    name: "hosted-bookmarklet",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: BOOKMARKLET_FILE,
        source: readFileSync(path.resolve(__dirname, "src/bookmarklet/dist/bookmarklet.js"), "utf8"),
      });
    },
  };
}

export default defineConfig({
  // Relative base so the static build works from any host/sub-path.
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    hostedBookmarklet(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      // The bookmarklet runs on Inbar, never inside the app, so the service worker skips it.
      workbox: { globIgnores: [BOOKMARKLET_FILE] },
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

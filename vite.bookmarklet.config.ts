import path from "node:path";
import { defineConfig } from "vite";

// Builds src/bookmarklet/main.ts into one self-contained IIFE that the app imports with ?raw
// and turns into a javascript: URL.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: {
    outDir: "src/bookmarklet/dist",
    emptyOutDir: true,
    minify: "esbuild",
    lib: {
      entry: path.resolve(__dirname, "src/bookmarklet/main.ts"),
      formats: ["iife"],
      name: "BiuAutopilotBookmarklet",
      fileName: () => "bookmarklet.js",
    },
  },
});

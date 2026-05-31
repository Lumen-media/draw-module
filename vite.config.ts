import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";

const HOST_EXTERNALS = ["react", "react-dom", "@lumen-media/ui", "@lumen-media/module-sdk"];

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  plugins: [
    {
      name: "lumen-module-assets",
      closeBundle() {
        const out = resolve(process.cwd(), "dist");
        mkdirSync(out, { recursive: true });
        copyFileSync(resolve(process.cwd(), "manifest.json"), resolve(out, "manifest.json"));
      },
    },
  ],
  build: {
    lib: {
      entry: resolve(process.cwd(), "src/main.ts"),
      formats: ["es"],
      fileName: () => "main.js",
    },
    rollupOptions: {
      external: (id: string) =>
        HOST_EXTERNALS.some((e) => id === e || id.startsWith(`${e}/`)),
    },
    sourcemap: true,
    emptyOutDir: true,
    outDir: "dist",
    minify: false,
  },
  esbuild: {
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    jsxInject: "import React from 'react'",
  },
});

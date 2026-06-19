import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from "fs";

function copyAssets() {
  return {
    name: "copy-assets",
    closeBundle() {
      const distDir = "dist";
      
      if (!existsSync(`${distDir}/src/assets/icons`)) {
        mkdirSync(`${distDir}/src/assets/icons`, { recursive: true });
      }
      
      const icons = readdirSync("src/assets/icons");
      icons.forEach((icon) => {
        copyFileSync(
          `src/assets/icons/${icon}`,
          `${distDir}/src/assets/icons/${icon}`
        );
      });

      if (!existsSync(`${distDir}/src/content`)) {
        mkdirSync(`${distDir}/src/content`, { recursive: true });
      }
      copyFileSync(
        "src/content/styles.css",
        `${distDir}/src/content/styles.css`
      );

      copyFileSync("manifest.json", `${distDir}/manifest.json`);

      const popupHtmlPath = `${distDir}/src/popup/popup.html`;
      if (existsSync(popupHtmlPath)) {
        let html = readFileSync(popupHtmlPath, "utf-8");
        html = html.replace(/src="\/assets\//g, 'src="../../assets/');
        html = html.replace(/href="\/assets\//g, 'href="../../assets/');
        writeFileSync(popupHtmlPath, html);
      }
    },
  };
}

export default defineConfig({
  define: {
    __DEBUG__: process.env.NODE_ENV !== 'production',
  },
  plugins: [copyAssets()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "src/background/index.js";
          }
          if (chunkInfo.name === "content") {
            return "src/content/index.js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});

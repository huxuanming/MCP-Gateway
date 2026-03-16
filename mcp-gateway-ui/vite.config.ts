import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

function readGitTagVersion(): string | null {
  try {
    const tag = execSync("git describe --tags --abbrev=0", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
    return tag.replace(/^v/, "") || null;
  } catch {
    return null;
  }
}

// 优先使用 CI 注入的 tag（如 v0.2.0），其次读取本地 git tag，最后回退 package.json
const pkgVersion = (JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf-8")
) as { version: string }).version;
const gitTagVersion = readGitTagVersion();
const appVersion = (process.env.VITE_APP_VERSION || gitTagVersion || pkgVersion).replace(/^v/, "");

export default defineConfig(async () => ({
  plugins: [react()],
  define: {
    // 编译时注入版本号，运行时通过 import.meta.env.VITE_APP_VERSION 读取
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target:
      process.env.TAURI_ENV_PLATFORM == "windows"
        ? "chrome105"
        : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}));

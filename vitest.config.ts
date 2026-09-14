import { fileURLToPath, URL } from "node:url"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vitest/config"

// 测试配置与 vite.config.ts 分开，原因：
//   - 测试需要 jsdom 环境与 @vue/test-utils；
//   - 测试**不**参与 demo / lib 两套构建，避免把测试代码带进产物。
//
// 注意 alias 与 vite.config.ts 保持一致：组件源码内部只用相对路径，
// 但演示页与测试都要能解析 "@sn/ui" 与 "@" 别名。
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@sn/ui": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
    // 组件源码在 strictNullChecks 档位下编写，测试沿用同一套 tsconfig 语义
    server: { deps: { inline: ["@iconify/vue"] } },
  },
})

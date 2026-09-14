import { fileURLToPath, URL } from "node:url"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

// 组件库构建配置（Vue 3 + Vite 7）。
//
// 说明：
// - 组件本身全部使用**相对路径**互相引用（这是它能被整体复制到任意项目的前提），
//   因此本文件不承担让组件库自身可编译的职责，别名只为宿主项目书写方便而存在。
// - Vite 7 的 css.preprocessorOptions.scss.api 默认已是 "modern-compiler"，
//   无需显式配置；若日后出现 legacy JS API 弃用告警再补上该项。
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      // 推荐宿主用 `import Button from "@sn/ui/Button.vue"` 引用组件
      "@sn/ui": fileURLToPath(new URL("./src/components", import.meta.url)),
    },
  },

  build: {
    // 演示页构建产物
    outDir: "dist",
    sourcemap: false,
  },
})

import { fileURLToPath, URL } from "node:url"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

// 两套构建目标，用 --mode 切换：
//   npm run build        → mode=demo（默认）：构建演示页到 dist/
//   npm run build:lib    → mode=lib        ：构建 npm 包到 dist-lib/
//
// 组件本身全部使用**相对路径**互相引用（这是它能被整体复制到任意项目的前提），
// 别名 "@sn/ui" 只为宿主/演示页书写方便，组件内部不使用它。
export default defineConfig(({ mode }) => {
  const isLib = mode === "lib"

  return {
    plugins: [
      vue(),
      // 仅库构建产出 .d.ts 类型声明
      ...(isLib
        ? [dts({
            tsconfigPath: "./tsconfig.lib.json",
            include: ["src/index.ts", "src/chart.ts", "src/components/**/*.ts", "src/components/**/*.vue"],
            outDir: "dist-lib",
            // 类型声明不需要类型检查以外的产出，也不希望把 .vue 的模板编译进去
            copyDtsFiles: false,
            // 声明文件里保留相对路径结构，方便使用方点进源码
            entryRoot: "src",
          })]
        : []),
    ],

    resolve: {
      alias: {
        "@sn/ui": fileURLToPath(new URL("./src/components", import.meta.url)),
      },
    },

    build: isLib
      ? {
          // ---- npm 包构建 ----
          outDir: "dist-lib",
          emptyOutDir: true,
          sourcemap: false,
          // 库不压缩，方便使用方调试与二次打包
          minify: false,
          lib: {
            // 双入口：
            //   index → 52 个组件（不含 Chart）
            //   chart → 单独的图表入口，只有用方按需引入，避免被迫安装 chart.js
            entry: {
              index: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
              chart: fileURLToPath(new URL("./src/chart.ts", import.meta.url)),
            },
            formats: ["es"],
          },
          rollupOptions: {
            // 运行时依赖一律外部化，交给使用方安装，避免重复打包 Vue
            // 注意：@iconify-json/mdi 是**数据**依赖，被 kit/iconify.ts 静态引入以支持离线图标，
            // 不做外部化（否则使用方还需自行注册图标集，失去「开箱离线可用」的特性）。
            external: [
              "vue",
              "@iconify/vue",
              /^chart\.js/,
              /^vue-chartjs/,
            ],
            output: {
              // 所有组件样式合并为单一 style.css，使用方一次引入
              assetFileNames: (assetInfo) => {
                const name = assetInfo.names?.[0] ?? assetInfo.name ?? ""
                return name.endsWith(".css") ? "style.css" : "assets/[name][extname]"
              },
            },
          },
        }
      : {
          // ---- 演示页构建 ----
          outDir: "dist",
          sourcemap: false,
        },
  }
})

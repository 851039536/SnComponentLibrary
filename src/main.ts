import { applyDefaultTheme } from "./components/kit/theme"
import { createApp } from "vue"
import App from "./App.vue"

// 演示页显式应用一次默认主题（组件内部也会副作用触发，这里仅为可读性显式化）。
// 真实业务项目若已自定义 --b3-theme-*，theme.ts 会自动让位，无需删除本行。
applyDefaultTheme()

createApp(App).mount("#app")

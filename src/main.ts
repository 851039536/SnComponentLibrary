import App from "./App.vue"
import { applyDefaultTheme } from "./components/kit/theme"
import { createApp } from "vue"

// 演示页显式应用一次默认主题（组件内部也会副作用触发，这里仅为可读性显式化）。
// 真实业务项目若已自定义 --b3-theme-*，theme.ts 会自动让位，无需删除本行。
applyDefaultTheme()

// 全局重置：让左侧目录贴边（浏览器默认给 body 8px 外边距）。
// 仅演示页需要，组件库本身不注入任何全局重置。
const style = document.createElement("style")
style.textContent = `
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--b3-theme-background, #fff);
    color: var(--b3-theme-on-background, #1a1a1a);
  }
  /* 演示页自测用：把滚动条做得低调些，避免影响观感 */
  .side__nav::-webkit-scrollbar { width: 8px; }
  .side__nav::-webkit-scrollbar-thumb {
    background: var(--b3-theme-outline, #d9d7d3);
    border-radius: 4px;
  }
  .side__nav::-webkit-scrollbar-track { background: transparent; }
`
document.head.appendChild(style)

createApp(App).mount("#app")

# SN 通用组件库

一套可直接用于**任意 Vue 3 项目**的 UI 组件库：**52 个公开组件**（按钮、表单、下拉、日历、浮层、图表、布局等），
零框架耦合、图标离线可用、明暗主题开箱即用。

| 项 | 说明 |
|---|---|
| 技术栈 | Vue 3.5 + Vite 7 + TypeScript 5.9 |
| 组件数 | 52 个公开组件（`src/components/*.vue`） |
| 来源 | 从 `siyuanPluginVueSN` 的 `src/components/` 整体迁移，未改写任何组件实现 |
| 运行时依赖 | `vue`、`@iconify/vue`、`@iconify-json/mdi` |
| 可选依赖 | `chart.js`、`vue-chartjs`（仅 `Chart.vue` 需要） |

---

## 一、快速开始

```bash
npm install
npm run dev        # 打开演示页，逐一查看 52 个组件
```

其他脚本：

```bash
npm run build      # 构建演示页到 dist/
npm run preview    # 预览构建产物
npm run typecheck  # vue-tsc 类型检查
```

---

## 二、在其它 Vue 3 项目中引入

### 方式 A：复制组件源码（推荐，零构建成本）

把 `src/components/` **整个目录**复制到目标项目（例如放到目标项目的 `src/components/`），然后：

```bash
npm i vue @iconify/vue @iconify-json/mdi
npm i -D sass @vitejs/plugin-vue
# 只有用到图表组件时才需要：
npm i chart.js vue-chartjs
```

> ⚠️ 必须**整个目录**复制，不要只挑几个 `.vue` 文件。组件之间互相引用，
> 并且依赖 `styles/`、`kit/` 及各私有子目录，少一个都会编译报错。
> 目录内部**全部使用相对路径**，所以放在哪儿都行，也不需要配置路径别名。

### 方式 B：本仓库内引用（配了 `@sn/ui` 别名）

本仓库的 `vite.config.ts` 已配置别名 `@sn/ui` → `src/components`：

```vue
<script setup lang="ts">
import Button from "@sn/ui/Button.vue"
import Input from "@sn/ui/Input.vue"
</script>

<template>
  <Input v-model="name" placeholder="你的名字" size="small" />
  <Button variant="primary">保存</Button>
</template>
```

> 该别名只为本仓库/宿主书写方便，**组件内部不使用它**——这正是组件库能被整体搬运的前提。

---

## 三、主题定制

组件的颜色全部读取 CSS 变量 `--b3-theme-*`（共 20 个）。宿主未定义时，`kit/theme.ts` 会自动注入一套默认的明暗配色。

**方式 1（推荐）：在目标项目自己的全局样式里定义变量**

```css
:root {
  --b3-theme-primary: #7c3aed;   /* 你的品牌色 */
  --b3-border-color: #e5e7eb;
}
```

宿主样式恒优先于组件库注入的默认值（注入内容包在 `@layer` 内，未分层样式优先级更高），已实测可直接覆盖。

**方式 2：调用组件库提供的函数**

```ts
import { applyDefaultTheme } from "@sn/ui/kit/theme"

applyDefaultTheme({ overrides: { "b3-theme-primary": "#7c3aed" } })
```

**方式 3：直接改 `src/components/kit/theme.ts` 里的 `LIGHT_VARS` / `DARK_VARS` 两张表。**

暗色由 `prefers-color-scheme: dark`、`[data-theme="dark"]`、`.dark` 三种条件之一触发，
给根元素加 `.dark` 类即可手动切换：

```ts
document.documentElement.classList.toggle("dark", isDark)
```

---

## 四、使用约束（重要）

以下都是实际使用中的真实坑，来自组件库自带文档 `src/components/docs/components-vue3-migration-guide.md`：

- **`Button` 没有 `label` 属性**，文字必须写在默认插槽里：`<Button>保存</Button>`。
  写成 `<Button label="保存" />` 不会报错，但按钮是空的（`label` 会作为无用的 HTML 属性落空）。
  同理 `Tab`、`ToggleButton`（后者用 `onLabel` / `offLabel`）。
- **图标名必须是 `kit/icons.ts` 里注册过的键**（如 `icon="close"`），**不能**直接写 `"mdi:close"`。
  名称不在表里会渲染成问号圆圈。
- **`Select` / `DatePicker` 的下拉是相对定位**（不是传送门挂到 body），父容器 `overflow: hidden` 会把下拉裁掉。
- **`FormField` 是多根组件**：控件必须写在它的默认插槽里，写在旁边会让提示文字跑到控件上方。
- **`Loader` 没有 props 且高度 100%**：父容器必须给显式高度，否则高度为 0 看不见。
- `Input` / `Select` / `Textarea` 在表单里建议显式写 `size="small"`（默认就是 small，medium 偏大）。
- **浏览器要求**：组件样式使用了较新的 CSS 相对颜色语法（Chromium 119+ / Safari 16.4+ / Firefox 128+）。

---

## 五、目录结构

```
src/
├── main.ts                  # 演示页入口
├── App.vue                  # 演示 / 自测页（按功能分组渲染代表性组件）
├── vite-env.d.ts            # *.vue 类型声明 + Chart 可选依赖的占位声明
└── components/              # ★ 组件库本体（可整体复制走）
    ├── *.vue                # 52 个公开组件
    ├── kit/                 # 自包含支撑层（随库一起复制）
    │   ├── icons.ts         # 图标表真源（IconKey / getIconConfig）
    │   ├── variables.scss   # 设计 Token 真源（$color-* / $font-* / $radius-* / $spacing-*）
    │   ├── theme.ts         # 默认主题注入（宿主未定义 --b3-theme-* 时才注入）
    │   ├── iconify.ts       # mdi 图标离线注册（不请求任何 CDN）
    │   └── format.ts        # 组件库自用格式化函数（formatFileSize）
    ├── styles/              # 组件样式（含共享基座 index.scss 与 _mixins.scss）
    ├── confirm/ datePicker/ fileUpload/ focustrap/ megaMenu/ metergroup/
    ├── overlay/ paginator/ select/ sidebar/ speedDial/ splitter/ tabs/
    ├── textarea/ tieredMenu/ timeline/ toast/ tooltip/   # 各组件私有实现目录
    └── docs/                # 组件库自带迁移说明与维护者约定
```

命名约定：`components/` 根目录下的 `.vue` 是**公开入口**，各私有子目录为内部实现，业务代码不应深入导入。

---

## 六、裁剪不需要的组件

| 不要的东西 | 一并删除 | 可省掉的依赖 |
|---|---|---|
| 图表 | `Chart.vue`、`styles/Chart.scss`、`chart.types.ts`、`vite-env.d.ts` 中的 Chart 占位声明 | `chart.js`、`vue-chartjs` |
| 浮动按钮 | `SpeedDial.vue`、`styles/SpeedDial.scss`、`speedDial/` | — |
| 矢量图标表瘦身 | `kit/icons.ts` 中大段业务图标可删，**保留** `COMMON_ICONS` 与 `getIconConfig()` | — |

> `IconWrapper.vue` 是 18 个组件的公共依赖，**不能删**。

---

## 七、迁移到本仓库时做的改动（维护者向）

为保持与源仓库可长期 diff，组件实现**零改写**。仅有的改动是切断两处外部耦合，以及修复一个主题自检测缺陷：

1. **新增 `kit/format.ts`**：把 `FileUpload.vue` 与 `fileUpload/FileList.vue` 中
   `import { formatFileSize } from "@/utils/format"` 改为相对路径 `./kit/format` / `../kit/format`。
   这是全目录仅有的两处非相对路径导入。
2. **修复 `kit/theme.ts` 的自检测缺陷**（`hostProvidesTheme()`）：
   原实现在复核时用 `getComputedStyle` 读 `--b3-theme-primary`，会读到**本模块自己注入的值**，
   从而误判「宿主已提供主题」并把刚注入的 style 节点删掉，导致默认主题完全失效
   （表现为组件全部退回 scss 里的硬编码 fallback 色）。
   修复方式：测量前先把自有节点从文档中摘下、量完立刻放回。
   该缺陷在思源内被掩盖（宿主确实先定义了变量），迁移到普通项目后才暴露。

同步自源仓库时请注意：`kit/theme.ts` 的这处修复需要**反向回灌**到源仓库。

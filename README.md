# SN 通用组件库

一套可直接用于**任意 Vue 3 项目**的 UI 组件库：**52 个公开组件**（按钮、表单、下拉、日历、浮层、图表、布局等），
零框架耦合、图标离线可用、明暗主题开箱即用。

| 项 | 说明 |
|---|---|
| 技术栈 | Vue 3.5 + Vite 7 + TypeScript 5.9 |
| 组件数 | 52 个公开组件（`src/components/*.vue`） |
| 来源 | 从 `siyuanPluginVueSN` 的 `src/components/` 整体迁移，未改写任何组件实现 |
| 包名 | `sn-component-library` |
| peer 依赖 | `vue`（`^3.5.0`） |
| 运行时依赖 | `@iconify/vue`、`@iconify-json/mdi`（后者为离线图标数据） |
| 可选依赖 | `chart.js`、`vue-chartjs`（**仅**使用图表时需要，见第三章） |

---

## 一、导入到其他项目

有两种方式，按场景选择：

| 方式 | 适用场景 | 是否需构建本仓库 |
|---|---|---|
| **A. 安装 npm 包** | 常规使用；希望按 import 路径引组件、有类型提示 | 需要（`npm run build:lib`） |
| **B. 复制组件源码** | 想直接改组件源码；不想引入构建流程 | 不需要 |

> **推荐方式 A**：组件之间互相依赖，用包管理能拿到完整类型提示，且升级只需重新安装。
> 方式 B 适合需要深度定制组件内部实现的情况。

### 方式 A：作为 npm 包安装（推荐）

**第 1 步：在本仓库构建并打包**

```bash
cd SnComponentLibrary
npm install
npm run build:lib          # 产出 dist-lib/（JS + .d.ts + style.css）
npm pack                   # 产出 sn-component-library-1.0.0.tgz
```

> 💡 以上三步（含打包前四道校验、版本自动判定、以及直接装到目标项目）
> 已封装成交互式脚本，**推荐直接用**：
>
> ```bash
> npm run release          # 交互式菜单：打包 / 版本变化打包 / 安装到其他项目 / 查看历史
> ```
>
> 详见 [`scripts/README.md`](./scripts/README.md)。

**第 2 步：在目标项目中安装**

```bash
# 本地 tarball（离线分发 / 内网）
npm i /path/to/sn-component-library-1.0.0.tgz

# 或者：直接指向本仓库目录（开发期联调最省事，改了本仓库重新 install 即生效）
npm i file:/path/to/SnComponentLibrary

# 或者：已发布到私有/公有 registry
npm i sn-component-library
```

目标项目还需要（`vue` 是 peer 依赖，须自行安装；`@iconify/*` 会自动带上）：

```bash
npm i vue@^3.5.0
```

#### 不用 registry：tarball 拷贝分发（离线 / 内网 / 同事之间传）

完全不需要 `npm publish`，也不需要登录 npm 账号。**已实测通过**的流程：

**① 在组件库仓库打出 tarball**

```bash
cd SnComponentLibrary
npm install
npm run build:lib      # 先构建，产物在 dist-lib/
npm pack               # 产出 sn-component-library-1.0.0.tgz（约 870KB）
```

**② 把这个 .tgz 拷给对方**（U 盘、共享盘、IM、内网文件服务器都行）

**③ 在目标项目里安装**

```bash
# 建议放到项目内的 libs/ 目录再安装，这样路径跟着仓库走，换机器也能装
mkdir libs
cp /path/to/sn-component-library-1.0.0.tgz libs/
npm i ./libs/sn-component-library-1.0.0.tgz
```

装完后 `package.json` 会记录为 `"sn-component-library": "file:libs/sn-component-library-1.0.0.tgz"`。

**④ 更新到新版本**

```bash
# 组件库侧：改完代码后 bump 版本再打包
npm version patch --no-git-tag-version   # 1.0.0 -> 1.0.1
npm run build:lib && npm pack

# 目标项目侧：换掉 libs/ 里的 tgz，重新安装
npm i ./libs/sn-component-library-1.0.1.tgz
```

> ⚠️ **改完组件库务必 bump 版本号**。相同版本号、相同文件名的 tarball 覆盖后，
> npm 可能因缓存而沿用旧内容（虽然实测 npm 12 能识别 `changed 1 package`，
> 但依赖这个行为不可靠）。bump 版本是唯一稳妥的更新方式 —— 换了文件名，
> npm 一定重新解包。

> ⚠️ `file:` 路径是**相对目标项目**解析的（`file:libs/...` 而非绝对路径）。
> 因此把 .tgz 放进项目内的 `libs/` 并提交到版本库，团队成员 clone 后
> `npm install` 即可复现，不会因各自机器上的绝对路径不同而失败。
> 但注意：这样会把约 870KB 的二进制文件提交进仓库。

**几种分发方式对比**

| 方式 | 需要 registry | 需要登录 | 适合 |
|---|---|---|---|
| `npm pack` + 拷 .tgz | 否 | 否 | **离线 / 内网 / 临时分发（推荐）** |
| `npm i file:/path/to/SnComponentLibrary` | 否 | 否 | 本机开发联调，改完组件库重装即生效 |
| 私有 registry（Verdaccio / Nexus 等） | 是 | 是 | 团队长期使用、需要版本管理 |
| 公开发布 npmjs | 是 | 是 | 开源项目 |

> 补充：本机 npm 若指向国内镜像（`npm config get registry` 显示
> `registry.npmmirror.com` 之类），该镜像**只读**，`npm publish` 会被拒绝。
> 若要公开发布需先切回 `https://registry.npmjs.org`。但按上面的 tarball 方式
> 分发则完全不受影响 —— 这也是它更省事的原因之一。

**第 3 步：引入样式并开始使用**

```ts
// main.ts
import { createApp } from "vue"
import App from "./App.vue"
import "sn-component-library/style.css"   // ① 组件样式，全局引入一次

createApp(App).mount("#app")
```

```vue
<!-- 任意组件 -->
<script setup lang="ts">
import { Button, Input, Select } from "sn-component-library"  // ② 具名导入，按需 tree-shaking
import { ref } from "vue"

const name = ref("")
const plan = ref("pro")
const options = [
  { label: "免费版", value: "free" },
  { label: "专业版", value: "pro" },
]
</script>

<template>
  <Input v-model="name" label="用户名" size="small" />
  <Select v-model="plan" :options="options" label="套餐" size="small" />
  <!-- 注意：Button 的文字写在插槽里，没有 label 属性！ -->
  <Button variant="primary" @click="save">保存</Button>
</template>
```

**用图表组件时（可选依赖）**

`Chart` **不在主入口**，它单独放在子路径下，这样不用图表的项目无需安装 `chart.js`：

```bash
npm i chart.js vue-chartjs
```

```vue
<script setup lang="ts">
import { Chart } from "sn-component-library/chart"
</script>
```

详见下方第二章「用法 4」。

**方式 A 的注意事项**

- 本包 `main`/`module` 字段指向 `dist-lib/index.js`（ES 格式，无 CJS 版本）。
  目标项目需为 Vite / Rollup / Webpack 5 等支持 ESM 的构建工具。
- 使用方**无需**自己配置 sass —— 样式已在构建期编译进 `style.css`。
- 使用方**无需**手动注册图标集 —— 离线图标数据已内置（见第五章）。

---

## 二、在第三方项目中怎么用组件

以下用法均在**独立第三方项目**中实测通过（`vue-tsc` 类型检查 + `vite build` + 浏览器运行时渲染）。

### 用法 1：按需具名导入（推荐）

```vue
<script setup lang="ts">
import { Button, Card, Input, Select, Tag } from "sn-component-library"
import { ref } from "vue"

const name = ref("")
const plan = ref("pro")
const options = [
  { label: "免费版", value: "free" },
  { label: "专业版", value: "pro" },
]
</script>

<template>
  <Card title="表单">
    <!-- v-model 与原生表单一致 -->
    <Input v-model="name" label="用户名" size="small" clearable />
    <Select v-model="plan" :options="options" label="套餐" size="small" />
    <Tag content="标签" variant="success" />
    <!-- Button 的文字写插槽里，没有 label 属性 -->
    <Button variant="primary">保存</Button>
  </Card>
</template>
```

带类型的导入（编辑器有完整提示）：

```ts
import type { IconKey, ThemeOptions } from "sn-component-library"
```

### 用法 2：全局注册（不想逐个 import）

```ts
// main.ts
import * as SnUI from "sn-component-library"
import { createApp } from "vue"
import App from "./App.vue"
import "sn-component-library/style.css"

const app = createApp(App)

// 批量注册为全局组件，统一加 Si 前缀避免与其它库冲突。
// ⚠️ 必须过滤：库还导出了函数（applyDefaultTheme 等）与常量，直接全注册会报错。
for (const [name, comp] of Object.entries(SnUI)) {
  const isComponent
    = comp && (typeof comp === "object" || typeof comp === "function")
      && ("render" in comp || "setup" in comp || "__name" in comp || "__file" in comp)
  if (isComponent && /^[A-Z]/.test(name)) app.component(`Si${name}`, comp)
}

app.mount("#app")
```

之后模板里直接用，脚本中无需 import：

```vue
<template>
  <SiCard title="全局注册">
    <SiInput v-model="name" label="用户名" size="small" />
    <SiButton variant="primary">确定</SiButton>
  </SiCard>
</template>
```

> 代价：全局注册会牺牲 tree-shaking（整库进产物），且模板里没有类型提示。
> 除非项目大量使用本库，否则**优先用用法 1**。

### 用法 3：受控组件（可见性用 `v-model:visible`）

浮层类组件（`Dialog` / `Drawer` / `ConfirmDialog` / `ConfirmPopup`）的显隐由**使用方**控制：

```vue
<script setup lang="ts">
import { Button, ConfirmDialog, Dialog } from "sn-component-library"
import { ref } from "vue"

const dialogVisible = ref(false)
const confirmVisible = ref(false)
</script>

<template>
  <Button @click="dialogVisible = true">打开</Button>

  <Dialog v-model:visible="dialogVisible" header="标题" dismissable-mask>
    <p>内容</p>
    <template #footer>
      <Button text @click="dialogVisible = false">取消</Button>
      <Button @click="dialogVisible = false">确定</Button>
    </template>
  </Dialog>

  <ConfirmDialog
    v-model:visible="confirmVisible"
    header="确认删除"
    message="删除后不可恢复，确定继续吗？"
    accept-label="删除"
    reject-label="取消"
    @accept="confirmVisible = false"
    @reject="confirmVisible = false"
  />
</template>
```

Toast 同理，用 `v-model:messages` 传入消息数组：

```vue
<script setup lang="ts">
import { Toast } from "sn-component-library"
import { ref } from "vue"

const toasts = ref<{
  severity?: "success" | "info" | "error"
  summary?: string
  detail?: string
  life?: number
}[]>([])

function push() {
  toasts.value = [...toasts.value, { severity: "success", summary: "保存成功", life: 3000 }]
}
</script>

<template>
  <Toast v-model:messages="toasts" position="top-right" />
</template>
```

### 用法 4：图表组件（子入口 + 可选依赖）

```bash
npm i chart.js vue-chartjs      # 只有用图表才需要装
```

```vue
<script setup lang="ts">
import { Card } from "sn-component-library"
import { Chart } from "sn-component-library/chart"

// ⚠️ Chart 的 data 是**扁平数组**，不是 chart.js 原生的 { labels, datasets }：
const data = [
  { label: "一月", value: 12 },
  { label: "二月", value: 19 },
  { label: "三月", value: 8 },
]

// options 也是本库的简化结构（不是 chart.js 的 options）
const options = { showLegend: false, showGrid: true, showTooltip: true, animationDuration: 600 }
</script>

<template>
  <Card title="月度统计">
    <!-- type 取值：line | bar | pie | doughnut | area -->
    <div style="height: 240px;">
      <Chart type="bar" :data="data" :options="options" />
    </div>
  </Card>
</template>
```

> **注意**：`Chart` 必须放在有**显式高度**的容器里（内部是 `maintainAspectRatio: false`），
> 否则高度会塌陷。
>
> 若忘了装 `chart.js`，构建时会直接报
> `Rollup failed to resolve import "chart.js" from .../dist-lib/chart.js` —— 错误信息明确。
> 只用主入口的项目不受影响。

### 用法 5：自定义主题（可选）

组件颜色全部读 CSS 变量 `--b3-theme-*`，宿主未定义时库会自动注入一套默认明暗配色。

```ts
// main.ts —— 两种方式任选
import { applyDefaultTheme } from "sn-component-library"

// ① 调用函数（同时作用于明暗两套）
applyDefaultTheme({ overrides: { "b3-theme-primary": "#7c3aed" } })
```

```css
/* ② 或在自己项目的全局样式里直接定义（优先级更高，会覆盖库内注入值） */
:root {
  --b3-theme-primary: #7c3aed;
  --b3-border-color: #e5e7eb;
}
```

暗色由 `prefers-color-scheme: dark`、`[data-theme="dark"]`、`.dark` 三者之一触发：

```ts
document.documentElement.classList.toggle("dark", isDark)
```

> ⚠️ `applyDefaultTheme({ overrides })` 的覆盖值**同时**用于明暗两套主题。
> 若你给的品牌色在暗色下对比度不足，请改用方式 ②，分别在 `:root` 和 `.dark` 下定义。

### 用法 6：直接使用 kit 里的工具与图标

主入口也导出了组件库的公共能力：

```ts
import {
  applyDefaultTheme,
  COMMON_ICONS,
  formatFileSize,
  getIconConfig,
  setupKitIcons,
} from "sn-component-library"
import type { IconKey } from "sn-component-library"

formatFileSize(1536000)        // "1.46 MB"
getIconConfig("star")          // { icon: "mdi:star", color: "#fbbf24" }
```

```vue
<script setup lang="ts">
import { IconWrapper } from "sn-component-library"
import type { IconKey } from "sn-component-library"

const star: IconKey = "star"
</script>

<template>
  <!-- 图标名必须是 kit/icons.ts 里注册过的键，不能写 "mdi:star" -->
  <IconWrapper :name="star" :size="20" />
  <IconWrapper name="magnify" :size="20" />
</template>
```

### 第三方项目最小接入清单

```bash
# 1. 安装（tarball 方式，详见第一章）
npm i ./libs/sn-component-library-1.0.0.tgz
npm i vue@^3.5.0            # peer 依赖，需自行安装
```

```ts
// 2. 引入样式（main.ts，必做，否则组件没有外观）
import "sn-component-library/style.css"

// 3. 开始用
import { Button, Input } from "sn-component-library"
```

必需的三样东西，缺一不可：

| 项 | 缺失后果 |
|---|---|
| 项目里有 `vue` | 装不上 / 运行报错（peer 依赖） |
| `import "sn-component-library/style.css"` | 组件能渲染但**完全没有样式** |
| 构建工具支持 ESM | 本包只发 ES 格式，无 CJS |


### 方式 B：复制组件源码

把 `src/components/` **整个目录**复制到目标项目（例如 `src/components/`），然后：

```bash
npm i vue @iconify/vue @iconify-json/mdi
npm i -D sass @vitejs/plugin-vue
# 只有用到图表组件时才需要：
npm i chart.js vue-chartjs
```

```vue
<script setup lang="ts">
import Button from "./components/Button.vue"
import Input from "./components/Input.vue"
</script>
```

> ⚠️ 必须**整个目录**复制，不要只挑几个 `.vue` 文件。组件之间互相引用，
> 并且依赖 `styles/`、`kit/` 及各私有子目录，少一个都会编译报错。
> 目录内部**全部使用相对路径**，所以放在哪儿都行，也不需要配置路径别名。

---

## 三、本仓库自身的开发

```bash
npm install
npm run dev          # 打开演示页，逐一查看 52 个组件
```

| 脚本 | 作用 |
|---|---|
| `npm run dev` | 启动演示页（`src/App.vue`） |
| `npm run build` | 构建演示页到 `dist/` |
| `npm run build:lib` | **构建 npm 包**到 `dist-lib/` |
| `npm run preview` | 预览演示页构建产物 |
| `npm run typecheck` | 类型检查（演示页 + 组件库） |
| `npm run typecheck:lib` | 类型检查（库构建专用配置） |
| `npm run release` | **发布助手**（打包 / 版本变化打包 / 安装到其他项目 / 历史） |

> 发布助手详见 [`scripts/README.md`](./scripts/README.md)。

三种使用形态共用同一份组件源码，互不影响：

```
src/components/   ← 组件库本体（唯一真源）
   ├── 方式 B 直接复制它
   ├── 方式 A 由 build:lib 编译成 dist-lib/
   └── src/App.vue 演示页直接引用它
```

---

## 四、主题定制（机制详述）

> 快速用法见第二章「用法 5」。这里补充完整机制。

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
// 方式 A（npm 包）安装的：
import { applyDefaultTheme } from "sn-component-library"

// 方式 B（复制源码）的：
import { applyDefaultTheme } from "./components/kit/theme"

applyDefaultTheme({ overrides: { "b3-theme-primary": "#7c3aed" } })
```

**方式 3：直接改 `src/components/kit/theme.ts` 里的 `LIGHT_VARS` / `DARK_VARS` 两张表。**

暗色由 `prefers-color-scheme: dark`、`[data-theme="dark"]`、`.dark` 三种条件之一触发，
给根元素加 `.dark` 类即可手动切换：

```ts
document.documentElement.classList.toggle("dark", isDark)
```

---

## 五、使用约束（重要）

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

## 六、目录结构

```
src/
├── main.ts                  # 演示页入口
├── App.vue                  # 演示 / 自测页（按功能分组渲染代表性组件）
├── index.ts                 # ★ npm 包主入口（导出 52 个组件 + kit 公共能力）
├── chart.ts                 # ★ 图表子入口（sn-component-library/chart）
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

产物目录（均已在 `.gitignore` 中忽略）：

```
dist/       # npm run build      演示页产物
dist-lib/   # npm run build:lib  npm 包产物（index.js / chart.js / style.css / *.d.ts）
```

命名约定：`components/` 根目录下的 `.vue` 是**公开入口**，各私有子目录为内部实现，业务代码不应深入导入。
包入口 `src/index.ts` 也只导出这 52 个公开组件，不导出私有子目录。

---

## 七、裁剪不需要的组件

| 不要的东西 | 一并删除 | 可省掉的依赖 |
|---|---|---|
| 图表 | `Chart.vue`、`styles/Chart.scss`、`chart.types.ts`、`vite-env.d.ts` 中的 Chart 占位声明 | `chart.js`、`vue-chartjs` |
| 浮动按钮 | `SpeedDial.vue`、`styles/SpeedDial.scss`、`speedDial/` | — |
| 矢量图标表瘦身 | `kit/icons.ts` 中大段业务图标可删，**保留** `COMMON_ICONS` 与 `getIconConfig()` | — |

> `IconWrapper.vue` 是 18 个组件的公共依赖，**不能删**。

---

## 八、迁移到本仓库时做的改动（维护者向）

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

### npm 包相关（方式 A）

3. **新增 `src/index.ts`**：包主入口，具名导出 52 个公开组件与 `kit/` 公共能力，
   不导出私有子目录（避免锁死内部结构）。
4. **新增 `src/chart.ts`**：图表子入口。`Chart` **刻意不从主入口导出** ——
   `dist-lib/index.js` 是单文件 bundle，被主入口引用的模块会在加载时执行顶层 `import`，
   若 Chart 挂在主入口，**未安装 `chart.js` 的使用方会直接构建失败**（已实测复现）。
   拆成子入口后，只有真的用图表的项目才需要装 `chart.js`。
5. **`vite.config.ts` 支持双模式**：`vite build` 出演示页（`dist/`），
   `vite build --mode lib` 出 npm 包（`dist-lib/`，双入口 + `vite-plugin-dts` 生成 `.d.ts`）。
6. **图标数据保持全量内联**（`index.js` 因此约 3.3MB / gzip 约 800KB）：
   这是刻意的取舍 —— 换取任何图标键开箱即用且断网可用。
   库自身渲染只用到 15 个图标键，如日后需要瘦身可改为按需子集 + 全量开关。


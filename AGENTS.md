# AGENTS.md

> 本文件是 AI 编码代理与人类协作者的**强制规则**。改动本仓库前先读本文。
> 与本文冲突的做法一律视为错误，即使它在别处能跑通。
>
> 架构大图与背景说明见 [`README.md`](./README.md)；发布助手用法见 [`scripts/README.md`](./scripts/README.md)。

---

## 命令

```bash
# 演示页（开发 / 构建）
npm run dev              # 启动演示页，人工逐个查验 52 个组件
npm run build            # 构建演示页到 dist/
npm run preview          # 预览演示页构建产物

# 组件库（npm 包）
npm run build:lib        # 构建 npm 包到 dist-lib/（构建前自动裁切图标数据）
npm run icons:prune      # 单独重新生成图标裁切子集

# 类型检查
npm run typecheck        # 演示页 + 组件库（tsconfig.json）
npm run typecheck:lib    # 库构建专用（tsconfig.lib.json）

# 质量检查
npm test                 # 单元测试（vitest，用例在 tests/）
npm run test:watch       # 单元测试（watch）
npm run lint             # ESLint（含「组件内部零别名」强制规则）
npm run publint          # 包元数据（exports / types / files）校验
npm run verify           # ★ 一键全跑：typecheck ×2 + lint + test + publint

# 发布 / 分发（交互式菜单）
npm run release          # 菜单：打包 / 版本变化打包 / 安装到其他项目 / 查看历史
npm run pack:lib         # = release.mjs pack
npm run bump:lib         # = release.mjs bump（自动判定 patch/minor/major）
npm run install:to       # = release.mjs install <目标项目> [--no-touch]
npm run status           # 查看已产出的 tarball / 目标项目 / 发布历史
```

> **验证责任**：改完代码必须自行跑通 `npm run verify`，以及 `npm run build`（或 `build:lib`）。
> 不允许把「未验证」的改动交付，也不允许用「应该没问题」替代实际运行结果。
>
> CI（`.github/workflows/ci.yml`）会在 PR 上执行同一套检查。**不要让 CI 变成唯一发现问题的
> 地方** —— 本地跑一遍通常只要十几秒。

---

## 架构

### 三条交付线共用一份源码

```
src/components/          ← 组件库本体（唯一真源，52 个公开组件）
   ├── 直接复制给第三方项目         （方式 B）
   ├── build:lib 编译成 dist-lib/   （方式 A，npm 包）
   └── src/App.vue 演示页引用它
```

**这决定了改动的第一原则：`src/components/` 必须保持「可整目录搬走」。**
任何让它依赖本仓库其它路径的改动都是破坏性的。

### 目录职责

```
src/
├── index.ts             # npm 包主入口：导出 51 个组件（**不含 Chart**）+ kit 能力
├── chart.ts             # 图表子入口：sn-component-library/chart
├── App.vue              # 演示页外壳：左侧组件目录 + 右侧演示区
├── main.ts              # 演示页入口（含全局重置，仅演示页需要）
├── demo/
│   ├── registry.ts      # ★ 演示注册表：左侧目录的唯一数据源
│   ├── components/      # 演示排版基元（DemoSection / DemoRow）
│   └── views/           # 各分组演示视图（懒加载）
└── components/          # ★ 组件库本体
    ├── *.vue            # 52 个公开组件
    ├── kit/             # 自包含支撑层（随库复制，见下）
    ├── styles/          # 组件样式
    └── <18 个私有子目录> # confirm/ datePicker/ select/ … 内部实现
```

### kit/ —— 组件库的自包含支撑层（强制）

`kit/` 是本库「能整目录搬走」的关键，其内容随组件库一起被复制：

| 文件 | 职责 |
|---|---|
| `icons.ts` | 图标表**真源**（`IconKey` / `getIconConfig` / `FEATURE_ICONS` / `COMMON_ICONS`） |
| `variables.scss` | 设计 Token **真源**（`$color-*` / `$font-*` / `$radius-*` / `$spacing-*`） |
| `theme.ts` | 默认主题注入（宿主未定义 `--b3-theme-*` 时才注入） |
| `iconify.ts` | mdi 图标离线注册（不请求任何 CDN）；优先加载裁切子集，缺失时回退全量 |
| `format.ts` | 组件库自用工具（`formatFileSize`） |
| `mdi-subset.json` | **构建生成物**（非真源）：`scripts/lib/prune-icons.mjs` 产出，已 gitignore |

**硬规则**：
1. **本仓库没有转发壳**。源仓库存在 `src/_variables.scss`、`src/config/icons.ts` 两个转发壳，
   本仓库**不得**重新引入 —— 它们只服务于源仓库的兼容路径，在本仓库是死代码且会让路径失效。
2. `kit/variables.scss` **故意不带下划线前缀**，组件以 `@use '../kit/variables.scss'`（带扩展名）引用。
   **不要改名、不要加下划线**，否则 Sass partial 回退解析会失效。
3. 新增图标 / Token **改 `kit/` 里的真源文件**，不要在别处另建图标表或变量表。
4. **`mdi-subset.json` 是生成物，不要手工编辑、不要提交**。它是按 `icons.ts` 裁切出来的
   mdi 子集，由 `npm run build:lib` 自动重新生成。

### 图标体积护栏（重要，别踩）

全量 mdi 有 **7638** 个图标（约 2.8 MB），本库只用到 **201** 个。
`kit/iconify.ts` 因此**只静态引入裁切子集**，全量数据放在**动态 `import()` 的回退分支**里。

**绝对不要**把全量数据改回顶层静态 import：

```ts
// ✗ 错误：全量数据会无条件进入产物，主入口从 ~420 KB 涨到 ~3.4 MB
import mdiIcons from "@iconify-json/mdi/icons.json"
addCollection(mdiIcons)

// ✓ 正确：见 kit/iconify.ts 现有实现（glob 取子集 + 动态 import 回退）
```

这个坑**没有类型错误、没有运行时报错**，唯一症状就是体积 —— 所以三道校验守着它：

| 校验 | 位置 | 断言 |
|---|---|---|
| 图标数上界 | `verify.mjs` 校验 3/4 | 主入口内联图标数 ≤ `ICON_BUDGET.maxIcons` |
| 主入口体积 | 同上 | `index.js` ≤ `ICON_BUDGET.maxIndexBytes` |
| 回退 chunk 不被静态引用 | 同上 | 全量 mdi 必须走按需加载 |
| 子集完整性 | `tests/icons.test.ts` | 子集覆盖 `icons.ts` 全部图标、别名 parent 已收录 |
| 裁切时校验 | `prune-icons.mjs` | 引用了 mdi 中不存在的图标时**直接构建失败** |

> ⚠️ 统计图标数时**只能看 `index.js` 自身**，不能把 import 闭包全拼进来 ——
> 回退 chunk（`icons-*.js`）属于闭包但永不加载，算进来会误报（该检查初版实测误报 7839 个）。

---

## 组件库本体维护规则（强制）

### 1. 零改写原则

`src/components/` 下的组件实现**与源仓库 `siyuanPluginVueSN` 保持逐字节一致**（唯一例外见第 4 条）。
因为：

- 两边可长期 diff，源仓库的修复能直接同步过来；
- 这也是「整目录复制」这一交付方式成立的前提。

**禁止**在 `src/components/` 内做「顺手优化」：改代码风格、调整注释、重排 import、
换 SCSS 写法、给组件加本仓库特有的 props。要改就回源仓库改，再同步过来。

### 2. 组件内部只用相对路径

组件之间**必须**用相对路径互相引用（`./Button.vue`、`../kit/format`）。
**禁止**出现 `@/`、`@sn/ui/` 等别名导入 —— 一旦出现，整目录复制到第三方项目就会编译失败。

**该规则已由 ESLint 强制**（`eslint.config.mjs` 的 `no-restricted-imports`），
`npm run lint` 与 CI 都会拦截，报错信息会直接引用本条硬规则。

```bash
npm run lint                              # 推荐：跑全量 lint
npx eslint src/components/                # 只查组件目录
```

> 早期这里是一条手写 grep 自检，问题是要记得跑、正则易写歪、注释里的 `@/` 会误报。
> 现改为 ESLint 规则后，属于「机器必然执行」，不再依赖人的自觉。
>
> 已知 `src/components/kit/variables.scss` 第 3 行的**注释**里提到了 `@use '@/variables.scss'`，
> 那是描述源仓库转发壳的说明文字，不是导入，ESLint 不会误报（它只看导入语句）。

`@sn/ui` 别名（见 `vite.config.ts`）**仅供宿主/演示页书写方便**，组件内部不得使用。

### 3. 私有子目录不得对外导出

`components/` 根目录下的 `.vue` 是**公开入口**；18 个私有子目录
（`confirm/` `datePicker/` `fileUpload/` `focustrap/` `megaMenu/` `metergroup/` `overlay/`
`paginator/` `select/` `sidebar/` `speedDial/` `splitter/` `tabs/` `textarea/` `tieredMenu/`
`timeline/` `toast/` `tooltip/`）是内部实现。

**禁止**从 `src/index.ts` 导出私有子目录内的文件 —— 那会锁死内部结构，日后无法重构。

### 4. 改组件 API 必须同步三处

修改任何组件的 props / emits / slots 后，**必须**同步：

1. `src/index.ts` —— 若导出面变化（新增/删除导出会影响版本档位判定）；
2. `src/demo/views/` 对应视图 —— 演示必须反映新 API（旧 props 在演示里会静默失效）；
3. `README.md` 第五章「使用约束」—— 若涉及使用方式的坑。

### 5. Chart 绝不进主入口（重要）

`Chart` 依赖 `chart.js` / `vue-chartjs`，是**可选依赖**，只从子入口导出：

```ts
import { Chart } from "sn-component-library/chart"
```

**原因（已实测复现）**：`dist-lib/index.js` 是单文件 bundle，被主入口引用的模块会在加载时
执行其顶层 `import`。若 `Chart` 挂在主入口，**未安装 `chart.js` 的使用方会直接构建失败**：

```
Rollup failed to resolve import "chart.js" from .../dist-lib/index.js
```

改完 `src/index.ts` 后，`npm run pack:lib` 的「校验 3/4：产物语义」会做**传递闭包分析**
并拦住这个错误。**不要**为了让某个检查通过而放宽该检查。

### 6. 图标名只能用 kit/icons.ts 里注册过的键

```vue
<IconWrapper name="star" />        <!-- 正确 -->
<IconWrapper name="mdi:star" />    <!-- 错误：渲染成问号圆圈 -->
```

新增图标键要改 `src/components/kit/icons.ts`（真源）。

---

## 演示页 / demo 目录规则（强制）

### 1. 新增组件演示只改 registry.ts

左侧目录、右侧路由、URL hash 全部由 `src/demo/registry.ts` 驱动。
新增演示 = 在 `DEMOS` 数组加一条 + 写一个视图文件（或复用同组已有视图），
**不要**去改 `App.vue`。

每条目字段：`key`（唯一，兼作 URL hash）/ `name`（中文）/ `en`（英文组件名，参与搜索）/
`group`（分组名，须在 `GROUP_ORDER` 中）/ `view`（懒加载视图）/ `note`（可选提示）。

### 2. 演示页不得使用 `@` 别名

演示页**刻意**全部走相对路径（`./components/Button.vue`），
用于证明「组件库脱离宿主别名配置仍可用」。**不要**为了少打几个字符引入别名。

### 3. 同一视图内用 DemoSection / DemoRow 排版

- `DemoSection`：一个组件演示 = 一个小节（标题 + 英文名 + 说明 + 示例区）；
  同视图内第二个及以后的小节传 `divided`。
- `DemoRow`：并排排列示例，自动换行；表单类控件用 `align="top"`。

**禁止**在视图里手写标题/间距样式 —— 那会让各视图排版逐渐不一致。

### 4. 演示必须真实反映 API

演示里的每个示例都会被后续维护者当作「正确用法」的参照。因此：

- **不要**在演示里用组件不存在的 props（TypeScript 不会报错，会作为无用的 HTML 属性落空）；
- 已知的坑要写进 `desc`（例如「Button 没有 label 属性」「Select 分组要 isGroup: true」）；
- 组件数量变化时，同步 `registry.ts` 的注释与 `COMPONENT_COUNT`。

### 5. 演示页需要额外依赖时，加到 devDependencies

例如演示 `Chart` 需要 `chart.js`。**必须**加到本仓库的 `devDependencies`，
**不得**加到 `dependencies` —— 那会强制所有使用方都安装图表库，
违背「Chart 是可选依赖」的设计。

---

## 构建与发布规则（强制）

### 1. 两套构建目标不要混淆

| 命令 | 输出 | 用途 |
|---|---|---|
| `npm run build` | `dist/` | 演示页（普通 SPA） |
| `npm run build:lib` | `dist-lib/` | npm 包（双入口 + `.d.ts`） |

`vite.config.ts` 用 `--mode lib` 区分。改构建配置时**必须**两套都验证。

### 2. 发布走脚本，不要手敲 npm pack

```bash
npm run release        # 或 pack:lib / bump:lib / install:to
```

脚本会跑四道校验（类型检查 / 产物完整性 / **产物语义与依赖边界** / tarball 内容），
手敲 `npm pack` 会跳过这些检查，可能把坏包发出去。

### 3. 改完组件库要 bump 版本号

相同版本号、相同文件名的 tarball 覆盖后，npm 可能沿用缓存内容。
`npm run bump:lib` 会自动判定档位（依据 git 变更范围，取最高档）。

### 4. 不碰 npm registry

本套发布流程只做**本地 tarball 分发**，不 `npm publish`。
本机 npm 指向国内镜像（`registry.npmmirror.com`），该镜像只读，发布会被拒绝。
若确实要公开发布，需先切回 `https://registry.npmjs.org` 并登录 —— 属独立决策，不要顺手做。

### 5. `.release/` 是本机数据，不提交

tarball、记住的目标项目、发布历史、版本判定基线都在此目录，已在 `.gitignore` 中忽略。
**不要**把它加进版本库。

---

## 已知踩坑清单（不要再犯）

以下均为本项目实际踩过并已修复的坑。**同类操作前先读本节。**

### 编码类

1. **禁止用 PowerShell 改写含中文的源文件**
   `Set-Content` / `Get-Content` 往返会把 UTF-8 中文注释损坏成乱码
   （本项目已两次损坏 `Tag.vue` 与 `README.md`）。
   - 改文件用 `edit` 工具；
   - 若必须用脚本批量替换，走 .NET 的 `[System.IO.File]::ReadAllText/WriteAllText` +
     `UTF8Encoding($false)`；
   - 一旦发现乱码，立刻 `git checkout -- <file>` 还原，不要在损坏内容上继续改。

2. `git checkout` 是安全网。改动前确认工作区干净，便于随时还原。

### 组件 API 类

**TypeScript 不会报「组件不存在的 props」**（会作为 fallthrough 属性静默丢弃，
表现为渲染空白或样式不对）。以下都是实际写错过的：

| 错误写法 | 正确写法 |
|---|---|
| `<Button label="保存" />` | `<Button>保存</Button>`（Button **没有** `label` 属性） |
| `<Tab label="详情" />` | `<Tab>详情</Tab>`（同理走插槽） |
| `<ToggleButton label="置顶" icon="star" />` | `on-label` / `off-label` / `on-icon` / `off-icon` |
| `<Tag severity="success" />` | `<Tag variant="success" />` |
| `<Badge variant="warn" />` | `<Badge variant="warning" />` |
| `<Dialog position="top-right" />` | `<Dialog position="topright" />`（**无连字符**） |
| `<Card variant="default" />` | `bordered` / `outlined` / `elevated` / `flat` |
| `Select` 分组 `{ label, items }` | `{ isGroup: true, label, options }` |
| `Inplace` 用默认插槽 | 具名插槽 `display` + `content`（后者作用域给 `closeCallback`） |
| `Chart` 数据 `{ labels, datasets }` | **扁平数组** `[{ label, value }]` |

**规则**：写组件用法前先查 `src/components/<Name>.vue` 的 `interface Props`，
**不要凭记忆或凭其它 UI 库的习惯猜**。

### 布局/运行类

3. **`Loader` 父容器必须给显式高度** —— 它无 props 且 `height: 100%`，否则高度为 0 看不见。
4. **`Select` / `DatePicker` 下拉是相对定位**（非传送门挂 body），父容器 `overflow: hidden` 会裁掉。
5. **`FormField` 是多根组件** —— 控件必须写在它的默认插槽里。
6. **`Splitter` 的 sizes 是百分比**（0–100，会自动归一化到 100），不是像素。
7. **`theme.ts` 的宿主检测必须排除自身注入的节点** ——
   否则 `getComputedStyle` 会读到本模块自己注入的 `--b3-theme-primary`，
   误判「宿主已有主题」并删除刚注入的 style 节点，导致默认主题完全失效。
   修复方式：测量前先把自有节点从 DOM 摘下、量完放回。**不要**改掉这个逻辑。

### Node / 工具类

8. **Windows 上 spawn `npm` 的正确姿势**：直接 spawn 会 `EINVAL`（Node 20+ 安全限制），
   用 `shell: true` 又会触发 Node 24 的 `DEP0190` 告警。
   正确做法是显式经 `cmd /c` 调用（见 `scripts/lib/util.mjs` 的 `buildSpawn`）。
9. **直投安装要先装依赖、后解包** —— `npm install` 会清理 `node_modules` 中
   「不在 package.json 里」的包；顺序反了会把刚放进去的库删掉（已实测踩到）。

---

## 硬规则速览

1. `src/components/` **零改写**，与源仓库保持可 diff。
2. 组件内部**只用相对路径**，禁止 `@/` 别名。
3. **私有子目录不导出**，只导出根级 52 个公开组件（`index.ts` 导出 51 个，Chart 走子入口）。
4. **Chart 绝不进主入口**，它是可选依赖。
5. **新增演示只改 `registry.ts`**，不改 `App.vue`。
6. **演示页不用别名**，排版走 `DemoSection` / `DemoRow`。
7. **发布走脚本**（`npm run release`），不手敲 `npm pack`。
8. **不碰 npm registry**，只做本地 tarball 分发。
9. **不用 PowerShell 改含中文的文件**，改完立刻核对编码。
10. **写组件用法前先查源码的 `interface Props`**，不猜。
11. 改完必须跑通 `npm run verify` 与 `npm run build`（或 `build:lib`），**不以「应该没问题」交付**。
12. **图标数据必须走裁切子集**，全量 mdi 只能动态 import（详见「图标体积护栏」）。
13. **测试文件放仓库根 `tests/`**，不放 `src/components/`（否则破坏「整目录复制」）。

---

## 测试与静态检查

### 为什么有这些检查

本库 52 个组件原先只靠人工点检，且 `AGENTS.md` 明确要求「不以『应该没问题』交付」——
但这条纪律当时**没有任何自动化兜底**。现补齐三层护栏：

| 层 | 工具 | 拦截什么 |
|---|---|---|
| 类型 | `vue-tsc` ×2 | 类型错误（演示页 + 库两套配置） |
| 静态 | ESLint | 组件内别名导入、导入私有子目录等**约定违规** |
| 行为 | vitest + @vue/test-utils | 改坏了但不报错的运行期契约 |
| 元数据 | publint | `exports` / `types` / `files` 解析问题 |
| 产物 | `verify.mjs` | 依赖边界越界、图标体积回归 |

### 测试放在 `tests/`，**不要**放 `src/components/`

`src/components/` 必须保持「可整目录搬走」。若把测试放进去，第三方项目复制后会多出一堆
跑不起来、也不需要的测试文件，直接破坏那条交付线。因此：

```
tests/icons.test.ts            # 图标真源完整性（★ 最重要，见下）
tests/form-controls.test.ts    # 表单控件 v-model 契约
tests/controlled-mode.test.ts  # 受控/非受控双模式 + Tabs 无障碍关联
```

### 最该写测试的两类东西

1. **图标真源完整性**（`tests/icons.test.ts`）
   图标键写错、裁切漏收、mdi 升级改名 —— 这几种情况**都不报错**，只渲染成问号圆圈，
   人工点检极易漏过。测试对「构建时真正注册进 @iconify/vue 的那份数据」做断言。

2. **受控 / 非受控双模式**
   本库 `Tabs` / `Splitter` 都支持「传了 prop 即受控，不传则自持」，
   改坏了不会有类型错误，只会让父组件拒绝回写时视图与 props 不一致。

> 新增组件时**不必**配测试，但新增/修改上面两类逻辑时**必须**更新对应测试。

### 已知的源码级发现（受零改写约束，暂不在本仓库修）

- `SplitterPanel.vue` 同时存在 prop `size` 与同名局部 computed `size`（遮蔽隐患，
  ESLint 以 warning 持续提示）。当前行为正确，但日后改动易出错。
- `Tabs.vue` 的 `updateValue` 在受控模式下也会乐观写入内部状态，因此父组件**不回写
  `value`** 时视图仍会自行切换（非严格受控）。详见 `tests/controlled-mode.test.ts`
  里那条标注「【已知行为】」的用例。

> 以上两项都应**回源仓库 `siyuanPluginVueSN` 修改后再同步**，不要在本仓库直接改。

---

## 关键文件速查

```
package.json                    # 脚本、exports 映射、peerDependencies（vue 为 peer）
vite.config.ts                  # 双模式构建（demo / lib）+ @sn/ui 别名
vitest.config.ts                # 单元测试配置（jsdom + @vue/test-utils）
eslint.config.mjs               # 静态检查：强制「组件内部零别名」等约定
tsconfig.json                   # 演示页 + 组件库的检查配置
tsconfig.lib.json               # 库构建的声明产出配置

src/index.ts                    # npm 包主入口（51 个组件 + kit 能力，**无 Chart**）
src/chart.ts                    # 图表子入口
src/components/kit/*            # 组件库自包含支撑层（真源，随库复制）
src/components/docs/            # 组件库自带迁移说明（源仓库产物，只读）
src/demo/registry.ts            # ★ 演示目录唯一数据源
src/demo/views/*.vue            # 各分组演示视图

tests/*.test.ts                 # 单元测试（★ 不放进 src/components/）
.github/workflows/ci.yml        # CI：verify + 两套构建 + 产物校验

scripts/release.mjs             # 发布助手主入口（菜单 + CLI）
scripts/lib/version.mjs         # 版本自动判定（分析 git 变更，取最高档）
scripts/lib/verify.mjs          # 打包前后四道校验（含依赖边界 + 图标体积预算）
scripts/lib/prune-icons.mjs     # 按 icons.ts 裁切 mdi 图标数据（★ 体积关键）
scripts/lib/install.mjs         # 两种安装模式 + 安装后校验
scripts/templates/sncl-update.mjs # 目标项目侧一键升级脚本（模板）
```

---

## 规则分片索引

本仓库规则**集中在本文单文件**，不设分片。相关文档：

| 文档 | 内容 |
|---|---|
| [`README.md`](./README.md) | 架构大图、第三方项目接入方式（6 种用法）、主题定制、使用约束、目录结构、裁剪指引、迁移记录 |
| [`scripts/README.md`](./scripts/README.md) | 发布助手的四个功能、命令行参数、常见问题 |
| [`src/components/docs/components-vue3-migration-guide.md`](./src/components/docs/components-vue3-migration-guide.md) | 组件库自带的迁移说明（源仓库产物，阐述了「整目录复制」的前提条件） |
| [`src/components/kit/README.md`](./src/components/kit/README.md) | kit 支撑层各文件职责与约束 |
| [`tests/`](./tests/) | 单元测试；用例头部注释写明「为什么测这个」，新增测试请沿用 |

/**
 * scripts/lib/docs.mjs —— 为目标项目生成「AI 友好的组件库资料」
 *
 * 背景：把包装进目标项目后，AI 能拿到的参考只有埋得很深的 README 与零散的 .d.ts，
 * 写代码时只能**猜 props** —— 而本库已证实「猜 props 不报错，只会静默渲染错」。
 * 本模块在安装后向目标项目投放三份资料，让 AI 有据可依。
 *
 * 生成物（落在目标项目根目录的 sn-components-docs/，**不改任何已有文件**）：
 *   USAGE.md                 用法指南（人 + AI 共读）
 *   sn-components.agents.md  AI 规则片段（供目标项目 AGENTS.md 引用）
 *   api.json                 52 个组件的结构化 API（从 .d.ts 机械提取）
 *
 * 文件名刻意选 `sn-components.agents.md` 而非 `AGENTS.sn-components.md`（曾用名）：
 * 后者以 `AGENTS` 开头且含两个点，与目标项目自己的 `AGENTS.md` 同前缀，
 * 实测在 VS Code 里双击会「找不到该文件、无法打开编辑器」，且多点扩展名在部分工具中
 * 会被解析成未知类型（.sn-components.md）。改名单点后不再有歧义。
 *
 * 设计要点：
 * 1. **优先读目标项目已安装包的 .d.ts**，保证文档与「实际装到的版本」一致，而非与本仓库源码一致；
 * 2. 除 scripts/data/component-notes.mjs 里的人工坑之外，全部字段机械提取，不手写；
 * 3. 生成物带「自动生成，请勿手改」标记；二次安装时若检测到被手改则跳过覆盖。
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { COMPONENT_NOTES, CONSTRAINTS, WRONG_USAGES } from "../data/component-notes.mjs"
import { c, humanSize, log, ROOT, timestamp } from "./util.mjs"

const PKG_NAME = "sn-component-library"
const DOCS_DIR_NAME = "sn-components-docs"

/** AI 规则片段的文件名（单点、不以 AGENTS 开头，避免与目标项目 AGENTS.md 混淆） */
const AGENTS_DOC_NAME = "sn-components.agents.md"

/** 生成物标记：用于识别「本脚本生成的文件」，二次安装时据此判断是否被手改 */
const GENERATED_MARK = "由 sn-component-library"

/** api.json 内的生成标识（纯 JSON 无法放注释，用字段代替） */
const GENERATED_BY = "sn-component-library/docs.mjs"

// ============================================================================
// .d.ts 解析
// ============================================================================

/**
 * 解析单个 .vue.d.ts，提取 props / emits / slots。
 * @param {string} src .d.ts 源码
 * @param {Record<string,string>} [unionIndex] 跨文件 union 索引（别名 → 原始定义体）
 * @returns {{props: object[], emits: object[], slots: string[], warnings: string[]}}
 */
export function parseDts(src, unionIndex = {}) {
  const warnings = []
  const props = []

  // ---- props：interface Props { ... } 内每个 "name?: type;"（前置 JSDoc 注释作 desc） ----
  const propsBody = extractBlock(src, /interface\s+Props\s*\{/)
  if (propsBody === null) {
    // 纯插槽型组件（InputGroupAddon / Loader / TabPanels 等）本就没有 props，属正常，不告警
  }
  else {
    // 逐行扫描，保留紧邻其上的 JSDoc
    let pendingDoc = null
    for (const raw of propsBody.split("\n")) {
      const line = raw.trim()
      if (!line) continue

      const docMatch = line.match(/^\/\*\*\s*(.*?)\s*\*\/$/)
      if (docMatch) { pendingDoc = docMatch[1]; continue }
      if (line.startsWith("/**")) { pendingDoc = ""; continue }
      if (line.startsWith("*")) {
        const t = line.replace(/^\*\s?/, "").replace(/\*\/$/, "").trim()
        if (t) pendingDoc = pendingDoc ? `${pendingDoc} ${t}` : t
        continue
      }
      if (line.startsWith("}")) break

      const m = line.match(/^([A-Za-z_$][\w$]*)(\?)?:\s*(.+?);?$/)
      if (m) {
        props.push({
          name: m[1],
          optional: Boolean(m[2]),
          type: m[3].replace(/;$/, "").trim(),
          desc: pendingDoc || undefined,
        })
      }
      pendingDoc = null
    }
  }

  // ---- union 字面量取值 ----
  // 本文件内定义的 union + 跨文件传来的 unionIndex（如 Dialog 的 DialogPosition 来自 overlay/types.d.ts）
  const rawUnions = { ...unionIndex }
  for (const m of src.matchAll(/^type\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]+);/gm)) {
    rawUnions[m[1]] = m[2].replace(/\s+/g, " ").trim()
  }
  /** 递归解析某个 union 引用的全部字面量取值 */
  const resolveUnion = (name, seen = new Set()) => {
    if (seen.has(name) || !rawUnions[name]) return []
    seen.add(name)
    const body = rawUnions[name]
    const out = [...body.matchAll(/"([^"]+)"/g)].map((x) => x[1])
    for (const r of body.matchAll(/([A-Za-z_$][\w$]*)/g)) {
      out.push(...resolveUnion(r[1], seen))
    }
    return out
  }
  // 把递归解析出的取值挂到引用它的 prop 上
  for (const p of props) {
    const vals = []
    for (const r of p.type.matchAll(/([A-Za-z_$][\w$]*)/g)) {
      vals.push(...resolveUnion(r[1]))
    }
    // 内联字面量（如 placement?: "top" | "bottom" | "auto"）
    vals.push(...[...p.type.matchAll(/"([^"]+)"/g)].map((x) => x[1]))
    if (vals.length > 0) p.values = [...new Set(vals)]
  }

  // ---- emits ----
  // DefineComponent<Props, {exposed methods}, {}, {}, {}, Mixin, Mixin, {emits}, string, ...>
  // 真实的 emits 是**第 8 个**泛型参数；第 2 个是 defineExpose 暴露的方法（如 focus/blur），不是事件。
  // 事件名可能带引号且含冒号/连字符（"update:modelValue"、"visible-change"），必须一并匹配。
  const emits = []
  const dcIdx = src.indexOf("DefineComponent<")
  if (dcIdx >= 0) {
    const generics = splitGenerics(src.slice(dcIdx + "DefineComponent<".length))
    const emitSeg = generics[7] ?? ""
    const emitRe = /(?:^|[{;,])\s*(?:"([^"]+)"|'([^']+)'|([\w$]+))\s*:\s*\(([^)]*)\)\s*=>\s*([^;}]+)/g
    for (const m of emitSeg.matchAll(emitRe)) {
      const name = m[1] ?? m[2] ?? m[3]
      emits.push({ name, signature: `(${m[4]}) => ${m[5].trim()}` })
    }
  }

  // ---- slots：__VLS_Slots 内出现的可选属性名 ----
  const slots = []
  const slotsBlock = extractBlock(src, /__VLS_Slots\s*=\s*\{\}\s*&?\s*\{/)
  if (slotsBlock !== null) {
    for (const m of slotsBlock.matchAll(/([\w$]+)\?\s*:\s*\(/g)) {
      if (!slots.includes(m[1])) slots.push(m[1])
    }
    // 默认插槽：{} 里直接是 "...?: (...)" 形态已在上面覆盖；
    // 若 slots 为空但组件用了 <slot />，.d.ts 里通常仍会列出 default
  }

  return { props, emits, slots, warnings }
}

/** 抽取 `{` 起始的配对块内容（不含最外层花括号） */
function extractBlock(src, headerRe) {
  const m = headerRe.exec(src)
  if (!m) return null
  let i = src.indexOf("{", m.index)
  if (i < 0) return null
  let depth = 0
  const start = i + 1
  for (; i < src.length; i++) {
    const ch = src[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return src.slice(start, i)
    }
  }
  return null
}

/**
 * 按顶层逗号切分泛型参数列表（跳过 <>、{}、[]、() 与字符串内部）。
 * 用于从 DefineComponent<...> 中取出第 8 个泛型（真正的 emits）。
 *
 * 注意：不能用「depth 归零即结束」来判定收尾 —— 泛型参数里嵌套了
 * `import('vue').PublicProps` 这类带括号的引用，简单计数会提前截断。
 * 因此这里**不提前 break**，而是切完全部内容后由调用方按索引取用。
 */
function splitGenerics(src) {
  const parts = []
  let depth = 0
  let cur = ""
  let quote = null
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quote) {
      cur += ch
      if (ch === quote && src[i - 1] !== "\\") quote = null
      continue
    }
    if (ch === "\"" || ch === "'" || ch === "`") { quote = ch; cur += ch; continue }
    if (ch === "<" || ch === "{" || ch === "[" || ch === "(") depth++
    if (ch === ">" || ch === "}" || ch === "]" || ch === ")") {
      // ⚠️ 箭头函数的 `=>` 里的 `>` 不是泛型闭合符。
      // 若不排除，`focus: () => void` 会把 depth 拉负导致整个列表提前截断
      //（实测：Button 只解析出 2 段而非 11 段，emits 因此全丢）。
      const prev = src[i - 1]
      const isArrow = ch === ">" && (prev === "=" || prev === "-")
      if (!isArrow) {
        depth--
        if (depth < 0) break // 整个泛型列表闭合
      }
    }
    if (ch === "," && depth === 0) { parts.push(cur.trim()); cur = ""; continue }
    cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

/**
 * 建立「跨文件 union 索引」：把所有 .d.ts 里定义的 type 别名汇总起来。
 * 组件常引用别处的类型（如 Dialog 的 DialogPosition 来自 overlay/types.d.ts），
 * 只有全量索引才能还原这些取值。
 */
function buildUnionIndex(dtsRoot) {
  const index = {}
  const walk = (dir) => {
    let entries = []
    try { entries = readdirSync(dir, { withFileTypes: true }) }
    catch { return }
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) { walk(full); continue }
      if (!e.name.endsWith(".d.ts")) continue
      let src = ""
      try { src = readFileSync(full, "utf8") }
      catch { continue }
      for (const m of src.matchAll(/^type\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]+);/gm)) {
        const body = m[2].replace(/\s+/g, " ").trim()
        // 同名只保留含字面量的那份（更有信息量）
        if (!index[m[1]] || (/"([^"]+)"/.test(body) && !/"([^"]+)"/.test(index[m[1]]))) {
          index[m[1]] = body
        }
      }
    }
  }
  walk(dtsRoot)
  return index
}

// ============================================================================
// 数据组装
// ============================================================================

/** 定位 .d.ts 来源目录：优先目标项目已安装的包，回退本仓库 dist-lib */
export function resolveDtsDir(targetDir) {
  const candidates = [
    { dir: join(targetDir ?? "", "node_modules", PKG_NAME, "dist-lib", "components"), from: "target" },
    { dir: join(ROOT, "dist-lib", "components"), from: "repo" },
  ]
  for (const cand of candidates) {
    if (cand.dir && existsSync(cand.dir)) return cand
  }
  return null
}

/** 读取目标项目已安装包的版本 */
function resolveInstalledVersion(targetDir) {
  const p = join(targetDir ?? "", "node_modules", PKG_NAME, "package.json")
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, "utf8")).version }
    catch { /* 忽略 */ }
  }
  const own = join(ROOT, "package.json")
  try { return JSON.parse(readFileSync(own, "utf8")).version }
  catch { return "unknown" }
}

/**
 * 收集 52 个公开组件的完整 API。
 * @returns {{api: object, warnings: string[]}}
 */
export function collectApi(targetDir) {
  const found = resolveDtsDir(targetDir)
  if (!found) {
    return { api: null, warnings: ["找不到 dist-lib/components，请先在组件库仓库执行 npm run build:lib"] }
  }

  const files = readdirSync(found.dir)
    .filter((f) => f.endsWith(".vue.d.ts"))
    .sort()

  // 跨文件 union 索引：组件常引用别处的类型（如 Dialog 的 DialogPosition 来自 overlay/types.d.ts）
  const unionIndex = buildUnionIndex(found.dir)

  const warnings = []
  const components = []

  for (const f of files) {
    const name = f.replace(/\.vue\.d\.ts$/, "")
    const src = readFileSync(join(found.dir, f), "utf8")
    const parsed = parseDts(src, unionIndex)
    for (const w of parsed.warnings) warnings.push(`${name}: ${w}`)
    components.push({
      name,
      props: parsed.props,
      emits: parsed.emits,
      slots: parsed.slots,
      notes: COMPONENT_NOTES[name] ?? [],
    })
  }

  return {
    api: {
      generatedBy: GENERATED_BY,
      package: PKG_NAME,
      version: resolveInstalledVersion(targetDir),
      generatedAt: timestamp(),
      source: found.from === "target" ? "目标项目已安装包" : "本仓库 dist-lib",
      componentCount: components.length,
      components,
      constraints: CONSTRAINTS,
      wrongUsages: WRONG_USAGES,
      warnings,
    },
    warnings,
  }
}

// ============================================================================
// 文档渲染
// ============================================================================

function renderUsageMd(api, targetDir, entryPath) {
  const quickRows = api.components
    .map((comp) => {
      const key = comp.props
        .filter((p) => !["modelValue", "class", "style"].includes(p.name))
        .slice(0, 6)
        .map((p) => `\`${p.name}\``)
        .join(" ")
      return `| ${comp.name} | ${key || "—"} |`
    })
    .join("\n")

  const constraintList = api.constraints.map((s, i) => `${i + 1}. ${s}`).join("\n")
  const wrongTable = api.wrongUsages
    .map((w) => `| \`${w.wrong}\` | \`${w.right}\` | ${w.why} |`)
    .join("\n")

  return `<!-- ${GENERATED_MARK}@${api.version} 自动生成，请勿手改；重新安装会覆盖本文件 -->
# 组件库用法参考（sn-component-library）

> 版本 **${api.version}** · 生成于 ${api.generatedAt} · 共 **${api.componentCount}** 个组件
> 数据来源：${api.source} 的 \`.d.ts\` 机械提取（非手写）

## 一、三步开始使用

\`\`\`bash
npm i sn-component-library
npm i vue@^3.5.0            # peer 依赖，需自行安装
\`\`\`

\`\`\`ts
// ① 引入样式（**必做**，否则组件能渲染但完全没有样式）。
//    本项目入口：${entryPath ?? "（未自动识别，请找到渲染进程入口文件）"}
import "sn-component-library/style.css"
\`\`\`

\`\`\`vue
<script setup lang="ts">
// ② 具名导入，按需 tree-shaking
import { Button, Input, Select } from "sn-component-library"
import { ref } from "vue"

const name = ref("")
</script>

<template>
  <Input v-model="name" label="用户名" size="small" />
  <!-- ③ 注意：Button 的文字写在插槽里，没有 label 属性 -->
  <Button variant="primary">保存</Button>
</template>
\`\`\`

必需的三样，缺一不可：

| 项 | 缺失后果 |
|---|---|
| 项目里有 \`vue\` | 装不上 / 运行报错（peer 依赖） |
| \`import "sn-component-library/style.css"\` | 组件能渲染但**完全没有样式** |
| 构建工具支持 ESM | 本包只发 ES 格式，无 CJS |

## 二、常用写法

**受控组件**（Dialog / Drawer / ConfirmDialog / Toast）的显隐由调用方控制：

\`\`\`vue
<Dialog v-model:visible="visible" header="标题">
  <p>内容</p>
</Dialog>
<Toast v-model:messages="toasts" position="top-right" />
\`\`\`

**图表**走独立子入口（是可选依赖，不在主入口）：

\`\`\`bash
npm i chart.js vue-chartjs
\`\`\`

\`\`\`ts
import { Chart } from "sn-component-library/chart"

// 注意：data 是扁平数组，不是 chart.js 的 { labels, datasets }
const data = [{ label: "一月", value: 12 }, { label: "二月", value: 19 }]
\`\`\`

**主题定制**（不调用也行，组件会自动注入默认明暗主题）：

\`\`\`ts
import { applyDefaultTheme } from "sn-component-library"
applyDefaultTheme({ overrides: { "b3-theme-primary": "#7c3aed" } })
\`\`\`

\`\`\`css
/* 或在自己项目的全局样式里覆盖（优先级更高） */
:root { --b3-theme-primary: #7c3aed; }
\`\`\`

**暗色**由 \`prefers-color-scheme: dark\`、\`[data-theme="dark"]\`、\`.dark\` 三者之一触发：

\`\`\`ts
document.documentElement.classList.toggle("dark", isDark)
\`\`\`

## 三、常用组件与关键 props

> 完整 props（含类型、取值、中文说明）见同目录 **\`api.json\`**；
> 类型定义见 \`node_modules/sn-component-library/dist-lib/components/*.vue.d.ts\`。

| 组件 | 常用 props |
|---|---|
${quickRows}

## 四、使用约束（重要）

${constraintList}

## 五、易错写法对照（实际踩过的坑）

| 错误写法 | 正确写法 | 原因 |
|---|---|---|
${wrongTable}

## 六、给 AI 的提示

在本项目里让 AI 写组件时，可直接说：

> 「组件用 sn-component-library，先读 \`sn-components-docs/api.json\` 确认 props，不要猜。」

因为**传了组件不存在的 props 不会报错**，TypeScript 也不会提示 —— 它会作为无用的 HTML 属性
静默落空，表现为渲染空白或样式不对。所以「先查再写」是硬要求。
`
}

function renderAgentsMd(api, entryPath) {
  const wrongTable = api.wrongUsages
    .map((w) => `| \`${w.wrong}\` | \`${w.right}\` |`)
    .join("\n")
  const constraintList = api.constraints.map((s) => `- ${s}`).join("\n")

  return `<!-- ${GENERATED_MARK}@${api.version} 自动生成，请勿手改；重新安装会覆盖本文件 -->
# 组件库使用规则（sn-component-library@${api.version}）

本项目的 UI 组件来自外部包 **\`sn-component-library\`**（${api.componentCount} 个组件），
源码**不在本项目中**，位于 \`node_modules/sn-component-library/\`。

## 硬规则

1. **写组件前先查 API，禁止猜 props。**
   完整清单见 \`sn-components-docs/api.json\`（由 \`.d.ts\` 机械提取，与实际版本一致）。
2. **禁止修改 \`node_modules/\` 里的组件**。缺功能要回到组件库仓库添加，不要就地改 ——
   就地改会在下次安装时丢失。
3. **传了不存在的 props 不会报错**，只会静默落空（渲染空白或样式不对）。
   拿不准就去查 \`api.json\` 或对应的 \`.vue.d.ts\`。
4. **文字类内容走插槽，不是属性**：\`<Button>保存</Button>\`，不是 \`<Button label="保存" />\`。
5. **图标名必须是注册过的键**（如 \`icon="star"\`），不能写 \`"mdi:star"\`，否则渲染成问号圆圈。
6. **样式必须在入口引入一次**：\`import "sn-component-library/style.css"\`
   ${entryPath ? `（本项目入口：\`${entryPath}\`）` : ""}。

## 易错写法对照

| 错误 | 正确 |
|---|---|
${wrongTable}

## 使用约束

${constraintList}

## 与 Element Plus 共存

本项目同时使用 Element Plus。建议：

- **同一界面不要混用两套组件**（按钮、输入框的风格与圆角/字号不一致，观感割裂）；
- 建议**按模块划分**边界：新增模块用 \`sn-component-library\`，存量模块维持 Element Plus；
- 若确实要在同一界面混用，注意本库样式是**全局**引入的（挂在 \`.si-*\` 类名下，
  与 Element Plus 的 \`.el-*\` 不冲突，但全局变量如 \`--b3-theme-*\` 会互相影响）。

## 升级方式

组件库有更新时，在组件库仓库执行：

\`\`\`bash
npm run bump:lib                              # 判定版本档位并打包
npm run install:to "<本项目路径>"              # 安装并刷新本文档
\`\`\`

或在项目侧放置 \`sncl-update.mjs\`（模板见组件库仓库 \`scripts/templates/\`）后：
\`\`\`bash
node sncl-update.mjs
\`\`\`
`
}

// ============================================================================
// 入口
// ============================================================================

/** 探测目标项目的样式引入位置（只用于打印提示，不修改文件） */
export function detectEntryFile(targetDir) {
  const candidates = [
    "src/renderer/src/main.ts",
    "src/main.ts",
    "src/index.ts",
    "src/renderer/main.ts",
    "main.ts",
  ]
  for (const rel of candidates) {
    if (existsSync(join(targetDir, rel))) return rel
  }
  return null
}

/**
 * 文件是否被手工改过（据此决定是否跳过覆盖）。
 *
 * 判定方式按文件类型区分：
 * - `.md`：靠 HTML 注释标记；标记被删即视为手改。
 * - `.json`：纯 JSON 放不下 HTML 注释，改用 `generatedBy` 字段判定
 *   （早期实现漏了这点，导致 api.json 永远被误判为「手改」而不再更新 —— 已修）。
 */
function isHandEdited(file) {
  if (!existsSync(file)) return false
  let existing = ""
  try { existing = readFileSync(file, "utf8") }
  catch { return false }

  if (file.endsWith(".json")) {
    try {
      return JSON.parse(existing).generatedBy !== GENERATED_BY
    }
    catch {
      return true // 已损坏或非本脚本产物，保守跳过
    }
  }
  return !existing.includes(GENERATED_MARK)
}

/**
 * 生成三份文档到目标项目的 sn-components-docs/。
 * 不改动目标项目任何已有文件。
 * @returns {{ok: boolean, written: string[], skipped: string[]}}
 */
export function generateDocs(targetDir, { silent = false } = {}) {
  const { api, warnings } = collectApi(targetDir)
  if (!api) {
    log.warn(warnings[0] ?? "无法收集组件 API，跳过文档生成")
    return { ok: false, written: [], skipped: [] }
  }

  const outDir = join(targetDir, DOCS_DIR_NAME)
  mkdirSync(outDir, { recursive: true })

  const entryPath = detectEntryFile(targetDir)
  const files = [
    { name: "USAGE.md", content: renderUsageMd(api, targetDir, entryPath) },
    { name: AGENTS_DOC_NAME, content: renderAgentsMd(api, entryPath) },
    { name: "api.json", content: `${JSON.stringify(api, null, 2)}\n` },
  ]

  const written = []
  const skipped = []

  for (const f of files) {
    const dest = join(outDir, f.name)
    // 二次安装：若文件被手工改过（标记丢失），跳过以免覆盖用户内容
    if (isHandEdited(dest)) {
      skipped.push(f.name)
      continue
    }
    writeFileSync(dest, f.content, "utf8")
    written.push(f.name)
  }

  if (!silent) {
    log.step("生成 AI 组件库资料")
    for (const w of written) {
      const p = join(outDir, w)
      log.plain(`    ${c.gray("·")} ${DOCS_DIR_NAME}/${w.padEnd(24)} ${humanSize(readFileSync(p).length)}`)
    }
    if (skipped.length > 0) {
      log.warn(`以下文件检测到被手工修改，已跳过覆盖：${skipped.join(", ")}`)
    }
    if (api.warnings.length > 0) {
      log.plain(c.gray(`    （${api.warnings.length} 项解析降级，已记录在 api.json 的 warnings）`))
    }
  }

  return { ok: true, written, skipped, entryPath, version: api.version, count: api.componentCount }
}

/** 打印「还需手动完成」的指引（脚本不代改已有文件） */
export function printManualSteps(targetDir, entryPath) {
  const rel = entryPath ?? "（未自动识别）找到你的渲染进程入口文件"
  log.plain("")
  log.plain(`  ${c.bold("还需你手动完成 2 步")}${c.gray("（脚本不改动已有文件）")}：`)
  log.plain(`    ${c.cyan("1)")} 在 ${c.bold(rel)} 中加入：`)
  log.plain(`         ${c.gray("import \"sn-component-library/style.css\"")}`)
  log.plain(`    ${c.cyan("2)")} 在本项目 ${c.bold("AGENTS.md")} 中加一行引用，让 AI 自动读到规则：`)
  log.plain(`         ${c.gray(`组件用法见 ${DOCS_DIR_NAME}/${AGENTS_DOC_NAME}（完整 API 见 api.json）`)}`)
}

export { AGENTS_DOC_NAME, DOCS_DIR_NAME, GENERATED_BY, GENERATED_MARK }

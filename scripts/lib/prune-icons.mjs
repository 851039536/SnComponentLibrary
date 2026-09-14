/**
 * scripts/lib/prune-icons.mjs —— 按需裁切 mdi 图标数据
 *
 * 背景（实测数据）：
 *   组件库只使用 201 个 mdi 图标，但 `kit/iconify.ts` 原先整包静态引入
 *   `@iconify-json/mdi/icons.json`（7638 个图标，约 2.82 MB）。
 *   由于 `addCollection(整包默认导入)` 的参数不是可静态分析的具名引用，
 *   Rollup 无法 tree-shake —— 实测产物 `dist-lib/index.js` 3.17 MB 里
 *   2.82 MB（89%）是永远用不到的图标数据。
 *
 * 本脚本在库构建前生成 `src/components/kit/mdi-subset.json`，只保留真正用到的图标。
 *
 * 收录规则（缺一不可，漏任何一条都会让图标渲染成「问号圆圈」且不报错）：
 *   1. `kit/icons.ts` 里所有 `icon: "mdi:xxx"` 字面量 —— 这是图标键的唯一真源，
 *      且 `IconKey` 类型保证运行时键只能来自这里，所以静态扫描是**完备**的；
 *   2. 命中 `aliases` 的图标，要连同其 `parent` 目标一起收录（否则别名解析不到本体）。
 *      实测：`mdi:chart-finance` 是别名，本体为 `finance`。
 *   3. 运行时兜底图标 `mdi:help-circle`（见 `kit/icons.ts` 的 getIconConfig 回退分支）。
 *
 * 产物落点刻意选在 `kit/` 内（而非 dist），以保住「src/components/ 可整目录搬走」
 * 这条交付线；但它是**生成物**，已加入 .gitignore，不提交版本库。
 * `kit/iconify.ts` 内有整包回退分支，所以方式 B（直接复制源码、不跑构建）仍开箱可用。
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ROOT, log, c, humanSize } from "./util.mjs"

const ICONS_TS = join(ROOT, "src", "components", "kit", "icons.ts")
const OUT_FILE = join(ROOT, "src", "components", "kit", "mdi-subset.json")

/** 运行时兜底图标：getIconConfig 找不到键时回退到这个 */
const FALLBACK_ICONS = ["help-circle"]

/**
 * 从 kit/icons.ts 中抽取图标名（不含 `mdi:` 前缀）。
 * @returns {string[]} 去重后的图标名
 */
export function extractUsedIconNames() {
  if (!existsSync(ICONS_TS)) {
    throw new Error(`找不到图标真源文件：${ICONS_TS}`)
  }
  const src = readFileSync(ICONS_TS, "utf8")
  const names = [...src.matchAll(/icon:\s*"mdi:([^"]+)"/g)].map((m) => m[1])
  return [...new Set([...names, ...FALLBACK_ICONS])]
}

/**
 * 生成裁切后的图标集对象。
 * @param {object} full 完整的 @iconify-json/mdi/icons.json
 * @param {string[]} used 需要保留的图标名
 * @returns {{ subset: object, stats: object }}
 */
export function buildSubset(full, used) {
  const icons = {}
  const aliases = {}
  const missing = []
  const parents = new Set()

  for (const name of used) {
    if (full.icons[name]) {
      icons[name] = full.icons[name]
    }
    else if (full.aliases && full.aliases[name]) {
      aliases[name] = full.aliases[name]
      // 别名指向的本体也必须收录，否则解析失败
      if (full.aliases[name].parent) parents.add(full.aliases[name].parent)
    }
    else {
      missing.push(name)
    }
  }

  // 补上别名依赖的本体
  const pulledParents = []
  for (const p of parents) {
    if (full.icons[p]) {
      icons[p] = full.icons[p]
      pulledParents.push(p)
    }
    else if (full.aliases && full.aliases[p]) {
      aliases[p] = full.aliases[p]
      pulledParents.push(`${p} (嵌套别名)`)
    }
    else {
      missing.push(`parent:${p}`)
    }
  }

  const subset = {
    prefix: full.prefix,
    icons,
    aliases,
    width: full.width,
    height: full.height,
    lastModified: full.lastModified,
  }

  return {
    subset,
    stats: {
      requested: used.length,
      directIcons: Object.keys(icons).length,
      aliasCount: Object.keys(aliases).length,
      pulledParents,
      missing,
    },
  }
}

/** 主流程：读取 → 裁切 → 写出。CLI 与构建前置步骤都会调用它。 */
export function pruneIcons({ quiet = false } = {}) {
  const p = (...a) => { if (!quiet) log.plain(...a) }

  if (!quiet) log.step("裁切 mdi 图标数据")

  const full = JSON.parse(readFileSync(
    join(ROOT, "node_modules", "@iconify-json", "mdi", "icons.json"),
    "utf8",
  ))

  const used = extractUsedIconNames()
  const { subset, stats } = buildSubset(full, used)

  if (stats.missing.length > 0) {
    log.err("以下图标在 mdi 集合中不存在，会渲染成问号圆圈：")
    for (const m of stats.missing) p(c.red(`    · ${m}`))
    throw new Error(`icons.ts 引用了 ${stats.missing.length} 个不存在的 mdi 图标`)
  }

  // 写出为紧凑 JSON（该文件在构建期被内联，无需可读性）
  writeFileSync(OUT_FILE, JSON.stringify(subset), "utf8")

  const size = JSON.stringify(subset).length
  const fullSize = JSON.stringify(full).length

  if (!quiet) {
    p(`    ${c.gray("·")} 真源图标数 ${String(used.length).padStart(5)} 个`)
    p(`    ${c.gray("·")} 本体 ${String(stats.directIcons).padStart(5)} 个 + 别名 ${stats.aliasCount} 个`)
    if (stats.pulledParents.length > 0) {
      p(`    ${c.gray("·")} 别名依赖本体：${stats.pulledParents.join(", ")}`)
    }
    p(`    ${c.gray("·")} 体积 ${humanSize(fullSize)} → ${c.green(humanSize(size))}`
      + c.gray(`（保留 ${(100 * size / fullSize).toFixed(1)}%）`))
    log.ok(`已生成 ${c.cyan("src/components/kit/mdi-subset.json")}`)
  }

  return { stats, size, fullSize }
}

// 允许 `node scripts/lib/prune-icons.mjs` 直接执行
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("prune-icons.mjs")) {
  try {
    pruneIcons()
  }
  catch (e) {
    log.err(e.message)
    process.exit(1)
  }
}

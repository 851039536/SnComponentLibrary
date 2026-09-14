/**
 * scripts/lib/verify.mjs —— 打包前后校验
 *
 * 目的：避免把「坏包」发给别人。历史教训（本项目真实踩过）：
 *   - Chart 挂在主入口导致未装 chart.js 的使用方构建失败；
 *   - .d.ts 里引用了未随包发布的文件；
 *   - tarball 漏了 style.css。
 * 所以打包前校验产物、打包后校验 tarball 内容，两道关。
 */

import { existsSync, readFileSync, statSync, readdirSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { run, log, c, humanSize, ROOT, TARBALL_DIR } from "./util.mjs"

/** 库产物必须存在的文件（相对 dist-lib/） */
const REQUIRED_ARTIFACTS = [
  "index.js",
  "index.d.ts",
  "chart.js",
  "chart.d.ts",
  "style.css",
]

/**
 * 从 tarball 内容清单里找出必需文件的缺失项。
 * @param {string[]} fileList package/dist-lib/... 形式的路径列表
 */
export function missingFromTarball(fileList) {
  const norm = fileList.map((f) => f.replace(/\\/g, "/"))
  const has = (suffix) => norm.some((f) => f.endsWith(suffix))
  const required = [
    "dist-lib/index.js",
    "dist-lib/index.d.ts",
    "dist-lib/chart.js",
    "dist-lib/chart.d.ts",
    "dist-lib/style.css",
  ]
  return required.filter((r) => !has(r))
}

/** 第 1 关：类型检查 */
export async function checkTypes({ lib = true } = {}) {
  log.step("校验 1/4：类型检查")
  const script = lib ? "typecheck:lib" : "typecheck"
  const code = await run("npm", ["run", script], { quiet: true })
  if (code !== 0) {
    log.err(`${script} 失败，已中止。请先修复类型错误。`)
    return false
  }
  log.ok(`${script} 通过`)
  return true
}

/** 第 2 关：产物完整性 */
export function checkArtifacts() {
  log.step("校验 2/4：构建产物完整性")
  const dir = join(ROOT, "dist-lib")
  if (!existsSync(dir)) {
    log.err("dist-lib/ 不存在，请先执行构建。")
    return false
  }
  const missing = REQUIRED_ARTIFACTS.filter((f) => !existsSync(join(dir, f)))
  if (missing.length > 0) {
    log.err(`缺少产物文件：${missing.join(", ")}`)
    return false
  }
  for (const f of REQUIRED_ARTIFACTS) {
    const size = statSync(join(dir, f)).size
    log.plain(`    ${c.gray("·")} ${f.padEnd(14)} ${humanSize(size)}`)
  }
  log.ok("产物齐全")
  return true
}

/**
 * 第 3 关：语义正确性
 * 这是最关键的一关——检查「不该出现在主入口的依赖」是否被意外引入。
 *
 * ⚠️ 必须做**传递闭包**分析，不能只看 index.js 里有没有直接写 "chart.js"：
 * 一旦有人把 Chart 加回主入口，Vite 会把它拆成独立 chunk，
 * index.js 只会出现 `import { C } from "./Chart-xxxx.js"` —— 直接引用检测会漏判。
 */
export function checkBundleSemantics() {
  log.step("校验 3/4：产物语义（依赖边界）")
  const outDir = join(ROOT, "dist-lib")
  const indexPath = join(outDir, "index.js")
  if (!existsSync(indexPath)) {
    log.warn("缺少 dist-lib/index.js，跳过语义校验")
    return true
  }

  let ok = true

  // ---- 1. 从 index.js 出发，沿相对 import 求传递闭包 ----
  const closure = collectImportClosure(outDir, "index.js")

  const offenders = []
  for (const rel of closure) {
    const full = join(outDir, rel)
    if (!existsSync(full)) continue
    let code = ""
    try { code = readFileSync(full, "utf8") }
    catch { continue }
    for (const dep of ["chart.js", "vue-chartjs"]) {
      const re = new RegExp(`from\\s+["']${dep.replace(".", "\\.")}["']`)
      if (re.test(code)) offenders.push({ rel, dep })
    }
  }

  if (offenders.length > 0) {
    log.err("主入口的依赖闭包中出现了可选依赖 —— 未安装它的使用方将构建失败！")
    for (const o of offenders) {
      log.plain(c.gray(`    · ${o.rel} 引用了 ${o.dep}`))
    }
    log.plain(c.gray("    修复：把该组件从 src/index.ts 移出，只从 src/chart.ts 导出。"))
    ok = false
  }
  else {
    log.ok("主入口依赖闭包干净（未引入 chart.js / vue-chartjs）")
  }

  // ---- 2. 图表子入口应该能引到 chart.js ----
  const chartPath = join(outDir, "chart.js")
  if (existsSync(chartPath)) {
    const chartClosure = collectImportClosure(outDir, "chart.js")
    let found = false
    for (const rel of chartClosure) {
      const full = join(outDir, rel)
      if (!existsSync(full)) continue
      try {
        if (/from\s+["']chart\.js["']/.test(readFileSync(full, "utf8"))) { found = true; break }
      }
      catch { /* 忽略 */ }
    }
    if (!found) {
      log.warn("chart.js 子入口的闭包内找不到 chart.js —— 请确认图表入口是否还有意义")
    }
    else {
      log.ok("图表子入口引用 chart.js 正常")
    }
  }

  // ---- 3. 图标数据必须内联（否则断网时图标空白） ----
  const indexCode = readFileSync(indexPath, "utf8")
      + closure
        .filter((r) => r !== "index.js")
        .map((r) => { try { return readFileSync(join(outDir, r), "utf8") } catch { return "" } })
        .join("")
  if (!indexCode.includes("mdi:")) {
    log.warn("主入口未内联 mdi 图标数据 —— 断网环境下图标可能空白")
  }
  else {
    log.ok("mdi 图标数据已内联（离线可用）")
  }

  return ok
}

/**
 * 从入口文件出发，收集相对 import 的传递闭包（含入口自身）。
 * @returns {string[]} 相对 outDir 的文件名列表
 */
function collectImportClosure(outDir, entry, maxFiles = 400) {
  const seen = new Set()
  const queue = [entry]

  while (queue.length > 0 && seen.size < maxFiles) {
    const rel = queue.shift()
    if (seen.has(rel)) continue
    seen.add(rel)

    const full = join(outDir, rel)
    if (!existsSync(full)) continue

    let code = ""
    try { code = readFileSync(full, "utf8") }
    catch { continue }

    // 匹配 import/export ... from "..." 与 import "..."，只跟相对路径
    const re = /(?:from|import)\s*\(?\s*["'](\.\.?\/[^"']+)["']/g
    let m
    while ((m = re.exec(code)) !== null) {
      const spec = m[1]
      const abs = resolve(dirname(full), spec)
      const relNext = relative(outDir, abs).replace(/\\/g, "/")
      if (!relNext.startsWith("..") && !seen.has(relNext)) queue.push(relNext)
    }
  }
  return [...seen]
}

/** 第 4 关：tarball 内容（打包后执行） */
export async function checkTarball(tgzPath) {
  log.step("校验 4/4：tarball 内容")
  const { capture } = await import("./util.mjs")
  const res = await capture("tar", ["-tzf", tgzPath])
  if (res.code !== 0) {
    log.warn("无法列出 tarball 内容（tar 不可用？），跳过此项校验")
    return true
  }
  const files = res.out.split("\n").map((s) => s.trim()).filter(Boolean)
  const missing = missingFromTarball(files)
  if (missing.length > 0) {
    log.err(`tarball 缺少必需文件：${missing.join(", ")}`)
    return false
  }
  const size = statSync(tgzPath).size
  log.plain(`    ${c.gray("·")} 包内文件 ${files.length} 个，体积 ${humanSize(size)}`)
  log.ok("tarball 内容完整")
  return true
}

/** 一步跑完打包前 3 关 */
export async function runPrePackChecks() {
  const a = await checkTypes({ lib: true })
  if (!a) return false
  const b = checkArtifacts()
  if (!b) return false
  const d = checkBundleSemantics()
  if (!d) return false
  return true
}

/** 列出某目录下的 .tgz */
export function listTarballs(dir = TARBALL_DIR) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => f.endsWith(".tgz")).map((f) => join(dir, f))
}

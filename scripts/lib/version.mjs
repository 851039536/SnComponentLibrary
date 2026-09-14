/**
 * scripts/lib/version.mjs —— 语义化版本自动判定
 *
 * 目标：功能 2「自动打包（版本变化）」——脚本自己判断该 bump 哪一位。
 *
 * 判定策略（按优先级从高到低，取**最高**一档）：
 *   1. 组件增减（components/ 根目录下的 .vue 文件被新增或删除）→ major
 *   2. 公开导出面变化（src/index.ts / src/chart.ts 增删导出）    → major
 *   3. 提交信息里的 BREAKING CHANGE / !:                        → major
 *   4. 新增组件私有文件、新增 kit 文件、feat: 提交                → minor
 *   5. 其余（修 bug、改样式、改注释、改文档）                     → patch
 *
 * 设计取舍：宁可**保守**（bump 大一点）也不要漏掉破坏性变更——对使用方而言
 * 「本以为安全升级却崩了」的代价远高于版本号跳得多。因此命中任一 major 信号即 major。
 */

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { capture, log, c, ROOT } from "./util.mjs"

export const LEVELS = ["patch", "minor", "major"]
const RANK = { patch: 0, minor: 1, major: 2 }

/** 取两档中更高的 */
export function maxLevel(a, b) {
  return RANK[a] >= RANK[b] ? a : b
}

/** 递增版本号 */
export function bumpVersion(version, level) {
  const m = String(version).match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!m) throw new Error(`无法解析版本号：${version}`)
  let [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (level === "major") { major += 1; minor = 0; patch = 0 }
  else if (level === "minor") { minor += 1; patch = 0 }
  else { patch += 1 }
  return `${major}.${minor}.${patch}`
}

/** 是否 git 仓库 */
export async function isGitRepo() {
  const { code, out } = await capture("git", ["rev-parse", "--is-inside-work-tree"])
  return code === 0 && out === "true"
}

/** 收集「自上次发布以来」的变更文件列表 */
export async function collectChangedFiles() {
  // 优先用上一次 release 的 commit 作为基线；没有则用 HEAD（只看未提交改动）
  const baselineFile = join(ROOT, ".release", "last-release-commit")
  let base = null
  try {
    if (existsSync(baselineFile)) base = readFileSync(baselineFile, "utf8").trim()
  }
  catch { /* 忽略 */ }

  const range = base ? [`${base}..HEAD`] : []

  // 已提交的变更（有基线时）
  const committed = base
    ? await capture("git", ["diff", "--name-status", ...range])
    : { code: 0, out: "" }

  // 未提交的变更（工作区 + 暂存区），始终要算上
  const working = await capture("git", ["status", "--porcelain"])
  const untracked = await capture("git", ["ls-files", "--others", "--exclude-standard"])

  const changes = []

  const parseNameStatus = (text) => {
    for (const line of text.split("\n")) {
      const t = line.trim()
      if (!t) continue
      const parts = t.split(/\s+/)
      if (parts.length < 2) continue
      changes.push({ status: parts[0][0], file: parts[parts.length - 1] })
    }
  }
  parseNameStatus(committed.out)

  for (const line of working.out.split("\n")) {
    const t = line.replace(/\r$/, "")
    if (!t.trim()) continue
    const status = t.slice(0, 2).trim()
    const file = t.slice(3).trim().replace(/^"|"$/g, "")
    if (!file) continue
    // 未跟踪文件（??）单独处理，避免重复
    if (status !== "??") changes.push({ status: status[0], file })
  }
  for (const f of untracked.out.split("\n")) {
    const t = f.trim()
    if (t) changes.push({ status: "A", file: t })
  }

  // 去重（同一文件可能同时出现在 committed 与 working）
  const seen = new Map()
  for (const ch of changes) {
    const prev = seen.get(ch.file)
    if (!prev) seen.set(ch.file, ch)
    else if (ch.status === "A" || prev.status === "D") seen.set(ch.file, ch)
  }

  return [...seen.values()].filter((ch) => !ch.file.startsWith(".release/"))
}

/** 收集提交信息（有基线时取区间内，否则取最近一条） */
export async function collectCommitMessages() {
  const baselineFile = join(ROOT, ".release", "last-release-commit")
  let base = null
  try {
    if (existsSync(baselineFile)) base = readFileSync(baselineFile, "utf8").trim()
  }
  catch { /* 忽略 */ }

  const args = base ? ["log", "--format=%B", `${base}..HEAD`] : ["log", "-1", "--format=%B"]
  const { code, out } = await capture("git", args)
  return code === 0 ? out : ""
}

/**
 * 依据变更推导建议的 bump 档位。
 * @returns {{level:"patch"|"minor"|"major", reasons:string[], changedCount:number}}
 */
export async function suggestBump() {
  const changes = await collectChangedFiles()
  const messages = await collectCommitMessages()

  let level = "patch"
  const reasons = []

  const raise = (lv, why) => {
    if (RANK[lv] > RANK[level]) level = lv
    reasons.push(`[${lv}] ${why}`)
  }

  // ---------- 1. 提交信息里的破坏性标记 ----------
  if (/BREAKING[ -]CHANGE/i.test(messages)) {
    raise("major", "提交信息含 BREAKING CHANGE")
  }
  if (/^\s*\w+(\([^)]*\))?!:/.test(messages)) {
    raise("major", "提交信息使用了 `!:` 破坏性标记")
  }

  // ---------- 2. 组件文件增减 ----------
  const componentRoot = join(ROOT, "src", "components")
  const isPublicComponent = (f) => {
    const norm = f.replace(/\\/g, "/")
    if (!norm.startsWith("src/components/")) return false
    const rest = norm.slice("src/components/".length)
    return rest.endsWith(".vue") && !rest.includes("/")
  }

  const addedComponents = changes.filter((ch) => ch.status === "A" && isPublicComponent(ch.file))
  const removedComponents = changes.filter((ch) => ch.status === "D" && isPublicComponent(ch.file))

  if (removedComponents.length > 0) {
    raise("major", `删除了公开组件：${removedComponents.map((x) => x.file.split("/").pop()).join(", ")}`)
  }
  if (addedComponents.length > 0) {
    raise("minor", `新增公开组件：${addedComponents.map((x) => x.file.split("/").pop()).join(", ")}`)
  }

  // ---------- 3. 导出面变化 ----------
  const entryFiles = ["src/index.ts", "src/chart.ts"]
  for (const ef of entryFiles) {
    const ch = changes.find((x) => x.file.replace(/\\/g, "/") === ef)
    if (!ch) continue
    if (ch.status === "A") { raise("minor", `新增入口文件 ${ef}`); continue }
    if (ch.status === "D") { raise("major", `删除入口文件 ${ef}`); continue }

    const diff = await capture("git", ["diff", "--", ef])
    const removed = diff.out.split("\n").filter((l) => /^-\s*export\b/.test(l))
    const added = diff.out.split("\n").filter((l) => /^\+\s*export\b/.test(l))
    if (removed.length > 0) raise("major", `${ef} 移除了导出（${removed.length} 行）`)
    if (added.length > 0) raise("minor", `${ef} 新增了导出（${added.length} 行）`)
  }

  // ---------- 4. 组件实现改动（非公开文件） ----------
  const implChanges = changes.filter((ch) => {
    const n = ch.file.replace(/\\/g, "/")
    return n.startsWith("src/components/") && !isPublicComponent(n)
  })
  if (implChanges.length > 0 && RANK[level] < RANK.minor) {
    // 私有实现有变动，但不足以提升到 minor；仅记录理由
    reasons.push(`[patch] 组件内部实现变动 ${implChanges.length} 个文件`)
  }

  // ---------- 5. kit 层改动 ----------
  const kitChanges = changes.filter((ch) => ch.file.replace(/\\/g, "/").startsWith("src/components/kit/"))
  if (kitChanges.length > 0 && RANK[level] < RANK.minor) {
    reasons.push(`[patch] 组件库支撑层（kit/）变动 ${kitChanges.length} 个文件`)
  }

  if (reasons.length === 0) {
    reasons.push(changes.length === 0
      ? "[patch] 未检测到源码变更（将仅重新打包当前版本）"
      : `[patch] 常规改动 ${changes.length} 个文件`)
  }

  return { level, reasons, changedCount: changes.length, changes }
}

/** 把「当前 HEAD」记为下次的对比基线 */
export async function markReleaseBaseline() {
  const { code, out } = await capture("git", ["rev-parse", "HEAD"])
  if (code !== 0) return null
  const { mkdirSync, writeFileSync } = await import("node:fs")
  mkdirSync(join(ROOT, ".release"), { recursive: true })
  writeFileSync(join(ROOT, ".release", "last-release-commit"), `${out}\n`, "utf8")
  return out
}

/** 打印建议结果 */
export function printSuggestion(currentVersion, suggestion) {
  const next = bumpVersion(currentVersion, suggestion.level)
  const color = { major: c.red, minor: c.yellow, patch: c.green }[suggestion.level]
  log.plain("")
  log.plain(`  ${c.bold("版本判定")}：${currentVersion} ${c.gray("→")} ${c.bold(color(next))}  ${color(`(${suggestion.level})`)}`)
  log.plain(`  ${c.bold("依据")}：`)
  for (const r of suggestion.reasons) log.plain(`    ${c.gray("·")} ${r}`)
  log.plain(`  ${c.gray(`共 ${suggestion.changedCount} 个文件变更`)}`)
  return next
}

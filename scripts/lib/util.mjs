/**
 * scripts/lib/util.mjs —— 发布脚本共用工具
 *
 * 只依赖 Node 内置模块，不引入任何第三方依赖（发布会话中不该因为缺依赖而失败）。
 * 交互用 node:readline/promises，无需 inquirer。
 */

import { spawn } from "node:child_process"
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import readline from "node:readline/promises"

// ---------------------------------------------------------------- 路径常量

/** scripts/lib/util.mjs → 仓库根目录 */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")

/** 发布相关的本地产物目录（已在 .gitignore 中忽略） */
export const OUT_DIR = join(ROOT, ".release")

/** 记住的目标项目 + 历史记录 */
export const STATE_FILE = join(OUT_DIR, "state.json")

/** tarball 输出目录 */
export const TARBALL_DIR = join(OUT_DIR, "tarballs")

// ---------------------------------------------------------------- 终端着色
// 仅在 TTY 下着色；重定向到文件时自动降级为纯文本，避免日志里出现 ANSI 噪声。

const useColor = process.stdout.isTTY && !process.env.NO_COLOR
const wrap = (code) => (s) => (useColor ? `\u001B[${code}m${s}\u001B[0m` : String(s))

export const c = {
  bold: wrap("1"),
  dim: wrap("2"),
  red: wrap("31"),
  green: wrap("32"),
  yellow: wrap("33"),
  blue: wrap("34"),
  magenta: wrap("35"),
  cyan: wrap("36"),
  gray: wrap("90"),
}

export const log = {
  info: (m) => console.log(`${c.blue("ℹ")} ${m}`),
  ok: (m) => console.log(`${c.green("✔")} ${m}`),
  warn: (m) => console.log(`${c.yellow("⚠")} ${m}`),
  err: (m) => console.error(`${c.red("✖")} ${m}`),
  step: (m) => console.log(`\n${c.bold(c.cyan("▸ " + m))}`),
  plain: (m) => console.log(m),
}

/** 缩进输出多行内容 */
export function indent(text, pad = "  ") {
  return String(text).split("\n").map((l) => (l.trim() ? pad + l : l)).join("\n")
}

// ---------------------------------------------------------------- 执行命令

/**
 * Windows 上 npm/npx 实为 .cmd 批处理：直接 spawn 会 EINVAL（Node 20+ 的安全限制），
 * 而用 shell:true 又会触发 Node 24 的 DEP0190 告警（shell 与 args 混用有注入风险）。
 * 折中且干净的做法是显式经 `cmd /c` 调用 —— 实测可用且无告警。
 * 非 Windows 或非包管理器命令一律原样执行。
 */
function buildSpawn(cmd, args) {
  if (process.platform === "win32" && /^(npm|npx|pnpm|yarn)$/.test(cmd)) {
    // 注意：/c 之后的整串由 cmd 解析，故把命令与参数拼为单个字符串
    return { file: "cmd", args: ["/c", cmd, ...args] }
  }
  return { file: cmd, args }
}

/**
 * 执行命令并实时透传输出（用于构建、typecheck、npm install 等长任务）。
 * @returns {Promise<number>} 退出码
 */
export function run(cmd, args, options = {}) {
  return new Promise((resolvePromise) => {
    const { file, args: finalArgs } = buildSpawn(cmd, args)
    const child = spawn(file, finalArgs, {
      cwd: options.cwd ?? ROOT,
      stdio: options.quiet ? ["ignore", "pipe", "pipe"] : "inherit",
      env: { ...process.env, ...(options.env ?? {}) },
    })

    let out = ""
    if (options.quiet) {
      child.stdout?.on("data", (d) => { out += d })
      child.stderr?.on("data", (d) => { out += d })
    }

    child.on("close", (code) => {
      if (options.quiet && code !== 0) process.stderr.write(out)
      resolvePromise(code ?? 1)
    })
    child.on("error", (e) => {
      log.err(`无法执行 ${cmd}: ${e.message}`)
      resolvePromise(1)
    })
  })
}

/** 执行命令并捕获 stdout（用于 git 查询等） */
export function capture(cmd, args, options = {}) {
  return new Promise((resolvePromise) => {
    const { file, args: finalArgs } = buildSpawn(cmd, args)
    const child = spawn(file, finalArgs, {
      cwd: options.cwd ?? ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let out = ""
    child.stdout?.on("data", (d) => { out += d })
    child.on("close", (code) => resolvePromise({ code: code ?? 1, out: out.trim() }))
    child.on("error", () => resolvePromise({ code: 1, out: "" }))
  })
}

// ---------------------------------------------------------------- 交互提问

let rl = null
function getRl() {
  if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return rl
}

export function closeRl() {
  if (rl) { rl.close(); rl = null }
}

/** 文本输入；传 default 时回车即取默认值。输入流结束（EOF，如管道喂完）时返回默认值。 */
export async function ask(question, defaultValue = "") {
  const suffix = defaultValue ? c.gray(` (${defaultValue})`) : ""
  try {
    const a = await getRl().question(`${c.cyan("?")} ${question}${suffix} `)
    const v = a.trim()
    return v || defaultValue
  }
  catch {
    // 管道输入的常见情形：输入耗尽导致 readline 已关闭。按「用户选择默认/放弃」处理。
    return defaultValue
  }
}

/** 是/否确认。输入流结束时返回 defaultValue。 */
export async function confirm(question, defaultValue = false) {
  const hint = defaultValue ? "Y/n" : "y/N"
  try {
    const a = await getRl().question(`${c.cyan("?")} ${question} ${c.gray(`(${hint})`)} `)
    const v = a.trim().toLowerCase()
    if (!v) return defaultValue
    return v === "y" || v === "yes"
  }
  catch {
    return defaultValue
  }
}

/**
 * 单选菜单。
 * @param {string} title
 * @param {{label:string, value:any, hint?:string, disabled?:boolean}[]} items
 * @returns {Promise<any>} 选中项的 value；用户选退出返回 null
 */
export async function choose(title, items) {
  console.log(`\n${c.bold(title)}`)
  items.forEach((it, i) => {
    const num = c.cyan(String(i + 1).padStart(2))
    const hint = it.hint ? c.gray(`  ${it.hint}`) : ""
    const label = it.disabled ? c.gray(`${it.label}（不可用）`) : it.label
    console.log(`  ${num}. ${label}${hint}`)
  })
  const quitIdx = items.length + 1
  console.log(`  ${c.cyan(String(quitIdx).padStart(2))}. ${c.gray("退出")}`)

  for (;;) {
    try {
      const a = await getRl().question(`\n${c.cyan("?")} 请选择 ${c.gray(`[1-${quitIdx}]`)} `)
      const n = Number.parseInt(a.trim(), 10)
      if (n === quitIdx || a.trim() === "q") return null
      if (Number.isInteger(n) && n >= 1 && n <= items.length) {
        if (items[n - 1].disabled) { log.warn("该项当前不可用，请另选。"); continue }
        return items[n - 1].value
      }
      log.warn("输入无效，请输入序号。")
    }
    catch {
      // 输入流结束（EOF）：视为退出，避免抛 "readline was closed"
      return null
    }
  }
}

/** 让用户从候选列表里选一个（带“手动输入路径”兜底） */
export async function choosePath(title, candidates) {
  const items = candidates.map((p) => ({ label: p, value: p }))
  items.push({ label: "手动输入路径…", value: "__manual__" })
  const picked = await choose(title, items)
  if (picked === null) return null
  if (picked !== "__manual__") return picked

  for (;;) {
    const p = await ask("请输入目标项目路径（绝对或相对本仓库）")
    if (!p) return null
    const abs = isAbsolute(p) ? p : resolve(ROOT, p)
    if (!existsSync(join(abs, "package.json"))) {
      log.warn(`该目录下没有 package.json：${abs}`)
      if (!(await confirm("仍然使用这个路径？", false))) continue
    }
    return abs
  }
}

// ---------------------------------------------------------------- 状态持久化

const EMPTY_STATE = { targets: [], history: [] }

export function loadState() {
  try {
    if (!existsSync(STATE_FILE)) return { ...EMPTY_STATE }
    const parsed = JSON.parse(readFileSync(STATE_FILE, "utf8"))
    return {
      targets: Array.isArray(parsed.targets) ? parsed.targets : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  }
  catch (e) {
    log.warn(`状态文件解析失败，将重新开始：${e.message}`)
    return { ...EMPTY_STATE }
  }
}

export function saveState(state) {
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

/** 记住一个目标项目（去重，最近使用排前面） */
export function rememberTarget(state, targetPath) {
  state.targets = [targetPath, ...state.targets.filter((t) => t !== targetPath)].slice(0, 10)
  saveState(state)
}

/** 追加一条发布历史 */
export function addHistory(state, entry) {
  state.history = [entry, ...state.history].slice(0, 50)
  saveState(state)
}

// ---------------------------------------------------------------- 杂项

/** 读取仓库 package.json */
export function readPkg() {
  return JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
}

/** 人类可读体积 */
export function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** 时间戳（本地时区，形如 2026-09-14 15:04:05） */
export function timestamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 扫描某个父目录下的候选 Vue 项目（含 package.json 且依赖 vue） */
export function scanVueProjects(parentDir, { maxDepth = 2 } = {}) {
  const found = []
  const skip = new Set(["node_modules", ".git", "dist", "dist-lib", ".release", "src", "public"])

  function walk(dir, depth) {
    if (depth > maxDepth) return
    let entries = []
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    }
    catch { return }

    for (const e of entries) {
      if (!e.isDirectory() || skip.has(e.name) || e.name.startsWith(".")) continue
      const full = join(dir, e.name)
      const pkgPath = join(full, "package.json")
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
          const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
          if (deps.vue) found.push(full)
        }
        catch { /* 忽略坏 package.json */ }
      }
      walk(full, depth + 1)
    }
  }

  walk(resolve(parentDir), 0)
  return found
}

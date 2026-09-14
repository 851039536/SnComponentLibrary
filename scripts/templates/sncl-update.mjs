#!/usr/bin/env node
/**
 * sncl-update.mjs —— 目标项目侧的一键升级脚本（模板）
 *
 * 用途：把本文件拷到**使用组件库的项目**根目录，以后在该项目里直接跑
 *     node sncl-update.mjs
 * 就能从组件库仓库拉取最新 tarball 并安装，无需回到组件库仓库。
 *
 * 用法：
 *   node sncl-update.mjs                    使用下方配置的组件库路径
 *   node sncl-update.mjs <组件库仓库路径>    临时指定组件库位置
 *   node sncl-update.mjs --pack             先让组件库仓库打包（自动判定版本），再安装
 *   node sncl-update.mjs --no-touch         直投模式，不改本项目的 package.json
 *   node sncl-update.mjs --check            只比对版本，不做任何改动
 *
 * 你可以直接改下面的 LIB_PATH，也可以每次用命令行参数传。
 */

import { spawn } from "node:child_process"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// ============================================================================
// 配置：组件库仓库的位置。改成你自己的路径，或用命令行参数覆盖。
// 支持相对路径（相对本文件所在目录）。
// ============================================================================
const LIB_PATH = process.env.SNCL_LIB_PATH || "../SnComponentLibrary"

const PKG_NAME = "sn-component-library"
const HERE = dirname(fileURLToPath(import.meta.url))

const c = {
  bold: (s) => `\u001B[1m${s}\u001B[0m`,
  dim: (s) => `\u001B[2m${s}\u001B[0m`,
  red: (s) => `\u001B[31m${s}\u001B[0m`,
  green: (s) => `\u001B[32m${s}\u001B[0m`,
  yellow: (s) => `\u001B[33m${s}\u001B[0m`,
  cyan: (s) => `\u001B[36m${s}\u001B[0m`,
}
const log = {
  info: (m) => console.log(`${c.cyan("ℹ")} ${m}`),
  ok: (m) => console.log(`${c.green("✔")} ${m}`),
  warn: (m) => console.log(`${c.yellow("⚠")} ${m}`),
  err: (m) => console.error(`${c.red("✖")} ${m}`),
}

/**
 * 与组件库仓库的 release.mjs 保持一致：Windows 上 npm 是 .cmd，
 * 直接 spawn 会 EINVAL，shell:true 又会触发 DEP0190 告警；显式经 cmd /c 最干净。
 */
function buildSpawn(cmd, args) {
  if (process.platform === "win32" && /^(npm|npx|pnpm|yarn)$/.test(cmd)) {
    return { file: "cmd", args: ["/c", cmd, ...args] }
  }
  return { file: cmd, args }
}

const run = (cmd, args, cwd) => new Promise((res) => {
  const { file, args: finalArgs } = buildSpawn(cmd, args)
  const child = spawn(file, finalArgs, { cwd, stdio: "inherit" })
  child.on("close", (code) => res(code ?? 1))
  child.on("error", () => res(1))
})

function readVersion(p) {
  try { return JSON.parse(readFileSync(p, "utf8")).version }
  catch { return null }
}

/** 取组件库仓库里最新的 tarball（.release/tarballs 下按时间倒序） */
function latestTarball(libDir) {
  const dir = join(libDir, ".release", "tarballs")
  if (!existsSync(dir)) return null
  const files = readdirSync(dir).filter((f) => f.endsWith(".tgz")).map((f) => join(dir, f))
  if (files.length === 0) return null
  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return files[0]
}

async function main() {
  const argv = process.argv.slice(2)
  const packFirst = argv.includes("--pack")
  const noTouch = argv.includes("--no-touch")
  const checkOnly = argv.includes("--check")
  const pathArg = argv.find((a) => !a.startsWith("--")) || LIB_PATH

  const libDir = resolve(HERE, pathArg)
  console.log(`\n${c.bold("组件库升级助手")}  ${c.dim("（目标项目侧）")}\n`)

  // ---- 1. 校验组件库仓库 ----
  if (!existsSync(join(libDir, "package.json"))) {
    log.err(`找不到组件库仓库：${libDir}`)
    log.info(`请修改本文件顶部的 LIB_PATH，或运行：node sncl-update.mjs <组件库路径>`)
    process.exit(1)
  }
  log.ok(`组件库仓库：${libDir}`)

  const scriptPath = join(libDir, "scripts", "release.mjs")
  if (packFirst) {
    if (!existsSync(scriptPath)) {
      log.err("组件库仓库缺少 scripts/release.mjs，无法自动打包")
      process.exit(1)
    }
    log.info("让组件库仓库打包（自动判定版本）…")
    const code = await run("node", [scriptPath, "bump"], libDir)
    if (code !== 0) { log.err("打包失败"); process.exit(1) }
  }

  // ---- 2. 找 tarball ----
  const tgz = latestTarball(libDir)
  if (!tgz) {
    log.err("组件库仓库里没有可用的 tarball。")
    log.info(`请先在该仓库执行：npm run build:lib && npm pack，或者加 --pack 让本脚本代劳`)
    process.exit(1)
  }
  const incoming = readVersionFromTar(tgz)
  const current = readVersion(join(HERE, "node_modules", PKG_NAME, "package.json"))

  log.info(`当前已装：${c.bold(current ?? "（未安装）")}`)
  log.info(`可用版本：${c.bold(incoming ?? "?")}  ${c.dim(tgz)}`)

  if (current && incoming && current === incoming) {
    log.warn("两边版本一致，无需升级。若组件库有改动未 bump 版本，请加 --pack 重新打包。")
    if (!checkOnly) { /* 继续，允许强制覆盖 */ }
  }
  if (checkOnly) { console.log(""); return }

  // ---- 3. 安装 ----
  const libsDir = join(HERE, "libs")
  if (!noTouch) {
    const { mkdirSync, copyFileSync } = await import("node:fs")
    mkdirSync(libsDir, { recursive: true })
    const dest = join(libsDir, tgz.split(/[\\/]/).pop())
    copyFileSync(tgz, dest)
    log.ok(`已拷贝 tarball → ${dest}`)
    log.info("执行 npm install…")
    const code = await run("npm", ["install", `./libs/${tgz.split(/[\\/]/).pop()}`, "--loglevel=error"], HERE)
    if (code !== 0) { log.err("npm install 失败"); process.exit(1) }
    log.ok("安装完成")
  }
  else {
    log.info("直投模式：解包到 node_modules（不改 package.json）")
    const code = await run("node", [scriptPath, "install", HERE, "--no-touch"], libDir)
    if (code !== 0) { log.err("直投失败"); process.exit(1) }
  }

  // ---- 4. 校验 ----
  const pkg = JSON.parse(readFileSync(join(HERE, "package.json"), "utf8"))
  if (pkg.scripts?.typecheck) {
    log.info("执行 typecheck 验证…")
    const code = await run("npm", ["run", "typecheck"], HERE)
    if (code !== 0) { log.warn("typecheck 未通过，请检查"); process.exit(1) }
    log.ok("typecheck 通过")
  }

  log.ok(c.bold(`升级完成：${current ?? "（未安装）"} → ${incoming}`))
  console.log("")
}

/** 从 tarball 读版本（不依赖 tar 命令：直接扫 gzip 流里的 package/package.json 不可靠，这里退回文件名解析） */
function readVersionFromTar(tgz) {
  const m = tgz.match(/(\d+\.\d+\.\d+)\.tgz$/)
  return m ? m[1] : null
}

main().catch((e) => { log.err(`异常：${e.message}`); process.exit(1) })

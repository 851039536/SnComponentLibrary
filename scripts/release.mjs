#!/usr/bin/env node
/**
 * scripts/release.mjs —— 组件库发布/分发助手（交互式菜单）
 *
 *   node scripts/release.mjs
 *
 * 功能：
 *   1. 自动打包                     —— 校验 + 构建 + 打出 tarball（版本号不变）
 *   2. 自动打包（版本变化）          —— 自动判定 patch/minor/major，bump 后打包
 *   3. 打包并安装到其他项目          —— 拷贝 tarball 到目标项目并自动安装
 *   4. 查看状态 / 发布历史
 *
 * 也可带参数直接执行（便于 CI 或快捷键）：
 *   node scripts/release.mjs pack            # 同功能 1
 *   node scripts/release.mjs bump            # 同功能 2（自动判定档位）
 *   node scripts/release.mjs bump minor      # 指定档位
 *   node scripts/release.mjs install <目标项目路径> [--no-touch] [--no-docs]
 *   node scripts/release.mjs history         # 同功能 4
 */

import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { generateDocs, printManualSteps } from "./lib/docs.mjs"
import { installAsDependency, installDirect, installedVersion, tarballVersion, verifyInTarget } from "./lib/install.mjs"
import {
  addHistory, ask, c, choose, closeRl, confirm, humanSize, indent,
  loadState, log, readPkg, rememberTarget, ROOT, run, saveState, scanVueProjects,
  TARBALL_DIR, timestamp,
} from "./lib/util.mjs"
import { checkTarball, runPrePackChecks } from "./lib/verify.mjs"
import { bumpVersion, isGitRepo, markReleaseBaseline, printSuggestion, suggestBump } from "./lib/version.mjs"

const PKG_NAME = "sn-component-library"

// ============================================================================
// 主流程
// ============================================================================

async function main() {
  const argv = process.argv.slice(2)
  const state = loadState()

  printHeader()

  // 带参数 → 直接执行
  if (argv.length > 0) {
    const ok = await dispatch(argv, state)
    closeRl()
    process.exit(ok ? 0 : 1)
  }

  // 无参数 → 交互菜单
  for (;;) {
    const pkg = readPkg()
    const choice = await choose(`请选择操作（当前版本 ${pkg.version}）`, [
      { label: "自动打包", hint: "校验 + 构建 + 出 tarball，版本号不变", value: "pack" },
      { label: "自动打包（版本变化）", hint: "自动判定 patch/minor/major 并 bump", value: "bump" },
      { label: "打包并安装到其他项目", hint: "出包 → 拷贝 → 自动安装 → 安装后校验", value: "install" },
      { label: "查看状态 / 发布历史", hint: "已记录的版本、目标项目、tarball 列表", value: "status" },
    ])

    if (choice === null) break

    try {
      await dispatch([choice], state)
    }
    catch (e) {
      log.err(`执行出错：${e.message}`)
      if (process.env.DEBUG) console.error(e)
    }
  }

  closeRl()
  log.plain(`\n${c.gray("已退出。")}`)
}

/** 按子命令分发（菜单与 CLI 共用） */
async function dispatch(argv, state) {
  const [cmd, ...rest] = argv
  switch (cmd) {
    case "pack": return await doPack(state, { bump: false })
    case "bump": return await doPack(state, { bump: true, level: rest[0] })
    case "install": return await doInstall(state, rest, { nonInteractive: true })
    case "status":
    case "history": return doStatus(state)
    default:
      log.err(`未知命令：${cmd}`)
      log.plain(indent(usage()))
      return false
  }
}

function usage() {
  return [
    "用法：",
    "  node scripts/release.mjs                      交互式菜单",
    "  node scripts/release.mjs pack                 自动打包",
    "  node scripts/release.mjs bump [patch|minor|major]  自动/指定档位打包",
    "  node scripts/release.mjs install <目标项目> [--no-touch] [--no-docs]",
    "  node scripts/release.mjs history              查看状态与历史",
  ].join("\n")
}

// ============================================================================
// 功能 1 / 2：打包
// ============================================================================

async function doPack(state, { bump, level }) {
  const pkg = readPkg()
  let targetVersion = pkg.version
  let bumpInfo = null

  // ---------- 版本判定 ----------
  if (bump) {
    const gitOk = await isGitRepo()
    if (!gitOk) {
      log.warn("当前不是 git 仓库，无法依据变更自动判定版本；将改为手动选择。")
      const picked = await choose("请选择版本递增档位", [
        { label: "patch（修 bug，向后兼容）", value: "patch" },
        { label: "minor（新增功能，向后兼容）", value: "minor" },
        { label: "major（破坏性变更）", value: "major" },
      ])
      if (picked === null) return false
      level = picked
    }

    if (level && !["patch", "minor", "major"].includes(level)) {
      log.err(`无效的档位：${level}（应为 patch / minor / major）`)
      return false
    }

    if (!level) {
      log.step("分析变更以判定版本档位")
      bumpInfo = await suggestBump()
      targetVersion = printSuggestion(pkg.version, bumpInfo)

      const accepted = await confirm(`是否采用 ${c.bold(targetVersion)}？`, true)
      if (!accepted) {
        const picked = await choose("请手动选择档位", [
          { label: `patch  → ${bumpVersion(pkg.version, "patch")}`, value: "patch" },
          { label: `minor  → ${bumpVersion(pkg.version, "minor")}`, value: "minor" },
          { label: `major  → ${bumpVersion(pkg.version, "major")}`, value: "major" },
          { label: "保持当前版本不变", value: "keep" },
        ])
        if (picked === null) return false
        if (picked === "keep") { level = null; targetVersion = pkg.version }
        else { level = picked; targetVersion = bumpVersion(pkg.version, picked) }
      }
      else {
        level = bumpInfo.level
      }
    }
    else {
      targetVersion = bumpVersion(pkg.version, level)
      log.info(`指定档位 ${c.bold(level)}：${pkg.version} → ${c.bold(targetVersion)}`)
    }
  }

  // ---------- 校验 ----------
  const checksOk = await runPrePackChecks()
  if (!checksOk) {
    log.err("校验未通过，已中止打包（未产出 tarball）。")
    return false
  }

  // ---------- 更新版本号 ----------
  if (targetVersion !== pkg.version) {
    log.step(`更新版本号：${pkg.version} → ${targetVersion}`)
    const code = await run("npm", ["version", targetVersion, "--no-git-tag-version", "--allow-same-version", "--loglevel=error"])
    if (code !== 0) {
      log.err("版本号写入失败")
      return false
    }
    log.ok(`package.json 版本已更新为 ${targetVersion}`)
  }

  // ---------- 构建 ----------
  log.step("构建库产物")
  const buildCode = await run("npm", ["run", "build:lib"])
  if (buildCode !== 0) {
    log.err("构建失败")
    return false
  }
  log.ok("构建完成")

  // ---------- 打包 ----------
  log.step("生成 tarball")
  mkdirSync(TARBALL_DIR, { recursive: true })
  // --loglevel=error 抑制 npm 那一大段 "npm notice" 文件清单（我们随后自己校验并打印摘要）
  const packCode = await run("npm", ["pack", "--pack-destination", TARBALL_DIR, "--loglevel=error"])
  if (packCode !== 0) {
    log.err("npm pack 失败")
    return false
  }
  const tgzPath = join(TARBALL_DIR, `${PKG_NAME}-${targetVersion}.tgz`)
  if (!existsSync(tgzPath)) {
    log.err(`未找到预期产物：${tgzPath}`)
    return false
  }

  const tarballOk = await checkTarball(tgzPath)
  if (!tarballOk) return false

  // ---------- 记录 ----------
  const baseline = await markReleaseBaseline()
  addHistory(state, {
    at: timestamp(),
    version: targetVersion,
    level: level ?? null,
    tarball: tgzPath,
    size: statSync(tgzPath).size,
    baseline: baseline?.slice(0, 8) ?? null,
    targets: [],
  })

  log.plain("")
  log.ok(`${c.bold("打包成功")}  ${c.cyan(tgzPath)}`)
  log.plain(`  ${c.gray(`体积 ${humanSize(statSync(tgzPath).size)}`)}`)
  log.plain("")
  log.plain(indent([
    "分发方式：",
    `  1) 把上面的 .tgz 拷给对方，对方执行 npm i ./libs/${basename(tgzPath)}`,
    "  2) 或直接跑本脚本：node scripts/release.mjs install",
  ].join("\n"), "  "))
  return true
}

// ============================================================================
// 功能 3：打包并安装到其他项目
// ============================================================================

async function doInstall(state, rest, { nonInteractive = false } = {}) {
  const noTouch = rest.includes("--no-touch")
  const noDocs = rest.includes("--no-docs")
  const pathArg = rest.find((a) => !a.startsWith("--"))

  // ---------- 1. 先有包 ----------
  // CLI 直调（给了目标路径）时自动取最新 tarball，不再交互询问，便于脚本/CI 使用
  let tgzPath = nonInteractive ? latestTarball() : await pickTarball(state)
  if (nonInteractive && !tgzPath) {
    log.warn("还没有任何 tarball，先自动打包一个。")
    const ok = await doPack(state, { bump: false })
    if (!ok) return false
    tgzPath = latestTarball()
  }
  if (!tgzPath) return false

  // ---------- 2. 选目标项目 ----------
  let targetDir = pathArg ? resolve(pathArg) : await pickTarget(state)
  if (!targetDir) return false

  if (!existsSync(join(targetDir, "package.json"))) {
    log.err(`目标目录不是 Node 项目（缺 package.json）：${targetDir}`)
    return false
  }
  rememberTarget(state, targetDir)

  // ---------- 3. 版本对比提示 ----------
  const incoming = await tarballVersion(tgzPath)
  const current = installedVersion(targetDir)
  log.plain("")
  log.plain(`  ${c.bold("目标项目")}：${c.cyan(targetDir)}`)
  log.plain(`  ${c.bold("版本对比")}：已装 ${c.bold(current ?? c.gray("（未安装）"))}  ${c.gray("→")}  ${c.bold(incoming ?? "?")}`)
  if (current && incoming && current === incoming) {
    log.warn("两边版本号相同。若组件库有改动但未 bump 版本，建议先走「功能 2」重新打包，避免 npm 缓存旧内容。")
  }

  // ---------- 4. 安装模式 ----------
  let mode = noTouch ? "direct" : null
  if (!mode) {
    if (nonInteractive) {
      // CLI / CI 场景默认走依赖模式，避免不必要的阻塞提问
      mode = "dep"
      log.info("未指定 --no-touch，使用依赖模式")
    }
    else {
      const picked = await choose("请选择安装模式", [
        { label: "依赖模式", hint: "拷贝到 libs/ 并 npm i，会写入对方 package.json", value: "dep" },
        { label: "直投模式", hint: "只覆盖 node_modules，不改对方 package.json", value: "direct" },
      ])
      if (picked === null) return false
      mode = picked
    }
  }

  // ---------- 5. 执行安装（先不生成文档，等校验通过再投放） ----------
  log.step("安装到目标项目")
  const ok = mode === "dep"
    ? await installAsDependency(targetDir, tgzPath, { noDocs: true })
    : await installDirect(targetDir, tgzPath, { noDocs: true })
  if (!ok) return false

  // ---------- 6. 安装后校验 ----------
  log.step("安装后校验")
  const verified = await verifyInTarget(targetDir)

  // ---------- 7. 校验通过后才投放 AI 文档 ----------
  // 顺序有意为之：若包在对方项目里跑不起来，就不该给 AI 留下「照这份文档写」的依据。
  if (noDocs) {
    log.info("已按 --no-docs 跳过文档生成")
  }
  else if (verified) {
    const r = generateDocs(targetDir)
    if (r.ok) printManualSteps(targetDir, r.entryPath)
  }
  else {
    log.warn("安装后校验未通过，已跳过文档生成（修好后再跑一次安装即可）")
  }

  // ---------- 8. 记录 ----------
  const entry = state.history.find((h) => h.tarball === tgzPath)
  if (entry) {
    entry.targets = [...(entry.targets ?? []), targetDir]
    saveState(state)
  }

  // ---------- 8. 提示目标项目侧升级脚本 ----------
  log.plain("")
  log.ok(c.bold("安装流程结束"))
  const helper = join(targetDir, "sncl-update.mjs")
  if (!existsSync(helper)) {
    log.plain(indent([
      "提示：可在目标项目放置一个升级脚本，便于以后一键更新（无需回到本仓库）：",
      `  node scripts/release.mjs install "${targetDir}" 也能重复使用本命令。`,
    ].join("\n"), "  "))
  }
  return true
}

/** 取最新的 tarball（按修改时间）；没有则返回 null */
function latestTarball() {
  if (!existsSync(TARBALL_DIR)) return null
  const files = readdirSync(TARBALL_DIR)
    .filter((f) => f.endsWith(".tgz"))
    .map((f) => join(TARBALL_DIR, f))
  if (files.length === 0) return null
  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return files[0]
}

/** 选择要安装的 tarball（默认最近一个） */
async function pickTarball(state) {
  mkdirSync(TARBALL_DIR, { recursive: true })
  const files = existsSync(TARBALL_DIR)
    ? readdirSync(TARBALL_DIR).filter((f) => f.endsWith(".tgz")).map((f) => join(TARBALL_DIR, f))
    : []
  // 按修改时间倒序
  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)

  if (files.length === 0) {
    log.warn("还没有任何 tarball。")
    if (await confirm("现在先打包一个？", true)) {
      const ok = await doPack(state, { bump: false })
      if (!ok) return null
      return pickTarball(state)
    }
    return null
  }

  const items = files.slice(0, 8).map((f, i) => ({
    label: basename(f),
    hint: `${humanSize(statSync(f).size)}  ${i === 0 ? "← 最新" : ""}`,
    value: f,
  }))
  items.push({ label: "重新打包一个最新的", value: "__repack__" })

  const picked = await choose("请选择要安装的 tarball", items)
  if (picked === null) return null
  if (picked === "__repack__") {
    const ok = await doPack(state, { bump: true })
    if (!ok) return null
    return pickTarball(state)
  }
  return picked
}

/** 选择目标项目：已记住的 / 扫描到的 / 手动输入 */
async function pickTarget(state) {
  const items = []

  // 已记住的（过滤掉已不存在的）
  const remembered = state.targets.filter((t) => existsSync(join(t, "package.json")))
  for (const t of remembered) {
    const v = installedVersion(t)
    items.push({ label: t, hint: `已装 ${v ?? "（未安装）"}`, value: t })
  }

  // 扫描同级目录下的 Vue 项目
  const parent = resolve(ROOT, "..")
  const scanned = scanVueProjects(parent, { maxDepth: 2 })
    .filter((p) => resolve(p) !== resolve(ROOT))
    .filter((p) => !remembered.includes(p))
  for (const p of scanned.slice(0, 8)) {
    const v = installedVersion(p)
    items.push({ label: p, hint: `${c.gray("扫描到")} ${v ? `已装 ${v}` : ""}`, value: p })
  }

  items.push({ label: "手动输入路径…", value: "__manual__" })

  const picked = await choose("请选择目标项目", items)
  if (picked === null) return null
  if (picked !== "__manual__") return picked

  for (;;) {
    const p = await ask("请输入目标项目路径（绝对路径，或相对本仓库的路径）")
    if (!p) return null
    const abs = resolve(ROOT, p)
    if (!existsSync(join(abs, "package.json"))) {
      log.warn(`该目录下没有 package.json：${abs}`)
      if (!(await confirm("仍然使用？", false))) continue
    }
    return abs
  }
}

// ============================================================================
// 功能 4：状态 / 历史
// ============================================================================

function doStatus(state) {
  const pkg = readPkg()
  log.plain("")
  log.plain(`  ${c.bold("当前版本")}：${c.cyan(pkg.version)}`)
  log.plain(`  ${c.bold("仓库路径")}：${c.gray(ROOT)}`)

  // tarball
  const files = existsSync(TARBALL_DIR)
    ? readdirSync(TARBALL_DIR).filter((f) => f.endsWith(".tgz"))
      .map((f) => join(TARBALL_DIR, f))
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
    : []

  log.plain("")
  log.plain(`  ${c.bold(`已有 tarball（${files.length} 个）`)}：`)
  if (files.length === 0) {
    log.plain(`    ${c.gray("（无，请先执行「自动打包」）")}`)
  }
  else {
    for (const f of files.slice(0, 10)) {
      log.plain(`    ${c.gray("·")} ${basename(f).padEnd(36)} ${humanSize(statSync(f).size)}`)
    }
    if (files.length > 10) log.plain(`    ${c.gray(`… 另有 ${files.length - 10} 个`)}`)
  }

  // 已记住的目标项目
  log.plain("")
  log.plain(`  ${c.bold(`已记录的目标项目（${state.targets.length} 个）`)}：`)
  if (state.targets.length === 0) {
    log.plain(`    ${c.gray("（无）")}`)
  }
  else {
    for (const t of state.targets) {
      const exists = existsSync(join(t, "package.json"))
      const v = exists ? installedVersion(t) : null
      const status = exists ? `${c.gray("已装")} ${v ?? c.gray("（未安装）")}` : c.red("路径已不存在")
      log.plain(`    ${c.gray("·")} ${t}  ${status}`)
    }
  }

  // 发布历史
  log.plain("")
  log.plain(`  ${c.bold(`发布历史（最近 ${Math.min(state.history.length, 12)} 条）`)}：`)
  if (state.history.length === 0) {
    log.plain(`    ${c.gray("（无）")}`)
  }
  else {
    for (const h of state.history.slice(0, 12)) {
      const lvl = h.level ? c.magenta(` ${h.level}`) : ""
      const tgts = h.targets?.length ? c.gray(` → ${h.targets.length} 个项目`) : ""
      log.plain(`    ${c.gray("·")} ${h.at}  ${c.cyan(String(h.version).padEnd(8))}${lvl}${tgts}`)
    }
  }
  log.plain("")
  return true
}

// ============================================================================

function printHeader() {
  const pkg = readPkg()
  console.log("")
  console.log(c.bold(c.cyan("  ┌─────────────────────────────────────────────┐")))
  console.log(c.bold(c.cyan("  │   组件库发布助手  sn-component-library      │")))
  console.log(c.bold(c.cyan("  └─────────────────────────────────────────────┘")))
  console.log(`   ${c.gray(`版本 ${pkg.version}   ${ROOT}`)}`)
}

main().catch((e) => {
  log.err(`未捕获异常：${e.message}`)
  if (process.env.DEBUG) console.error(e)
  closeRl()
  process.exit(1)
})

/**
 * scripts/lib/install.mjs —— 把 tarball 安装到目标项目
 *
 * 两种模式：
 *   A. 依赖模式（默认）：拷 .tgz 到目标项目 libs/ 并 `npm i ./libs/xxx.tgz`
 *      → 会写入目标项目 package.json（`file:libs/xxx.tgz`），可被 npm 追踪、可提交
 *   B. 直投模式（--no-touch）：解包后直接覆盖目标项目的 node_modules/sn-component-library/
 *      → 不修改对方 package.json，适合「只是临时试一下」或对方不许改依赖的场景
 *      代价：目标项目执行 npm install 时可能被覆盖，需重新投递
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs"
import { basename, join } from "node:path"
import { capture, c, humanSize, log, run } from "./util.mjs"

/** 本库的包名 */
const PKG_NAME = "sn-component-library"

/** 读取目标项目的 package.json（读不到返回 null） */
export function readTargetPkg(targetDir) {
  const p = join(targetDir, "package.json")
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, "utf8"))
  }
  catch {
    return null
  }
}

/** 目标项目当前已安装的本库版本（未安装返回 null） */
export function installedVersion(targetDir) {
  const p = join(targetDir, "node_modules", PKG_NAME, "package.json")
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, "utf8")).version
  }
  catch {
    return null
  }
}

/** 读取 tarball 内的版本号（顺带验证包结构） */
export async function tarballVersion(tgzPath) {
  const res = await capture("tar", ["-xzOf", tgzPath, "package/package.json"])
  if (res.code !== 0) return null
  try {
    return JSON.parse(res.out).version
  }
  catch {
    return null
  }
}

/**
 * 模式 A：拷贝 tarball 到目标项目 libs/ 并 npm i
 * @returns {Promise<boolean>}
 */
export async function installAsDependency(targetDir, tgzPath) {
  const libsDir = join(targetDir, "libs")
  mkdirSync(libsDir, { recursive: true })
  const dest = join(libsDir, basename(tgzPath))
  copyFileSync(tgzPath, dest)
  log.ok(`已拷贝 tarball → ${c.cyan(dest)}  ${c.gray(`(${humanSize(statSync(dest).size)})`)}`)

  const rel = `./libs/${basename(tgzPath)}`
  log.info(`执行 npm install ${rel}`)
  const code = await run("npm", ["install", rel], { cwd: targetDir })
  if (code !== 0) {
    log.err("npm install 失败")
    return false
  }
  log.ok("安装完成（已写入目标项目 package.json）")
  return true
}

/**
 * 模式 B：不修改 package.json，解包后直投 node_modules
 *
 * ⚠️ 直投不会触发 npm 的依赖解析，因此本库自身的运行时依赖
 * （@iconify/vue、@iconify-json/mdi）必须手动补上，否则使用方构建时
 * 会报 `Failed to resolve import "@iconify/vue"`。
 *
 * @returns {Promise<boolean>}
 */
export async function installDirect(targetDir, tgzPath) {
  const nmDir = join(targetDir, "node_modules")
  if (!existsSync(nmDir)) {
    log.err("目标项目没有 node_modules/，请先在该项目执行 npm install")
    return false
  }
  const destDir = join(nmDir, PKG_NAME)

  // ---- 先从 tarball 里读出本库依赖清单（此时还没解包） ----
  let deps = {}
  try {
    const res = await capture("tar", ["-xzOf", tgzPath, "package/package.json"])
    if (res.code === 0) deps = JSON.parse(res.out).dependencies ?? {}
  }
  catch { /* 读不到就不补依赖 */ }

  // ---- 1. 先补齐依赖（必须在解包之前，见下方注释） ----
  // ⚠️ 顺序很关键：`npm install` 会清理 node_modules 中「不在 package.json 里」的包。
  // 若先解包再装依赖，npm 会把手工放入的本库当成多余包删掉（实测踩过这个坑）。
  const missing = []
  for (const [name, range] of Object.entries(deps)) {
    if (!existsSync(join(nmDir, name, "package.json"))) missing.push(`${name}@${range}`)
  }

  if (missing.length > 0) {
    log.info(`补齐本库依赖：${missing.join(", ")}`)
    // --no-save：不写目标项目 package.json，保持「不侵入」的承诺
    const depCode = await run("npm", ["install", "--no-save", "--loglevel=error", ...missing], { cwd: targetDir })
    if (depCode !== 0) {
      log.err("依赖补齐失败。可手动执行后重试：")
      log.plain(`    cd "${targetDir}" && npm i --no-save ${missing.join(" ")}`)
      return false
    }
    log.ok("依赖已补齐")
  }
  else if (Object.keys(deps).length > 0) {
    log.ok("本库所需依赖在目标项目中已存在")
  }

  // ---- 2. 再解包本库（npm tarball 内层固定是 package/ 前缀） ----
  if (existsSync(destDir)) {
    rmSync(destDir, { recursive: true, force: true })
    log.info("已移除旧的 node_modules/sn-component-library")
  }
  mkdirSync(destDir, { recursive: true })
  const code = await run("tar", ["-xzf", tgzPath, "-C", destDir, "--strip-components=1"])
  if (code !== 0) {
    log.err("解包失败（tar 不可用？）")
    return false
  }
  if (!existsSync(join(destDir, "package.json"))) {
    log.err("解包结果异常：缺少 package.json")
    return false
  }
  log.ok(`已直投到 ${c.cyan(destDir)}`)

  log.warn("直投模式不改目标项目 package.json；对方再跑 npm install 时可能被覆盖，需重新投递。")
  return true
}

/**
 * 安装后在目标项目做轻量校验：优先 typecheck，其次 build。
 * 目的：确认对方拿到的是能用的包，而不是「装上就红」。
 */
export async function verifyInTarget(targetDir) {
  const pkg = readTargetPkg(targetDir)
  if (!pkg) {
    log.warn("读不到目标项目 package.json，跳过安装后校验")
    return true
  }

  const steps = []
  if (pkg.scripts?.typecheck) steps.push(["typecheck", "typecheck"])
  if (pkg.scripts?.build) steps.push(["build", "build"])

  if (steps.length === 0) {
    log.warn("目标项目既无 typecheck 也无 build 脚本，跳过安装后校验")
    return true
  }

  for (const [label, script] of steps) {
    log.info(`在目标项目执行 ${label}…`)
    const code = await run("npm", ["run", script], { cwd: targetDir, quiet: true })
    if (code !== 0) {
      log.warn(`目标项目 ${label} 未通过 —— 若因本库破坏性变更所致，请考虑 bump major 并通知使用方`)
      return false
    }
    log.ok(`目标项目 ${label} 通过`)
  }
  return true
}

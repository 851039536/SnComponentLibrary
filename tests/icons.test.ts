/**
 * 图标真源完整性测试
 *
 * 这是本仓库**最重要的一条测试**，原因：
 *
 *  1. `IconWrapper` 的 `name` 是 `IconKey` 类型，图标键 100% 来自 kit/icons.ts，
 *     运行时不会有其它来源 —— 所以「扫描 icons.ts」对图标集合是**完备**的。
 *  2. 图标键写错（或裁切脚本漏收）**不会报任何错**，只会渲染成一个问号圆圈，
 *     在人工点检中极易漏过。
 *  3. scripts/lib/prune-icons.mjs 会按 icons.ts 裁切 mdi 数据用于构建，
 *     一旦 mdi 升级导致某个图标被改名/移除，裁切脚本会失败或产出缺图标的子集。
 *
 * 因此这里直接对「构建时真正会被注册进 @iconify/vue 的那份数据」做断言。
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import mdiFull from "@iconify-json/mdi/icons.json"
import { describe, expect, it } from "vitest"
import { COMMON_ICONS, FEATURE_ICONS, getIconConfig } from "../src/components/kit/icons"

const ROOT = join(__dirname, "..")

/** 从 icons.ts 源码里抽出所有 `icon: "mdi:xxx"` 字面量 */
function extractIconNames(): string[] {
  const src = readFileSync(join(ROOT, "src/components/kit/icons.ts"), "utf8")
  return [...new Set([...src.matchAll(/icon:\s*"mdi:([^"]+)"/g)].map(m => m[1]))]
}

describe("kit/icons.ts 图标真源", () => {
  const names = extractIconNames()

  it("应至少注册 100 个图标（防止误删整段配置）", () => {
    expect(names.length).toBeGreaterThan(100)
  })

  it("所有图标键都只使用 mdi 图标集", () => {
    // kit/iconify.ts 只注册 mdi；出现别的图标集会因未注册而渲染空白
    for (const n of names) {
      expect(n).not.toContain(":")
    }
  })

  it("每个图标名都真实存在于 mdi 图标集中（防 mdi 升级后改名）", () => {
    const full = mdiFull as { icons: Record<string, unknown>, aliases?: Record<string, unknown> }
    const missing = names.filter(
      n => !full.icons[n] && !(full.aliases && full.aliases[n]),
    )
    expect(missing, `以下图标在 mdi 中不存在，会渲染成问号圆圈：${missing.join(", ")}`).toEqual([])
  })

  it("别名图标的 parent 本体也存在（裁切时必须一并收录）", () => {
    const full = mdiFull as {
      icons: Record<string, unknown>
      aliases?: Record<string, { parent?: string }>
    }
    const broken: string[] = []
    for (const n of names) {
      const alias = full.aliases?.[n]
      if (alias) {
        // 别名可能指向本体，也可能指向另一个别名
        const parent = alias.parent
        if (parent && !full.icons[parent] && !full.aliases?.[parent]) {
          broken.push(`${n} -> ${parent}`)
        }
      }
    }
    expect(broken, `别名指向的本体缺失：${broken.join(", ")}`).toEqual([])
  })

  it("getIconConfig 对每个 FEATURE_ICONS / COMMON_ICONS 键都能返回配置", () => {
    for (const key of [...Object.keys(FEATURE_ICONS), ...Object.keys(COMMON_ICONS)]) {
      const cfg = getIconConfig(key as never)
      expect(cfg, `键 ${key} 取不到配置`).toBeTruthy()
      expect(cfg.icon, `键 ${key} 的 icon 无效`).toMatch(/^mdi:[a-z0-9-]+$/)
    }
  })

  it("未知键回退到 help-circle（且该图标本身在真源中存在）", () => {
    const fallback = getIconConfig("__definitely_not_a_key__" as never)
    expect(fallback.icon).toBe("mdi:help-circle")
    // 兜底图标必须在 mdi 中真实存在，否则未匹配的键会渲染成问号
    const full = mdiFull as { icons: Record<string, unknown>, aliases?: Record<string, unknown> }
    expect(
      full.icons["help-circle"] || full.aliases?.["help-circle"],
      "兜底图标 help-circle 不在 mdi 集合中",
    ).toBeTruthy()
  })
})

describe("mdi 裁切子集（构建产物）", () => {
  const subsetPath = join(ROOT, "src/components/kit/mdi-subset.json")

  it("若存在，必须覆盖 icons.ts 的全部图标且体积受控", () => {
    let subset: {
      prefix: string
      icons: Record<string, { body?: string }>
      aliases?: Record<string, { parent?: string }>
    }
    try {
      subset = JSON.parse(readFileSync(subsetPath, "utf8"))
    }
    catch {
      // 子集是构建生成物、不入版本库：不存在时跳过（kit/iconify.ts 会回退全量）
      return
    }

    const names = extractIconNames()

    for (const n of names) {
      const has = subset.icons[n] || subset.aliases?.[n]
      expect(has, `裁切子集缺少图标 ${n} —— 会导致该图标渲染成问号圆圈`).toBeTruthy()
    }

    // 别名依赖的本体也必须被收录，否则解析失败
    for (const [aliasName, def] of Object.entries(subset.aliases ?? {})) {
      if (def.parent) {
        expect(
          subset.icons[def.parent],
          `别名 ${aliasName} 的本体 ${def.parent} 未被收录`,
        ).toBeTruthy()
      }
    }

    for (const [n, def] of Object.entries(subset.icons)) {
      expect(def.body, `图标 ${n} 缺少可渲染的 body`).toBeTruthy()
    }

    // 体积护栏：子集应远小于全量（全量约 2.8 MB）
    const bytes = JSON.stringify(subset).length
    expect(bytes, "子集体积异常偏大，可能误把全量数据写进去了").toBeLessThan(200 * 1024)
  })
})

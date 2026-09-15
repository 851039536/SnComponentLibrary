/**
 * 主题中性色阶梯不变量测试
 *
 * 背景：组件把 surface 系列当作「离背景由近到远」的单调阶梯使用
 * （surface → surface-light → surface-lighter → border）。
 * 实测曾出现两类错误，且**都不会报任何错、只表现为观感异常**：
 *
 *   1. 暗色下 surface-light(#232325) 比 surface(#2c2c2e) 更暗 —— 阶梯反转；
 *   2. 暗色下 border 与 surface-lighter 取了同一个值(#3a3a3c) —— 边框与 hover 底无法区分。
 *
 * 这类问题靠人工看演示页很难发现（尤其暗色），所以用测试固定住不变量。
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const THEME_TS = join(__dirname, "../src/components/kit/theme.ts")

/** 从 theme.ts 源码里解析出 LIGHT_VARS / DARK_VARS */
function parseVars(src: string, which: "LIGHT_VARS" | "DARK_VARS"): Record<string, string> {
  const start = src.indexOf(`const ${which}`)
  expect(start, `找不到 ${which}`).toBeGreaterThan(-1)
  // 从该处截到下一个顶层 const 或文件末
  const rest = src.slice(start)
  const endIdx = rest.indexOf("\n}");
  const block = rest.slice(0, endIdx)
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/"([a-z0-9-]+)":\s*"([^"]+)"/g)) {
    out[m[1]] = m[2]
  }
  return out
}

/** sRGB 相对亮度（WCAG 定义） */
function luminance(color: string): number {
  const hex = color.replace("#", "")
  expect(hex, `${color} 不是 #rrggbb 形式`).toMatch(/^[0-9a-f]{6}$/i)
  const rgb = [0, 2, 4].map(i => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = rgb.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

/** 两色的对比度（1..21）—— 用作「视觉可辨程度」的度量 */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const src = readFileSync(THEME_TS, "utf8")
const LIGHT = parseVars(src, "LIGHT_VARS")
const DARK = parseVars(src, "DARK_VARS")

/** 阶梯顺序：与背景由近到远 */
const LADDER = ["b3-theme-surface", "b3-theme-surface-light", "b3-theme-surface-lighter"]

describe("主题中性色阶梯", () => {
  it("明暗两套都注入完全相同的变量键（否则暗色下会有变量缺失）", () => {
    expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort())
  })

  it("每个值都是合法颜色或 rgb 分量串", () => {
    // 注意：*-rgb 变量存的是「逗号分隔的 rgb 分量」（如 "59, 130, 246"），
    // 供 rgba(var(--x), a) 消费，本身不是颜色字面量，需单独放行。
    const isComponents = (v: string) =>
      /^\d{1,3}(,\s*\d{1,3}){2}$/.test(v)
      && v.split(",").every(n => Number(n.trim()) >= 0 && Number(n.trim()) <= 255)
    for (const [set, vars] of [["LIGHT", LIGHT], ["DARK", DARK]] as const) {
      for (const [k, v] of Object.entries(vars)) {
        const ok = /^#[0-9a-f]{6}$/i.test(v) || /^rgba?\(/.test(v) || isComponents(v)
        expect(ok, `${set}.${k} = ${v} 不是合法颜色或 rgb 分量串`).toBe(true)
      }
    }
  })

  it("明色：surface 系列随「远离背景」单调变暗，且逐档可辨", () => {
    const bg = LIGHT["b3-theme-background"]
    const dists = LADDER.map(k => contrast(LIGHT[k], bg))
    for (let i = 1; i < dists.length; i++) {
      expect(
        dists[i],
        `明色 ${LADDER[i]} 未比 ${LADDER[i - 1]} 更远离背景（阶梯反转）`,
      ).toBeGreaterThan(dists[i - 1])
    }
    // 相邻档应肉眼可辨
    for (let i = 1; i < dists.length; i++) {
      expect(dists[i] - dists[i - 1], `明色第 ${i} 档与上一档过于接近`).toBeGreaterThan(0.01)
    }
  })

  it("暗色：surface 系列与明色**同序**（这是曾经的 bug 点）", () => {
    const bg = DARK["b3-theme-background"]
    const dists = LADDER.map(k => contrast(DARK[k], bg))
    for (let i = 1; i < dists.length; i++) {
      expect(
        dists[i],
        `暗色 ${LADDER[i]} 未比 ${LADDER[i - 1]} 更远离背景 —— 阶梯反转，`
        + "输入框/按下态会看起来比卡片底更「凹」",
      ).toBeGreaterThan(dists[i - 1])
    }
  })

  it("明暗两套的阶梯顺序必须一致", () => {
    const order = (vars: Record<string, string>) => {
      const bg = vars["b3-theme-background"]
      return [...LADDER].sort((a, b) => contrast(vars[a], bg) - contrast(vars[b], bg)).join("|")
    }
    expect(order(DARK), "暗色的层级顺序与明色不一致").toBe(order(LIGHT))
  })

  it("边框必须与 surface-lighter 可区分（暗色下曾取同值）", () => {
    for (const [name, vars] of [["明色", LIGHT], ["暗色", DARK]] as const) {
      const border = vars["b3-border-color"]
      const lighter = vars["b3-theme-surface-lighter"]
      expect(border, `${name} border 与 surface-lighter 取了相同值 ${border}`).not.toBe(lighter)
      expect(
        contrast(border, lighter),
        `${name} border 与 surface-lighter 太接近，边框会糊在 hover 底上`,
      ).toBeGreaterThan(1.03)
    }
  })

  it("正文文字对背景需达 WCAG AA（>= 4.5）", () => {
    expect(contrast(LIGHT["b3-theme-on-background"], LIGHT["b3-theme-background"])).toBeGreaterThanOrEqual(4.5)
    expect(contrast(DARK["b3-theme-on-background"], DARK["b3-theme-background"])).toBeGreaterThanOrEqual(4.5)
  })

  it("主色上的文字需达 WCAG AA（>= 4.5）", () => {
    expect(
      contrast(LIGHT["b3-theme-on-primary"], LIGHT["b3-theme-primary"]),
      "明色 on-primary 对 primary 对比度不足",
    ).toBeGreaterThanOrEqual(4.5)
    expect(
      contrast(DARK["b3-theme-on-primary"], DARK["b3-theme-primary"]),
      "暗色 on-primary 对 primary 对比度不足",
    ).toBeGreaterThanOrEqual(4.5)
  })

  it("background-rgb / primary-rgb 必须与对应色值一致（被 rgba() 消费）", () => {
    const hexToRgb = (hex: string) =>
      [0, 2, 4].map(i => Number.parseInt(hex.replace("#", "").slice(i, i + 2), 16)).join(", ")
    for (const [name, vars] of [["明色", LIGHT], ["暗色", DARK]] as const) {
      expect(
        vars["b3-theme-background-rgb"],
        `${name} background-rgb 与 background 不一致`,
      ).toBe(hexToRgb(vars["b3-theme-background"]))
      expect(
        vars["b3-theme-primary-rgb"],
        `${name} primary-rgb 与 primary 不一致`,
      ).toBe(hexToRgb(vars["b3-theme-primary"]))
    }
  })
})

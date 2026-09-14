/**
 * Button dense 修饰的契约测试
 *
 * 补这条测试的原因：`dense` 的注释写明「仅与 size="xsmall" 协同时生效，
 * 独立使用不产生任何效果」，但演示页此前**没有任何 dense 示例**，
 * 使用者极易误以为 `dense` 单独就能收紧按钮。
 *
 * 这里把该契约固定下来：CSS 选择器必须是 `.si-button--dense.si-button--xsmall`
 * 的组合（同特异性下需要同时具备两个类）。
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import Button from "../src/components/Button.vue"

const ROOT = join(__dirname, "..")

describe("Button —— dense 紧凑修饰", () => {
  it("dense 会与 xsmall 同时出现在 class 上", () => {
    const wrapper = mount(Button, {
      props: { size: "xsmall", dense: true },
      slots: { default: "紧凑" },
    })
    const cls = wrapper.find("button").classes()
    expect(cls).toContain("si-button--dense")
    expect(cls).toContain("si-button--xsmall")
  })

  it("dense 可与非 xsmall 档位共存于 DOM，但 CSS 上不生效（契约）", () => {
    const wrapper = mount(Button, {
      props: { size: "medium", dense: true },
      slots: { default: "对照" },
    })
    const cls = wrapper.find("button").classes()
    // 类仍会挂上（组件不做联动判断），生效与否完全由 CSS 选择器决定
    expect(cls).toContain("si-button--dense")
    expect(cls).toContain("si-button--medium")
    expect(cls).not.toContain("si-button--xsmall")
  })

  it("样式表中 dense 规则必须是 dense+xsmall 的组合选择器", () => {
    const scss = readFileSync(
      join(ROOT, "src/components/styles/Button.scss"),
      "utf8",
    )
    // 源码里应存在 &--dense.si-button--xsmall 这种组合嵌套
    expect(scss).toMatch(/&--dense\.si-button--xsmall/)
    // 不应存在「单独的 dense 规则」（否则会在所有尺寸上生效）
    expect(scss).not.toMatch(/&--dense\s*\{/)
  })

  it("dense 下 icon-only 尺寸收紧一档（22px → 20px）", () => {
    const scss = readFileSync(
      join(ROOT, "src/components/styles/Button.scss"),
      "utf8",
    )
    expect(scss).toMatch(/--button-size:\s*20px/)
  })
})

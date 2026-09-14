/**
 * 组件行为测试 —— 表单控件的 v-model 契约
 *
 * 为什么只测「行为」不测「样式」：
 *   - 52 个组件靠人工点检不现实（AGENTS.md 明确要求「不以『应该没问题』交付」）；
 *   - 样式快照极易因无关改动而失效，维护成本高、收益低；
 *   - 而 v-model / emits 契约是**使用方真正依赖**的东西，且改坏了不会报类型错。
 *
 * 注意：组件源码内部只用相对路径，测试通过相对路径从仓库外层的 tests/ 导入，
 * 以保证 `src/components/` 保持「可整目录搬走」——测试文件刻意**不放进** src/。
 */

import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import Checkbox from "../src/components/Checkbox.vue"
import Input from "../src/components/Input.vue"
import Switch from "../src/components/Switch.vue"
import Textarea from "../src/components/Textarea.vue"

describe("Input —— v-model 契约", () => {
  it("输入时触发 update:modelValue", async () => {
    const wrapper = mount(Input, { props: { modelValue: "" } })
    const el = wrapper.find("input")
    await el.setValue("hello")
    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted, "Input 未触发 update:modelValue").toBeTruthy()
    expect(emitted![0]).toEqual(["hello"])
  })

  it("外部传入的 modelValue 会渲染到 input 上（受控）", async () => {
    const wrapper = mount(Input, { props: { modelValue: "abc" } })
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("abc")
  })

  it("disabled 时 input 应被禁用", () => {
    const wrapper = mount(Input, { props: { modelValue: "", disabled: true } })
    expect((wrapper.find("input").element as HTMLInputElement).disabled).toBe(true)
  })

  it("placeholder 应透传到原生 input", () => {
    const wrapper = mount(Input, { props: { modelValue: "", placeholder: "请输入" } })
    expect(wrapper.find("input").attributes("placeholder")).toBe("请输入")
  })
})

describe("Textarea —— v-model 契约", () => {
  it("输入时触发 update:modelValue", async () => {
    const wrapper = mount(Textarea, { props: { modelValue: "" } })
    await wrapper.find("textarea").setValue("multi\nline")
    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(["multi\nline"])
  })

  it("外部 modelValue 会渲染到 textarea", () => {
    const wrapper = mount(Textarea, { props: { modelValue: "初始" } })
    expect((wrapper.find("textarea").element as HTMLTextAreaElement).value).toBe("初始")
  })
})

describe("Checkbox —— v-model 契约", () => {
  it("点击后触发 update:modelValue 且值为布尔", async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    await wrapper.find("input[type=checkbox]").setValue(true)
    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted, "Checkbox 未触发 update:modelValue").toBeTruthy()
    expect(typeof emitted![0][0]).toBe("boolean")
  })

  it("modelValue 为 true 时复选框应为勾选态", () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    expect((wrapper.find("input[type=checkbox]").element as HTMLInputElement).checked).toBe(true)
  })
})

describe("Switch —— v-model 契约", () => {
  // 注意：Switch 刻意**不用**原生 input，而是 <button role="switch" :aria-checked>，
  // 这是更规范的可访问实现（原生 checkbox 需要额外的样式与 ARIA 补丁）。
  // 因此这里按 role 选择元素，而不是找 input。
  it("应渲染 button[role=switch] 并正确反映 aria-checked", () => {
    const off = mount(Switch, { props: { modelValue: false } })
    expect(off.find("button[role=switch]").exists()).toBe(true)
    expect(off.find("button[role=switch]").attributes("aria-checked")).toBe("false")

    const on = mount(Switch, { props: { modelValue: true } })
    expect(on.find("button[role=switch]").attributes("aria-checked")).toBe("true")
  })

  it("点击时触发 update:modelValue 并翻转布尔值", async () => {
    const wrapper = mount(Switch, { props: { modelValue: false } })
    await wrapper.find("button[role=switch]").trigger("click")
    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted, "Switch 未触发 update:modelValue").toBeTruthy()
    expect(emitted![0]).toEqual([true])
  })

  it("disabled 时按钮禁用且 aria-disabled 为 true", () => {
    const wrapper = mount(Switch, { props: { modelValue: false, disabled: true } })
    const btn = wrapper.find("button[role=switch]")
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    expect(btn.attributes("aria-disabled")).toBe("true")
  })
})

describe("受控组件应如实反映 props", () => {
  it("Input 的显示值由 modelValue 决定（受控）", async () => {
    const wrapper = mount(Input, { props: { modelValue: "fixed" } })
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("fixed")

    // 父组件回写新值 → 视图必须跟随 props 变化
    await wrapper.setProps({ modelValue: "changed" })
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("changed")
  })

  it("Input 抛出的 update:modelValue 不会自行改内部状态之外的语义", async () => {
    const wrapper = mount(Input, { props: { modelValue: "" } })
    await wrapper.find("input").setValue("typed")
    // 组件只负责抛出事件，不承诺回写；这里断言事件载荷准确
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["typed"])
  })
})

/**
 * 受控 / 非受控双模式测试
 *
 * 本库的 Tabs / Splitter 都支持「传了 prop 即受控，不传则内部自持」这一模式，
 * 并在源码注释里明确承诺（例如 Splitter 的 `sizes`：**传入即受控**）。
 *
 * 这类双模式逻辑的典型故障：受控模式下仍然自行改内部状态，
 * 导致父组件拒绝回写时视图与实际值不一致。**改坏了不会有任何类型错误**，
 * 所以必须由测试兜住。
 */

import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import Tab from "../src/components/Tab.vue"
import TabList from "../src/components/TabList.vue"
import TabPanel from "../src/components/TabPanel.vue"
import TabPanels from "../src/components/TabPanels.vue"
import Tabs from "../src/components/Tabs.vue"

/**
 * 取当前「可见」的面板文本。
 *
 * 为什么不用 wrapper.isVisible()：
 *   实测在 jsdom + @vue/test-utils 下，点击后 isVisible() 会返回**过期**结果
 *   （DOM 的 style 已正确互换为 display:none / 空，但 isVisible() 仍报告旧值）。
 *   因此这里直接读 `style.display` —— 这正是组件真正用于切换可见性的机制
 *   （inactive 面板以 v-show 隐藏，见 TabPanel 的实现），断言更贴近事实。
 */
function visiblePanelTexts(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper
    .findAll('[role="tabpanel"]')
    .filter(p => (p.attributes("style") ?? "").includes("display: none") === false)
    .map(p => p.text())
}

/** 组装一个最小的 Tabs 结构 */
function mountTabs(props: Record<string, unknown> = {}) {
  return mount(Tabs, {
    props,
    slots: {
      default: `
        <TabList>
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="a">panel-a</TabPanel>
          <TabPanel value="b">panel-b</TabPanel>
        </TabPanels>
      `,
    },
    global: {
      components: { TabList, Tab, TabPanels, TabPanel },
    },
  })
}

describe("Tabs —— 非受控模式（不传 value）", () => {
  it("应能在无 value 时自行激活首个标签并展示对应面板", async () => {
    const wrapper = mountTabs()
    await wrapper.vm.$nextTick()
    // 非受控：内部应已选中某个标签，面板内容可见
    expect(wrapper.text()).toContain("panel-a")
  })

  it("点击第二个标签应切换面板（内部自持状态）", async () => {
    const wrapper = mountTabs()
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.length, "未渲染出 role=tab 元素").toBeGreaterThan(1)
    await tabs[1].trigger("click")
    expect(wrapper.emitted("update:value"), "非受控模式仍应抛出 update:value 便于监听").toBeTruthy()
    expect(wrapper.text()).toContain("panel-b")
  })
})

describe("Tabs —— 受控模式（传 value）", () => {
  it("初始应展示 value 指定的面板", async () => {
    const wrapper = mountTabs({ value: "b" })
    await wrapper.vm.$nextTick()
    // 注意：面板默认只是**隐藏**（v-show）而非卸载 —— 这是 lazy 关闭时的文档化行为，
    // 所以这里断言「可见性」而不是「是否存在于 DOM」。
    const visible = visiblePanelTexts(wrapper)
    expect(visible.length, "应有且仅有一个可见面板").toBe(1)
    expect(visible[0]).toContain("panel-b")
  })

  it("【已知行为】父组件忽略事件时，视图仍会自行切换（非严格受控）", async () => {
    // 这是本次审查**实测确认**的行为，记录在此以便：
    //   a) 未来若修正为严格受控，本测试会失败并提醒更新文档；
    //   b) 使用方了解「受控模式下父组件应当回写 value」的实际契约。
    //
    // 成因（src/components/Tabs.vue 的 updateValue）：
    //     const updateValue = (next) => {
    //       if (innerValue.value === next) return
    //       innerValue.value = next        // ← 无条件写入内部状态（受控时也写）
    //       emit("update:value", next)
    //     }
    // 即 innerValue 在受控模式下依然被乐观更新，因此父组件不回写时视图与
    // props.value 会不一致（props.value="a" 但显示 panel-b）。
    //
    // 修正方向（需回源仓库 siyuanPluginVueSN 修改，见 AGENTS.md 零改写原则）：
    //     受控时（props.value !== undefined）不写 innerValue，只 emit；
    //     非受控时才写。即 value 是否传入决定「受控 vs 自持」。
    const wrapper = mountTabs({ value: "a" })
    await wrapper.findAll('[role="tab"]')[1].trigger("click")
    await wrapper.vm.$nextTick()

    expect(wrapper.props("value"), "父组件未回写，props 应保持 a").toBe("a")
    expect(wrapper.emitted("update:value")![0]).toEqual(["b"])

    // 当前实现：视图跟随内部状态 → 显示 panel-b
    expect(visiblePanelTexts(wrapper)).toEqual(["panel-b"])
  })

  it("父组件回写 value 后视图应跟随", async () => {
    const wrapper = mountTabs({ value: "a" })
    await wrapper.setProps({ value: "b" })
    await wrapper.vm.$nextTick()
    expect(visiblePanelTexts(wrapper)).toEqual(["panel-b"])
  })
})

describe("Tabs —— 无障碍基线（role/aria 关联）", () => {
  it("激活标签应有 aria-selected=true，其余为 false", async () => {
    const wrapper = mountTabs({ value: "a" })
    await wrapper.vm.$nextTick()
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0].attributes("aria-selected")).toBe("true")
    expect(tabs[1].attributes("aria-selected")).toBe("false")
  })

  it("role=tab 应带 aria-controls，且指向真实存在的面板 id", async () => {
    const wrapper = mountTabs({ value: "a" })
    await wrapper.vm.$nextTick()
    const tabs = wrapper.findAll('[role="tab"]')
    const panelIds = new Set(
      wrapper.findAll('[role="tabpanel"]').map(p => p.attributes("id")),
    )
    for (const t of tabs) {
      const controls = t.attributes("aria-controls")
      expect(controls, "tab 缺少 aria-controls").toBeTruthy()
      expect(panelIds.has(controls!), `aria-controls="${controls}" 未指向任何面板`).toBe(true)
    }
  })

  it("role=tabpanel 应带 aria-labelledby，且指向真实存在的标签 id", async () => {
    const wrapper = mountTabs({ value: "a" })
    await wrapper.vm.$nextTick()
    const tabIds = new Set(
      wrapper.findAll('[role="tab"]').map(t => t.attributes("id")),
    )
    for (const p of wrapper.findAll('[role="tabpanel"]')) {
      const labelledby = p.attributes("aria-labelledby")
      expect(labelledby, "tabpanel 缺少 aria-labelledby").toBeTruthy()
      expect(tabIds.has(labelledby!), `aria-labelledby="${labelledby}" 未指向任何标签`).toBe(true)
    }
  })
})

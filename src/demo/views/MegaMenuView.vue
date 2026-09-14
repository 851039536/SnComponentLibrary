<script setup lang="ts">
// 导航 · 超级菜单：MegaMenu
// 与 TieredMenu 的区别：展开后是多列面板，常配 header: true 做分组标题。
import { ref } from "vue"
import MegaMenu from "../../components/MegaMenu.vue"
import DemoSection from "../components/DemoSection.vue"

const last = ref("（尚未点击）")

const model = [
  {
    key: "products",
    label: "产品",
    items: [
      {
        key: "g1",
        label: "效率工具",
        header: true,
        items: [
          { key: "p1", label: "文档编辑器", description: "富文本与 Markdown", command: () => (last.value = "文档编辑器") },
          { key: "p2", label: "知识库", description: "双链笔记", command: () => (last.value = "知识库") },
          { key: "p3", label: "思维导图", description: "结构化梳理", command: () => (last.value = "思维导图") },
        ],
      },
      {
        key: "g2",
        label: "开发工具",
        header: true,
        items: [
          { key: "p4", label: "接口调试", description: "REST / GraphQL", command: () => (last.value = "接口调试") },
          { key: "p5", label: "数据看板", description: "可视化报表", command: () => (last.value = "数据看板") },
        ],
      },
    ],
  },
  {
    key: "resources",
    label: "资源",
    items: [
      {
        key: "g3",
        label: "学习",
        header: true,
        items: [
          { key: "r1", label: "快速上手", command: () => (last.value = "快速上手") },
          { key: "r2", label: "组件文档", command: () => (last.value = "组件文档") },
          { key: "r3", label: "示例代码", command: () => (last.value = "示例代码") },
        ],
      },
      {
        key: "g4",
        label: "支持",
        header: true,
        items: [
          { key: "r4", label: "常见问题", command: () => (last.value = "常见问题") },
          { key: "r5", label: "提交反馈", command: () => (last.value = "提交反馈") },
        ],
      },
    ],
  },
  {
    key: "pricing",
    label: "价格",
    command: () => (last.value = "价格（无子项直接触发）"),
  },
]
</script>

<template>
  <div class="view">
    <DemoSection
      name="超级菜单"
      en="MegaMenu"
      desc="展开后是多列面板。把某项设为 header: true，它就成为该列的标题，其 items 作为该列内容。"
    >
      <div class="bar">
        <MegaMenu :model="model" />
      </div>
      <p class="hint">最近点击：<strong>{{ last }}</strong></p>
    </DemoSection>

    <DemoSection
      name="垂直布局"
      en="MegaMenu · orientation"
      divided
      desc="orientation=&quot;vertical&quot; 时菜单竖向排列，面板从侧面展开，适合侧边导航。"
    >
      <div class="bar bar--vertical">
        <MegaMenu :model="model" orientation="vertical" />
      </div>
    </DemoSection>

    <DemoSection name="禁用" en="MegaMenu · disabled" divided>
      <div class="bar">
        <MegaMenu :model="model" disabled />
      </div>
    </DemoSection>

    <DemoSection name="说明" en="用法要点" divided>
      <ul class="tips">
        <li><code>header: true</code> 的项本身不可点击，只作为列标题。</li>
        <li><code>description</code> 在该项下方渲染一行小字说明。</li>
        <li><code>openOnHover</code> 可改为悬停展开（默认点击展开）。</li>
        <li>面板列宽由 <code>columnMinWidth</code> 控制。</li>
      </ul>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.bar {
  display: flex;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--b3-border-color, #e0deda);
  border-radius: 8px;
  background: var(--b3-theme-surface, #f7f7f5);
}
.bar--vertical { min-height: 300px; }
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
.tips {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.9;
}
code {
  background: var(--b3-theme-surface-light, #efefec);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
}
</style>

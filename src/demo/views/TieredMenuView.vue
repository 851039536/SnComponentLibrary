<script setup lang="ts">
// 导航 · 多级菜单：TieredMenu
// model 是树形结构：{ key, label, icon?, items?, separator?, disabled?, command? }
import { ref } from "vue"
import Button from "../../components/Button.vue"
import TieredMenu from "../../components/TieredMenu.vue"
import DemoSection from "../components/DemoSection.vue"

const lastCommand = ref("（尚未点击任何菜单项）")

const model = [
  {
    key: "file",
    label: "文件",
    icon: "save" as const,
    items: [
      { key: "new", label: "新建", icon: "plus" as const, command: () => (lastCommand.value = "新建") },
      { key: "open", label: "打开", icon: "folder-open-outline" as const, command: () => (lastCommand.value = "打开") },
      { key: "sep1", separator: true },
      {
        key: "recent",
        label: "最近打开",
        items: [
          { key: "r1", label: "报告.docx", command: () => (lastCommand.value = "最近打开 → 报告.docx") },
          { key: "r2", label: "笔记.md", command: () => (lastCommand.value = "最近打开 → 笔记.md") },
        ],
      },
      { key: "sep2", separator: true },
      { key: "save", label: "保存", icon: "save" as const, command: () => (lastCommand.value = "保存") },
      { key: "disabled", label: "导出（暂不可用）", disabled: true },
    ],
  },
  {
    key: "edit",
    label: "编辑",
    icon: "edit" as const,
    items: [
      { key: "copy", label: "复制", icon: "copy" as const, command: () => (lastCommand.value = "复制") },
      { key: "paste", label: "粘贴", command: () => (lastCommand.value = "粘贴") },
      { key: "delete", label: "删除", icon: "delete" as const, command: () => (lastCommand.value = "删除") },
    ],
  },
  {
    key: "help",
    label: "帮助",
    command: () => (lastCommand.value = "帮助（无子项，直接触发）"),
  },
]
</script>

<template>
  <div class="view">
    <DemoSection
      name="多级菜单"
      en="TieredMenu"
      desc="model 是树形结构，items 嵌套即为子菜单。菜单项支持 icon / separator / disabled / command。"
    >
      <div class="bar">
        <TieredMenu :model="model" />
      </div>
      <p class="hint">
        最近点击：<strong>{{ lastCommand }}</strong>
      </p>
    </DemoSection>

    <DemoSection
      name="弹出模式"
      en="TieredMenu · popup"
      divided
      desc="popup 模式下菜单不常驻，需要自己控制显隐（点右侧按钮打开）。"
    >
      <div class="bar">
        <TieredMenu :model="model" popup />
      </div>
      <p class="hint">
        popup 模式适合「右键菜单 / 更多操作」按钮。子菜单方向由 submenuSide 控制（left / right / auto）。
      </p>
    </DemoSection>

    <DemoSection name="禁用" en="TieredMenu · disabled" divided>
      <div class="bar">
        <TieredMenu :model="model" disabled />
      </div>
      <p class="hint">整个菜单禁用后不响应鼠标与键盘。</p>
    </DemoSection>

    <DemoSection name="说明" en="用法要点" divided>
      <ul class="tips">
        <li><code>key</code> 必须唯一，用于内部索引与键盘导航。</li>
        <li><code>separator: true</code> 的项只需 key，会渲染成分隔线。</li>
        <li>点击叶子项会调用它的 <code>command(item, event)</code>。</li>
        <li>键盘：方向键在层级间移动，Esc 关闭当前层。</li>
      </ul>
      <Button size="small" text @click="lastCommand = '（尚未点击任何菜单项）'">重置记录</Button>
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
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
.tips {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.9;
  color: var(--b3-theme-on-background, #1a1a1a);
}
code {
  background: var(--b3-theme-surface-light, #efefec);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
}
</style>

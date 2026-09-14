<script setup lang="ts">
// 数据展示 · 可折叠面板：Panel
import { ref } from "vue"
import Button from "../../components/Button.vue"
import Panel from "../../components/Panel.vue"
import DemoSection from "../components/DemoSection.vue"

const collapsed = ref(false)
const open = ref(true)
</script>

<template>
  <div class="view">
    <DemoSection
      name="可折叠面板"
      en="Panel"
      desc="toggleable 开启后标题栏出现折叠箭头（图标来自 kit/icons.ts）。collapsed 可用 v-model 受控。"
    >
      <Panel header="基础面板" toggleable>
        <p>面板内容：默认展开，点击标题栏可折叠。</p>
      </Panel>

      <Panel v-model:collapsed="collapsed" header="受控折叠状态" toggleable>
        <p>当前折叠状态：{{ collapsed ? "已折叠" : "已展开" }}</p>
        <Button size="small" outlined @click="collapsed = !collapsed">
          从外部切换
        </Button>
      </Panel>

      <Panel v-model:collapsed="open" header="折叠时也保留标题" toggleable>
        <p>内容区域。</p>
      </Panel>

      <Panel header="不可折叠（无 toggleable）">
        <p>没有 toggleable 时，标题栏不会有折叠箭头。</p>
      </Panel>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 16px; }
</style>

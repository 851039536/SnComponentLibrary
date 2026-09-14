<script setup lang="ts">
// 选择器 · Listbox：单选 / 多选 / 复选样式 / 可筛选
import { ref } from "vue"
import Listbox from "../../components/Listbox.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const single = ref("js")
const multi = ref<string[]>(["js", "ts"])
const checked = ref<string[]>(["js"])

const langs = [
  { label: "JavaScript", value: "js" },
  { label: "TypeScript", value: "ts" },
  { label: "Rust", value: "rs" },
  { label: "Go", value: "go" },
  { label: "Python（暂不支持）", value: "py", disabled: true },
]
</script>

<template>
  <div class="view">
    <DemoSection
      name="列表选择"
      en="Listbox"
      desc="直接把选项平铺在页面里（不弹层），适合选项不多、需要一览无余的场景。multiple 开启多选。"
    >
      <div class="grid">
        <Listbox v-model="single" :options="langs" label="单选" size="small" />
        <Listbox v-model="multi" :options="langs" label="多选" size="small" multiple />
        <Listbox
          v-model="checked"
          :options="langs"
          label="复选样式 + 可筛选"
          size="small"
          multiple
          checkbox
          filter
          filter-placeholder="搜索语言…"
        />
      </div>
    </DemoSection>

    <DemoSection name="状态" en="Listbox · state" divided>
      <DemoRow align="top" gap="large">
        <Listbox :options="langs" label="禁用" size="small" disabled />
        <Listbox :options="langs" label="错误态" size="small" error="请至少选择一项" />
        <Listbox
          :options="[]"
          label="空列表"
          size="small"
          empty-text="暂无数据"
        />
      </DemoRow>
      <p class="hint">
        单选：{{ single }} · 多选：{{ multi.join("、") || "（无）" }}
      </p>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  align-items: start;
}
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
</style>

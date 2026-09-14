<script setup lang="ts">
// 选择器 · Select：选项分组 / 可搜索 / 清除 / 尺寸 / 状态
import { ref } from "vue"
import Select from "../../components/Select.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const plan = ref<"free" | "pro">("pro")
const city = ref<string | null>(null)
const multi = ref<string | null>("a")
const disabledVal = ref("x")

const planOptions = [
  { label: "免费版", value: "free" },
  { label: "专业版", value: "pro" },
  { label: "企业版（停售）", value: "enterprise", disabled: true },
]

// 分组选项：必须带 isGroup: true，子项放在 options 里
// （isGroup 用 as const 收窄成字面量 true，否则会被推断成 boolean 而类型不匹配）
const cityOptions = [
  {
    isGroup: true as const,
    label: "华东",
    options: [
      { label: "上海", value: "sh" },
      { label: "杭州", value: "hz" },
      { label: "南京", value: "nj" },
    ],
  },
  {
    isGroup: true as const,
    label: "华南",
    options: [
      { label: "广州", value: "gz" },
      { label: "深圳", value: "sz" },
    ],
  },
]

const flatOptions = [
  { label: "选项 A", value: "a" },
  { label: "选项 B", value: "b" },
  { label: "选项 C", value: "c" },
]
</script>

<template>
  <div class="view">
    <DemoSection
      name="下拉选择"
      en="Select"
      desc="下拉是相对定位（非传送门挂 body），父容器 overflow:hidden 会把它裁掉。"
    >
      <div class="grid">
        <Select v-model="plan" :options="planOptions" label="套餐" size="small" placeholder="请选择" />
        <Select
          v-model="city"
          :options="cityOptions"
          label="城市（分组 + 可搜索）"
          size="small"
          filterable
          clearable
          placeholder="请选择城市"
        />
        <Select
          v-model="multi"
          :options="flatOptions"
          label="可清除"
          size="small"
          clearable
        />
        <Select
          v-model="disabledVal"
          :options="flatOptions"
          label="禁用"
          size="small"
          disabled
        />
        <Select
          :options="flatOptions"
          label="错误态"
          size="small"
          error="该项必填"
        />
        <Select
          :options="[]"
          label="空选项"
          size="small"
          empty-text="没有可选项"
        />
      </div>
    </DemoSection>

    <DemoSection name="尺寸档位" en="Select · size" divided>
      <DemoRow align="top">
        <Select size="xsmall" :options="flatOptions" placeholder="xsmall" />
        <Select size="small" :options="flatOptions" placeholder="small" />
        <Select size="medium" :options="flatOptions" placeholder="medium" />
        <Select size="large" :options="flatOptions" placeholder="large" />
      </DemoRow>
      <p class="hint">当前套餐：{{ plan }} · 城市：{{ city ?? "未选" }}</p>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  align-items: start;
}
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
</style>

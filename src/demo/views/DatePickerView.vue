<script setup lang="ts">
// 选择器 · 日期选择：DatePicker
import { ref } from "vue"
import DatePicker from "../../components/DatePicker.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const single = ref<Date | null>(new Date())
const range = ref<Date[] | null>(null)
const manual = ref<Date | null>(null)
// value-format 模式下模型值是字符串
const asString = ref<string>("2026-09-12")
const noBar = ref<Date | null>(null)
const limited = ref<Date | null>(null)

// 禁用：过去 3 天与未来 3 天
const today = new Date()
const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3)
const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)
</script>

<template>
  <div class="view">
    <DemoSection
      name="日期选择"
      en="DatePicker"
      desc="下拉为相对定位（非传送门），父容器 overflow:hidden 会裁掉面板。dateFormat 默认 yy-mm-dd。"
    >
      <div class="grid">
        <DatePicker v-model="single" label="单选" size="small" show-button-bar />
        <DatePicker v-model="range" label="范围选择" size="small" selection-mode="range" />
        <DatePicker
          v-model="manual"
          label="允许手输"
          size="small"
          manual-input
          show-button-bar
        />
        <DatePicker
          v-model="asString"
          label="值为字符串"
          size="small"
          value-format
          date-format="yy-mm-dd"
        />
        <DatePicker v-model="noBar" label="不显示按钮栏" size="small" :show-button-bar="false" />
        <DatePicker
          v-model="limited"
          label="限定可选范围"
          size="small"
          :min-date="minDate"
          :max-date="maxDate"
          show-button-bar
        />
      </div>
    </DemoSection>

    <DemoSection name="尺寸与状态" en="DatePicker · size / state" divided>
      <DemoRow align="top">
        <DatePicker size="xsmall" placeholder="xsmall" />
        <DatePicker size="small" placeholder="small" />
        <DatePicker size="medium" placeholder="medium" />
        <DatePicker size="large" placeholder="large" />
      </DemoRow>
      <DemoRow align="top">
        <DatePicker label="禁用" size="small" disabled placeholder="不可选" />
        <DatePicker label="错误态" size="small" error="请选择有效日期" />
        <DatePicker label="带说明" size="small" hint="格式为 年-月-日" />
      </DemoRow>
      <p class="hint">
        单选值：{{ single ? single.toLocaleDateString() : "未选" }} ·
        范围：{{ range && range.length === 2 ? `${range[0].toLocaleDateString()} ~ ${range[1].toLocaleDateString()}` : "未选" }}
      </p>
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

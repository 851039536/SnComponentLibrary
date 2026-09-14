<script setup lang="ts">
// 数据展示 · 图表：Chart
// ⚠️ 图表是可选依赖：需要另外安装 chart.js 与 vue-chartjs。
//    本页从 npm 包引入时用 "sn-component-library/chart"；这里演示页直连源码。
import { ref } from "vue"
import Button from "../../components/Button.vue"
import Chart from "../../components/Chart.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

// 注意：data 是**扁平数组** [{ label, value }]，不是 chart.js 的 { labels, datasets }
const barData = [
  { label: "一月", value: 12 },
  { label: "二月", value: 19 },
  { label: "三月", value: 8 },
  { label: "四月", value: 15 },
  { label: "五月", value: 22 },
]

const pieData = [
  { label: "文档", value: 40, color: "#3b82f6" },
  { label: "图片", value: 35, color: "#10b981" },
  { label: "其它", value: 25, color: "#f59e0b" },
]

const lineData = [
  { label: "周一", value: 5 },
  { label: "周二", value: 9 },
  { label: "周三", value: 7 },
  { label: "周四", value: 12 },
  { label: "周五", value: 18 },
]

const type = ref<"bar" | "line" | "area" | "pie" | "doughnut">("bar")
const current = ref(barData)

function setType(t: typeof type.value) {
  type.value = t
  current.value = t === "pie" || t === "doughnut" ? pieData : t === "line" || t === "area" ? lineData : barData
}
</script>

<template>
  <div class="view">
    <DemoSection
      name="图表"
      en="Chart"
      desc="data 是扁平数组；type 支持 bar / line / area / pie / doughnut。必须放在有显式高度的容器里，否则高度塌陷。"
    >
      <DemoRow>
        <Button
          v-for="t in ['bar', 'line', 'area', 'pie', 'doughnut'] as const"
          :key="t"
          :outlined="type !== t"
          size="small"
          @click="setType(t)"
        >
          {{ t }}
        </Button>
      </DemoRow>

      <div class="chart-box">
        <Chart :type="type" :data="current" title="月度统计" />
      </div>
    </DemoSection>

    <DemoSection name="尺寸与状态" en="Chart · size / loading / empty" divided>
      <DemoRow gap="large" align="top">
        <div class="chart-box chart-box--small">
          <Chart type="bar" :data="barData" size="small" />
        </div>
        <div class="chart-box chart-box--small">
          <Chart type="bar" :data="barData" size="small" loading />
        </div>
        <div class="chart-box chart-box--small">
          <Chart type="bar" :data="[]" size="small" empty-text="暂无数据" />
        </div>
      </DemoRow>
      <p class="hint">
        图表默认跟随明暗主题（theme="auto"）；切换左上角暗色按钮可看到网格与文字颜色变化。
      </p>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.chart-box {
  height: 280px;
  padding: 8px 0;
}
.chart-box--small { height: 180px; width: 240px; }
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
</style>

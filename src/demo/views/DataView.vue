<script setup lang="ts">
// 数据展示：ProgressBar / MeterGroup / Timeline / Loader
import { computed, ref } from "vue"
import Loader from "../../components/Loader.vue"
import MeterGroup from "../../components/MeterGroup.vue"
import ProgressBar from "../../components/ProgressBar.vue"
import Slider from "../../components/Slider.vue"
import Timeline from "../../components/Timeline.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const progress = ref(45)
const meterValue = [
  { label: "文档", value: 40, color: "#3b82f6" },
  { label: "图片", value: 30, color: "#10b981" },
  { label: "其它", value: 20, color: "#f59e0b" },
]

const verticalMeter = [
  { label: "CPU", value: 72, color: "#ef4444" },
  { label: "内存", value: 48, color: "#3b82f6" },
]

const timelineEvents = [
  { title: "组件库初始化", time: "2026-09-12 10:00", desc: "从源仓库整体迁移" },
  { title: "接入主题变量", time: "2026-09-12 11:30", desc: "支持明暗自动切换" },
  { title: "完成冒烟自测", time: "2026-09-12 15:20", desc: "52 个组件逐一验证" },
]

const horizontalEvents = [
  { title: "设计" },
  { title: "开发" },
  { title: "测试" },
  { title: "发布" },
]

const indeterminate = computed(() => progress.value <= 0)
</script>

<template>
  <div class="view">
    <DemoSection
      name="进度条"
      en="ProgressBar"
      desc="value 超出 0~100 会被钳制而非溢出容器；mode=&quot;indeterminate&quot; 时忽略 value。"
    >
      <ProgressBar :value="progress" show-value />
      <ProgressBar :value="progress" size="large" show-value />
      <ProgressBar :value="progress" size="xsmall" />
      <ProgressBar :value="100" show-value />
      <ProgressBar mode="indeterminate" indeterminate-label="正在处理…" />
      <DemoRow>
        <Slider v-model="progress" :min="0" :max="100" show-value class="grow" />
      </DemoRow>
      <p class="hint">
        拖动滑块联动上方进度条。当前 {{ progress }}%
        <template v-if="indeterminate">（value 为 0 时上方不定态条生效）</template>
      </p>
    </DemoSection>

    <DemoSection
      name="度量组"
      en="MeterGroup"
      divided
      desc="每段的长度 =（该项 value - min）/（max - min），即各段各自映射到整个区间。"
    >
      <MeterGroup :value="meterValue" :max="100" />
      <MeterGroup :value="meterValue" :max="100" label-position="start" />
      <DemoRow>
        <MeterGroup :value="verticalMeter" :max="100" orientation="vertical" />
      </DemoRow>
    </DemoSection>

    <DemoSection name="时间线" en="Timeline" divided desc="内容通过 content 作用域插槽自定义。">
      <Timeline :value="timelineEvents">
        <template #content="slotProps">
          <div class="tl">
            <strong class="tl__title">{{ slotProps.item.title }}</strong>
            <span class="tl__time">{{ slotProps.item.time }}</span>
            <p class="tl__desc">{{ slotProps.item.desc }}</p>
          </div>
        </template>
      </Timeline>
      <Timeline :value="horizontalEvents" layout="horizontal" />
    </DemoSection>

    <DemoSection
      name="加载中"
      en="Loader"
      divided
      desc="没有 props 且高度 100% —— 父容器必须给显式高度，否则高度为 0 看不见。"
    >
      <DemoRow gap="large">
        <div class="loader-box">
          <Loader />
        </div>
        <div class="loader-box loader-box--tall">
          <Loader />
        </div>
      </DemoRow>
      <p class="hint">上面两个盒子分别高 60px / 120px，Loader 自动撑满。</p>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
.grow { flex: 1; }
.tl__title { font-size: 13px; display: block; }
.tl__time { font-size: 11px; color: var(--b3-theme-secondary, #8a8a8a); }
.tl__desc { margin: 4px 0 0; font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); }
.loader-box {
  height: 60px;
  width: 200px;
  border: 1px dashed var(--b3-border-color, #e0deda);
  border-radius: 8px;
}
.loader-box--tall { height: 120px; }
</style>

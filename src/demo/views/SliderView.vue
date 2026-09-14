<script setup lang="ts">
// 表单 · 滑块与颜色：Slider / ColorField
import { ref } from "vue"
import ColorField from "../../components/ColorField.vue"
import Slider from "../../components/Slider.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const volume = ref(60)
const opacity = ref(80)
const price = ref(250)
const disabled = ref(40)
const hex = ref("#3b82f6")
const presetColors = ["#3b82f6", "#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#1a1a1a"]
</script>

<template>
  <div class="view">
    <DemoSection name="滑块" en="Slider" desc="showValue 显示当前值，showMinMax 在轨道下方标出区间。">
      <Slider v-model="volume" label="音量" show-value show-min-max :min="0" :max="100" />
      <Slider
        v-model="price"
        label="预算（自定义格式化）"
        show-value
        :min="0"
        :max="1000"
        :step="50"
        :format-value="(v: number) => `¥${v}`"
      />
      <Slider v-model="opacity" label="透明度" show-value :min="0" :max="100" />
      <Slider v-model="disabled" label="禁用" disabled show-value />
      <Slider :model-value="70" label="只读（可聚焦不可拖动）" readonly show-value />
      <Slider label="错误态" error="数值超出范围" :model-value="10" show-value />
    </DemoSection>

    <DemoSection
      name="颜色选择"
      en="ColorField"
      divided
      desc="原生取色器 + 文本输入双通道，值始终是 hex 字符串。"
    >
      <DemoRow align="top" gap="large">
        <ColorField v-model="hex" placeholder="#000000" />
        <div class="swatches">
          <button
            v-for="c in presetColors"
            :key="c"
            type="button"
            class="swatch"
            :style="{ background: c }"
            :title="c"
            @click="hex = c"
          />
        </div>
      </DemoRow>
      <div class="preview" :style="{ background: hex }">
        <span class="preview__text">预览区 · {{ hex }}</span>
      </div>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.swatches { display: flex; gap: 6px; flex-wrap: wrap; }
.swatch {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--b3-border-color, #e0deda);
  cursor: pointer;
  padding: 0;
}
.preview {
  height: 72px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  border: 1px solid var(--b3-border-color, #e0deda);
  transition: background 0.2s;
}
.preview__text {
  font-size: 12px;
  font-family: ui-monospace, monospace;
  background: rgba(255, 255, 255, 0.86);
  padding: 3px 8px;
  border-radius: 5px;
  color: #1a1a1a;
}
</style>

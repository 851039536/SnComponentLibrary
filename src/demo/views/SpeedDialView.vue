<script setup lang="ts">
// 导航 · 悬浮操作：SpeedDial
// model 是动作列表：[{ key, label, icon?, severity?, onClick? }]
import { ref } from "vue"
import SpeedDial from "../../components/SpeedDial.vue"
import DemoSection from "../components/DemoSection.vue"

const last = ref("（尚未点击）")

const model = [
  {
    key: "add",
    label: "新建",
    icon: "plus" as const,
    onClick: () => (last.value = "新建"),
  },
  {
    key: "upload",
    label: "上传",
    icon: "upload" as const,
    onClick: () => (last.value = "上传"),
  },
  {
    key: "copy",
    label: "复制",
    icon: "copy" as const,
    onClick: () => (last.value = "复制"),
  },
  {
    key: "delete",
    label: "删除",
    icon: "delete" as const,
    severity: "danger" as const,
    onClick: () => (last.value = "删除"),
  },
  {
    key: "disabled",
    label: "禁用项",
    icon: "settings" as const,
    disabled: true,
    onClick: () => (last.value = "不该被点到"),
  },
]

const controlled = ref(false)
const downModel = model.map((m) => ({ ...m, onClick: () => (last.value = `[向下] ${m.label}`) }))
</script>

<template>
  <div class="view">
    <DemoSection
      name="悬浮操作"
      en="SpeedDial"
      desc="点击主按钮后环形展开一组动作。默认向上展开（direction=&quot;up&quot;），可改 down / left / right。"
    >
      <div class="stage">
        <SpeedDial :model="model" direction="up" />
      </div>
      <p class="hint">最近点击：<strong>{{ last }}</strong></p>
    </DemoSection>

    <DemoSection name="展开方向" en="SpeedDial · direction" divided>
      <div class="stage stage--row">
        <SpeedDial :model="downModel" direction="right" />
        <SpeedDial :model="downModel" direction="left" />
      </div>
      <p class="hint">
        direction 取 up / down / left / right；实际排布是围绕主按钮的扇形（由 radius 控制半径）。
      </p>
    </DemoSection>

    <DemoSection name="受控显隐" en="SpeedDial · v-model:visible" divided>
      <div class="stage">
        <SpeedDial v-model:visible="controlled" :model="model" direction="up" />
      </div>
      <p class="hint">
        当前状态：{{ controlled ? "已展开" : "已收起" }}。
        可用 v-model:visible 从外部控制，组件也会派发 show / hide / select 事件。
      </p>
    </DemoSection>

    <DemoSection name="禁用" en="SpeedDial · disabled" divided>
      <div class="stage">
        <SpeedDial :model="model" direction="up" disabled />
      </div>
      <p class="hint">禁用后主按钮不响应点击；单条动作也可各自 disabled。</p>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.stage {
  height: 260px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--b3-border-color, #e0deda);
  border-radius: 10px;
  background: var(--b3-theme-surface, #f7f7f5);
  /* 展开时按钮会溢出容器，这里给足空间且不裁剪 */
  overflow: visible;
}
.stage--row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 60px;
}
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
</style>

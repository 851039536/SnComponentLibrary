<script setup lang="ts">
// 浮层 · 焦点陷阱：FocusTrap
// 把 Tab 键的循环限制在一个容器内，常用于自定义弹层。
import { ref } from "vue"
import Button from "../../components/Button.vue"
import FocusTrap from "../../components/FocusTrap.vue"
import Input from "../../components/Input.vue"
import Switch from "../../components/Switch.vue"
import DemoSection from "../components/DemoSection.vue"

const enabled = ref(true)
const autoFocus = ref(true)
</script>

<template>
  <div class="view">
    <DemoSection
      name="焦点陷阱"
      en="FocusTrap"
      desc="开启后，Tab / Shift+Tab 只在下方框内循环，不会跑到页面其它地方。disabled 可临时关闭。"
    >
      <div class="controls">
        <Switch v-model="enabled" label="启用焦点陷阱" />
        <Switch v-model="autoFocus" label="自动聚焦首个可聚焦元素" />
      </div>

      <FocusTrap :disabled="!enabled" :auto-focus="autoFocus" class="trap">
        <p class="trap__title">
          {{ enabled ? "Tab 会被限制在这个框内" : "焦点陷阱已关闭，Tab 可自由离开" }}
        </p>
        <Input label="第一个输入框" size="small" placeholder="按 Tab 试试" />
        <Input label="第二个输入框" size="small" placeholder="继续按 Tab" />
        <div class="trap__actions">
          <Button size="small" outlined>按钮 A</Button>
          <Button size="small" outlined>按钮 B</Button>
        </div>
        <p class="trap__hint">
          循环顺序：输入框 1 → 输入框 2 → 按钮 A → 按钮 B → 回到输入框 1
        </p>
      </FocusTrap>
    </DemoSection>

    <DemoSection
      name="初始焦点"
      en="FocusTrap · initialFocus"
      divided
      desc="initialFocus 传 CSS 选择器，容器出现时优先聚焦匹配到的元素。"
    >
      <FocusTrap :auto-focus="false" initial-focus="#focus-target" class="trap">
        <p class="trap__title">已指定 initialFocus，但 autoFocus 关闭 —— 不自动跳到任何元素</p>
        <Input id="focus-target" label="被指定为初始焦点的输入框" size="small" />
        <Button size="small" outlined>其它按钮</Button>
      </FocusTrap>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.controls { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 4px; }
.trap {
  border: 1px dashed var(--b3-theme-primary, #3b82f6);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
}
.trap__title { margin: 0; font-size: 13px; font-weight: 600; }
.trap__actions { display: flex; gap: 8px; }
.trap__hint { margin: 0; font-size: 11px; color: var(--b3-theme-secondary, #8a8a8a); }
</style>

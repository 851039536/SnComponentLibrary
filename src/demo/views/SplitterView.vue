<script setup lang="ts">
// 布局 · 分割面板：Splitter / SplitterPanel
import { ref } from "vue"
import Splitter from "../../components/Splitter.vue"
import SplitterPanel from "../../components/SplitterPanel.vue"
import DemoSection from "../components/DemoSection.vue"

const sizesH = ref<number[]>([30, 70])
const sizesV = ref<number[]>([40, 60])
const sizes3 = ref<number[]>([25, 50, 25])
const log = ref<string[]>([])
function onResizeEnd(e: unknown) {
  log.value = [`调整结束：${JSON.stringify((e as { sizes?: number[] })?.sizes ?? sizesH.value)}`, ...log.value].slice(0, 4)
}
</script>

<template>
  <div class="view">
    <DemoSection
      name="分割面板"
      en="Splitter / SplitterPanel"
      desc="layout 取 horizontal（左右分栏）或 vertical（上下分栏）；拖动中间的分隔条调整尺寸。"
    >
      <Splitter v-model:sizes="sizesH" layout="horizontal" state-key="demo-splitter-h" @resizeend="onResizeEnd">
        <SplitterPanel :size="sizesH[0]" :min-size="15">
          <div class="pane">左栏<span class="pane__size">{{ sizesH[0] }}%</span></div>
        </SplitterPanel>
        <SplitterPanel :size="sizesH[1]" :min-size="20">
          <div class="pane">右栏<span class="pane__size">{{ sizesH[1] }}%</span></div>
        </SplitterPanel>
      </Splitter>
      <p class="hint">尺寸会按 stateKey 记忆到浏览器存储，刷新后保持。</p>
    </DemoSection>

    <DemoSection name="上下分栏" en="Splitter · vertical" divided>
      <Splitter v-model:sizes="sizesV" layout="vertical" :gutter-size="6">
        <SplitterPanel :size="sizesV[0]" :min-size="20">
          <div class="pane">上栏<span class="pane__size">{{ sizesV[0] }}%</span></div>
        </SplitterPanel>
        <SplitterPanel :size="sizesV[1]" :min-size="20">
          <div class="pane">下栏<span class="pane__size">{{ sizesV[1] }}%</span></div>
        </SplitterPanel>
      </Splitter>
    </DemoSection>

    <DemoSection name="三栏" en="Splitter · 3 panels" divided>
      <Splitter v-model:sizes="sizes3" layout="horizontal">
        <SplitterPanel :size="sizes3[0]" :min-size="15">
          <div class="pane">侧栏</div>
        </SplitterPanel>
        <SplitterPanel :size="sizes3[1]" :min-size="25">
          <div class="pane">主区</div>
        </SplitterPanel>
        <SplitterPanel :size="sizes3[2]" :min-size="15" collapsible>
          <div class="pane">可折叠栏</div>
        </SplitterPanel>
      </Splitter>
      <p class="hint">第三栏设了 collapsible，可折叠到 collapsedSize。</p>
    </DemoSection>

    <DemoSection name="事件" en="Splitter · events" divided>
      <ul class="log">
        <li v-if="log.length === 0" class="log__empty">（拖动上面任意分隔条试试）</li>
        <li v-for="(l, i) in log" :key="i">{{ l }}</li>
      </ul>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.pane {
  height: 180px;
  display: grid;
  place-items: center;
  font-size: 13px;
  gap: 4px;
  background: var(--b3-theme-surface, #f7f7f5);
  border-radius: 6px;
  border: 1px solid var(--b3-border-color, #e0deda);
}
.pane__size {
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: var(--b3-theme-secondary, #8a8a8a);
}
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
.log {
  margin: 0;
  padding: 12px 14px 12px 28px;
  border-radius: 8px;
  background: var(--b3-theme-surface-light, #efefec);
  font-size: 12px;
  font-family: ui-monospace, monospace;
  line-height: 1.9;
}
.log__empty { list-style: none; margin-left: -14px; color: var(--b3-theme-secondary, #8a8a8a); }
</style>

<script setup lang="ts">
// 浮层 · 确认气泡：ConfirmPopup
// 与 ConfirmDialog 的区别：它锚定在某个元素旁边（target），而不是居中模态。
import { ref } from "vue"
import Button from "../../components/Button.vue"
import ConfirmPopup from "../../components/ConfirmPopup.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const anchor1 = ref<HTMLElement | null>(null)
const anchor2 = ref<HTMLElement | null>(null)
const anchor3 = ref<HTMLElement | null>(null)

const visible = ref({ a: false, b: false, c: false })
const log = ref<string[]>([])
function note(msg: string) {
  log.value = [`${new Date().toLocaleTimeString()} ${msg}`, ...log.value].slice(0, 5)
}
</script>

<template>
  <div class="view">
    <DemoSection
      name="确认气泡"
      en="ConfirmPopup"
      desc="锚定在 target 元素旁，适合「删除某一行」这类就地二次确认。target 传元素或返回元素的函数。"
    >
      <DemoRow gap="large">
        <span ref="anchor1">
          <Button severity="danger" outlined @click="visible.a = true">删除（下方）</Button>
        </span>
        <span ref="anchor2">
          <Button severity="danger" outlined @click="visible.b = true">删除（上方）</Button>
        </span>
        <span ref="anchor3">
          <Button outlined @click="visible.c = true">自定义文案</Button>
        </span>
      </DemoRow>

      <ConfirmPopup
        v-model:visible="visible.a"
        :target="anchor1"
        header="确认删除"
        message="确定要删除这一条吗？"
        placement="bottom"
        @accept="visible.a = false; note('接受了删除（下方）')"
        @reject="visible.a = false; note('取消了（下方）')"
      />

      <ConfirmPopup
        v-model:visible="visible.b"
        :target="anchor2"
        header="确认删除"
        message="这条也会一并移除。"
        placement="top"
        @accept="visible.b = false; note('接受了删除（上方）')"
        @reject="visible.b = false; note('取消了（上方）')"
      />

      <ConfirmPopup
        v-model:visible="visible.c"
        :target="anchor3"
        header="需要继续吗？"
        message="可以自定义按钮文案与语义色。"
        accept-label="继续"
        reject-label="返回"
        accept-severity="primary"
        accept-icon="check"
        @accept="visible.c = false; note('选择了继续')"
        @reject="visible.c = false; note('选择了返回')"
      />
    </DemoSection>

    <DemoSection name="事件日志" en="ConfirmPopup · events" divided>
      <ul class="log">
        <li v-if="log.length === 0" class="log__empty">（点击上面的按钮试试）</li>
        <li v-for="(l, i) in log" :key="i">{{ l }}</li>
      </ul>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.log {
  margin: 0;
  padding: 12px 14px 12px 28px;
  border-radius: 8px;
  background: var(--b3-theme-surface-light, #efefec);
  font-size: 12px;
  font-family: ui-monospace, monospace;
  line-height: 1.9;
  min-height: 44px;
}
.log__empty { list-style: none; margin-left: -14px; color: var(--b3-theme-secondary, #8a8a8a); }
</style>

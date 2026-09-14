<script setup lang="ts">
// 浮层 · 反馈：Toast / Message
import { ref } from "vue"
import Button from "../../components/Button.vue"
import Message from "../../components/Message.vue"
import Toast from "../../components/Toast.vue"
import type { ToastMessageOptionsPublic } from "../../components/Toast.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const messages = ref<ToastMessageOptionsPublic[]>([])

/** Toast 是受控的：组件不改数组，而是派发「移除后的新数组」由使用方回写 */
function push(severity: ToastMessageOptionsPublic["severity"]) {
  messages.value = [
    ...messages.value,
    {
      severity,
      summary: `${severity} 标题`,
      detail: "这是一条演示消息，3 秒后自动消失",
      life: 3000,
    },
  ]
}

function pushSticky() {
  messages.value = [
    ...messages.value,
    { severity: "info", summary: "不会自动关闭", detail: "需要点右上角 × 关闭" },
  ]
}

const messageVisible = ref({
  success: true,
  info: true,
  warn: true,
  error: true,
})
</script>

<template>
  <div class="view">
    <DemoSection
      name="轻提示"
      en="Toast"
      desc="受控组件：用 v-model:messages 传入消息队列，关闭后组件派发新数组由你回写。life 为毫秒，不传则常驻。"
    >
      <DemoRow>
        <Button severity="success" @click="push('success')">成功</Button>
        <Button severity="info" @click="push('info')">信息</Button>
        <Button severity="warning" @click="push('warn')">警告</Button>
        <Button severity="danger" @click="push('error')">错误</Button>
        <Button outlined @click="pushSticky">常驻消息</Button>
        <Button text @click="messages = []">清空</Button>
      </DemoRow>
      <p class="hint">
        当前队列 {{ messages.length }} 条。Toast 停靠在右上角，可传 position 改八档方位。
      </p>
    </DemoSection>

    <!-- Toast 容器：position 支持八个方位 -->
    <Toast v-model:messages="messages" position="top-right" />

    <DemoSection
      name="消息条"
      en="Message"
      desc="页面内的行内提示，不是浮层。组件不自动隐藏，是否移除由调用方用 v-if 决定。"
    >
      <div class="stack">
        <Message v-if="messageVisible.success" severity="success" closable @close="messageVisible.success = false">
          操作成功：数据已保存
        </Message>
        <Message v-if="messageVisible.info" severity="info" closable @close="messageVisible.info = false">
          提示：这里是一条信息
        </Message>
        <Message v-if="messageVisible.warn" severity="warn" closable @close="messageVisible.warn = false">
          警告：请检查配置项
        </Message>
        <Message v-if="messageVisible.error" severity="error" closable @close="messageVisible.error = false">
          错误：请求失败
        </Message>
        <Message severity="contrast">对比色消息条（contrast）</Message>
      </div>
      <DemoRow>
        <Button
          size="small"
          text
          @click="messageVisible = { success: true, info: true, warn: true, error: true }"
        >
          恢复全部消息条
        </Button>
      </DemoRow>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.stack { display: flex; flex-direction: column; gap: 10px; }
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
</style>

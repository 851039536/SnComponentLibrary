<script setup lang="ts">
// 基础 · 按钮：Button 的变体 / 颜色轴 / 尺寸 / 图标 / 状态
import { ref } from "vue"
import Button from "../../components/Button.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const clicked = ref(0)
const loading = ref(false)

function fakeLoad() {
  loading.value = true
  window.setTimeout(() => { loading.value = false }, 1500)
}
</script>

<template>
  <div class="view">
    <DemoSection
      name="按钮"
      en="Button"
      desc="文字写在默认插槽里 —— Button 没有 label 属性，写成 label=&quot;文字&quot; 会渲染成空按钮。"
    >
      <DemoRow>
        <Button variant="primary">主要</Button>
        <Button variant="secondary">次要</Button>
        <Button variant="ghost">幽灵</Button>
        <Button outlined>描边</Button>
        <Button text>纯文本</Button>
      </DemoRow>

      <DemoRow>
        <Button severity="success">成功</Button>
        <Button severity="info">信息</Button>
        <Button severity="warning">警告</Button>
        <Button severity="danger">危险</Button>
      </DemoRow>

      <DemoRow>
        <Button size="xsmall">xsmall</Button>
        <Button size="small">small（默认）</Button>
        <Button size="medium">medium</Button>
        <Button size="large">large</Button>
      </DemoRow>

      <!-- dense 是「紧凑几何修饰」，**只与 size="xsmall" 协同时生效**：
           去 min-height、收紧 padding/gap/圆角，字号仍取 xsmall 的 10px。
           单独使用（不配 xsmall）时不会产生任何效果 —— 见下方对照。 -->
      <DemoRow>
        <Button size="xsmall" dense>dense（紧凑）</Button>
        <Button size="xsmall" dense icon="plus">带图标</Button>
        <Button size="xsmall" dense rounded icon="close" aria-label="关闭" />
        <Button size="medium" dense>medium + dense（无效，对照）</Button>
      </DemoRow>

      <DemoRow>
        <Button icon="save" icon-position="left">左图标</Button>
        <Button icon="send" icon-position="right">右图标</Button>
        <Button icon="magnify" rounded aria-label="搜索" />
        <Button icon="settings" text aria-label="设置" />
      </DemoRow>

      <DemoRow>
        <Button disabled>禁用</Button>
        <Button :loading="loading" @click="fakeLoad">
          {{ loading ? "加载中…" : "点击加载 1.5s" }}
        </Button>
        <Button severity="danger" outlined @click="clicked++">
          点击计数：{{ clicked }}
        </Button>
      </DemoRow>

      <DemoRow>
        <Button block variant="primary">块级按钮（block）</Button>
      </DemoRow>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
</style>

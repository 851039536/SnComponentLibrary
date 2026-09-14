<script setup lang="ts">
// 基础 · 头像：Avatar
import { ref } from "vue"
import Avatar from "../../components/Avatar.vue"
import Button from "../../components/Button.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const clicked = ref(0)
// 一个必然加载失败的地址，用于演示「图片加载失败回退到 icon / 文本」
const brokenSrc = "https://example.invalid/not-found.png"
</script>

<template>
  <div class="view">
    <DemoSection
      name="头像"
      en="Avatar"
      desc="按优先级回退：src 图片 → text 文字 → icon 图标。图片加载失败也会回退，不会出现破图。"
    >
      <DemoRow gap="large">
        <Avatar text="张三" />
        <Avatar text="AB" />
        <Avatar icon="star" />
        <Avatar :src="brokenSrc" text="回退" />
        <Avatar :src="brokenSrc" icon="settings" />
      </DemoRow>
    </DemoSection>

    <DemoSection name="形状与尺寸" en="Avatar · shape / size" divided>
      <DemoRow gap="large">
        <Avatar text="圆" shape="circle" />
        <Avatar text="方" shape="square" />
      </DemoRow>
      <DemoRow gap="large">
        <Avatar text="XS" size="xsmall" />
        <Avatar text="S" size="small" />
        <Avatar text="M" size="medium" />
        <Avatar text="L" size="large" />
        <Avatar text="XL" size="xlarge" />
        <Avatar text="自定" :custom-size="72" />
      </DemoRow>
    </DemoSection>

    <DemoSection name="颜色与状态" en="Avatar · color / state" divided>
      <DemoRow gap="large">
        <Avatar text="主色" color="#3b82f6" />
        <Avatar text="紫" color="#7c3aed" />
        <Avatar text="绿" color="#10b981" />
        <Avatar text="自定义文字色" color="#f59e0b" text-color="#1a1a1a" />
      </DemoRow>
      <DemoRow gap="large">
        <Avatar text="可点" clickable @click="clicked++" />
        <Avatar text="激活" active clickable />
        <Avatar text="禁用" disabled />
      </DemoRow>
      <p class="hint">可点击头像被点击 {{ clicked }} 次（clickable 时会派发 click）。</p>
      <DemoRow>
        <Button size="small" outlined @click="clicked = 0">重置计数</Button>
      </DemoRow>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
</style>

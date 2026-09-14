<script setup lang="ts">
/**
 * 演示小节容器：标题 + 英文名 + 可选说明 + 示例区。
 * 各演示视图用它包裹每个组件的示例，保证排版一致。
 */
import Divider from "../../components/Divider.vue"

interface Props {
  /** 中文名 */
  name: string
  /** 英文组件名（也用于检索） */
  en?: string
  /** 说明文字 */
  desc?: string
  /** 是否在顶部画分隔线（同视图内第二个及以后的小节设为 true） */
  divided?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  en: "",
  desc: "",
  divided: false,
})
</script>

<template>
  <section class="sec" :id="`sec-${props.en.split(/[\s/]+/)[0] || props.name}`">
    <Divider v-if="props.divided" />
    <header class="sec__head">
      <h3 class="sec__title">
        {{ props.name }}
        <code v-if="props.en" class="sec__en">{{ props.en }}</code>
      </h3>
      <p v-if="props.desc" class="sec__desc">{{ props.desc }}</p>
    </header>
    <div class="sec__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.sec {
  scroll-margin-top: 16px;
}

.sec__head {
  margin-bottom: 12px;
}

.sec__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--b3-theme-on-background, #1a1a1a);
}

.sec__en {
  font-size: 11px;
  font-weight: 400;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--b3-theme-surface-light, #efefec);
  color: var(--b3-theme-secondary, #8a8a8a);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.sec__desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--b3-theme-secondary, #8a8a8a);
  line-height: 1.6;
}

.sec__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>

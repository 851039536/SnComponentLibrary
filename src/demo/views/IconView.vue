<script setup lang="ts">
// 基础 · 图标：IconWrapper
// 注意：图标名必须是 kit/icons.ts 里注册过的键，不能写 "mdi:xxx"，否则渲染成问号圆圈。
import IconWrapper from "../../components/IconWrapper.vue"
import Tag from "../../components/Tag.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"
import { COMMON_ICONS, getIconConfig } from "../../components/kit/icons"

const keys = Object.keys(COMMON_ICONS).slice(0, 42)
const sizes = [12, 16, 20, 28, 40]
</script>

<template>
  <div class="view">
    <DemoSection
      name="图标"
      en="IconWrapper"
      desc="图标键来自 kit/icons.ts；mdi 图标数据已内联进产物，断网也能显示。"
    >
      <DemoRow gap="large">
        <div v-for="s in sizes" :key="s" class="cell">
          <IconWrapper name="settings" :size="s" />
          <span class="cell__label">{{ s }}px</span>
        </div>
      </DemoRow>

      <DemoSection name="常用图标" en="COMMON_ICONS" divided>
        <div class="icons">
          <div v-for="k in keys" :key="k" class="icon" :title="k">
            <IconWrapper :name="k as any" :size="20" />
            <span class="icon__key">{{ k }}</span>
          </div>
        </div>
        <p class="hint">
          共 {{ Object.keys(COMMON_ICONS).length }} 个常用图标键（此处展示前 {{ keys.length }} 个）。
        </p>
      </DemoSection>

      <DemoSection name="颜色与配置" en="IconWrapper · color" divided>
        <DemoRow gap="large">
          <IconWrapper name="check" :size="22" color="#10b981" />
          <IconWrapper name="close" :size="22" color="#ef4444" />
          <IconWrapper name="star" :size="22" color="#fbbf24" />
          <IconWrapper name="info" :size="22" color="#3b82f6" />
        </DemoRow>
        <DemoRow>
          <Tag content="getIconConfig('star')" />
          <code>{{ JSON.stringify(getIconConfig("star")) }}</code>
        </DemoRow>
      </DemoSection>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.cell__label { font-size: 10px; color: var(--b3-theme-secondary, #8a8a8a); }
.icons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 10px;
}
.icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 8px;
  border: 1px solid var(--b3-border-color, #e0deda);
}
.icon__key {
  font-size: 9px;
  color: var(--b3-theme-secondary, #8a8a8a);
  font-family: ui-monospace, monospace;
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
}
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
code {
  font-size: 11px;
  background: var(--b3-theme-surface-light, #efefec);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>

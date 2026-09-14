<script setup lang="ts">
// 基础 · 卡片：Card
import { ref } from "vue"
import Button from "../../components/Button.vue"
import Card from "../../components/Card.vue"
import Tag from "../../components/Tag.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const active = ref(false)
const clicks = ref(0)
</script>

<template>
  <div class="view">
    <DemoSection
      name="卡片"
      en="Card"
      desc="title / subtitle 走 props（也可用 header、footer 插槽覆盖），内容放默认插槽。"
    >
      <div class="grid">
        <Card title="基础卡片" subtitle="带标题与副标题">
          <p class="body">这是卡片内容区域，默认带内边距。</p>
        </Card>

        <Card title="无内边距主体" subtitle="bodyNoPadding">
          <template #default>
            <div class="flush">内容贴着卡片边缘（bodyNoPadding 生效）</div>
          </template>
        </Card>

        <Card title="直角卡片" :rounded="false">
          <p class="body">rounded=false 去掉圆角。</p>
        </Card>
      </div>
    </DemoSection>

    <DemoSection name="变体与尺寸" en="Card · variant / size" divided>
      <div class="grid">
        <Card
          v-for="v in ['bordered', 'outlined', 'elevated', 'flat'] as const"
          :key="v"
          :variant="v"
          :title="`variant: ${v}`"
        >
          <p class="body">变体 {{ v }}</p>
        </Card>
      </div>
      <div class="grid">
        <Card v-for="s in ['xsmall', 'small', 'medium', 'large'] as const" :key="s" :size="s" :title="`size: ${s}`">
          <p class="body">尺寸 {{ s }}</p>
        </Card>
      </div>
    </DemoSection>

    <DemoSection name="交互与状态" en="Card · clickable / loading" divided>
      <div class="grid">
        <Card
          title="可点击"
          clickable
          :active="active"
          @click="active = !active; clicks++"
        >
          <p class="body">
            点击切换激活态，当前：<Tag :content="active ? '激活' : '未激活'" :variant="active ? 'success' : 'default'" />
          </p>
          <p class="body">累计点击 {{ clicks }} 次</p>
        </Card>

        <Card title="加载中" loading>
          <p class="body">loading=true 时主体显示加载态。</p>
        </Card>

        <Card title="禁用" disabled clickable>
          <p class="body">disabled 时不可交互。</p>
        </Card>
      </div>
    </DemoSection>

    <DemoSection name="页头与页脚插槽" en="Card · slots" divided>
      <Card>
        <template #header>
          <DemoRow>
            <Tag content="header 插槽" variant="primary" />
            <Button size="xsmall" text>操作</Button>
          </DemoRow>
        </template>
        <template #header-extra>
          <Tag content="header-extra" variant="info" />
        </template>
        <p class="body">主体内容。</p>
        <template #footer>
          <p class="body foot">footer 插槽：常用于放操作按钮</p>
        </template>
      </Card>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  align-items: start;
}
.body { margin: 0; font-size: 13px; line-height: 1.7; }
.flush {
  padding: 12px;
  background: var(--b3-theme-surface-light, #efefec);
  font-size: 13px;
}
.foot { color: var(--b3-theme-secondary, #8a8a8a); font-size: 12px; }
</style>

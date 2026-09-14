<script setup lang="ts">
// 布局 · 侧边栏：Sidebar / SidebarMain
import { ref } from "vue"
import Button from "../../components/Button.vue"
import IconWrapper from "../../components/IconWrapper.vue"
import Sidebar from "../../components/Sidebar.vue"
import SidebarMain from "../../components/SidebarMain.vue"
import Tag from "../../components/Tag.vue"
import DemoSection from "../components/DemoSection.vue"

const open = ref(true)
const current = ref("home")

const navItems = [
  { key: "home", label: "首页", icon: "folder-open-outline" as const },
  { key: "docs", label: "文档", icon: "notebook" as const },
  { key: "star", label: "收藏", icon: "star" as const },
  { key: "settings", label: "设置", icon: "settings" as const },
]
</script>

<template>
  <div class="view">
    <DemoSection
      name="侧边栏"
      en="Sidebar / SidebarMain"
      desc="Sidebar 是可折叠导航容器，SidebarMain 是右侧主内容区。collapsible=&quot;icon&quot; 时收起只留图标。"
    >
      <div class="stage">
        <Sidebar v-model:open="open" side="left" collapsible="icon" width="200px">
          <div class="sb-head">
            <IconWrapper name="layoutGrid" :size="18" />
            <span v-show="open" class="sb-head__text">导航</span>
          </div>
          <ul class="sb-nav">
            <li v-for="item in navItems" :key="item.key">
              <button
                type="button"
                class="sb-item"
                :class="{ 'sb-item--active': current === item.key }"
                :title="item.label"
                @click="current = item.key"
              >
                <IconWrapper :name="item.icon" :size="16" />
                <span v-show="open">{{ item.label }}</span>
              </button>
            </li>
          </ul>
        </Sidebar>

        <SidebarMain padded>
          <div class="content">
            <div class="content__bar">
              <Button size="small" outlined @click="open = !open">
                {{ open ? "收起侧栏" : "展开侧栏" }}
              </Button>
              <Tag :content="`当前页：${current}`" variant="primary" />
            </div>
            <p class="content__body">
              主内容区。点击左侧导航项切换，或点上方按钮折叠侧边栏 —— 折叠后只剩图标，
              悬停可看 title 提示。
            </p>
          </div>
        </SidebarMain>
      </div>
    </DemoSection>

    <DemoSection name="说明" en="用法要点" divided>
      <ul class="tips">
        <li><code>side</code> 取 left / right，决定侧栏贴哪一边。</li>
        <li><code>collapsible</code> 取 icon（收起留图标）/ 其它值决定折叠行为。</li>
        <li><code>overlay</code> 开启后侧栏浮在内容之上（不挤压主区），适合窄屏。</li>
        <li><code>openOnHover</code> 可让收起态悬停时临时展开。</li>
        <li>收起/展开用 <code>v-model:open</code> 受控。</li>
      </ul>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.stage {
  display: flex;
  height: 320px;
  border: 1px solid var(--b3-border-color, #e0deda);
  border-radius: 10px;
  overflow: hidden;
}
.sb-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--b3-border-color, #e0deda);
}
.sb-head__text { white-space: nowrap; }
.sb-nav {
  list-style: none;
  margin: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sb-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  color: var(--b3-theme-on-surface, #1a1a1a);
  white-space: nowrap;
  overflow: hidden;
}
.sb-item:hover { background: var(--b3-theme-hover, rgba(0, 0, 0, 0.06)); }
.sb-item--active {
  background: var(--b3-theme-primary, #3b82f6);
  color: var(--b3-theme-on-primary, #fff);
}
.content { display: flex; flex-direction: column; gap: 12px; }
.content__bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.content__body { margin: 0; font-size: 13px; line-height: 1.8; }
.tips { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.9; }
code {
  background: var(--b3-theme-surface-light, #efefec);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
}
</style>

<script setup lang="ts">
// ============================================================================
// 组件库演示 / 自测页
//
// 布局：左侧「组件目录」（按分组折叠 + 搜索 + 键盘导航），右侧显示所选组件的演示。
//
// 目的：逐个确认 52 个公开组件的「图标正常 / 交互正常 / 明暗主题跟随 / 无报错」。
//
// 注意：本页刻意不使用任何 @ 别名，全部走相对路径，以证明组件库脱离宿主仍可用。
//       左侧目录的数据源见 demo/registry.ts，新增组件演示只需改那一个文件。
// ============================================================================
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue"
import Button from "./components/Button.vue"
import IconWrapper from "./components/IconWrapper.vue"
import Input from "./components/Input.vue"
import Tooltip from "./components/Tooltip.vue"
import { COMPONENT_COUNT, DEMOS, groupedDemos } from "./demo/registry"

// ---------------------------------------------------------------- 主题
// kit/theme.ts 识别三种暗色触发：prefers-color-scheme / [data-theme="dark"] / .dark
const isDark = ref(false)
function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle("dark", isDark.value)
}

// ---------------------------------------------------------------- 目录状态
const groups = groupedDemos()
const activeKey = ref(DEMOS[0]?.key ?? "")
const keyword = ref("")

/** 分组折叠状态：默认全部展开 */
const collapsed = ref<Record<string, boolean>>({})
function toggleGroup(name: string) {
  collapsed.value = { ...collapsed.value, [name]: !collapsed.value[name] }
}

/** 按关键词过滤（匹配中文名、英文名、分组名） */
const filteredGroups = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return groups
  return groups
    .map((g) => ({
      ...g,
      entries: g.entries.filter(
        (e) =>
          e.name.toLowerCase().includes(kw)
          || e.en.toLowerCase().includes(kw)
          || e.group.toLowerCase().includes(kw),
      ),
    }))
    .filter((g) => g.entries.length > 0)
})

const activeEntry = computed(() => DEMOS.find((d) => d.key === activeKey.value) ?? null)

/** 扁平顺序，用于方向键上下切换 */
const flatVisible = computed(() => {
  const out = []
  for (const g of filteredGroups.value) {
    if (collapsed.value[g.name]) continue
    for (const e of g.entries) out.push(e)
  }
  return out
})

function select(key: string) {
  activeKey.value = key
  // 同步到 URL hash，刷新后停留在同一组件
  if (typeof location !== "undefined") {
    history.replaceState(null, "", `#${key}`)
  }
  // 右侧内容区复位到顶部（右栏是独立滚动容器）
  nextTick(() => {
    document.getElementById("main-scroll")?.scrollTo({ top: 0 })
  })
}

/** 上下方向键在目录内移动（不在输入框里时生效） */
function onKeydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === "INPUT" || tag === "TEXTAREA") return
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
  const list = flatVisible.value
  const idx = list.findIndex((x) => x.key === activeKey.value)
  if (idx < 0) return
  const next = e.key === "ArrowDown" ? idx + 1 : idx - 1
  if (next < 0 || next >= list.length) return
  e.preventDefault()
  select(list[next].key)
}

onMounted(() => {
  // 支持通过 URL hash 直达某个组件
  const hash = location.hash.replace(/^#/, "")
  if (hash && DEMOS.some((d) => d.key === hash)) activeKey.value = hash
  window.addEventListener("keydown", onKeydown)
})
onUnmounted(() => window.removeEventListener("keydown", onKeydown))
</script>

<template>
  <div class="app">
    <!-- ==================== 左侧：组件目录 ==================== -->
    <aside class="side">
      <div class="side__brand">
        <div class="side__logo">SN</div>
        <div class="side__title">
          <strong>通用组件库</strong>
          <span>{{ COMPONENT_COUNT }} 个组件 · Vue 3</span>
        </div>
      </div>

      <div class="side__search">
        <Input
          v-model="keyword"
          size="small"
          placeholder="搜索组件…"
          prefix-icon="magnify"
          clearable
          borderless
        />
      </div>

      <nav class="side__nav">
        <div v-for="g in filteredGroups" :key="g.name" class="grp">
          <button
            type="button"
            class="grp__head"
            :aria-expanded="!collapsed[g.name]"
            @click="toggleGroup(g.name)"
          >
            <IconWrapper
              :name="collapsed[g.name] ? 'chevronRight' : 'chevronDown'"
              :size="14"
              class="grp__caret"
            />
            <span class="grp__name">{{ g.name }}</span>
            <span class="grp__count">{{ g.entries.length }}</span>
          </button>

          <ul v-show="!collapsed[g.name]" class="grp__list">
            <li v-for="e in g.entries" :key="e.key">
              <button
                type="button"
                class="item"
                :class="{ 'item--active': e.key === activeKey }"
                :title="e.note || e.en"
                @click="select(e.key)"
              >
                <span class="item__name">{{ e.name }}</span>
                <span class="item__en">{{ e.en.split(/[\s/]+/)[0] }}</span>
              </button>
            </li>
          </ul>
        </div>

        <p v-if="filteredGroups.length === 0" class="side__empty">
          没有匹配「{{ keyword }}」的组件
        </p>
      </nav>

      <div class="side__foot">
        <Button size="small" outlined block :icon="isDark ? 'star' : 'starOutline'" @click="toggleDark">
          {{ isDark ? "切回亮色" : "切换暗色" }}
        </Button>
      </div>
    </aside>

    <!-- ==================== 右侧：演示区 ==================== -->
    <main id="main-scroll" class="main">
      <header class="main__head">
        <div class="main__crumb">
          <span class="main__group">{{ activeEntry?.group }}</span>
          <IconWrapper name="chevronRight" :size="12" />
          <h1 class="main__title">{{ activeEntry?.name }}</h1>
          <code class="main__en">{{ activeEntry?.en }}</code>
        </div>
        <div class="main__meta">
          <Tooltip text="切换到上一个 / 下一个组件（↑ ↓）">
            <span class="main__kbd-hint">↑ ↓ 切换</span>
          </Tooltip>
        </div>
      </header>

      <p v-if="activeEntry?.note" class="main__note">
        <IconWrapper name="info" :size="14" />
        {{ activeEntry.note }}
      </p>

      <!-- 演示视图：每个组件切换时重新挂载，保证内部状态干净 -->
      <div class="main__body">
        <component :is="activeEntry?.view" v-if="activeEntry" :key="activeEntry.key" />
      </div>

      <footer class="main__foot">
        组件源码位于 <code>src/components/</code> · 主题变量为 <code>--b3-theme-*</code> ·
        目录数据源 <code>src/demo/registry.ts</code>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 248px 1fr;
  /* 两栏各自滚动：左栏固定满高、右栏独立滚动，互不影响 */
  height: 100vh;
  overflow: hidden;
  font-family: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
  color: var(--b3-theme-on-background, #1a1a1a);
  background: var(--b3-theme-background, #fff);
}

/* ---------------------------------------------------------------- 左侧 */
.side {
  height: 100vh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--b3-border-color, #e0deda);
  background: var(--b3-theme-surface, #f7f7f5);
  box-sizing: border-box;
}

.side__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 14px 12px;
}

.side__logo {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
  color: var(--b3-theme-on-primary, #fff);
  background: var(--b3-theme-primary, #3b82f6);
  flex: none;
}

.side__title {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  min-width: 0;
}
.side__title strong { font-size: 14px; }
.side__title span {
  font-size: 11px;
  color: var(--b3-theme-secondary, #8a8a8a);
}

.side__search {
  padding: 0 10px 8px;
}

.side__nav {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 16px;
}

.grp { margin-bottom: 2px; }

.grp__head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 6px;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--b3-theme-secondary, #8a8a8a);
  text-transform: uppercase;
}
.grp__head:hover { background: var(--b3-theme-hover, rgba(0, 0, 0, 0.06)); }
.grp__caret { flex: none; opacity: 0.7; }
.grp__name { flex: 1; text-align: left; }
.grp__count {
  font-size: 10px;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

.grp__list {
  list-style: none;
  margin: 0;
  padding: 0 0 4px;
}

.item {
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 8px 6px 22px;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font: inherit;
  text-align: left;
  color: var(--b3-theme-on-surface, #1a1a1a);
}
.item:hover { background: var(--b3-theme-hover, rgba(0, 0, 0, 0.06)); }

.item--active {
  background: var(--b3-theme-primary, #3b82f6);
  color: var(--b3-theme-on-primary, #fff);
}
.item--active:hover { background: var(--b3-theme-primary, #3b82f6); }

.item__name { font-size: 13px; flex: 1; }

.item__en {
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--b3-theme-secondary, #8a8a8a);
  flex: none;
}
.item--active .item__en { color: inherit; opacity: 0.75; }

.side__empty {
  padding: 16px 12px;
  font-size: 12px;
  color: var(--b3-theme-secondary, #8a8a8a);
  text-align: center;
}

.side__foot {
  padding: 10px;
  border-top: 1px solid var(--b3-border-color, #e0deda);
}

/* ---------------------------------------------------------------- 右侧 */
.main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 32px 64px;
  gap: 16px;
  overflow-y: auto;
}

.main__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--b3-border-color, #e0deda);
}

.main__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.main__group {
  font-size: 12px;
  color: var(--b3-theme-secondary, #8a8a8a);
  flex: none;
}

.main__title {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
  flex: none;
}

.main__en {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--b3-theme-surface-light, #efefec);
  color: var(--b3-theme-secondary, #8a8a8a);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main__meta { flex: none; }

.main__kbd-hint {
  font-size: 11px;
  color: var(--b3-theme-secondary, #8a8a8a);
  border: 1px solid var(--b3-border-color, #e0deda);
  border-radius: 5px;
  padding: 3px 7px;
  cursor: default;
}

.main__note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--b3-theme-secondary, #8a8a8a);
}

.main__body {
  min-height: 320px;
}

.main__foot {
  margin-top: auto;
  padding-top: 24px;
  font-size: 12px;
  color: var(--b3-theme-secondary, #8a8a8a);
  text-align: center;
}

code {
  background: var(--b3-theme-surface-light, #efefec);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* 窄屏：目录折到上方，两栏改纵向滚动 */
@media (max-width: 760px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    height: 100vh;
  }
  .side {
    height: auto;
    max-height: 46vh;
    border-right: 0;
    border-bottom: 1px solid var(--b3-border-color, #e0deda);
  }
  .main { padding: 20px 16px 48px; }
}
</style>

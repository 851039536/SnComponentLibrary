<script setup lang="ts">
// ============================================================================
// 组件库演示 / 自测页
//
// 目的：一次性渲染各组代表性组件，覆盖各私有子目录（confirm/ datePicker/
//       fileUpload/ overlay/ paginator/ select/ speedDial/ splitter/ tabs/
//       textarea/ tieredMenu/ toast/ tooltip/ megaMenu/ metergroup/ sidebar/ …）
//       的代码路径，用于人工确认「图标正常 / 交互正常 / 明暗主题跟随 / 无报错」。
//
// 注意：本页刻意不使用任何 @ 别名，全部走相对路径，以证明组件库脱离宿主仍可用。
// ============================================================================
import { computed, ref } from "vue"
import Badge from "./components/Badge.vue"
import Button from "./components/Button.vue"
import Card from "./components/Card.vue"
import Checkbox from "./components/Checkbox.vue"
import ColorField from "./components/ColorField.vue"
import ConfirmDialog from "./components/ConfirmDialog.vue"
import DatePicker from "./components/DatePicker.vue"
import Dialog from "./components/Dialog.vue"
import Divider from "./components/Divider.vue"
import Drawer from "./components/Drawer.vue"
import FileUpload from "./components/FileUpload.vue"
import Input from "./components/Input.vue"
import Loader from "./components/Loader.vue"
import Message from "./components/Message.vue"
import MeterGroup from "./components/MeterGroup.vue"
import Paginator from "./components/Paginator.vue"
import Panel from "./components/Panel.vue"
import ProgressBar from "./components/ProgressBar.vue"
import RadioButton from "./components/RadioButton.vue"
import Select from "./components/Select.vue"
import Slider from "./components/Slider.vue"
import Switch from "./components/Switch.vue"
import Tab from "./components/Tab.vue"
import TabList from "./components/TabList.vue"
import TabPanel from "./components/TabPanel.vue"
import TabPanels from "./components/TabPanels.vue"
import Tabs from "./components/Tabs.vue"
import Tag from "./components/Tag.vue"
import Textarea from "./components/Textarea.vue"
import Timeline from "./components/Timeline.vue"
import Toast from "./components/Toast.vue"
import ToggleButton from "./components/ToggleButton.vue"
import Toolbar from "./components/Toolbar.vue"
import Tooltip from "./components/Tooltip.vue"
import type { ToastMessageOptionsPublic } from "./components/Toast.vue"

// ---------------------------------------------------------------- 暗色切换
// kit/theme.ts 识别三种暗色触发：prefers-color-scheme / [data-theme="dark"] / .dark
const isDark = ref(false)
function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle("dark", isDark.value)
}

// ---------------------------------------------------------------- 表单状态
const name = ref("张三")
const password = ref("")
const bio = ref("")
const agree = ref(false)
const notify = ref(true)
const volume = ref(60)
const plan = ref<"free" | "pro">("pro")
const color = ref("#3b82f6")

const planOptions = [
  { label: "免费版", value: "free" },
  { label: "专业版", value: "pro" },
  { label: "企业版", value: "enterprise", disabled: true },
]

// ---------------------------------------------------------------- 浮层状态
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const confirmVisible = ref(false)

const toastMessages = ref<ToastMessageOptionsPublic[]>([])
function pushToast() {
  toastMessages.value = [
    ...toastMessages.value,
    { severity: "success", summary: "保存成功", detail: "配置已写入本地存储", life: 3000 },
  ]
}

const date = ref<Date | null>(new Date())
const range = ref<Date[] | null>(null)

// ---------------------------------------------------------------- 分页
const page = ref(1)
const rows = ref(10)

// ---------------------------------------------------------------- 数据展示
const timelineEvents = [
  { title: "组件库初始化", time: "2026-09-12 10:00" },
  { title: "接入主题变量", time: "2026-09-12 11:30" },
  { title: "完成冒烟自测", time: "2026-09-12 15:20" },
]

const meterValue = [
  { label: "文档", value: 40, color: "#3b82f6" },
  { label: "图片", value: 30, color: "#10b981" },
  { label: "其它", value: 30, color: "#f59e0b" },
]

const selectedTab = ref("0")
const pinned = ref(false)

const progress = computed(() => Math.min(100, page.value * 10))
</script>

<template>
  <div class="demo">
    <header class="demo__head">
      <div>
        <h1>SN 通用组件库</h1>
        <p class="demo__sub">
          Vue 3 + Vite 7 · 52 个组件 · 零框架耦合 · 图标离线可用
        </p>
      </div>
      <Button
        :icon="isDark ? 'star' : 'starOutline'"
        outlined
        @click="toggleDark"
      >
        {{ isDark ? '切回亮色' : '切换暗色' }}
      </Button>
    </header>

    <!-- ==================== 1. 按钮 / 徽标 / 标签 ==================== -->
    <Card title="1. 按钮 · 徽标 · 标签" subtitle="Button / Badge / Tag">
      <div class="demo__row">
        <Button variant="primary">主要</Button>
        <Button variant="secondary">次要</Button>
        <Button severity="success">成功</Button>
        <Button severity="danger">危险</Button>
        <Button outlined>描边</Button>
        <Button text>纯文本</Button>
        <Button disabled>禁用</Button>
        <Button loading>加载中</Button>
        <Button icon="magnify" rounded aria-label="搜索" />
        <Button icon="save" icon-position="left">带图标</Button>
      </div>
      <Divider />
      <div class="demo__row">
        <Badge :content="5"><Button outlined>未读</Button></Badge>
        <Badge dot><Button outlined>在线</Button></Badge>
        <Badge :content="120" :max="99"><Button outlined>消息</Button></Badge>
        <Tag content="默认" />
        <Tag content="成功" variant="success" />
        <Tag content="警告" variant="warn" />
        <Tag content="错误" variant="error" />
        <Tag content="可关闭" closable @close="() => {}" />
        <Tag content="圆角" shape="circle" />

        <Tag content="默认" />
        <Tag content="主色" variant="primary" />
        <Tag content="信息" variant="info" />
        <Tag content="危险" variant="danger" />
      </div>
    </Card>

    <!-- ==================== 2. 表单基础 ==================== -->
    <Card title="2. 表单基础" subtitle="Input / Textarea / Checkbox / Switch / Slider / RadioButton / FormField">
      <div class="demo__grid">
        <Input v-model="name" label="用户名" placeholder="请输入" size="small" clearable />
        <Input
          v-model="password"
          label="密码"
          type="password"
          placeholder="请输入密码"
          size="small"
          show-password
        />
        <Input label="带前缀图标" prefix-icon="magnify" placeholder="搜索…" size="small" />
        <Input label="错误态" error="该字段不合法" size="small" />
        <Textarea
          v-model="bio"
          label="简介"
          placeholder="说点什么…"
          size="small"
          auto-resize
          :rows="2"
          :maxlength="100"
          show-count
        />
        <Input label="字数统计" :maxlength="20" show-count size="small" />
      </div>

      <Divider />

      <div class="demo__row demo__row--wrap">
        <Checkbox v-model="agree" label="同意条款" />
        <Checkbox :model-value="true" label="已选中（只读）" readonly />
        <RadioButton v-model="plan" value="free" label="免费版" name="plan-demo" />
        <RadioButton v-model="plan" value="pro" label="专业版" name="plan-demo" />
        <Switch v-model="notify" label="启用通知" />
        <ToggleButton
          v-model="pinned"
          on-label="已置顶"
          off-label="置顶"
          on-icon="star"
          off-icon="starOutline"
        />
      </div>

      <Divider />

      <Slider v-model="volume" label="音量" show-value show-min-max :min="0" :max="100" />
      <ColorField v-model="color" placeholder="#000000" />
      <p class="demo__hint">
        当前颜色：<code>{{ color }}</code> ·
        开关：{{ notify ? "开" : "关" }} · 套餐：{{ plan }}
      </p>
    </Card>

    <!-- ==================== 3. 选择类 ==================== -->
    <Card
      title="3. 选择类"
      subtitle="Select / DatePicker / Paginator / FileUpload（下拉为相对定位，父容器勿 overflow:hidden）"
    >
      <div class="demo__grid">
        <Select
          v-model="plan"
          :options="planOptions"
          label="套餐"
          size="small"
          filterable
          clearable
          placeholder="请选择"
        />
        <Select
          :options="[{ label: '选项 A', value: 'a' }, { label: '选项 B', value: 'b' }]"
          label="禁用"
          size="small"
          disabled
          placeholder="不可用"
        />
        <DatePicker v-model="date" label="日期" size="small" show-button-bar />
        <DatePicker v-model="range" label="日期范围" size="small" selection-mode="range" />
      </div>

      <Divider />

      <Paginator
        v-model:page="page"
        v-model:rows="rows"
        :total="95"
        show-report
        @change="() => {}"
      />

      <Divider />

      <FileUpload
        accept="image/*,.pdf"
        multiple
        :max-file-size="5 * 1024 * 1024"
        :file-limit="3"
        drag-text="拖拽文件到此处，或点击选择"
        hint-text="支持图片与 PDF，单个不超过 5MB，最多 3 个"
      />
    </Card>

    <!-- ==================== 4. 浮层类 ==================== -->
    <Card title="4. 浮层类" subtitle="Dialog / Drawer / ConfirmDialog / Toast / Message / Tooltip / Panel">
      <div class="demo__row">
        <Button @click="dialogVisible = true">打开 Dialog</Button>
        <Button outlined @click="drawerVisible = true">打开 Drawer</Button>
        <Button severity="danger" outlined @click="confirmVisible = true">打开 Confirm</Button>
        <Button @click="pushToast">弹出 Toast</Button>
        <Tooltip text="我是一个提示气泡">
          <Button text>悬浮查看 Tooltip</Button>
        </Tooltip>
        <Button
          outlined
          title="原生 title 提示也可用"
        >
          点我
        </Button>
      </div>

      <Divider />

      <div class="demo__stack">
        <Message severity="success" closable @close="() => {}">操作成功：数据已保存</Message>
        <Message severity="info" closable @close="() => {}">提示：这里是一条信息</Message>
        <Message severity="warn" closable @close="() => {}">警告：请检查配置项</Message>
        <Message severity="error" closable @close="() => {}">错误：请求失败</Message>
      </div>

      <Divider />

      <Panel header="可折叠面板（Panel）" toggleable>
        <p>面板内容：Panel 支持 toggleable 折叠，箭头图标来自 kit/icons.ts。</p>
      </Panel>
    </Card>

    <!-- ==================== 5. 标签页 / 工具栏 / 布局 ==================== -->
    <Card title="5. 标签页 · 工具栏 · 布局" subtitle="Tabs 系列 / Toolbar / Splitter / Sidebar">
      <Tabs v-model="selectedTab">
        <TabList>
          <Tab value="0">概览</Tab>
          <Tab value="1">详情</Tab>
          <Tab value="2">设置</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <p>概览面板内容。当前值：{{ selectedTab }}</p>
          </TabPanel>
          <TabPanel value="1">
            <p>详情面板内容。</p>
          </TabPanel>
          <TabPanel value="2">
            <p>设置面板内容。</p>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Divider />

      <Toolbar>
        <Button icon="save" text>保存</Button>
        <Button icon="refresh" text>刷新</Button>
        <Button icon="delete" text>删除</Button>
        <Button icon="settings" text>设置</Button>
      </Toolbar>
    </Card>

    <!-- ==================== 6. 数据展示 ==================== -->
    <Card title="6. 数据展示" subtitle="ProgressBar / MeterGroup / Timeline / Loader">
      <ProgressBar :value="progress" show-value />
      <Divider />
      <MeterGroup :value="meterValue" :max="100" />
      <Divider />
      <Timeline :value="timelineEvents">
        <template #content="slotProps">
          <div>
            <strong>{{ slotProps.item.title }}</strong>
            <div class="demo__hint">{{ slotProps.item.time }}</div>
          </div>
        </template>
      </Timeline>
      <Divider />
      <div class="demo__loader">
        <!-- Loader 无 props 且 height:100%，父容器必须给显式高度 -->
        <Loader />
      </div>
    </Card>

    <footer class="demo__foot">
      组件库源码位于 <code>src/components/</code>；主题变量为 <code>--b3-theme-*</code>。
    </footer>

    <!-- ==================== 浮层实体 ==================== -->
    <Dialog v-model:visible="dialogVisible" header="Dialog 标题" :dismissable-mask="true">
      <p>这是一个 Dialog。支持 Esc 关闭、遮罩点击关闭、焦点陷阱。</p>
      <Input label="弹窗内输入框" size="small" placeholder="试试 Tab 键循环" />
      <template #footer>
        <Button text @click="dialogVisible = false">取消</Button>
        <Button @click="dialogVisible = false">确定</Button>
      </template>
    </Dialog>

    <Drawer v-model:visible="drawerVisible" header="Drawer 标题" position="right">
      <p>这是一个从右侧滑出的 Drawer。</p>
      <Button outlined @click="drawerVisible = false">关闭</Button>
    </Drawer>

    <ConfirmDialog
      v-model:visible="confirmVisible"
      header="确认删除"
      message="删除后不可恢复，确定继续吗？"
      accept-label="删除"
      reject-label="取消"
      @accept="confirmVisible = false"
      @reject="confirmVisible = false"
    />

    <Toast v-model:messages="toastMessages" position="top-right" />
  </div>
</template>

<style scoped>
.demo {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
  color: var(--b3-theme-on-background, #1a1a1a);
  background: var(--b3-theme-background, #fff);
}

.demo__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.demo__head h1 {
  margin: 0 0 4px;
  font-size: 22px;
}

.demo__sub {
  margin: 0;
  font-size: 13px;
  color: var(--b3-theme-secondary, #8a8a8a);
}

.demo__row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.demo__row--wrap {
  flex-wrap: wrap;
}

.demo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  align-items: start;
}

.demo__stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.demo__hint {
  font-size: 12px;
  color: var(--b3-theme-secondary, #8a8a8a);
  margin: 6px 0 0;
}

.demo__loader {
  height: 80px;
}

.demo__foot {
  font-size: 12px;
  color: var(--b3-theme-secondary, #8a8a8a);
  text-align: center;
  padding-top: 8px;
}

code {
  background: var(--b3-theme-surface-light, #efefec);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
}
</style>

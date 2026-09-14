/**
 * demo/registry.ts —— 演示页注册表
 *
 * 这是「左侧组件目录」的**唯一数据源**，同时决定右侧渲染哪个视图。
 * 新增组件演示只需在这里加一条，App.vue 与侧边栏都无需改动。
 *
 * 每个条目：
 *   key    —— 唯一标识（也用作 URL hash）
 *   name   —— 左侧显示的中文名
 *   en     —— 组件英文名（用于副标题与检索）
 *   group  —— 所属分组
 *   view   —— 对应的演示视图组件（懒加载，避免一次性加载全部演示）
 *   note   —— 可选提示（显示在左侧条目下或视图顶部）
 */

import type { Component } from "vue"
import { defineAsyncComponent } from "vue"

/** 懒加载视图：切换目录项时才真正加载，加快首屏 */
function lazy(loader: () => Promise<{ default: Component }>) {
  return defineAsyncComponent({ loader, delay: 0 })
}

export interface DemoEntry {
  key: string
  name: string
  en: string
  group: string
  view: Component
  note?: string
}

export interface DemoGroup {
  name: string
  entries: DemoEntry[]
}

// ---------------------------------------------------------------------------
// 分组定义：与左侧目录的分节一一对应
//
// 说明：为保持可维护性，同组内多个组件共用一个视图文件（见 views/ 下的分组视图），
// 每个条目在视图内以「小标题 + 独立示例」的方式单独呈现。
// 这样 50+ 个组件只需要十余个视图文件，目录粒度却可以细到单个组件。
// ---------------------------------------------------------------------------

export const GROUP_ORDER = [
  "基础",
  "表单",
  "选择器",
  "浮层",
  "数据展示",
  "导航与菜单",
  "布局",
  "其它",
] as const

export const DEMOS: DemoEntry[] = [
  // ---------------------------------------------------------------- 基础
  { key: "button", name: "按钮", en: "Button", group: "基础", view: lazy(() => import("./views/ButtonsView.vue")) },
  { key: "buttongroup", name: "输入框组", en: "InputGroup / InputGroupAddon", group: "基础", view: lazy(() => import("./views/InputsView.vue")) },
  { key: "icon", name: "图标", en: "IconWrapper", group: "基础", view: lazy(() => import("./views/IconView.vue")) },
  { key: "label", name: "标签文字", en: "Label", group: "基础", view: lazy(() => import("./views/LabelView.vue")) },
  { key: "avatar", name: "头像", en: "Avatar", group: "基础", view: lazy(() => import("./views/AvatarView.vue")) },
  { key: "tag", name: "标签", en: "Tag", group: "基础", view: lazy(() => import("./views/TagsView.vue")) },
  { key: "badge", name: "徽标", en: "Badge", group: "基础", view: lazy(() => import("./views/TagsView.vue")) },
  { key: "divider", name: "分隔线", en: "Divider", group: "基础", view: lazy(() => import("./views/TagsView.vue")) },
  { key: "card", name: "卡片", en: "Card", group: "基础", view: lazy(() => import("./views/CardView.vue")) },

  // ---------------------------------------------------------------- 表单
  { key: "input", name: "输入框", en: "Input", group: "表单", view: lazy(() => import("./views/InputsView.vue")) },
  { key: "textarea", name: "多行文本", en: "Textarea", group: "表单", view: lazy(() => import("./views/InputsView.vue")) },
  { key: "formfield", name: "表单字段", en: "FormField", group: "表单", view: lazy(() => import("./views/InputsView.vue")), note: "控件必须写在默认插槽内" },
  { key: "checkbox", name: "复选框", en: "Checkbox", group: "表单", view: lazy(() => import("./views/TogglesView.vue")) },
  { key: "radiobutton", name: "单选框", en: "RadioButton", group: "表单", view: lazy(() => import("./views/TogglesView.vue")) },
  { key: "switch", name: "开关", en: "Switch", group: "表单", view: lazy(() => import("./views/TogglesView.vue")) },
  { key: "togglebutton", name: "切换按钮", en: "ToggleButton", group: "表单", view: lazy(() => import("./views/TogglesView.vue")), note: "用 onLabel / offLabel" },
  { key: "slider", name: "滑块", en: "Slider", group: "表单", view: lazy(() => import("./views/SliderView.vue")) },
  { key: "colorfield", name: "颜色选择", en: "ColorField", group: "表单", view: lazy(() => import("./views/SliderView.vue")) },
  { key: "fileupload", name: "文件上传", en: "FileUpload", group: "表单", view: lazy(() => import("./views/FileUploadView.vue")) },

  // ---------------------------------------------------------------- 选择器
  { key: "select", name: "下拉选择", en: "Select", group: "选择器", view: lazy(() => import("./views/SelectView.vue")) },
  { key: "listbox", name: "列表选择", en: "Listbox", group: "选择器", view: lazy(() => import("./views/ListboxView.vue")) },
  { key: "datepicker", name: "日期选择", en: "DatePicker", group: "选择器", view: lazy(() => import("./views/DatePickerView.vue")) },
  { key: "inplace", name: "就地编辑", en: "Inplace", group: "选择器", view: lazy(() => import("./views/InplaceView.vue")) },

  // ---------------------------------------------------------------- 浮层
  { key: "dialog", name: "对话框", en: "Dialog", group: "浮层", view: lazy(() => import("./views/OverlaysView.vue")) },
  { key: "drawer", name: "抽屉", en: "Drawer", group: "浮层", view: lazy(() => import("./views/OverlaysView.vue")) },
  { key: "confirmdialog", name: "确认对话框", en: "ConfirmDialog", group: "浮层", view: lazy(() => import("./views/OverlaysView.vue")) },
  { key: "confirmpopup", name: "确认气泡", en: "ConfirmPopup", group: "浮层", view: lazy(() => import("./views/ConfirmPopupView.vue")) },
  { key: "tooltip", name: "文字提示", en: "Tooltip", group: "浮层", view: lazy(() => import("./views/OverlaysView.vue")) },
  { key: "toast", name: "轻提示", en: "Toast", group: "浮层", view: lazy(() => import("./views/FeedbackView.vue")) },
  { key: "message", name: "消息条", en: "Message", group: "浮层", view: lazy(() => import("./views/FeedbackView.vue")) },
  { key: "focustrap", name: "焦点陷阱", en: "FocusTrap", group: "浮层", view: lazy(() => import("./views/FocusTrapView.vue")) },

  // ---------------------------------------------------------------- 数据展示
  { key: "progressbar", name: "进度条", en: "ProgressBar", group: "数据展示", view: lazy(() => import("./views/DataView.vue")) },
  { key: "metergroup", name: "度量组", en: "MeterGroup", group: "数据展示", view: lazy(() => import("./views/DataView.vue")) },
  { key: "timeline", name: "时间线", en: "Timeline", group: "数据展示", view: lazy(() => import("./views/DataView.vue")) },
  { key: "loader", name: "加载中", en: "Loader", group: "数据展示", view: lazy(() => import("./views/DataView.vue")), note: "父容器需显式高度" },
  { key: "chart", name: "图表", en: "Chart", group: "数据展示", view: lazy(() => import("./views/ChartView.vue")), note: "需另装 chart.js" },
  { key: "paginator", name: "分页器", en: "Paginator", group: "数据展示", view: lazy(() => import("./views/PaginatorView.vue")) },
  { key: "panel", name: "可折叠面板", en: "Panel", group: "数据展示", view: lazy(() => import("./views/PanelView.vue")) },

  // ---------------------------------------------------------------- 导航与菜单
  { key: "tabs", name: "标签页", en: "Tabs / TabList / Tab / TabPanels / TabPanel", group: "导航与菜单", view: lazy(() => import("./views/TabsView.vue")) },
  { key: "toolbar", name: "工具栏", en: "Toolbar", group: "导航与菜单", view: lazy(() => import("./views/TabsView.vue")) },
  { key: "tiermenu", name: "多级菜单", en: "TieredMenu", group: "导航与菜单", view: lazy(() => import("./views/TieredMenuView.vue")) },
  { key: "megamenu", name: "超级菜单", en: "MegaMenu", group: "导航与菜单", view: lazy(() => import("./views/MegaMenuView.vue")) },
  { key: "speeddial", name: "悬浮操作", en: "SpeedDial", group: "导航与菜单", view: lazy(() => import("./views/SpeedDialView.vue")) },

  // ---------------------------------------------------------------- 布局
  { key: "splitter", name: "分割面板", en: "Splitter / SplitterPanel", group: "布局", view: lazy(() => import("./views/SplitterView.vue")) },
  { key: "sidebar", name: "侧边栏", en: "Sidebar / SidebarMain", group: "布局", view: lazy(() => import("./views/SidebarView.vue")) },
]

/** 按分组聚合，供左侧目录渲染（保持 GROUP_ORDER 的顺序） */
export function groupedDemos(): DemoGroup[] {
  const groups: DemoGroup[] = []
  for (const g of GROUP_ORDER) {
    const entries = DEMOS.filter((d) => d.group === g)
    if (entries.length > 0) groups.push({ name: g, entries })
  }
  return groups
}

/** 组件总数（用于页头统计；与组件库公开组件数对齐） */
export const COMPONENT_COUNT = 52

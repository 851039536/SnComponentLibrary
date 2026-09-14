/**
 * 组件库公共入口（npm 包入口）
 *
 * 设计取舍：
 * - **只导出 52 个公开组件**（`components/*.vue` 根级），不导出各私有子目录
 *   （`select/`、`datePicker/` 等属内部实现，导出会锁死内部结构）。
 * - 全部使用**具名导出**且不产生副作用聚合，配合打包器的 tree-shaking，
 *   使用方 `import { Button } from "sn-component-library"` 时未用到的组件不会进产物。
 * - 额外导出 `kit/` 里的公共能力（主题、图标表、格式化工具），供使用方定制。
 *
 * 注意：CSS 不在此处 import。组件样式随各自 `.vue` 的 <style> 块编译进产物，
 * 使用方一次性引入 `sn-component-library/style.css` 即可（见 README）。
 */

// ---------------------------------------------------------------- 主题与图标
export { applyDefaultTheme } from "./components/kit/theme"
export type { ThemeOptions } from "./components/kit/theme"

export {
  COMMON_ICONS,
  FEATURE_ICONS,
  getIconConfig,
} from "./components/kit/icons"
export type {
  CommonIconKey,
  FeatureIconKey,
  IconKey,
} from "./components/kit/icons"

export { setupKitIcons } from "./components/kit/iconify"
export { formatFileSize } from "./components/kit/format"

// ⚠️ Chart 刻意**不**在此导出：它是全库唯一依赖重量级第三方库（chart.js /
// vue-chartjs）的组件。库产出的 index.js 是单文件 bundle，任何被此入口
// 引用的模块都会在加载时执行其顶层 import——即使使用方从不用图表，也会因
// 缺少 chart.js 而构建失败。因此 Chart 走独立子入口：
//     import Chart from "sn-component-library/chart"
// 该子入口把 chart.js / vue-chartjs 声明为 peer，只有真正用图表的项目才需安装。

// ---------------------------------------------------------------- 表单控件
export { default as Button } from "./components/Button.vue"
export { default as Checkbox } from "./components/Checkbox.vue"
export { default as ColorField } from "./components/ColorField.vue"
export { default as DatePicker } from "./components/DatePicker.vue"
export { default as FileUpload } from "./components/FileUpload.vue"
export { default as FormField } from "./components/FormField.vue"
export { default as Input } from "./components/Input.vue"
export { default as InputGroup } from "./components/InputGroup.vue"
export { default as InputGroupAddon } from "./components/InputGroupAddon.vue"
export { default as Listbox } from "./components/Listbox.vue"
export { default as RadioButton } from "./components/RadioButton.vue"
export { default as Select } from "./components/Select.vue"
export { default as Slider } from "./components/Slider.vue"
export { default as Switch } from "./components/Switch.vue"
export { default as Textarea } from "./components/Textarea.vue"
export { default as ToggleButton } from "./components/ToggleButton.vue"

// ---------------------------------------------------------------- 浮层与反馈
export { default as ConfirmDialog } from "./components/ConfirmDialog.vue"
export { default as ConfirmPopup } from "./components/ConfirmPopup.vue"
export { default as Dialog } from "./components/Dialog.vue"
export { default as Drawer } from "./components/Drawer.vue"
export { default as Message } from "./components/Message.vue"
export { default as Toast } from "./components/Toast.vue"
export { default as Tooltip } from "./components/Tooltip.vue"

// ---------------------------------------------------------------- 展示与布局
export { default as Avatar } from "./components/Avatar.vue"
export { default as Badge } from "./components/Badge.vue"
export { default as Card } from "./components/Card.vue"
export { default as Divider } from "./components/Divider.vue"
export { default as FocusTrap } from "./components/FocusTrap.vue"
export { default as IconWrapper } from "./components/IconWrapper.vue"
export { default as Inplace } from "./components/Inplace.vue"
export { default as Label } from "./components/Label.vue"
export { default as Loader } from "./components/Loader.vue"
export { default as MegaMenu } from "./components/MegaMenu.vue"
export { default as MeterGroup } from "./components/MeterGroup.vue"
export { default as Paginator } from "./components/Paginator.vue"
export { default as Panel } from "./components/Panel.vue"
export { default as ProgressBar } from "./components/ProgressBar.vue"
export { default as Sidebar } from "./components/Sidebar.vue"
export { default as SidebarMain } from "./components/SidebarMain.vue"
export { default as SpeedDial } from "./components/SpeedDial.vue"
export { default as Splitter } from "./components/Splitter.vue"
export { default as SplitterPanel } from "./components/SplitterPanel.vue"
export { default as Tab } from "./components/Tab.vue"
export { default as TabList } from "./components/TabList.vue"
export { default as TabPanel } from "./components/TabPanel.vue"
export { default as TabPanels } from "./components/TabPanels.vue"
export { default as Tabs } from "./components/Tabs.vue"
export { default as Tag } from "./components/Tag.vue"
export { default as TieredMenu } from "./components/TieredMenu.vue"
export { default as Timeline } from "./components/Timeline.vue"
export { default as Toolbar } from "./components/Toolbar.vue"

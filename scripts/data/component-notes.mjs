/**
 * scripts/data/component-notes.mjs —— 人工维护的「坑」与约束
 *
 * 这是文档生成里**唯一手写**的数据源。其余内容（props / emits / slots / 取值）
 * 全部由 scripts/lib/docs.mjs 从 .d.ts 机械提取，保证与真实 API 一致。
 *
 * 维护约定：
 * - 新增一条「易错用法」时，必须是自己或他人**真实踩过**的，并在本仓库
 *   AGENTS.md「已知踩坑清单」里有对应记载；不要凭猜想添加。
 * - key 用组件名（与 components/*.vue 同名，不带扩展名）。
 */

/** 使用约束（全局，来自 README 第五章，已实测） */
export const CONSTRAINTS = [
  "**`Button` 没有 `label` 属性**，文字必须写在默认插槽里：`<Button>保存</Button>`。写成 `<Button label=\"保存\" />` 不报错但按钮是空的。同理 `Tab`；`ToggleButton` 用 `onLabel` / `offLabel`。",
  "**图标名必须是 `sn-component-library` 注册过的键**（如 `icon=\"close\"`），**不能**写 `\"mdi:close\"`，否则渲染成问号圆圈且不报错。",
  "**`Select` / `DatePicker` 的下拉是相对定位**（不是传送门挂 body），父容器 `overflow: hidden` 会把下拉裁掉。",
  "**`FormField` 是多根组件**：控件必须写在它的默认插槽里，写在旁边会让提示文字跑到控件上方。",
  "**`Loader` 没有 props 且高度 100%**：父容器必须给显式高度，否则高度为 0 看不见。",
  "`Input` / `Select` / `Textarea` 在表单里建议显式写 `size=\"small\"`（默认就是 small，medium 偏大）。",
  "**浏览器要求**：组件样式使用了较新的 CSS 相对颜色语法（Chromium 119+ / Safari 16.4+ / Firefox 128+）。",
  "**`Chart` 必须放在有显式高度的容器里**（内部是 `maintainAspectRatio: false`），否则高度塌陷。",
]

/** 易错用法对照表（错误 → 正确）。这些都是实际写错过的。 */
export const WRONG_USAGES = [
  { wrong: "<Button label=\"保存\" />", right: "<Button>保存</Button>", why: "Button 没有 label 属性，文字走默认插槽" },
  { wrong: "<Tab label=\"详情\" />", right: "<Tab>详情</Tab>", why: "同理，Tab 的文案也走插槽" },
  { wrong: "<ToggleButton label=\"置顶\" icon=\"star\" />", right: "on-label / off-label / on-icon / off-icon", why: "ToggleButton 的文案与图标按开关态区分" },
  { wrong: "<Tag severity=\"success\" />", right: "<Tag variant=\"success\" />", why: "Tag 的颜色轴叫 variant" },
  { wrong: "<Badge variant=\"warn\" />", right: "<Badge variant=\"warning\" />", why: "Badge 用 warning 全称（不在取值内的值会静默失效）" },
  { wrong: "<Dialog position=\"top-right\" />", right: "<Dialog position=\"topright\" />", why: "位置取值无连字符" },
  { wrong: "<Card variant=\"default\" />", right: "bordered / outlined / elevated / flat", why: "没有 default 这个变体" },
  { wrong: "Select 分组选项 { label, items }", right: "{ isGroup: true, label, options }", why: "分组项结构固定" },
  { wrong: "Inplace 用默认插槽", right: "具名插槽 display + content", why: "content 插槽作用域给 closeCallback" },
  { wrong: "Chart 数据用 { labels, datasets }", right: "扁平数组 [{ label, value }]", why: "Chart 是简化封装，不是 chart.js 原生结构" },
]

/** 各组件补充说明（按组件名索引） */
export const COMPONENT_NOTES = {
  Button: ["文字写在默认插槽里，**没有 `label` 属性**。"],
  Tag: ["颜色轴是 `variant`（不是 `severity`）。", "内容可用 `content` 属性或默认插槽。"],
  Badge: ["变体用 `warning` 全称，不是 `warn`。"],
  Dialog: ["显隐受控：`v-model:visible`，组件不会自己改状态。", "`position` 取值无连字符：`topleft` / `topright` / `bottomleft` / `bottomright`。"],
  Drawer: ["显隐受控：`v-model:visible`。", "`position` 取 left / right / top / bottom。"],
  ConfirmDialog: ["显隐受控：`v-model:visible`，`@accept` / `@reject` 由调用方决定是否关闭。"],
  ConfirmPopup: ["锚定在 `target` 元素旁，不是居中模态。", "适合「删除某一行」这类就地二次确认。"],
  Toast: ["受控组件：`v-model:messages` 传消息队列，组件派发移除后的新数组由调用方回写。", "`life` 为毫秒，不传则常驻。"],
  Message: ["行内提示，不是浮层。", "组件**不自动隐藏**，是否移除由调用方用 `v-if` 决定。"],
  Tooltip: ["默认由 hover / focus 驱动，也可 `v-model:visible` 受控。"],
  Select: ["下拉是相对定位，父容器 `overflow: hidden` 会裁掉。", "分组选项必须带 `isGroup: true`。"],
  DatePicker: ["下拉是相对定位，父容器 `overflow: hidden` 会裁掉。", "`valueFormat` 为真时模型值是字符串。"],
  Listbox: ["选项平铺在页面里（不弹层），适合选项不多的场景。"],
  Inplace: ["用**具名插槽** `display`（只读态）与 `content`（编辑态，作用域给 `closeCallback`）。"],
  FormField: ["多根组件：控件必须写在默认插槽里。"],
  Loader: ["无 props 且 `height: 100%`，父容器必须给显式高度。"],
  FileUpload: ["组件**不做网络请求**，上传与进度由调用方通过 `uploading` / `progress` 回传。"],
  Chart: ["**不在主入口**，从 `sn-component-library/chart` 导入。", "需要另装 `chart.js` 与 `vue-chartjs`。", "`data` 是**扁平数组** `[{ label, value }]`，不是 chart.js 的 `{ labels, datasets }`。", "必须放在有显式高度的容器里。"],
  Splitter: ["`sizes` 是**百分比**（0–100，会自动归一化到 100），不是像素。", "`stateKey` 可把尺寸记忆到浏览器存储。"],
  Sidebar: ["折叠/展开用 `v-model:open` 受控。", "`collapsible=\"icon\"` 时收起只留图标。"],
  TieredMenu: ["`model` 是树形结构，`items` 嵌套即为子菜单。", "`separator: true` 的项只渲染分隔线，只需 `key`。"],
  MegaMenu: ["`header: true` 的项作为列标题，本身不可点击。"],
  SpeedDial: ["点击主按钮环形展开，`direction` 取 up / down / left / right。"],
  ProgressBar: ["`value` 超出 0~100 会被钳制而非溢出容器。"],
  MeterGroup: ["每段长度 =（该项 value − min）/（max − min），即各段各自映射到整个区间。"],
  Paginator: ["`page` 从 1 开始。", "用 `v-model:page` 与 `v-model:rows` 双向绑定。"],
  Panel: ["`toggleable` 开启后标题栏出现折叠箭头；`collapsed` 可用 `v-model:collapsed` 受控。"],
  Avatar: ["回退优先级：`src` 图片 → `text` 文字 → `icon` 图标，图片加载失败也会回退。"],
  IconWrapper: ["图标名必须是注册过的键（见包的 `kit/icons.ts`），不能写 `mdi:xxx`。"],
  Tabs: ["五件套配合：`Tabs` 持 `v-model`，`TabList` 放 `Tab`，`TabPanels` 放 `TabPanel`，`value` 一一对应。"],
  Timeline: ["内容通过 `content` 作用域插槽自定义；另有 `opposite` / `marker` 插槽。"],
}

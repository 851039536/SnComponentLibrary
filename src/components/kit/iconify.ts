/**
 * kit/iconify.ts —— 图标数据离线注册（自包含迁移的组成部分）
 *
 * 把 mdi 图标集注入 @iconify/vue 的内部注册表，使 <Icon icon="mdi:*"> 完全离线可用。
 * 未注册时 @iconify/vue 会转而请求 api.iconify.design，断网/内网环境下图标全部
 * 空白且不报错，是最容易漏、症状最迷惑的一步。
 *
 * 组件库只使用 mdi 图标集（kit/icons.ts 内 100% 为 mdi:*），因此这里仅注册 mdi；
 * ph 等其他图标集由宿主项目按需自行注册（本仓库见 src/utils/iconifySetup.ts）。
 *
 * 由 IconWrapper.vue 以副作用导入（import "./kit/iconify"）触发 —— 图标数据只在
 * 真正用到图标的产物中出现，纯展示类组件不会被迫打包整套 mdi 数据。模块级幂等。
 *
 * ## 数据来源：裁切后的子集（体积关键）
 *
 * 全量 mdi 有 7638 个图标（约 2.8 MB），而本库只用到 201 个。若整包静态引入，
 * 由于 `addCollection(整包默认导入)` 的参数不是可静态分析的具名引用，Rollup
 * 无法 tree-shake —— 实测会把约 89% 的产物体积浪费在永远用不到的图标上
 * （主入口 3.17 MB，其中 2.82 MB 是永不使用的图标）。
 *
 * 因此库构建前由 `scripts/lib/prune-icons.mjs` 生成 `src/components/kit/mdi-subset.json`，
 * 这里**优先静态引入**它（见下方「为什么全量数据必须动态 import」）。
 *
 * ## 回退策略（保住「整目录复制」这条交付线）
 *
 * `mdi-subset.json` 是构建生成物，不提交版本库。若它不存在（例如把
 * `src/components/` 整目录复制到第三方项目、没跑构建脚本），这里会回退到全量数据，
 * 保证那条交付线**开箱可用**，代价只是体积回到 3 MB。
 *
 * ## ⚠️ 为什么全量数据必须用动态 import（不要改回顶层 import）
 *
 * 最初的回退实现写的是顶层 `import mdiIcons from "@iconify-json/mdi/icons.json"`，
 * 结果产物从 3.17 MB **涨到 3.38 MB** —— 因为静态 import 让全量数据**无条件**
 * 进入产物，再叠加子集，两套数据同时被打包。
 *
 * 正确写法是动态 `import()`：正常构建路径（子集存在）下该分支不会执行，
 * Rollup 会把它拆成独立 chunk 且**不被主入口静态引用**，因此永不加载。
 * `scripts/lib/verify.mjs` 的校验 3/4 会同时断言「主入口图标数在预算内」
 * 与「回退 chunk 未被静态引用」，改回静态 import 会当场失败。
 */

import type { IconifyJSON } from "@iconify/vue"
import { addCollection } from "@iconify/vue"

/**
 * 子集存在时由 Vite 在构建期静态解析并内联（`eager: true`）。
 * 文件不存在时该 glob 结果为空对象，**不会**让构建失败 —— 这正是回退的实现基础。
 */
const subsetModules = import.meta.glob("./mdi-subset.json", { eager: true }) as Record<
  string,
  { default?: IconifyJSON }
>

let registered = false

/** 取出子集数据；不存在时返回 null。 */
function getSubset(): IconifyJSON | null {
  const entry = subsetModules["./mdi-subset.json"]
  if (!entry)
    return null
  const data = (entry.default ?? entry) as IconifyJSON
  return data && typeof data === "object" ? data : null
}

/** 注册 mdi 图标集（幂等；重复调用无副作用） */
export function setupKitIcons(): void {
  if (registered)
    return

  const subset = getSubset()
  if (subset) {
    addCollection(subset)
    registered = true
    return
  }

  // 回退：子集缺失（把 src/components/ 整目录复制到第三方项目、未跑构建脚本）
  // → 加载全量数据。
  //
  // ⚠️ 必须用**动态** import，理由见文件头注释。这里再补一层保险：
  // 用变量拼接说明符，避免打包器在「子集已存在」的正常路径下仍然把
  // @iconify-json/mdi 静态解析进产物图（否则使用方 dist 里会多出一个
  // 约 2.9 MB、但永远不会被加载的 chunk —— 实测确实会产生）。
  // 变量拼接使说明符无法被静态分析，因此只有真正执行到这一行才会去解析它。
  const fullSetSpecifier = "@iconify-json/mdi/icons.json"
  void import(/* @vite-ignore */ fullSetSpecifier).then((mod: any) => {
    if (registered)
      return
    addCollection((mod.default ?? mod) as any)
    registered = true
  }).catch((err) => {
    // 走到这里说明既没有子集、也拿不到全量数据 —— 图标会渲染成空白。
    // 不静默：这是「断网/内网环境图标全空白且不报错」这一历史坑的直接成因。
    console.warn(
      "[sn-component-library] 图标数据加载失败（mdi-subset.json 缺失且无法加载全量 mdi）。"
      + "请运行 `npm run icons:prune` 生成子集，或确认已安装 @iconify-json/mdi。",
      err,
    )
  })
}

// 副作用：被 IconWrapper import 时自动注册一次
setupKitIcons()

import js from "@eslint/js"
import ts from "typescript-eslint"
import vue from "eslint-plugin-vue"

/**
 * ESLint 配置
 *
 * 本配置的首要目的**不是**代码风格，而是把 AGENTS.md 里的「靠自觉」规则
 * 变成机器强制。最重要的一条是「组件内部只用相对路径，禁止 @/ 别名」——
 * AGENTS.md 原本靠一条手写 grep 自检：
 *
 *     grep -rnE '^\s*(import|export)[^/]*from\s+["'\'']@/' src/components/
 *
 * 手写 grep 的问题是：要记得跑、正则容易写歪、注释里的 `@/` 会误报。
 * 这里用 no-restricted-imports 精确表达同一约束，CI 每次都会跑。
 */
export default ts.config(
  {
    ignores: [
      "dist/**",
      "dist-lib/**",
      "node_modules/**",
      ".release/**",
      "src/components/docs/**",
      "src/components/kit/mdi-subset.json",
    ],
  },

  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs["flat/recommended"],

  {
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: [".vue"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
      // 组件库与演示页都是浏览器代码；不声明时 no-undef 会把 window/HTMLElement
      // 等标准全局全部报错（首次运行实测 285 个误报，全是这一类）。
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        history: "readonly",
        location: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLSelectElement: "readonly",
        Element: "readonly",
        Node: "readonly",
        Event: "readonly",
        KeyboardEvent: "readonly",
        MouseEvent: "readonly",
        FocusEvent: "readonly",
        CustomEvent: "readonly",
        File: "readonly",
        FileList: "readonly",
        Blob: "readonly",
        FormData: "readonly",
        URL: "readonly",
        getComputedStyle: "readonly",
        PointerEvent: "readonly",
        DragEvent: "readonly",
        TouchEvent: "readonly",
        SelectionMode: "readonly",
        AbortController: "readonly",
        DOMRect: "readonly",
        DOMParser: "readonly",
        FileReader: "readonly",
        Option: "readonly",
        URLSearchParams: "readonly",
        Image: "readonly",
        ResizeObserver: "readonly",
        MutationObserver: "readonly",
        IntersectionObserver: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
      },
    },
    rules: {
      // ---- 风格：交给约定，不设卡（避免把精力耗在格式上） ----
      //
      // ⚠️ 这里刻意关闭了**纯排版类**规则。原因与 AGENTS.md 的「零改写原则」直接相关：
      // src/components/ 与源仓库 siyuanPluginVueSN 保持逐字节一致，便于长期 diff 与同步。
      // 若在 ESLint 里强制模板换行/缩进，会迫使对 52 个组件做大规模纯格式改动，
      // 既无实质收益，又会彻底破坏可 diff 性。样式统一交给人工约定与 review。
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/multiline-html-element-content-newline": "off",
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/attributes-order": "off",
      "vue/first-attribute-linebreak": "off",
      "vue/attribute-hyphenation": "off",
      "vue/html-quotes": "off",
      "vue/order-in-components": "off",
      "vue/no-required-prop-with-default": "off",
      // `prefer-const` 在源码里已有既定写法，批量改动会污染与源仓库的 diff
      "prefer-const": "off",
    },
  },

  // ---- 组件库本体：零别名（AGENTS.md 硬规则 2） ----
  {
    files: ["src/components/**/*.{ts,vue}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/*", "@sn/ui/*", "@sn/*", "~/*"],
            message:
              "组件库内部禁止使用路径别名（AGENTS.md 硬规则 2）：整目录复制到第三方项目后会编译失败。请改用相对路径，例如 './Button.vue' 或 '../kit/format'。",
          },
        ],
      }],

      // `vue/no-dupe-keys` 实测在 src/components/SplitterPanel.vue 命中：
      // 该文件既有 prop `size`（第 56 行）又有同名局部 computed `size`（第 101 行）。
      // 目前**不构成实际错误**——`getSize: () => props.size` 读的是 prop，
      // 渲染用的 panelStyle 读的是局部 computed，二者恰好都对。
      // 但这是真实的遮蔽隐患：日后若有人在这两个名字间改错一处，不会报任何错，
      // 只会表现为尺寸异常。按「零改写原则」不在本仓库直接改源码（须回源仓库修），
      // 故这里保留为 **warning** 持续可见，而不是 error 挡住 CI。
      "vue/no-dupe-keys": "warn",
    },
  },

  // ---- 私有子目录不得被外部导入（AGENTS.md 硬规则 3） ----
  {
    files: ["src/demo/**/*.{ts,vue}", "src/App.vue", "tests/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: [
              "**/components/confirm/*",
              "**/components/datePicker/*",
              "**/components/fileUpload/*",
              "**/components/focustrap/*",
              "**/components/megaMenu/*",
              "**/components/metergroup/*",
              "**/components/overlay/*",
              "**/components/paginator/*",
              "**/components/select/*",
              "**/components/sidebar/*",
              "**/components/speedDial/*",
              "**/components/splitter/*",
              "**/components/tabs/*",
              "**/components/textarea/*",
              "**/components/tieredMenu/*",
              "**/components/timeline/*",
              "**/components/toast/*",
              "**/components/tooltip/*",
            ],
            message:
              "私有子目录是内部实现，不得从外部导入（AGENTS.md 硬规则 3）。请从根级公开组件导入。",
          },
        ],
      }],
    },
  },

  // ---- 测试：允许更大的自由度 ----
  {
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // ---- 脚本与配置：Node 环境 ----
  {
    files: ["scripts/**/*.mjs", "scripts/**/*.js", "*.config.ts", "*.config.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      // 脚本里 `let x = <初值>` 后紧跟 try/catch 赋值是常见且清晰的写法，
      // 该规则在此场景属误报（初值是有意义的兜底）。
      "no-useless-assignment": "off",
    },
  },

  // ---- 目标项目侧的模板脚本：**不是本仓库的构建脚本** ----
  //
  // scripts/templates/sncl-update.mjs 会被拷贝到第三方项目里独立运行，
  // 其运行环境由目标项目决定，不参与本仓库任何流程，故不做 lint 约束。
  {
    files: ["scripts/templates/**"],
    rules: {
      "no-undef": "off",
      "no-useless-assignment": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
)

# scripts/ —— 组件库发布 / 分发助手

给「把组件库打包并交付到其他项目」这件事用的一组脚本。**零第三方依赖**，只用 Node 内置模块，
所以发布会话里不会因为缺依赖而失败。

---

## 快速开始

```bash
npm run release          # 交互式菜单（推荐）
```

菜单长这样：

```
请选择操作（当前版本 1.0.0）
   1. 自动打包              校验 + 构建 + 出 tarball，版本号不变
   2. 自动打包（版本变化）   自动判定 patch/minor/major 并 bump
   3. 打包并安装到其他项目   出包 → 拷贝 → 自动安装 → 安装后校验
   4. 查看状态 / 发布历史    已记录的版本、目标项目、tarball 列表
   5. 退出
```

---

## 四个功能

### 1. 自动打包

```bash
npm run pack:lib
```

跑完四道校验后构建并产出 tarball，**版本号不变**（用于「改动很小，重新出个包」的场景）。

四道校验的意义是**避免把坏包发出去**，都是本项目真实踩过的坑：

| 校验 | 拦什么 |
|---|---|
| 1. 类型检查 | 类型错误 |
| 2. 产物完整性 | `dist-lib/` 缺 `index.js` / `chart.js` / `style.css` / `*.d.ts` |
| 3. 产物语义 | **主入口误引 `chart.js`** —— 会让未安装它的使用方直接构建失败（真实踩过） |
| 4. tarball 内容 | 包内漏了必需文件（例如 `style.css` 没打进去） |

产物落在 `.release/tarballs/sn-component-library-<版本>.tgz`。

### 2. 自动打包（版本变化）

```bash
npm run bump:lib              # 自动判定档位
npm run bump:lib -- minor     # 指定档位
```

自动判定规则（**取最高一档**，宁可跳大也不漏掉破坏性变更）：

| 信号 | 档位 |
|---|---|
| 删除公开组件（`components/*.vue`） | major |
| `src/index.ts` / `src/chart.ts` 移除导出 | major |
| 提交信息含 `BREAKING CHANGE` 或 `!:` | major |
| 新增公开组件 | minor |
| 新增入口文件、新增导出 | minor |
| 其余（改 bug、样式、注释、文档） | patch |

输出示例：

```
  版本判定：1.0.0 → 1.0.1  (patch)
  依据：
    · [patch] 组件内部实现变动 3 个文件
  共 6 个文件变更
```

判定不放心时会让你确认，也可以改手动选档位或保持版本不变。

> 判定基线记在 `.release/last-release-commit`，即「上次发布时的 commit」。
> 因此它看的是「自上次发布以来」的累计变更，而不是只盯最后一次提交。

### 3. 打包并安装到其他项目

```bash
npm run install:to                     # 交互式：选 tarball → 选目标项目 → 选模式
npm run install:to -- "D:\proj\myapp"  # 直接指定目标项目
npm run install:to -- "D:\proj\myapp" --no-touch
```

**会记住你用过的目标项目**（存在 `.release/state.json`），下次直接选，不用重输。
也会自动扫描同级目录下的 Vue 项目作为候选。

两种安装模式：

| 模式 | 行为 | 对方 `package.json` | 适用 |
|---|---|---|---|
| **依赖模式**（默认） | 拷 tarball 到对方 `libs/`，执行 `npm i ./libs/xxx.tgz` | 会写入 `file:libs/xxx.tgz` | 常规交付，可提交、可复现 |
| **直投模式**（`--no-touch`） | 解包直接覆盖对方 `node_modules/sn-component-library/` | **不改** | 只是临时试一下，或对方不许改依赖 |

安装后会自动在目标项目跑 `typecheck` / `build`，确认对方拿到的是能用的包。

> ⚠️ 直投模式的两个已知约束（脚本已处理/提示）：
> 1. 直投不触发 npm 依赖解析，所以脚本会**先把本库依赖补齐、再解包**。
>    顺序不能反 —— `npm install` 会清理 node_modules 里「不在 package.json 中」的包，
>    若先解包再装依赖，手工放入的本库会被 npm 删掉（这是实测踩到的坑）。
> 2. 对方再执行 `npm install` 时可能覆盖直投结果，需要重新投递。

### 3.1 安装时顺带投放「AI 组件库资料」（默认开启）

装完包后，脚本会向目标项目生成 `sn-components-docs/`（**只新增，不改对方任何已有文件**）：

| 文件 | 作用 |
|---|---|
| `USAGE.md` | 用法指南：三步接入、6 种常用写法、组件速查表、使用约束、易错写法对照 |
| `sn-components.agents.md` | 给 AI 的规则片段（含硬规则与易错表），供目标项目 `AGENTS.md` 引用 |
| `api.json` | **52 个组件的结构化 API**（props / 类型 / 取值枚举 / emits / slots / 中文说明） |

**为什么需要它**：装完包后，目标项目里能查到的只有埋得很深的 README 与零散的 `.d.ts`，
AI 写代码时只能**猜 props** —— 而本库已证实「猜 props 不报错，只会静默渲染错」
（如 `Button` 无 `label` 属性、`Badge` 用 `warning` 非 `warn`、`Dialog` 的 `topright` 无连字符）。
有了 `api.json`，AI 可先查再写。

**数据可信度**：`api.json` 的 props / emits / 取值**全部从 `.d.ts` 机械提取**，
非手写。已实测校验：52 个组件的 **550 个 props** 与 **102 个 emits** 与 `.d.ts` 逐项一致。
唯一手写的是「易错写法」与「使用约束」，集中在 `scripts/data/component-notes.mjs`
（每条都来自真实踩过的坑）。

**只读哪一个**：优先读目标项目**已安装包**的 `.d.ts`，
因此文档内容与「实际装到的版本」一致，而非与本仓库源码一致。

**投放时机**：在**安装后校验通过之后**。若包在对方项目里跑不起来，
就不生成文档 —— 避免给 AI 留下「照这份文档写」的错误依据。

**安装输出会打印还需手动完成的 2 步**（脚本刻意不代改已有文件）：

```
还需你手动完成 2 步（脚本不改动已有文件）：
  1) 在 src/renderer/src/main.ts 中加入：
       import "sn-component-library/style.css"
  2) 在本项目 AGENTS.md 中加一行引用，让 AI 自动读到规则：
       组件用法见 sn-components-docs/sn-components.agents.md（完整 API 见 api.json）
```

> 入口文件路径由脚本自动探测（依次找 `src/renderer/src/main.ts` / `src/main.ts` /
> `src/index.ts` / `main.ts`）。
>
> **为什么规则片段不叫 `AGENTS.xxx.md`**：曾用过 `AGENTS.sn-components.md`，
> 实测在 VS Code 里双击会提示「找不到该文件，无法打开编辑器」——
> 它既与目标项目自己的 `AGENTS.md` 同前缀，又是**多点**文件名
> （部分工具按第一个点取扩展名，得到 `.sn-components.md` 这种未知类型）。
> 改名为单点的 `sn-components.agents.md` 后不再有歧义。

**安全行为**：

- `--no-docs` 可完全跳过文档生成；
- 二次安装时，若某文件被手工改过（`.md` 的标记注释被删、或 `.json` 缺 `generatedBy` 字段），
  该文件**跳过覆盖**并告警，其余文件正常更新；
- 生成物只落在 `sn-components-docs/`，**不改动**目标项目的 `AGENTS.md`、`main.ts`、`package.json`（依赖除外）。

### 4. 查看状态 / 发布历史

```bash
npm run status
```

显示当前版本、已有 tarball、记住的目标项目（含各自已装版本）、以及最近 12 条发布历史。

---

## 目标项目侧：一键升级脚本（可选）

如果你希望**在目标项目里**一条命令完成升级，不必回到本仓库：

```bash
# 1. 把模板拷到目标项目根目录
cp scripts/templates/sncl-update.mjs  /path/to/target-project/

# 2. 改一下模板顶部的 LIB_PATH 指向本仓库（或用环境变量 SNCL_LIB_PATH）
#    默认值 ../SnComponentLibrary 适用于两个项目同级的情况

# 3. 之后在目标项目里
node sncl-update.mjs            # 拉最新 tarball 并安装 + typecheck 校验 + 刷新 AI 文档
node sncl-update.mjs --pack     # 先让本仓库自动打包（自动判定版本），再安装
node sncl-update.mjs --check    # 只比对版本，不做任何改动
node sncl-update.mjs --no-touch # 直投模式，不改本项目的 package.json
node sncl-update.mjs --no-docs  # 不生成 sn-components-docs/
```

> 模板本身只做「找包 + 比对版本 + 展示」，实际安装统一委托给本仓库的
> `release.mjs install`，因此两条路径的行为（含文档生成、安装后校验）不会漂移。

---

## 命令行参数（便于 CI / 快捷键）

```bash
node scripts/release.mjs                     # 交互式菜单
node scripts/release.mjs pack                # 功能 1
node scripts/release.mjs bump [patch|minor|major]
node scripts/release.mjs install <目标项目> [--no-touch] [--no-docs]
node scripts/release.mjs status              # 功能 4
```

`install` 在 CLI 模式下**不会**交互提问（自动取最新 tarball、默认依赖模式、默认生成文档），
方便写进 CI 或快捷方式。

---

## 文件结构

```
scripts/
├── release.mjs              # 主入口：菜单 + CLI 分发
├── lib/
│   ├── util.mjs             # 交互提问、着色输出、命令执行、状态持久化、项目扫描
│   ├── version.mjs          # 版本自动判定（分析 git 变更）与 bump
│   ├── verify.mjs           # 打包前后四道校验
│   ├── install.mjs          # 两种安装模式 + 安装后校验
│   └── docs.mjs             # 从 .d.ts 提取 52 个组件 API，生成 AI 文档三件套
├── data/
│   └── component-notes.mjs  # ★ 唯一手写数据：使用约束与易错写法（其余全部机械提取）
└── templates/
    └── sncl-update.mjs      # 目标项目侧一键升级脚本（模板，需拷到目标项目）
```

本机数据（已 gitignore，可随时删掉重来）：

```
.release/
├── tarballs/                # 产出的 .tgz
├── state.json               # 记住的目标项目 + 发布历史
└── last-release-commit      # 版本判定的对比基线
```

---

## 常见问题

**Q：`npm run bump:lib` 判定得不准怎么办？**
它会让你确认；不接受时可选手动档位。也可以直接 `npm run bump:lib -- major` 指定。

**Q：打包很慢？**
主要是类型检查与构建。想快速出包可用 `npm run pack:lib`（同样跑校验，但不动版本号）。

**Q：目标项目安装后 typecheck 失败？**
脚本会告警提示「若因本库破坏性变更所致，请考虑 bump major 并通知使用方」。
这也是为什么校验项 3 和安装后校验都值得留着。

**Q：能推到 npm registry 吗？**
本套脚本只做本地 tarball 分发，不碰 registry。要公开发布需自行
`npm publish`（注意先把 registry 从国内镜像切回 `registry.npmjs.org`，镜像通常是只读的）。

**Q：目标项目里 AI 还是写错组件 props？**
确认两件事：① 目标项目 `AGENTS.md` 里引用了规则片段
（`sn-components-docs/sn-components.agents.md`，或指向 `sn-components-docs/USAGE.md`），
否则 AI 不会主动去读；
② 直接告诉 AI「先读 `sn-components-docs/api.json` 确认 props，不要猜」。

**Q：文档里的组件数/版本对不上？**
`api.json` 优先读**目标项目已安装包**的 `.d.ts`。若目标项目装了旧版，文档就反映旧版
—— 这正是期望行为（文档与实际可用的 API 一致）。升级包后重跑安装即可刷新。

**Q：想改「易错写法」或「使用约束」这两张表？**
改 `scripts/data/component-notes.mjs`（这是唯一手写数据源），然后重跑安装。
不要去改目标项目里生成的文件 —— 它们带「勿手改」标记，且下次安装会覆盖
（手改过的会被跳过并告警）。

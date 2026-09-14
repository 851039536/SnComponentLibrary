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
node sncl-update.mjs            # 拉最新 tarball 并安装 + typecheck 校验
node sncl-update.mjs --pack     # 先让本仓库自动打包（自动判定版本），再安装
node sncl-update.mjs --check    # 只比对版本，不做任何改动
node sncl-update.mjs --no-touch # 直投模式，不改本项目的 package.json
```

---

## 命令行参数（便于 CI / 快捷键）

```bash
node scripts/release.mjs                     # 交互式菜单
node scripts/release.mjs pack                # 功能 1
node scripts/release.mjs bump [patch|minor|major]
node scripts/release.mjs install <目标项目> [--no-touch]
node scripts/release.mjs status              # 功能 4
```

`install` 在 CLI 模式下**不会**交互提问（自动取最新 tarball、默认依赖模式），
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
│   └── install.mjs          # 两种安装模式 + 安装后校验
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

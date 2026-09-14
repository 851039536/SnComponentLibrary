/**
 * 图表子入口：`import Chart from "sn-component-library/chart"`
 *
 * 单独入口的原因：
 * - Chart 依赖 chart.js / vue-chartjs（体积大，且非所有项目都需要）；
 * - 主入口 index.js 是单文件 bundle，被它引用的模块会在加载时执行顶层 import，
 *   若 Chart 挂在主入口，未安装 chart.js 的使用方会直接构建失败。
 *
 * 使用前请自行安装：
 *     npm i chart.js vue-chartjs
 */
export { default as Chart } from "./components/Chart.vue"
export type { ChartData, ChartOptions } from "./components/chart.types"

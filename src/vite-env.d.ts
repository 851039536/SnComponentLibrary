/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue"

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// ============================================================================
// Chart.vue 的可选依赖
//
// Chart.vue 是本库唯一依赖重量级第三方库的组件。为避免所有引入方被迫安装
// chart.js / vue-chartjs，这两个包不写入 package.json 的 dependencies。
// 只有真正使用 Chart.vue 时才需要 `npm i chart.js vue-chartjs`。
//
// 为了让「不使用图表」的项目也能通过类型检查，这里在模块缺失时提供占位声明。
// 补装依赖后，真实类型会优先于本声明生效（实际模块解析优先于 ambient 声明）。
// ============================================================================

declare module "chart.js" {
  export const Chart: any
  export function register(...args: any[]): void
  export type ChartData<T = any, L = any> = any
  export type ChartOptions<T = any> = any
  export type ChartType = any
  export type ChartDataset<T = any, L = any> = any
  export type ChartEvent = any
  export type ActiveElement = any
  export type TooltipItem<T = any> = any
  export type ScriptableContext<T = any> = any
  export type Plugin<T = any> = any
  export const CategoryScale: any
  export const LinearScale: any
  export const BarElement: any
  export const LineElement: any
  export const PointElement: any
  export const ArcElement: any
  export const RadialLinearScale: any
  export const Title: any
  export const Tooltip: any
  export const Legend: any
  export const Filler: any
  export const BarController: any
  export const LineController: any
  export const DoughnutController: any
  export const PieController: any
  export const RadarController: any
}

declare module "vue-chartjs" {
  import type { DefineComponent } from "vue"

  export const Bar: DefineComponent<any, any, any>
  export const Line: DefineComponent<any, any, any>
  export const Doughnut: DefineComponent<any, any, any>
  export const Pie: DefineComponent<any, any, any>
  export const Radar: DefineComponent<any, any, any>
  export const PolarArea: DefineComponent<any, any, any>
  export const Bubble: DefineComponent<any, any, any>
  export const Scatter: DefineComponent<any, any, any>
}

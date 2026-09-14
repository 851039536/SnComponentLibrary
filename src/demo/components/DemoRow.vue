<script setup lang="ts">
/**
 * 演示行：把一组示例横向排列，空间不足时自动换行。
 * 用于「按钮的十种外观」这类并排对照。
 */
interface Props {
  /** 垂直居中（默认）还是顶部对齐 —— 表单类控件建议 top */
  align?: "center" | "top"
  /** 是否允许换行 */
  wrap?: boolean
  /** 间距档位 */
  gap?: "small" | "medium" | "large"
}

const props = withDefaults(defineProps<Props>(), {
  align: "center",
  wrap: true,
  gap: "medium",
})
</script>

<template>
  <div
    class="row"
    :class="[
      `row--align-${props.align}`,
      `row--gap-${props.gap}`,
      { 'row--wrap': props.wrap },
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.row {
  display: flex;
}
.row--wrap { flex-wrap: wrap; }
.row--align-center { align-items: center; }
.row--align-top { align-items: flex-start; }
.row--gap-small { gap: 8px; }
.row--gap-medium { gap: 12px; }
.row--gap-large { gap: 20px; }
</style>

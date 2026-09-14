/**
 * kit/format.ts —— 组件库自包含格式化工具（自包含迁移的组成部分）
 *
 * 背景：FileUpload 需要把字节数显示成人类可读的文件大小。该函数原先位于宿主的
 * `@/utils/format`，会让「整体复制 components/ 即可用」这一前提失效，故内聚到 kit/。
 *
 * 实现与宿主 `src/utils/format.ts` 的 formatFileSize 保持逐字节一致，
 * 以确保两边的显示输出不发生漂移。
 */

/**
 * 格式化文件大小为可读字符串
 * @param bytes 文件大小（字节）
 * @returns 格式化后的字符串，如 "1.23 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
}

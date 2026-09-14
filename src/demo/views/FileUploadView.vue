<script setup lang="ts">
// 表单 · 文件上传：FileUpload（advanced / basic 两种模式）
// 注意：组件本身不做网络请求，上传/进度由使用方回传。
import { ref } from "vue"
import Button from "../../components/Button.vue"
import FileUpload from "../../components/FileUpload.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const picked = ref<File[]>([])
const uploading = ref(false)
const progress = ref(0)

function onSelect(files: File[]) {
  picked.value = files
}

/** 演示用：模拟上传进度（组件不自带网络请求） */
function fakeUpload() {
  if (picked.value.length === 0) return
  uploading.value = true
  progress.value = 0
  const timer = window.setInterval(() => {
    progress.value += 12
    if (progress.value >= 100) {
      progress.value = 100
      window.clearInterval(timer)
      uploading.value = false
    }
  }, 220)
}
</script>

<template>
  <div class="view">
    <DemoSection
      name="文件上传"
      en="FileUpload"
      desc="advanced 模式含拖拽区 + 文件列表 + 操作栏。组件不做网络请求，进度由使用方回传。"
    >
      <FileUpload
        accept="image/*,.pdf"
        multiple
        :max-file-size="5 * 1024 * 1024"
        :file-limit="3"
        :uploading="uploading"
        :progress="progress"
        drag-text="拖拽文件到此处，或点击选择"
        hint-text="支持图片与 PDF，单个不超过 5MB，最多 3 个"
        @select="onSelect"
      />
      <DemoRow>
        <Button size="small" outlined :disabled="picked.length === 0" @click="fakeUpload">
          模拟上传进度
        </Button>
        <span class="hint">
          已选 {{ picked.length }} 个文件
          <template v-if="picked.length">
            （{{ picked.map((f) => f.name).join("、") }}）
          </template>
        </span>
      </DemoRow>
    </DemoSection>

    <DemoSection
      name="文件上传（基础模式）"
      en="FileUpload · basic"
      divided
      desc="mode=&quot;basic&quot; 只渲染一个选择按钮，适合塞进表单行内。"
    >
      <FileUpload
        mode="basic"
        accept=".pdf"
        choose-label="选择 PDF"
        :show-upload-button="false"
      />
    </DemoSection>

    <DemoSection name="文件上传（禁用）" en="FileUpload · disabled" divided>
      <FileUpload disabled drag-text="已禁用，不可选择" />
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); }
</style>

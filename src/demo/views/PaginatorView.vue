<script setup lang="ts">
// 数据展示 · 分页器：Paginator
import { ref } from "vue"
import Paginator from "../../components/Paginator.vue"
import DemoSection from "../components/DemoSection.vue"

const page = ref(1)
const rows = ref(10)
const page2 = ref(3)
const rows2 = ref(20)
const page3 = ref(1)
const rows3 = ref(10)
</script>

<template>
  <div class="view">
    <DemoSection
      name="分页器"
      en="Paginator"
      desc="page 从 1 开始；用 v-model:page 与 v-model:rows 双向绑定，change 事件带完整载荷。"
    >
      <Paginator v-model:page="page" v-model:rows="rows" :total="95" show-report />
      <p class="hint">当前第 {{ page }} 页，每页 {{ rows }} 条（共 95 条）</p>
    </DemoSection>

    <DemoSection name="显示变体" en="Paginator · 变体" divided>
      <Paginator v-model:page="page2" v-model:rows="rows2" :total="480" show-report />
      <Paginator
        v-model:page="page3"
        v-model:rows="rows3"
        :total="480"
        :show-first-last="false"
        :show-report="false"
      />
      <Paginator
        v-model:page="page3"
        v-model:rows="rows3"
        :total="480"
        :page-link-size="3"
        show-report
      />
    </DemoSection>

    <DemoSection name="数据量为 0" en="Paginator · empty" divided>
      <Paginator :page="1" :rows="10" :total="0" show-report />
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
</style>

<script setup lang="ts">
// 选择器 · 就地编辑：Inplace
// 注意插槽名：只读态是 display 插槽，编辑态是 content 插槽（作用域给 closeCallback）。
import { ref } from "vue"
import Button from "../../components/Button.vue"
import Inplace from "../../components/Inplace.vue"
import Input from "../../components/Input.vue"
import DemoSection from "../components/DemoSection.vue"

const name = ref("张三")
const draft = ref("张三")
const uncontrolled = ref(false)
</script>

<template>
  <div class="view">
    <DemoSection
      name="就地编辑"
      en="Inplace"
      desc="点击只读内容切换成编辑态。display 插槽放只读展示，content 插槽放编辑器（作用域带 closeCallback）。"
    >
      <div class="box">
        <Inplace>
          <template #display>
            <span class="display">{{ name }}</span>
          </template>
          <template #content="{ closeCallback }">
            <div class="editor">
              <Input v-model="draft" size="small" placeholder="输入名字" />
              <Button
                size="small"
                @click="name = draft; closeCallback()"
              >
                保存
              </Button>
              <Button size="small" text @click="draft = name; closeCallback()">
                取消
              </Button>
            </div>
          </template>
        </Inplace>
      </div>
      <p class="hint">当前值：{{ name }}（草稿：{{ draft }}）</p>
    </DemoSection>

    <DemoSection
      name="受控与禁用"
      en="Inplace · active / disabled"
      divided
      desc="active 可用 v-model 受控；disabled 时不响应点击与 Enter。"
    >
      <div class="box">
        <Inplace v-model:active="uncontrolled">
          <template #display>
            <span class="display">受控模式（当前{{ uncontrolled ? "编辑中" : "只读" }}）</span>
          </template>
          <template #content="{ closeCallback }">
            <Button size="small" @click="closeCallback()">关闭编辑</Button>
          </template>
        </Inplace>
      </div>
      <div class="box">
        <Inplace disabled>
          <template #display>
            <span class="display display--disabled">禁用状态，点击无反应</span>
          </template>
          <template #content>
            <span>不会显示</span>
          </template>
        </Inplace>
      </div>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.box {
  padding: 12px 14px;
  border: 1px solid var(--b3-border-color, #e0deda);
  border-radius: 8px;
}
.display {
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.display--disabled {
  color: var(--b3-theme-secondary, #8a8a8a);
  cursor: not-allowed;
}
.editor { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
</style>

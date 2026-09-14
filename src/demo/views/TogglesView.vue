<script setup lang="ts">
// 表单 · 开关类：Checkbox / RadioButton / Switch / ToggleButton
import { ref } from "vue"
import Checkbox from "../../components/Checkbox.vue"
import RadioButton from "../../components/RadioButton.vue"
import Switch from "../../components/Switch.vue"
import ToggleButton from "../../components/ToggleButton.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const agree = ref(false)
const fruits = ref<string[]>(["apple"])
const plan = ref<"free" | "pro">("pro")
const notify = ref(true)
const autoSave = ref(false)
const pinned = ref(false)
const bold = ref(false)

const allChecked = ref(false)
function toggleAll(v: boolean) {
  allChecked.value = v
  fruits.value = v ? ["apple", "banana", "cherry"] : []
}
</script>

<template>
  <div class="view">
    <DemoSection name="复选框" en="Checkbox" desc="二元模式传布尔值；分组模式传数组并给每项 value。">
      <DemoRow>
        <Checkbox v-model="agree" label="同意条款" />
        <Checkbox :model-value="true" label="已选中" readonly />
        <Checkbox :model-value="false" label="禁用" disabled />
        <Checkbox :model-value="true" label="半选（受控）" indeterminate />
      </DemoRow>
      <DemoRow>
        <Checkbox label="失败态" error="必须勾选" />
        <Checkbox label="带说明" hint="这行是辅助文字" />
      </DemoRow>
      <DemoRow gap="large">
        <Checkbox
          :model-value="allChecked"
          :indeterminate="fruits.length > 0 && fruits.length < 3"
          label="全选"
          @update:model-value="toggleAll"
        />
        <span class="sep" />
        <Checkbox v-model="fruits" value="apple" label="苹果" />
        <Checkbox v-model="fruits" value="banana" label="香蕉" />
        <Checkbox v-model="fruits" value="cherry" label="樱桃" />
      </DemoRow>
      <p class="hint">已选：{{ fruits.join("、") || "（无）" }}</p>
    </DemoSection>

    <DemoSection
      name="单选框"
      en="RadioButton"
      divided
      desc="同一组必须传相同的 name，否则方向键与 ARIA 语义失效。"
    >
      <DemoRow>
        <RadioButton v-model="plan" value="free" label="免费版" name="demo-plan" />
        <RadioButton v-model="plan" value="pro" label="专业版" name="demo-plan" />
      </DemoRow>
      <DemoRow>
        <RadioButton :model-value="'a'" value="a" label="已选中" name="demo-plan2" />
        <RadioButton :model-value="'a'" value="b" label="禁用" name="demo-plan2" disabled />
        <RadioButton :model-value="'a'" value="c" label="错误态" name="demo-plan2" error="必选" />
      </DemoRow>
      <p class="hint">当前套餐：{{ plan }}</p>
    </DemoSection>

    <DemoSection name="开关" en="Switch" divided desc="支持自定义选中/未选中的颜色，以及标签靠左。">
      <DemoRow>
        <Switch v-model="notify" label="启用通知" />
        <Switch v-model="autoSave" label="自动保存" />
        <Switch :model-value="false" label="禁用" disabled />
        <Switch :model-value="true" label="加载中" loading />
      </DemoRow>
      <DemoRow>
        <Switch v-model="pinned" label="标签在左" label-before />
        <Switch v-model="bold" label="自定义颜色" active-color="#7c3aed" />
      </DemoRow>
      <DemoRow>
        <Switch size="xsmall" :model-value="true" label="xsmall" />
        <Switch size="small" :model-value="true" label="small" />
        <Switch size="medium" :model-value="true" label="medium" />
        <Switch size="large" :model-value="true" label="large" />
      </DemoRow>
    </DemoSection>

    <DemoSection
      name="切换按钮"
      en="ToggleButton"
      divided
      desc="按钮式开关。注意它没有 label 属性 —— 文案用 onLabel / offLabel，图标用 onIcon / offIcon。"
    >
      <DemoRow>
        <ToggleButton
          v-model="pinned"
          on-label="已置顶"
          off-label="置顶"
          on-icon="star"
          off-icon="starOutline"
        />
        <ToggleButton v-model="notify" on-label="已开启" off-label="已关闭" />
        <ToggleButton v-model="autoSave" on-label="自动保存中" off-label="自动保存" :disabled="false" />
        <ToggleButton :model-value="false" on-label="禁用" off-label="禁用" disabled />
      </DemoRow>
      <DemoRow>
        <ToggleButton size="xsmall" v-model="pinned" on-label="xsmall" off-label="xsmall" />
        <ToggleButton size="small" v-model="pinned" on-label="small" off-label="small" />
        <ToggleButton size="medium" v-model="pinned" on-label="medium" off-label="medium" />
      </DemoRow>
      <p class="hint">置顶：{{ pinned ? "是" : "否" }} · 通知：{{ notify ? "开" : "关" }}</p>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
.sep {
  width: 1px;
  height: 18px;
  background: var(--b3-border-color, #e0deda);
}
</style>

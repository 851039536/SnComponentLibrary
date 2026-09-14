<script setup lang="ts">
// 表单 · 输入类：Input / Textarea / FormField / InputGroup / InputGroupAddon
import { ref } from "vue"
import Button from "../../components/Button.vue"
import Checkbox from "../../components/Checkbox.vue"
import Divider from "../../components/Divider.vue"
import IconWrapper from "../../components/IconWrapper.vue"
import Input from "../../components/Input.vue"
import InputGroup from "../../components/InputGroup.vue"
import InputGroupAddon from "../../components/InputGroupAddon.vue"
import Textarea from "../../components/Textarea.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const name = ref("张三")
const password = ref("")
const bio = ref("")
const counted = ref("")
const withAddon = ref("")
const agree = ref(false)
</script>

<template>
  <div class="view">
    <DemoSection
      name="输入框"
      en="Input"
      desc="建议在表单里显式写 size=&quot;small&quot;（默认就是 small，medium 偏大）。"
    >
      <div class="grid">
        <Input v-model="name" label="用户名" placeholder="请输入" size="small" clearable />
        <Input
          v-model="password"
          label="密码"
          type="password"
          placeholder="请输入密码"
          size="small"
          show-password
        />
        <Input label="带前缀图标" prefix-icon="magnify" placeholder="搜索…" size="small" />
        <Input label="带后缀图标" suffix-icon="settings" placeholder="设置项" size="small" />
        <Input label="错误态" error="该字段不合法" size="small" />
        <Input label="提示态" hint="这行是辅助说明" size="small" />
        <Input label="禁用" disabled model-value="不可编辑" size="small" />
        <Input label="只读" readonly model-value="只读内容" size="small" />
        <Input v-model="counted" label="字数统计" :maxlength="20" show-count size="small" />
        <Input label="必填" required placeholder="带星号" size="small" />
      </div>
      <DemoRow>
        <Input size="xsmall" placeholder="xsmall" />
        <Input size="small" placeholder="small" />
        <Input size="medium" placeholder="medium" />
        <Input size="large" placeholder="large" />
      </DemoRow>
    </DemoSection>

    <DemoSection
      name="多行文本"
      en="Textarea"
      divided
      desc="autoResize 开启后随内容增高，超过 maxRows 转为内部滚动。"
    >
      <Textarea
        v-model="bio"
        label="简介"
        placeholder="说点什么…"
        size="small"
        auto-resize
        :rows="2"
        :max-rows="6"
        :maxlength="100"
        show-count
      />
      <Textarea label="固定行数" size="small" :rows="3" placeholder="不可自动增高" resize="vertical" />
    </DemoSection>

    <DemoSection
      name="表单字段"
      en="FormField"
      divided
      desc="多根组件：控件必须写在它的默认插槽里，写在旁边会让提示文字跑到控件上方。"
    >
      <div class="grid">
        <!-- 正确：控件在插槽内 -->
        <Input v-model="name" label="用户名" size="small" hint="用户名注册后不可修改" />
        <Input label="邮箱" size="small" error="邮箱格式不正确" />
      </div>
      <p class="hint">
        上面两个 Input 内部就用 FormField 承载 label / hint / error，
        自定义控件时也可以直接包一层：
      </p>
      <InputGroup size="small">
        <InputGroupAddon>
          <IconWrapper name="magnify" :size="14" />
        </InputGroupAddon>
        <Input v-model="withAddon" borderless placeholder="输入框组：前后可挂载附件" />
        <InputGroupAddon>
          <Button size="small" text>搜索</Button>
        </InputGroupAddon>
      </InputGroup>
    </DemoSection>

    <DemoSection
      name="输入框组"
      en="InputGroup / InputGroupAddon"
      divided
      desc="把若干控件拼成一条，去掉内部边框。常配 borderless 的 Input 使用。"
    >
      <DemoRow>
        <InputGroup size="small">
          <InputGroupAddon>https://</InputGroupAddon>
          <Input borderless placeholder="example.com" />
        </InputGroup>
        <InputGroup size="small">
          <Input borderless placeholder="金额" />
          <InputGroupAddon>元</InputGroupAddon>
        </InputGroup>
      </DemoRow>
      <Divider />
      <Checkbox v-model="agree" label="与普通控件混排也正常" />
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  align-items: start;
}
.hint { font-size: 12px; color: var(--b3-theme-secondary, #8a8a8a); margin: 0; }
</style>

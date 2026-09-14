<script setup lang="ts">
// 基础 · 标签文字：Label
import Label from "../../components/Label.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"
</script>

<template>
  <div class="view">
    <DemoSection
      name="标签文字"
      en="Label"
      desc="用于表单标签 / 状态文字，可带必填星号、图标与语义色。tag 可切换渲染成 label / span / div。"
    >
      <DemoRow align="top" gap="large">
        <Label>普通文字</Label>
        <Label required>必填项</Label>
        <Label disabled>禁用</Label>
      </DemoRow>

      <DemoSection name="语义变体" en="Label · variant" divided>
        <DemoRow align="top" gap="large">
          <Label variant="default">default</Label>
          <Label variant="primary">primary</Label>
          <Label variant="success">success</Label>
          <Label variant="warning">warning</Label>
          <Label variant="danger">danger</Label>
          <Label variant="info">info</Label>
        </DemoRow>
      </DemoSection>

      <DemoSection name="状态" en="Label · state" divided>
        <DemoRow align="top" gap="large">
          <Label state="default">default</Label>
          <Label state="error">error</Label>
          <Label state="success">success</Label>
          <Label state="warning">warning</Label>
        </DemoRow>
      </DemoSection>

      <DemoSection name="图标与尺寸" en="Label · icon / size" divided>
        <DemoRow align="top" gap="large">
          <Label icon="star" icon-position="left">左图标</Label>
          <Label icon="star" icon-position="right">右图标</Label>
        </DemoRow>
        <DemoRow align="top" gap="large">
          <Label size="xsmall">xsmall</Label>
          <Label size="small">small</Label>
          <Label size="medium">medium</Label>
          <Label size="large">large</Label>
        </DemoRow>
      </DemoSection>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
</style>

<script setup lang="ts">
// 导航 · 标签页与工具栏：Tabs / TabList / Tab / TabPanels / TabPanel / Toolbar
import { ref } from "vue"
import Button from "../../components/Button.vue"
import Tab from "../../components/Tab.vue"
import TabList from "../../components/TabList.vue"
import TabPanel from "../../components/TabPanel.vue"
import TabPanels from "../../components/TabPanels.vue"
import Tabs from "../../components/Tabs.vue"
import Tag from "../../components/Tag.vue"
import Toolbar from "../../components/Toolbar.vue"
import DemoSection from "../components/DemoSection.vue"

const basic = ref("overview")
const disabledDemo = ref("a")
</script>

<template>
  <div class="view">
    <DemoSection
      name="标签页"
      en="Tabs / TabList / Tab / TabPanels / TabPanel"
      desc="五件套配合使用：Tabs 持有 v-model，TabList 放 Tab，TabPanels 放 TabPanel，value 一一对应。"
    >
      <Tabs v-model="basic">
        <TabList>
          <Tab value="overview">概览</Tab>
          <Tab value="detail">详情</Tab>
          <Tab value="settings">设置</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="overview">
            <p class="pane">概览面板。当前选中：<Tag :content="basic" variant="primary" /></p>
          </TabPanel>
          <TabPanel value="detail">
            <p class="pane">详情面板。</p>
          </TabPanel>
          <TabPanel value="settings">
            <p class="pane">设置面板。</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </DemoSection>

    <DemoSection name="含禁用项" en="Tab · disabled" divided>
      <Tabs v-model="disabledDemo">
        <TabList>
          <Tab value="a">可用</Tab>
          <Tab value="b">也可用</Tab>
          <Tab value="c" disabled>已禁用</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="a"><p class="pane">面板 A</p></TabPanel>
          <TabPanel value="b"><p class="pane">面板 B</p></TabPanel>
          <TabPanel value="c"><p class="pane">面板 C（到不了）</p></TabPanel>
        </TabPanels>
      </Tabs>
    </DemoSection>

    <DemoSection name="懒加载面板" en="Tabs · lazy" divided>
      <Tabs v-model="basic" lazy>
        <TabList>
          <Tab value="overview">概览</Tab>
          <Tab value="detail">详情</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="overview"><p class="pane">lazy 模式下未激活的面板不渲染。</p></TabPanel>
          <TabPanel value="detail"><p class="pane">切到这里才会挂载。</p></TabPanel>
        </TabPanels>
      </Tabs>
    </DemoSection>

    <DemoSection
      name="工具栏"
      en="Toolbar"
      divided
      desc="横向排列控件的容器，本身没有交互，只负责布局与分隔。"
    >
      <Toolbar>
        <Button icon="save" text size="small">保存</Button>
        <Button icon="refresh" text size="small">刷新</Button>
        <Button icon="copy" text size="small">复制</Button>
        <Button icon="delete" text size="small">删除</Button>
      </Toolbar>
      <Toolbar>
        <Tag content="筛选：全部" variant="primary" />
        <Button icon="plus" size="small" outlined>新建</Button>
        <Button icon="settings" size="small" text>设置</Button>
      </Toolbar>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
.pane { margin: 0; font-size: 13px; line-height: 1.7; }
</style>

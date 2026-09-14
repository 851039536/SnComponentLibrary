<script setup lang="ts">
// 基础 · 标签 / 徽标 / 分隔线：Tag / Badge / Divider
import { ref } from "vue"
import Badge from "../../components/Badge.vue"
import Button from "../../components/Button.vue"
import Divider from "../../components/Divider.vue"
import Tag from "../../components/Tag.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const tags = ref(["前端", "Vue", "TypeScript"])
function removeTag(t: string) {
  tags.value = tags.value.filter((x) => x !== t)
}
</script>

<template>
  <div class="view">
    <DemoSection
      name="标签"
      en="Tag"
      desc="颜色轴叫 variant（不是 severity）；content 直接传文本，也可用默认插槽。"
    >
      <DemoRow>
        <Tag content="默认" />
        <Tag content="主色" variant="primary" />
        <Tag content="成功" variant="success" />
        <Tag content="警告" variant="warn" />
        <Tag content="错误" variant="error" />
        <Tag content="信息" variant="info" />
        <Tag content="对比" variant="contrast" />
      </DemoRow>

      <DemoRow>
        <Tag content="带图标" icon="star" />
        <Tag content="实底" variant="primary" fill />
        <Tag content="圆角" shape="circle" />
        <Tag content="方形" shape="square" />
      </DemoRow>

      <DemoRow>
        <Tag :content="120" :max="99" variant="error" />
        <Tag content="超过上限显示 max+" :max="5" />
        <Tag content="禁用" disabled />
        <Tag content="自定义色" color="#7c3aed" text-color="#fff" />
      </DemoRow>

      <DemoRow>
        <Tag size="xsmall" content="xsmall" />
        <Tag size="small" content="small" />
        <Tag size="medium" content="medium" />
        <Tag size="large" content="large" />
      </DemoRow>

      <DemoSection name="可关闭标签" en="Tag · closable" divided>
        <DemoRow>
          <Tag
            v-for="t in tags"
            :key="t"
            :content="t"
            closable
            variant="primary"
            @close="removeTag(t)"
          />
          <Button
            v-if="tags.length === 0"
            size="small"
            text
            @click="tags = ['前端', 'Vue', 'TypeScript']"
          >
            恢复
          </Button>
        </DemoRow>
      </DemoSection>
    </DemoSection>

    <DemoSection
      name="徽标"
      en="Badge"
      divided
      desc="默认包在子元素右上角；content 传数值可配合 max 折叠成 99+。"
    >
      <DemoRow gap="large">
        <Badge :content="5"><Button outlined>未读</Button></Badge>
        <Badge dot><Button outlined>在线</Button></Badge>
        <Badge :content="120" :max="99"><Button outlined>消息</Button></Badge>
        <Badge :content="0" show-zero><Button outlined>显示 0</Button></Badge>
        <Badge :content="3" hidden><Button outlined>已隐藏</Button></Badge>
      </DemoRow>

      <DemoRow gap="large">
        <Badge :content="1" variant="success"><Button outlined>success</Button></Badge>
        <Badge :content="2" variant="warning"><Button outlined>warning</Button></Badge>
        <Badge :content="3" variant="danger"><Button outlined>danger</Button></Badge>
      </DemoRow>

      <DemoRow gap="large">
        <Badge :content="9" position="top-left"><Button outlined>左上</Button></Badge>
        <Badge :content="9" position="bottom-right"><Button outlined>右下</Button></Badge>
      </DemoRow>
    </DemoSection>

    <DemoSection name="分隔线" en="Divider" divided desc="layout 可取 horizontal / vertical。">
      <p>上方内容</p>
      <Divider />
      <p>下方内容（默认水平线）</p>
      <DemoRow gap="small">
        <span>左</span>
        <Divider layout="vertical" />
        <span>中</span>
        <Divider layout="vertical" />
        <span>右</span>
      </DemoRow>
      <Divider>带文字的分隔线</Divider>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
</style>

<script setup lang="ts">
// 浮层 · 对话框与抽屉：Dialog / Drawer / ConfirmDialog / Tooltip
import { ref } from "vue"
import Button from "../../components/Button.vue"
import ConfirmDialog from "../../components/ConfirmDialog.vue"
import Dialog from "../../components/Dialog.vue"
import Drawer from "../../components/Drawer.vue"
import Input from "../../components/Input.vue"
import Tooltip from "../../components/Tooltip.vue"
import DemoRow from "../components/DemoRow.vue"
import DemoSection from "../components/DemoSection.vue"

const dialog = ref(false)
const noHeader = ref(false)
const positionDialog = ref(false)
const drawer = ref({ right: false, left: false, top: false, bottom: false })
const confirm = ref(false)
const confirmLoading = ref(false)

function acceptConfirm() {
  confirmLoading.value = true
  window.setTimeout(() => {
    confirmLoading.value = false
    confirm.value = false
  }, 1200)
}
</script>

<template>
  <div class="view">
    <DemoSection
      name="对话框"
      en="Dialog"
      desc="显隐由使用方控制（v-model:visible）。关闭请求统一回写 false，组件不会自己改状态。"
    >
      <DemoRow>
        <Button @click="dialog = true">标准对话框</Button>
        <Button outlined @click="noHeader = true">无标题栏</Button>
        <Button outlined @click="positionDialog = true">非居中位置</Button>
      </DemoRow>
    </DemoSection>

    <Dialog v-model:visible="dialog" header="对话框标题" dismissable-mask>
      <p>支持 Esc 关闭、遮罩点击关闭、焦点陷阱（Tab 循环不会跑出去）。</p>
      <Input label="弹窗内输入框" size="small" placeholder="试试按 Tab 循环" />
      <template #footer>
        <Button text @click="dialog = false">取消</Button>
        <Button @click="dialog = false">确定</Button>
      </template>
    </Dialog>

    <Dialog v-model:visible="noHeader" :show-header="false">
      <p>没有标题栏，只能靠 Esc / 遮罩 / 自定义按钮关闭。</p>
      <Button block @click="noHeader = false">关闭</Button>
    </Dialog>

    <Dialog v-model:visible="positionDialog" header="右上角" position="topright" size="small">
      <p>position 支持四角与四边中点（topleft / topright / bottomleft / bottomright）。</p>
    </Dialog>

    <DemoSection
      name="抽屉"
      en="Drawer"
      divided
      desc="从四边滑出；position 取 left / right / top / bottom。"
    >
      <DemoRow>
        <Button @click="drawer.right = true">右侧</Button>
        <Button outlined @click="drawer.left = true">左侧</Button>
        <Button outlined @click="drawer.top = true">顶部</Button>
        <Button outlined @click="drawer.bottom = true">底部</Button>
      </DemoRow>
    </DemoSection>

    <Drawer v-model:visible="drawer.right" header="右侧抽屉" position="right">
      <p>从右侧滑出，常用于表单 / 详情面板。</p>
      <Button outlined @click="drawer.right = false">关闭</Button>
    </Drawer>
    <Drawer v-model:visible="drawer.left" header="左侧抽屉" position="left">
      <p>从左侧滑出，常用于导航。</p>
    </Drawer>
    <Drawer v-model:visible="drawer.top" header="顶部抽屉" position="top">
      <p>从顶部滑出。</p>
    </Drawer>
    <Drawer v-model:visible="drawer.bottom" header="底部抽屉" position="bottom">
      <p>从底部滑出，移动端常用。</p>
    </Drawer>

    <DemoSection
      name="确认对话框"
      en="ConfirmDialog"
      divided
      desc="危险操作二次确认。acceptLoading 可在确认后显示加载态。"
    >
      <DemoRow>
        <Button severity="danger" outlined @click="confirm = true">删除某项</Button>
      </DemoRow>
    </DemoSection>

    <ConfirmDialog
      v-model:visible="confirm"
      header="确认删除"
      message="删除后不可恢复，确定继续吗？"
      icon="delete"
      accept-label="删除"
      reject-label="取消"
      accept-severity="danger"
      :accept-loading="confirmLoading"
      @accept="acceptConfirm"
      @reject="confirm = false"
    />

    <DemoSection
      name="文字提示"
      en="Tooltip"
      divided
      desc="默认由 hover / focus 驱动；也可用 v-model:visible 受控。"
    >
      <DemoRow>
        <Tooltip text="这是上方的提示气泡">
          <Button text>悬浮我看提示</Button>
        </Tooltip>
        <Tooltip text="提示在下方" placement="bottom">
          <Button outlined>下方提示</Button>
        </Tooltip>
        <Tooltip text="很长的一段说明文字会自动换行，不会拉成一条长条" :max-width="180">
          <Button outlined>长文本换行</Button>
        </Tooltip>
        <Button outlined title="原生 title 属性也能用">原生 title</Button>
      </DemoRow>
    </DemoSection>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 20px; }
</style>

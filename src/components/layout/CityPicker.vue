<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/store'
import { CITY_OPTIONS } from '@/utils/region'

const appStore = useAppStore()
const visible = ref(false)

const cascaderValue = computed({
  get: () => (appStore.province && appStore.city ? [appStore.province, appStore.city] : []),
  set: (value: string[]) => {
    if (!Array.isArray(value) || value.length < 2) return
    appStore.setCity(value[0], value[1])
    visible.value = false
  },
})
</script>

<template>
  <el-popover
    v-model:visible="visible"
    placement="bottom-start"
    :width="340"
    trigger="click"
    :offset="8"
    popper-class="city-picker-popper"
  >
    <template #reference>
      <button type="button" class="city-trigger" :class="{ open: visible }">
        <img class="pin-icon" src="/images/home/map-pin.svg" width="16" height="16" alt="" />
        <span class="name">{{ appStore.cityLabel || '选择城市' }}</span>
        <span class="caret" :class="{ up: visible }" />
      </button>
    </template>

    <div class="picker-body">
      <div class="picker-head">
        <strong>选择定位城市</strong>
        <span>按省 / 市筛选附近老师</span>
      </div>
      <el-cascader
        v-model="cascaderValue"
        class="city-cascader"
        :options="CITY_OPTIONS"
        :props="{ expandTrigger: 'hover', emitPath: true }"
        filterable
        clearable
        placeholder="请选择省 / 市"
        popper-class="city-cascader-dropdown"
        style="width: 100%"
      />
    </div>
  </el-popover>
</template>

<style scoped lang="scss">
.city-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #33445d;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s ease;

  &:hover,
  &.open {
    color: #2878ff;
  }
}

.pin-icon {
  flex-shrink: 0;
  display: block;
}

.name {
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caret {
  width: 0;
  height: 0;
  margin-left: 2px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #c0c4cc;
  transition: transform 0.15s ease, border-top-color 0.15s ease;

  &.up {
    transform: rotate(180deg);
    border-top-color: #2878ff;
  }
}

.city-trigger:hover .caret,
.city-trigger.open .caret {
  border-top-color: #2878ff;
}

.picker-body {
  padding: 2px 0 4px;
}

.picker-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;

  strong {
    position: relative;
    padding-left: 11px;
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
    color: #292d36;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 4px;
      width: 3px;
      height: 14px;
      border-radius: 2px;
      background: #1890ff;
    }
  }

  span {
    font-size: 12px;
    line-height: 18px;
    color: #7b8496;
  }
}

:deep(.city-cascader) {
  .el-input__wrapper {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;

    &:hover,
    &.is-focus {
      box-shadow: 0 0 0 1px #99b4ff inset, 0 1px 1px rgba(51, 105, 255, 0.3);
    }
  }

  .el-input__inner {
    color: #424957;
    font-size: 14px;
  }
}
</style>

<style lang="scss">
.city-picker-popper.el-popover.el-popper {
  padding: 16px 16px 14px !important;
  border: none !important;
  border-radius: 12px !important;
  background: #fff !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16) !important;
}

.city-cascader-dropdown.el-popper {
  margin-top: 6px !important;
  border: none !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16) !important;
  overflow: hidden;

  .el-cascader-node {
    border-radius: 6px;
    color: #424957;
    font-size: 14px;

    &:not(.is-disabled):hover,
    &.in-active-path,
    &.is-active {
      background: #edf2ff;
      color: #2878ff;
      font-weight: 600;
    }
  }

  .el-cascader-menu {
    min-width: 140px;
    border-right-color: #eef1f6;
  }
}
</style>

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
    :width="320"
    trigger="click"
    popper-class="city-picker-popper"
  >
    <template #reference>
      <button type="button" class="city-trigger" :class="{ open: visible }">
        <span class="pin" aria-hidden="true" />
        <span class="name">{{ appStore.cityLabel }}</span>
        <span class="caret">▾</span>
      </button>
    </template>

    <div class="picker-body">
      <p class="hint">选择定位城市</p>
      <el-cascader
        v-model="cascaderValue"
        :options="CITY_OPTIONS"
        :props="{ expandTrigger: 'hover', emitPath: true }"
        filterable
        placeholder="省 / 市"
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
  height: 34px;
  padding: 0 10px;
  border: 1px solid $color-border;
  border-radius: 999px;
  background: #fff;
  color: $color-text;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;

  &:hover,
  &.open {
    border-color: $color-primary;
    color: $color-primary;
    background: $color-primary-light;
  }
}

.pin {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $color-primary;
  box-shadow: 0 0 0 3px rgba($color-primary, 0.18);
}

.name {
  font-size: 13px;
  font-weight: 600;
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caret {
  font-size: 11px;
  opacity: 0.7;
  line-height: 1;
}

.picker-body {
  .hint {
    margin: 0 0 10px;
    font-size: 12px;
    color: $color-text-secondary;
  }
}
</style>

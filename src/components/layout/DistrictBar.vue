<script setup lang="ts">
import { useAppStore } from '@/store'

withDefaults(
  defineProps<{
    /** compact：嵌在筛选区「方式」下方；bar：通栏样式 */
    variant?: 'compact' | 'bar'
  }>(),
  { variant: 'compact' },
)

const appStore = useAppStore()

function selectAll() {
  appStore.clearDistrict()
}

function selectDistrict(name: string) {
  appStore.setDistrict(name)
}
</script>

<template>
  <div v-if="appStore.province && appStore.city" :class="['district-bar', variant]">
    <div :class="variant === 'bar' ? 'page-container bar-inner' : 'bar-inner'">
      <span class="label">地区</span>
      <div class="chips">
        <button
          type="button"
          :class="['chip', { active: !appStore.district }]"
          @click="selectAll"
        >
          全{{ appStore.cityLabel }}
        </button>
        <button
          v-for="name in appStore.districts"
          :key="name"
          type="button"
          :class="['chip', { active: appStore.district === name }]"
          @click="selectDistrict(name)"
        >
          {{ name }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.district-bar.bar {
  background: #fff;
  border-bottom: 1px solid $color-border;

  .bar-inner {
    padding-top: 10px;
    padding-bottom: 10px;
  }
}

.bar-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.label {
  flex-shrink: 0;
  margin-top: 5px;
  font-size: 13px;
  color: $color-text-secondary;
  line-height: 1.4;
  width: 36px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.chip {
  border: 1px solid $color-border;
  background: #fff;
  color: $color-text-secondary;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
  line-height: 1.4;
  transition: all 0.15s ease;

  &.active,
  &:hover {
    border-color: $color-primary;
    color: $color-primary;
    background: $color-primary-light;
  }
}

.district-bar.compact {
  .label {
    width: 36px;
  }
}

@media (max-width: $breakpoint-md) {
  .bar-inner {
    flex-direction: column;
    gap: 8px;
  }

  .label {
    margin-top: 0;
    width: auto;
  }

  .chips {
    max-height: 84px;
    overflow-y: auto;
  }
}
</style>

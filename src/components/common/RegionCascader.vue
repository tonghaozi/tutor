<script setup lang="ts">
import { computed } from 'vue'
import { REGION_OPTIONS, joinRegionPath, splitRegionPath } from '@/utils/region'

const props = withDefaults(
  defineProps<{
    modelValue?: string | string[]
    multiple?: boolean
    checkStrictly?: boolean
    clearable?: boolean
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    multiple: false,
    checkStrictly: false,
    clearable: true,
    placeholder: '请选择省 / 市 / 区',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  change: [value: string | string[]]
}>()

const cascaderValue = computed({
  get() {
    if (props.multiple) {
      const list = Array.isArray(props.modelValue) ? props.modelValue : []
      return list.map((item) => splitRegionPath(item))
    }
    const path = typeof props.modelValue === 'string' ? props.modelValue : ''
    return path ? splitRegionPath(path) : []
  },
  set(value: string[] | string[][]) {
    if (props.multiple) {
      const paths = (Array.isArray(value) ? value : [])
        .map((item) => joinRegionPath(Array.isArray(item) ? item : []))
        .filter(Boolean)
      emit('update:modelValue', paths)
      emit('change', paths)
      return
    }
    const path = joinRegionPath(Array.isArray(value) ? (value as string[]) : [])
    emit('update:modelValue', path)
    emit('change', path)
  },
})

const cascaderProps = computed(() => ({
  multiple: props.multiple,
  checkStrictly: props.checkStrictly,
  emitPath: true,
  expandTrigger: 'hover' as const,
}))
</script>

<template>
  <el-cascader
    v-model="cascaderValue"
    :options="REGION_OPTIONS"
    :props="cascaderProps"
    :clearable="clearable"
    :placeholder="placeholder"
    :disabled="disabled"
    filterable
    style="width: 100%"
  />
</template>

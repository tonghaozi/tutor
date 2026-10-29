<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { DemandFilter } from '@/types'
import { STAGES, SUBJECTS, TEACH_MODE_OPTIONS } from '@/constants'
import DistrictBar from '@/components/layout/DistrictBar.vue'
import { useAppStore } from '@/store'

const props = withDefaults(
  defineProps<{
    modelValue?: DemandFilter
    showKeyword?: boolean
  }>(),
  {
    modelValue: () => ({}),
    showKeyword: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: DemandFilter]
  search: [value: DemandFilter]
}>()

const appStore = useAppStore()

const form = reactive<DemandFilter>({
  keyword: '',
  subject: '',
  stage: '',
  district: appStore.regionPath,
  teachMode: '',
  budgetMin: null,
  budgetMax: null,
  ...props.modelValue,
})

watch(
  () => props.modelValue,
  (val) => Object.assign(form, val),
  { deep: true },
)

watch(
  () => appStore.regionPath,
  (path) => {
    form.district = path
    emitChange()
  },
)

function emitChange() {
  form.district = appStore.regionPath
  const payload = { ...form }
  emit('update:modelValue', payload)
  emit('search', payload)
}

function reset() {
  form.keyword = ''
  form.subject = ''
  form.stage = ''
  form.teachMode = ''
  form.budgetMin = null
  form.budgetMax = null
  appStore.clearDistrict()
  form.district = appStore.regionPath
  emitChange()
}
</script>

<template>
  <div class="demand-filter">
    <el-form :inline="true" @submit.prevent="emitChange">
      <el-form-item v-if="showKeyword" label="搜索">
        <el-input
          v-model="form.keyword"
          clearable
          placeholder="科目/备注/时间"
          style="width: 180px"
          @keyup.enter="emitChange"
        />
      </el-form-item>
      <el-form-item label="学段">
        <el-select v-model="form.stage" clearable placeholder="全部" style="width: 110px">
          <el-option v-for="s in STAGES" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="学科">
        <el-select v-model="form.subject" clearable placeholder="全部" style="width: 120px">
          <el-option v-for="s in SUBJECTS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="方式">
        <el-select v-model="form.teachMode" clearable placeholder="全部" style="width: 110px">
          <el-option
            v-for="m in TEACH_MODE_OPTIONS"
            :key="m.value"
            :label="m.label"
            :value="m.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="预算">
        <div class="budget-range">
          <el-input-number v-model="form.budgetMin" :min="0" :controls="false" placeholder="最低" />
          <span>-</span>
          <el-input-number v-model="form.budgetMax" :min="0" :controls="false" placeholder="最高" />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="emitChange">筛选</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <DistrictBar class="district-row" />
  </div>
</template>

<style scoped lang="scss">
.demand-filter {
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 16px 16px 12px;
  margin-bottom: 20px;
}

.district-row {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px dashed $color-border;
}

.budget-range {
  display: flex;
  align-items: center;
  gap: 6px;

  :deep(.el-input-number) {
    width: 90px;
  }
}

@media (max-width: $breakpoint-md) {
  .demand-filter :deep(.el-form-item) {
    margin-right: 0;
    width: 100%;
  }

  .demand-filter :deep(.el-input),
  .demand-filter :deep(.el-select) {
    width: 100% !important;
  }
}
</style>

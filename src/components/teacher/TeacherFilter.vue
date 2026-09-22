<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { TeacherFilter } from '@/types'
import { DISTRICTS, SUBJECTS, TEACH_MODE_OPTIONS } from '@/constants'

const props = withDefaults(
  defineProps<{
    modelValue?: TeacherFilter
    showKeyword?: boolean
  }>(),
  {
    modelValue: () => ({}),
    showKeyword: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: TeacherFilter]
  search: [value: TeacherFilter]
}>()

const form = reactive<TeacherFilter>({
  keyword: '',
  subject: '',
  district: '',
  teachMode: '',
  priceMin: null,
  priceMax: null,
  ...props.modelValue,
})

watch(
  () => props.modelValue,
  (val) => Object.assign(form, val),
  { deep: true },
)

function emitChange() {
  const payload = { ...form }
  emit('update:modelValue', payload)
  emit('search', payload)
}

function reset() {
  form.keyword = ''
  form.subject = ''
  form.district = ''
  form.teachMode = ''
  form.priceMin = null
  form.priceMax = null
  emitChange()
}
</script>

<template>
  <div class="teacher-filter">
    <el-form :inline="true" @submit.prevent="emitChange">
      <el-form-item v-if="showKeyword" label="搜索">
        <el-input
          v-model="form.keyword"
          clearable
          placeholder="姓名/科目/介绍"
          style="width: 180px"
          @keyup.enter="emitChange"
        />
      </el-form-item>
      <el-form-item label="学科">
        <el-select v-model="form.subject" clearable placeholder="全部" style="width: 120px">
          <el-option v-for="s in SUBJECTS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="区域">
        <el-select v-model="form.district" clearable placeholder="合肥各区" style="width: 130px">
          <el-option v-for="d in DISTRICTS" :key="d" :label="d" :value="d" />
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
      <el-form-item label="价格">
        <div class="price-range">
          <el-input-number v-model="form.priceMin" :min="0" :controls="false" placeholder="最低" />
          <span>-</span>
          <el-input-number v-model="form.priceMax" :min="0" :controls="false" placeholder="最高" />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="emitChange">筛选</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.teacher-filter {
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 16px 16px 0;
  margin-bottom: 20px;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 6px;

  :deep(.el-input-number) {
    width: 90px;
  }
}

@media (max-width: $breakpoint-md) {
  .teacher-filter :deep(.el-form-item) {
    margin-right: 0;
    width: 100%;
  }

  .teacher-filter :deep(.el-input),
  .teacher-filter :deep(.el-select) {
    width: 100% !important;
  }
}
</style>

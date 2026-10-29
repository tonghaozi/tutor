<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { apiPublishDemand } from '@/api'
import { SUBJECTS, TEACH_MODE_OPTIONS } from '@/constants'
import RegionCascader from '@/components/common/RegionCascader.vue'
import { useUserStore } from '@/store'
import type { Demand, TeachMode } from '@/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  subject: '吉他' as Demand['subject'],
  district: '' as Demand['district'],
  budget: 150,
  schedule: '',
  teachMode: 'offline' as TeachMode,
  remark: '',
  phone: '',
})

const rules: FormRules = {
  subject: [{ required: true, message: '请选择科目', trigger: 'change' }],
  district: [{ required: true, message: '请选择地区', trigger: 'change' }],
  budget: [{ required: true, message: '请填写预算', trigger: 'blur' }],
  schedule: [{ required: true, message: '请填写上课时间', trigger: 'blur' }],
  teachMode: [{ required: true, message: '请选择授课方式', trigger: 'change' }],
  phone: [
    { required: true, message: '请填写手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    form.phone = userStore.userInfo?.phone || ''
    form.remark = ''
    form.schedule = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  loading.value = true
  try {
    await apiPublishDemand({
      ...form,
      userId: userStore.userInfo?.id,
    })
    ElMessage.success('求学需求已发布')
    close()
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || '发布失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="发布求学需求"
    width="560px"
    align-center
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    class="th-dialog"
    @close="close"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="th-dialog-form">
      <h3 class="form-title">
        基本信息
        <span>填写后老师可主动联系你</span>
      </h3>
      <div class="form-tips">
        <span class="dot">i</span>
        <p>填写你想学的乐器与上课安排，合适老师看到后可主动联系你。平台仅做信息撮合，不收取课时费。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="科目" prop="subject">
          <el-select v-model="form.subject" style="width: 100%" placeholder="请选择科目">
            <el-option v-for="s in SUBJECTS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="上课地区" prop="district">
          <RegionCascader v-model="form.district" placeholder="请选择省 / 市 / 区" />
        </el-form-item>
        <el-form-item label="预算(元)" prop="budget">
          <el-input-number v-model="form.budget" :min="50" :max="1000" :step="10" />
        </el-form-item>
        <el-form-item label="上课时间" prop="schedule">
          <el-input v-model="form.schedule" placeholder="如：周六下午、工作日晚上" />
        </el-form-item>
        <el-form-item label="授课方式" prop="teachMode">
          <el-radio-group v-model="form.teachMode">
            <el-radio v-for="m in TEACH_MODE_OPTIONS" :key="m.value" :value="m.value">
              {{ m.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="300"
            show-word-limit
            placeholder="基础水平、学习目标等"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="方便老师联系" />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">提交需求</el-button>
    </template>
  </el-dialog>
</template>

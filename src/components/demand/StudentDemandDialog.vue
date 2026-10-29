<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { apiPublishDemand } from '@/api'
import { GRADES_BY_STAGE, STAGES, SUBJECTS_BY_STAGE, TEACH_MODE_OPTIONS } from '@/constants'
import RegionCascader from '@/components/common/RegionCascader.vue'
import { useUserStore } from '@/store'
import type { Demand, Stage, TeachMode } from '@/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const agreed = ref(false)

const form = reactive({
  stage: '小学' as Stage,
  grade: '四年级',
  subject: '数学' as Demand['subject'],
  district: '' as Demand['district'],
  budget: 150,
  schedule: '',
  teachMode: 'offline' as TeachMode,
  statusText: '',
  goalText: '',
  guardianLabel: '',
  phone: '',
})

const subjectOptions = computed(() => SUBJECTS_BY_STAGE[form.stage] || [])
const gradeOptions = computed(() => GRADES_BY_STAGE[form.stage] || [])

const rules: FormRules = {
  stage: [{ required: true, message: '请选择学段', trigger: 'change' }],
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
    form.statusText = ''
    form.goalText = ''
    form.schedule = ''
    form.guardianLabel = ''
    agreed.value = false
  },
)

watch(
  () => form.stage,
  (next) => {
    const grades = GRADES_BY_STAGE[next] || []
    if (!grades.includes(form.grade)) form.grade = grades[0] || ''
    const list = SUBJECTS_BY_STAGE[next] || []
    if (!list.includes(form.subject)) form.subject = list[0]
  },
)

function close() {
  emit('update:modelValue', false)
}

function buildRemark() {
  const chunks: string[] = []
  if (form.guardianLabel.trim()) chunks.push(`监护人称呼：${form.guardianLabel.trim()}`)
  if (form.grade) chunks.push(`年级：${form.grade}`)
  if (form.statusText.trim()) chunks.push(`学习现状：${form.statusText.trim()}`)
  if (form.goalText.trim()) chunks.push(`学习目标：${form.goalText.trim()}`)
  return chunks.join('\n')
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  if (!agreed.value) {
    ElMessage.warning('请先勾选同意条款')
    return
  }
  loading.value = true
  try {
    await apiPublishDemand({
      subject: form.subject,
      stage: form.stage,
      district: form.district,
      budget: form.budget,
      schedule: form.schedule,
      teachMode: form.teachMode,
      remark: buildRemark(),
      phone: form.phone,
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
    title="发布学习需求"
    width="600px"
    align-center
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    class="th-dialog th-dialog--teal"
    @close="close"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="th-dialog-form demand-dialog">
      <h3 class="form-title">
        学习基本信息
        <span>填写后老师可主动联系你</span>
      </h3>
      <div class="form-tips">
        <span class="dot">i</span>
        <p>只写学习需要，不公开孩子姓名、学校或详细住址。平台仅做信息撮合，不收取课时费。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="学段" prop="stage">
          <el-select v-model="form.stage" style="width: 100%" placeholder="请选择学段">
            <el-option v-for="s in STAGES" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级">
          <el-select v-model="form.grade" style="width: 100%">
            <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-select v-model="form.subject" style="width: 100%" placeholder="请选择科目">
            <el-option v-for="s in subjectOptions" :key="s" :label="s" :value="s" />
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
        <el-form-item label="学习现状">
          <el-input
            v-model="form.statusText"
            type="textarea"
            :rows="2"
            maxlength="200"
            placeholder="当前困难与基础情况"
          />
        </el-form-item>
        <el-form-item label="学习目标">
          <el-input
            v-model="form.goalText"
            type="textarea"
            :rows="2"
            maxlength="200"
            placeholder="希望沟通的方向"
          />
        </el-form-item>
        <el-form-item label="监护人称呼">
          <el-input v-model="form.guardianLabel" maxlength="20" placeholder="选填" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="方便老师联系" />
        </el-form-item>
        <el-form-item>
          <label class="agree">
            <input v-model="agreed" type="checkbox" />
            <span>我确认由监护人填写，并同意需求发布须知与隐私政策。</span>
          </label>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">发布需求</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.demand-dialog {
  --teal: #13857d;
  --mint: #eaf6f1;
  --muted: #687e7e;
}

.agree {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
  cursor: pointer;

  input {
    margin-top: 2px;
    accent-color: var(--teal);
  }
}

:deep(.form-tips) {
  background: var(--mint) !important;

  .dot {
    background: var(--teal) !important;
  }
}

:deep(.form-title::before) {
  background: var(--teal) !important;
}
</style>

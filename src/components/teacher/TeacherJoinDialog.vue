<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { apiSubmitTeacherJoin } from '@/api'
import { STAGES, SUBJECTS, TEACH_MODE_OPTIONS } from '@/constants'
import RegionCascader from '@/components/common/RegionCascader.vue'
import { useUserStore } from '@/store'
import type { RegionPath, Stage, Subject, TeachMode } from '@/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const agreed = ref(false)

const form = reactive({
  name: '',
  phone: '',
  stages: ['小学'] as Stage[],
  subjects: ['数学'] as Subject[],
  districts: [] as RegionPath[],
  price: 150,
  teachMode: 'both' as TeachMode,
  experience: '',
  introduction: '',
  focus: '',
  availableTimesText: '周末全天',
})

const rules: FormRules = {
  name: [{ required: true, message: '请填写公开称呼', trigger: 'blur' }],
  phone: [
    { required: true, message: '请填写手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  stages: [{ type: 'array', required: true, message: '请选择学段', trigger: 'change' }],
  subjects: [{ type: 'array', required: true, message: '请选择擅长科目', trigger: 'change' }],
  districts: [{ type: 'array', required: true, message: '请选择授课地区', trigger: 'change' }],
  price: [{ required: true, message: '请填写课时报价', trigger: 'blur' }],
  introduction: [{ required: true, message: '请填写自我介绍', trigger: 'blur' }],
}

const experiencePayload = computed(() => {
  const focus = form.focus.trim()
  const exp = form.experience.trim()
  if (focus && exp) return `教学侧重：${focus}\n${exp}`
  if (focus) return `教学侧重：${focus}`
  return exp || '暂无补充经历'
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    form.name = userStore.userInfo?.name || ''
    form.phone = userStore.userInfo?.phone || ''
    form.experience = ''
    form.introduction = ''
    form.focus = ''
    agreed.value = false
  },
)

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  if (!agreed.value) {
    ElMessage.warning('请先勾选资料真实性声明')
    return
  }
  loading.value = true
  try {
    await apiSubmitTeacherJoin({
      name: form.name.trim(),
      phone: form.phone,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.phone}`,
      stages: form.stages,
      subjects: form.subjects,
      districts: form.districts,
      price: form.price,
      teachMode: form.teachMode,
      experience: experiencePayload.value,
      introduction: form.introduction.trim(),
      certificates: [],
      availableTimes: form.availableTimesText
        .split(/[,，、\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      userId: userStore.userInfo?.id,
    })
    ElMessage.success('资料已提交，审核通过后才会对外展示')
    close()
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || '提交失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="完善教师资料"
    width="680px"
    align-center
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    class="th-dialog th-dialog--teal"
    @close="close"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="th-dialog-form join-dialog">
      <h3 class="form-title">
        公开资料
        <span>提交后进入待审核</span>
      </h3>
      <div class="form-tips">
        <span class="dot">i</span>
        <p>资料展示不等于平台认证。请确保信息真实有效；平台仅做信息撮合，不提供支付。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
        <el-form-item label="公开称呼" prop="name">
          <el-input v-model="form.name" maxlength="20" placeholder="例如：周老师" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" />
        </el-form-item>
        <el-form-item label="授课学段" prop="stages">
          <el-select v-model="form.stages" multiple style="width: 100%" placeholder="请选择学段">
            <el-option v-for="s in STAGES" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="擅长科目" prop="subjects">
          <el-select v-model="form.subjects" multiple style="width: 100%" placeholder="请选择科目">
            <el-option v-for="s in SUBJECTS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="教学侧重">
          <el-input v-model="form.focus" placeholder="选填，会写入经历说明" />
        </el-form-item>
        <el-form-item label="授课地区" prop="districts">
          <RegionCascader
            v-model="form.districts"
            multiple
            placeholder="可多选省市区"
          />
        </el-form-item>
        <el-form-item label="课时报价" prop="price">
          <el-input-number v-model="form.price" :min="50" :max="2000" :step="10" />
          <span class="unit">元 / 课时</span>
        </el-form-item>
        <el-form-item label="授课方式">
          <el-radio-group v-model="form.teachMode">
            <el-radio v-for="m in TEACH_MODE_OPTIONS" :key="m.value" :value="m.value">
              {{ m.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="可授课时间">
          <el-input v-model="form.availableTimesText" placeholder="可用逗号或换行分隔" />
        </el-form-item>
        <el-form-item label="教学经历">
          <el-input v-model="form.experience" type="textarea" :rows="3" maxlength="300" show-word-limit />
        </el-form-item>
        <el-form-item label="自我介绍" prop="introduction">
          <el-input v-model="form.introduction" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item>
          <label class="agree">
            <input v-model="agreed" type="checkbox" />
            <span>我声明所填资料真实准确，并同意相关展示须知与隐私政策。</span>
          </label>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">提交资料</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.join-dialog {
  --teal: #13857d;
  --mint: #eaf6f1;
  --ink: #173b3d;
  --muted: #687e7e;
}

.unit {
  margin-left: 8px;
  color: var(--muted);
  font-size: 13px;
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

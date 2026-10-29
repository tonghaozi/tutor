<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadUserFile } from 'element-plus'
import { apiSubmitTeacherJoin } from '@/api'
import { SUBJECTS, TEACH_MODE_OPTIONS } from '@/constants'
import RegionCascader from '@/components/common/RegionCascader.vue'
import { useUserStore } from '@/store'
import type { RegionPath, Subject, TeachMode } from '@/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const fileList = ref<UploadUserFile[]>([])

const form = reactive({
  name: '',
  phone: '',
  subjects: ['吉他'] as Subject[],
  districts: [] as RegionPath[],
  price: 150,
  teachMode: 'both' as TeachMode,
  experience: '',
  introduction: '',
  availableTimesText: '周末全天',
  certificatesText: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请填写手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  subjects: [{ type: 'array', required: true, message: '请选择擅长科目', trigger: 'change' }],
  districts: [{ type: 'array', required: true, message: '请选择授课地区', trigger: 'change' }],
  price: [{ required: true, message: '请填写课时报价', trigger: 'blur' }],
  experience: [{ required: true, message: '请填写教学经历', trigger: 'blur' }],
  introduction: [{ required: true, message: '请填写自我介绍', trigger: 'blur' }],
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    form.name = userStore.userInfo?.name || ''
    form.phone = userStore.userInfo?.phone || ''
    form.experience = ''
    form.introduction = ''
    fileList.value = []
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
    const certFromFiles = fileList.value.map((f) => f.name).filter(Boolean)
    const certFromText = form.certificatesText
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean)
    await apiSubmitTeacherJoin({
      name: form.name.trim(),
      phone: form.phone,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.phone}`,
      subjects: form.subjects,
      districts: form.districts,
      price: form.price,
      teachMode: form.teachMode,
      experience: form.experience.trim(),
      introduction: form.introduction.trim(),
      certificates: [...new Set([...certFromText, ...certFromFiles])],
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
    title="老师发布需求"
    width="680px"
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
        授课资料
        <span>提交后进入待审核</span>
      </h3>
      <div class="form-tips">
        <span class="dot">i</span>
        <p>请确保资料真实有效。审核通过后会出现在找老师列表与首页热门中。平台仅做信息撮合，不提供支付。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" maxlength="20" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" />
        </el-form-item>
        <el-form-item label="擅长科目" prop="subjects">
          <el-select v-model="form.subjects" multiple style="width: 100%" placeholder="请选择科目">
            <el-option v-for="s in SUBJECTS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="授课地区" prop="districts">
          <RegionCascader
            v-model="form.districts"
            multiple
            placeholder="可多选省市区，如：安徽省/合肥市/蜀山区"
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
          <el-input v-model="form.availableTimesText" placeholder="可用逗号或换行分隔多段时间" />
        </el-form-item>
        <el-form-item label="教学经历" prop="experience">
          <el-input v-model="form.experience" type="textarea" :rows="3" maxlength="300" show-word-limit />
        </el-form-item>
        <el-form-item label="证书上传">
          <el-upload v-model:file-list="fileList" action="#" :auto-upload="false" multiple>
            <el-button>选择文件（仅记录文件名）</el-button>
          </el-upload>
          <el-input
            v-model="form.certificatesText"
            placeholder="或手动填写证书名称，逗号分隔"
            style="margin-top: 8px"
          />
        </el-form-item>
        <el-form-item label="自我介绍" prop="introduction">
          <el-input v-model="form.introduction" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">提交发布</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.unit {
  margin-left: 8px;
  color: #7b8496;
  font-size: 13px;
}
</style>

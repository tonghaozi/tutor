<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadUserFile } from 'element-plus'
import { apiSubmitTeacherJoin } from '@/api'
import { DISTRICTS, SUBJECTS, TEACH_MODE_OPTIONS } from '@/constants'
import { useUserStore } from '@/store'
import type { HefeiDistrict, Subject, TeachMode } from '@/types'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const fileList = ref<UploadUserFile[]>([])

const form = reactive({
  name: userStore.userInfo?.name || '',
  phone: userStore.userInfo?.phone || '',
  subjects: ['吉他'] as Subject[],
  districts: ['蜀山区'] as HefeiDistrict[],
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
  districts: [{ type: 'array', required: true, message: '请选择授课区域', trigger: 'change' }],
  price: [{ required: true, message: '请填写课时报价', trigger: 'blur' }],
  experience: [{ required: true, message: '请填写教学经历', trigger: 'blur' }],
  introduction: [{ required: true, message: '请填写自我介绍', trigger: 'blur' }],
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
    ElMessage.success('入驻资料已提交，状态为待审核，通过后才会对外展示')
    form.experience = ''
    form.introduction = ''
    fileList.value = []
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container form-page">
    <h1 class="section-title">老师入驻</h1>
    <p class="section-desc">
      提交后默认为「待审核」。管理员在后台审核通过后，才会出现在找老师列表与首页热门中。
    </p>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="平台仅信息撮合，不提供支付。请确保资料真实有效。"
      style="margin-bottom: 16px; max-width: 720px"
    />

    <el-form ref="formRef" :model="form" :rules="rules" label-width="108px" class="panel">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" maxlength="20" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="form.phone" maxlength="11" />
      </el-form-item>
      <el-form-item label="擅长科目" prop="subjects">
        <el-select v-model="form.subjects" multiple style="width: 100%">
          <el-option v-for="s in SUBJECTS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="授课区域" prop="districts">
        <el-select v-model="form.districts" multiple style="width: 100%">
          <el-option v-for="d in DISTRICTS" :key="d" :label="d" :value="d" />
        </el-select>
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
          <el-button>选择文件（Mock，仅记录文件名）</el-button>
        </el-upload>
        <el-input
          v-model="form.certificatesText"
          placeholder="或手动填写证书名称，逗号分隔"
          style="margin-top: 8px"
        />
      </el-form-item>
      <el-form-item label="自我介绍" prop="introduction">
        <el-input v-model="form.introduction" type="textarea" :rows="4" maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">提交入驻</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.panel {
  max-width: 720px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 24px 24px 8px;
}

.unit {
  margin-left: 8px;
  color: $color-text-secondary;
  font-size: 13px;
}
</style>

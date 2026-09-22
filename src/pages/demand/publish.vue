<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { apiPublishDemand } from '@/api'
import { DISTRICTS, SUBJECTS, TEACH_MODE_OPTIONS } from '@/constants'
import { useUserStore } from '@/store'
import type { Demand, TeachMode } from '@/types'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  subject: '吉他' as Demand['subject'],
  district: '蜀山区' as Demand['district'],
  budget: 150,
  schedule: '',
  teachMode: 'offline' as TeachMode,
  remark: '',
  phone: userStore.userInfo?.phone || '',
})

const rules: FormRules = {
  subject: [{ required: true, message: '请选择科目', trigger: 'change' }],
  district: [{ required: true, message: '请选择区域', trigger: 'change' }],
  budget: [{ required: true, message: '请填写预算', trigger: 'blur' }],
  schedule: [{ required: true, message: '请填写上课时间', trigger: 'blur' }],
  teachMode: [{ required: true, message: '请选择授课方式', trigger: 'change' }],
  phone: [
    { required: true, message: '请填写手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
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
    ElMessage.success('需求已发布（Mock 已保存到本地）')
    form.remark = ''
    form.schedule = ''
  } catch (e: any) {
    ElMessage.error(e?.message || '发布失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container form-page">
    <h1 class="section-title">学员求聘</h1>
    <p class="section-desc">发布你的家教需求，老师可在首页看到最新求聘信息（演示数据保存在浏览器本地）。</p>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" class="panel">
      <el-form-item label="科目" prop="subject">
        <el-select v-model="form.subject" style="width: 100%">
          <el-option v-for="s in SUBJECTS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="合肥区域" prop="district">
        <el-select v-model="form.district" style="width: 100%">
          <el-option v-for="d in DISTRICTS" :key="d" :label="d" :value="d" />
        </el-select>
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
          :rows="4"
          maxlength="300"
          show-word-limit
          placeholder="基础水平、学习目标等"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="form.phone" maxlength="11" placeholder="方便老师联系" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">提交需求</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.panel {
  max-width: 640px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 24px 24px 8px;
}
</style>

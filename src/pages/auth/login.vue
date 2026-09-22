<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiLogin, apiSendCode } from '@/api'
import { ADMIN_PHONE, MOCK_SMS_CODE } from '@/constants'
import type { UserRole } from '@/types'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const sending = ref(false)

const form = reactive({
  phone: (route.query.role === 'admin' ? ADMIN_PHONE : '') as string,
  code: '',
  role: ((route.query.role as UserRole) || 'student') as UserRole,
})

async function sendCode() {
  sending.value = true
  try {
    const res = await apiSendCode(form.phone)
    ElMessage.success(res.message)
    form.code = MOCK_SMS_CODE
  } catch (e: any) {
    ElMessage.error(e?.message || '发送失败')
  } finally {
    sending.value = false
  }
}

async function submit() {
  loading.value = true
  try {
    const user = await apiLogin(form.phone, form.code, form.role)
    ElMessage.success(`欢迎，${user.name}`)
    const redirect = (route.query.redirect as string) || (user.role === 'admin' ? '/admin' : '/')
    router.replace(redirect)
  } catch (e: any) {
    ElMessage.error(e?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container login-page">
    <div class="panel">
      <h1>登录 / 注册</h1>
      <p class="desc">手机号即账号。未注册会自动创建；演示验证码固定为 {{ MOCK_SMS_CODE }}。</p>

      <el-form label-width="80px" @submit.prevent="submit">
        <el-form-item label="身份">
          <el-radio-group v-model="form.role">
            <el-radio value="student">学员</el-radio>
            <el-radio value="teacher">老师</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" maxlength="11" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="验证码">
          <div class="code-row">
            <el-input v-model="form.code" maxlength="6" placeholder="验证码" />
            <el-button :loading="sending" @click="sendCode">获取验证码</el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="submit">
            登录 / 注册
          </el-button>
        </el-form-item>
      </el-form>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        :title="`管理员演示账号：${ADMIN_PHONE}，验证码 ${MOCK_SMS_CODE}`"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  justify-content: center;
  padding-top: 24px;
}

.panel {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 28px 24px;

  h1 {
    margin: 0 0 8px;
    font-size: 22px;
  }
}

.desc {
  margin: 0 0 20px;
  color: $color-text-secondary;
  font-size: 13px;
  line-height: 1.6;
}

.code-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
</style>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { apiChangePassword, apiSendCode } from '@/api'
import { useUserStore } from '@/store'
import {
  errorMessage,
  isStrongPassword,
  PASSWORD_RULE_HINT,
  passwordRuleError,
} from '@/utils'
import {
  assertSmsSendable,
  getSmsCooldownRemain,
  markSmsSent,
  SMS_COOLDOWN_SECONDS,
} from '@/utils/smsLimit'

type VerifyMode = 'code' | 'password'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const userStore = useUserStore()
const loading = ref(false)
const sending = ref(false)
const countdown = ref(0)
const mode = ref<VerifyMode>('code')
let timer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  code: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const phone = computed(() => userStore.userInfo?.phone || '')
const maskedPhone = computed(() => {
  if (!/^1\d{10}$/.test(phone.value)) return phone.value
  return `${phone.value.slice(0, 3)} **** ${phone.value.slice(7)}`
})
const codeValid = computed(() => /^\d{6}$/.test(form.code))
const passwordValid = computed(() => isStrongPassword(form.newPassword))
const confirmValid = computed(() => form.newPassword === form.confirmPassword)
const sendLabel = computed(() => {
  if (sending.value) return '发送中'
  if (countdown.value > 0) return `${countdown.value}s 后重发`
  return '获取验证码'
})
const canSubmit = computed(() => {
  if (!passwordValid.value || !confirmValid.value) return false
  if (mode.value === 'code') return codeValid.value
  return form.oldPassword.length > 0
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) resetForm()
  },
)

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startCountdown(seconds = SMS_COOLDOWN_SECONDS) {
  clearTimer()
  countdown.value = seconds
  if (seconds <= 0) return
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearTimer()
  }, 1000)
}

function restoreDeviceCooldown() {
  const remain = getSmsCooldownRemain()
  if (remain > 0) startCountdown(remain)
  else {
    countdown.value = 0
    clearTimer()
  }
}

onUnmounted(clearTimer)

function resetForm() {
  mode.value = 'code'
  form.code = ''
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  restoreDeviceCooldown()
}

function close() {
  emit('update:modelValue', false)
}

async function sendCode() {
  if (!/^1\d{10}$/.test(phone.value)) {
    ElMessage.warning('当前账号手机号无效')
    return
  }
  if (countdown.value > 0 || sending.value) {
    if (countdown.value > 0) {
      ElMessage.warning(`发送太频繁，请 ${countdown.value} 秒后再试`)
    }
    return
  }
  try {
    assertSmsSendable()
  } catch (error: unknown) {
    restoreDeviceCooldown()
    ElMessage.warning(errorMessage(error, '发送太频繁，请稍后再试'))
    return
  }

  sending.value = true
  try {
    const res = await apiSendCode(phone.value)
    markSmsSent()
    ElMessage.success(res.message)
    startCountdown(res.cooldown || SMS_COOLDOWN_SECONDS)
  } catch (error: unknown) {
    restoreDeviceCooldown()
    ElMessage.error(errorMessage(error, '发送失败'))
  } finally {
    sending.value = false
  }
}

async function submit() {
  const ruleError = passwordRuleError(form.newPassword)
  if (ruleError) {
    ElMessage.warning(ruleError)
    return
  }
  if (!confirmValid.value) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  if (mode.value === 'code' && !codeValid.value) {
    ElMessage.warning('请输入 6 位验证码')
    return
  }
  if (mode.value === 'password' && !form.oldPassword) {
    ElMessage.warning('请输入原密码')
    return
  }

  loading.value = true
  try {
    const res = await apiChangePassword({
      method: mode.value,
      code: mode.value === 'code' ? form.code : undefined,
      oldPassword: mode.value === 'password' ? form.oldPassword : undefined,
      newPassword: form.newPassword,
    })
    ElMessage.success(res.message || '密码修改成功')
    close()
  } catch (error: unknown) {
    ElMessage.error(errorMessage(error, '修改失败'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="修改密码"
    width="440px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="change-password">
      <p class="hint">登录手机号：{{ maskedPhone }}</p>

      <div class="mode-tabs">
        <button
          type="button"
          :class="['mode-tab', { active: mode === 'code' }]"
          @click="mode = 'code'"
        >
          手机验证码
        </button>
        <button
          type="button"
          :class="['mode-tab', { active: mode === 'password' }]"
          @click="mode = 'password'"
        >
          原密码验证
        </button>
      </div>

      <label v-if="mode === 'code'" class="field">
        <span class="field-label">短信验证码</span>
        <div class="code-row">
          <el-input
            v-model="form.code"
            maxlength="6"
            placeholder="请输入 6 位验证码"
            inputmode="numeric"
          />
          <el-button :disabled="countdown > 0 || sending" @click="sendCode">
            {{ sendLabel }}
          </el-button>
        </div>
      </label>

      <label v-else class="field">
        <span class="field-label">原密码</span>
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          placeholder="请输入原密码"
          autocomplete="current-password"
        />
      </label>

      <label class="field">
        <span class="field-label">新密码</span>
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          :placeholder="PASSWORD_RULE_HINT"
          autocomplete="new-password"
        />
      </label>

      <label class="field">
        <span class="field-label">确认新密码</span>
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="再次输入新密码"
          autocomplete="new-password"
        />
      </label>

      <p class="field-tip">{{ PASSWORD_RULE_HINT }}</p>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" :disabled="!canSubmit" @click="submit">
        确认修改
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.change-password {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: $color-text-secondary;
}

.mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 4px;
  border-radius: 10px;
  background: #f3f5f8;
}

.mode-tab {
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: $color-text-secondary;
  cursor: pointer;

  &.active {
    background: #fff;
    color: $color-primary;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  color: $color-text;
}

.code-row {
  display: flex;
  gap: 8px;

  .el-input {
    flex: 1;
  }
}

.field-tip {
  margin: 0;
  font-size: 12px;
  color: $color-text-secondary;
  line-height: 1.5;
}
</style>

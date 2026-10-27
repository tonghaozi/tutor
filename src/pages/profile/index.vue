<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog.vue'
import GenderIcon from '@/components/common/GenderIcon.vue'
import {
  apiChangePhone,
  apiSendCode,
  apiUpdateProfile,
  apiUploadAvatar,
} from '@/api'
import { useUserStore } from '@/store'
import type { UserGender, UserRole } from '@/types'
import { errorMessage, maskPhone, resolveAvatar } from '@/utils'
import { compressImageToDataUrl } from '@/utils/image'
import {
  assertSmsSendable,
  getSmsCooldownRemain,
  markSmsSent,
  SMS_COOLDOWN_SECONDS,
} from '@/utils/smsLimit'

const ROLE_LABEL: Record<UserRole, string> = {
  student: '学员',
  teacher: '老师',
  admin: '管理员',
}

const userStore = useUserStore()
const passwordDialogVisible = ref(false)
const profileDialogVisible = ref(false)
const phoneDialogVisible = ref(false)
const savingProfile = ref(false)
const uploading = ref(false)
const sending = ref(false)
const changingPhone = ref(false)
const countdown = ref(0)
const localAvatarPreview = ref('')
let timer: ReturnType<typeof setInterval> | null = null
let localPreviewUrl = ''

const profile = reactive({
  name: '',
  gender: 'male' as UserGender,
  age: '' as string | number,
})

const phoneForm = reactive({
  phone: '',
  code: '',
})

const avatarUrl = computed(() => {
  if (localAvatarPreview.value) return localAvatarPreview.value
  return resolveAvatar(userStore.userInfo?.avatar, userStore.userInfo?.gender)
})

const displayName = computed(() => userStore.userInfo?.name || '未设置昵称')
const displayGender = computed(() =>
  userStore.userInfo?.gender === 'female' ? '女' : userStore.userInfo?.gender === 'male' ? '男' : '未设置',
)
const displayAge = computed(() => {
  const age = userStore.userInfo?.age
  return age ? `${age} 岁` : '未设置'
})
const displayRole = computed(() => {
  const role = userStore.userInfo?.role
  return role ? ROLE_LABEL[role] : ''
})
const displayPhone = computed(() => maskPhone(userStore.userInfo?.phone || '') || '未绑定')

function clearLocalPreview() {
  if (localPreviewUrl) {
    URL.revokeObjectURL(localPreviewUrl)
    localPreviewUrl = ''
  }
  localAvatarPreview.value = ''
}

function onAvatarError(event: Event) {
  const img = event.target as HTMLImageElement
  const fallback = resolveAvatar(undefined, userStore.userInfo?.gender)
  if (img.src !== fallback) img.src = fallback
}

watch(
  () => userStore.userInfo,
  (user) => {
    if (!user) return
    profile.name = user.name || ''
    profile.gender = user.gender === 'female' ? 'female' : 'male'
    profile.age = user.age ?? ''
  },
  { immediate: true },
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
}

onMounted(restoreDeviceCooldown)
onUnmounted(() => {
  clearTimer()
  clearLocalPreview()
})

function openProfileDialog() {
  const user = userStore.userInfo
  if (user) {
    profile.name = user.name || ''
    profile.gender = user.gender === 'female' ? 'female' : 'male'
    profile.age = user.age ?? ''
  }
  profileDialogVisible.value = true
}

function openPhoneDialog() {
  phoneForm.phone = ''
  phoneForm.code = ''
  phoneDialogVisible.value = true
}

async function saveProfile() {
  const name = profile.name.trim()
  if (!name || name.length > 20) {
    ElMessage.warning('昵称长度需要 1 到 20 位')
    return
  }
  const age = Number(profile.age)
  if (!Number.isInteger(age) || age < 1 || age > 120) {
    ElMessage.warning('年龄需要在 1 到 120 之间')
    return
  }
  savingProfile.value = true
  try {
    await apiUpdateProfile({
      name,
      gender: profile.gender,
      age,
    })
    ElMessage.success('资料已保存')
    profileDialogVisible.value = false
  } catch (error: unknown) {
    ElMessage.error(errorMessage(error, '保存失败'))
  } finally {
    savingProfile.value = false
  }
}

async function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('头像大小不能超过 2MB')
    return
  }
  clearLocalPreview()
  localPreviewUrl = URL.createObjectURL(file)
  localAvatarPreview.value = localPreviewUrl
  uploading.value = true
  try {
    const dataUrl = await compressImageToDataUrl(file)
    localAvatarPreview.value = dataUrl
    const updated = await apiUploadAvatar(dataUrl)
    if (!updated?.avatar || !String(updated.avatar).startsWith('data:image/')) {
      throw new Error('头像保存失败，请刷新后重试')
    }
    localAvatarPreview.value = updated.avatar
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
      localPreviewUrl = ''
    }
    ElMessage.success('头像已更新')
  } catch (error: unknown) {
    clearLocalPreview()
    ElMessage.error(errorMessage(error, '上传失败'))
  } finally {
    uploading.value = false
  }
}

async function sendPhoneCode() {
  if (!/^1\d{10}$/.test(phoneForm.phone)) {
    ElMessage.warning('请输入正确的新手机号')
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
    const res = await apiSendCode(phoneForm.phone)
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

async function submitPhoneChange() {
  if (!/^1\d{10}$/.test(phoneForm.phone)) {
    ElMessage.warning('请输入正确的新手机号')
    return
  }
  if (!/^\d{6}$/.test(phoneForm.code)) {
    ElMessage.warning('请输入 6 位验证码')
    return
  }
  changingPhone.value = true
  try {
    await apiChangePhone(phoneForm.phone, phoneForm.code)
    ElMessage.success('手机号已更新')
    phoneForm.phone = ''
    phoneForm.code = ''
    phoneDialogVisible.value = false
    countdown.value = 0
    clearTimer()
  } catch (error: unknown) {
    ElMessage.error(errorMessage(error, '更换失败'))
  } finally {
    changingPhone.value = false
  }
}
</script>

<template>
  <div class="page-container profile-page">
    <section class="identity">
      <div class="identity-bg" aria-hidden="true" />
      <div class="identity-body">
        <label class="avatar-wrap" :class="{ busy: uploading }" title="点击更换头像">
          <img
            class="avatar"
            :key="avatarUrl"
            :src="avatarUrl"
            alt="头像"
            @error="onAvatarError"
          />
          <span class="avatar-mask">{{ uploading ? '上传中' : '更换' }}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            :disabled="uploading"
            @change="onAvatarChange"
          />
        </label>

        <div class="identity-meta">
          <h1>{{ displayName }}</h1>
          <div class="meta-line">
            <span v-if="displayRole" class="chip role">{{ displayRole }}</span>
            <span class="chip">{{ displayGender }}</span>
            <span class="chip">{{ displayAge }}</span>
          </div>
          <p class="phone-line">{{ displayPhone }}</p>
        </div>
      </div>
    </section>

    <section class="panel">
      <header class="panel-head">
        <h2>个人资料</h2>
        <button type="button" class="link-btn" @click="openProfileDialog">编辑</button>
      </header>
      <ul class="setting-list">
        <li class="setting-row" @click="openProfileDialog">
          <span class="label">昵称</span>
          <span class="value">{{ displayName }}</span>
          <span class="arrow" aria-hidden="true" />
        </li>
        <li class="setting-row" @click="openProfileDialog">
          <span class="label">性别</span>
          <span class="value gender-value">
            <GenderIcon
              v-if="userStore.userInfo?.gender === 'male' || userStore.userInfo?.gender === 'female'"
              :gender="userStore.userInfo.gender"
            />
            {{ displayGender }}
          </span>
          <span class="arrow" aria-hidden="true" />
        </li>
        <li class="setting-row" @click="openProfileDialog">
          <span class="label">年龄</span>
          <span class="value">{{ displayAge }}</span>
          <span class="arrow" aria-hidden="true" />
        </li>
      </ul>
    </section>

    <section class="panel">
      <header class="panel-head">
        <h2>账号安全</h2>
      </header>
      <ul class="setting-list">
        <li class="setting-row" @click="openPhoneDialog">
          <span class="label">手机号</span>
          <span class="value">{{ displayPhone }}</span>
          <span class="arrow" aria-hidden="true" />
        </li>
        <li class="setting-row" @click="passwordDialogVisible = true">
          <span class="label">登录密码</span>
          <span class="value muted">修改</span>
          <span class="arrow" aria-hidden="true" />
        </li>
      </ul>
    </section>

    <el-dialog
      v-model="profileDialogVisible"
      title="编辑资料"
      width="420px"
      align-center
      destroy-on-close
    >
      <div class="dialog-form">
        <label class="field">
          <span>昵称</span>
          <el-input v-model="profile.name" maxlength="20" placeholder="1-20 个字符" />
        </label>
        <div class="field">
          <span>性别</span>
          <div class="gender-row">
            <button
              type="button"
              :class="['gender-btn', { active: profile.gender === 'male' }]"
              @click="profile.gender = 'male'"
            >
              <GenderIcon gender="male" />
              男
            </button>
            <button
              type="button"
              :class="['gender-btn', { active: profile.gender === 'female' }]"
              @click="profile.gender = 'female'"
            >
              <GenderIcon gender="female" />
              女
            </button>
          </div>
        </div>
        <label class="field">
          <span>年龄</span>
          <el-input v-model="profile.age" type="number" min="1" max="120" placeholder="1-120" />
        </label>
      </div>
      <template #footer>
        <el-button @click="profileDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingProfile" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="phoneDialogVisible"
      title="更换手机号"
      width="420px"
      align-center
      destroy-on-close
    >
      <p class="dialog-tip">当前绑定：{{ displayPhone }}</p>
      <div class="dialog-form">
        <label class="field">
          <span>新手机号</span>
          <el-input v-model="phoneForm.phone" maxlength="11" placeholder="请输入新手机号" />
        </label>
        <label class="field">
          <span>验证码</span>
          <div class="code-row">
            <el-input v-model="phoneForm.code" maxlength="6" placeholder="6 位验证码" />
            <el-button :disabled="countdown > 0 || sending" @click="sendPhoneCode">
              {{ sending ? '发送中' : countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </label>
      </div>
      <template #footer>
        <el-button @click="phoneDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="changingPhone" @click="submitPhoneChange">确认更换</el-button>
      </template>
    </el-dialog>

    <ChangePasswordDialog v-model="passwordDialogVisible" />
  </div>
</template>

<style scoped lang="scss">
.profile-page {
  padding: 24px 16px 56px;
  max-width: 720px;
}

.identity {
  position: relative;
  margin-bottom: 20px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #2a7fd4 0%, #3b9eff 48%, #6db5ff 100%);
  color: #fff;
  box-shadow: 0 12px 28px rgba(59, 158, 255, 0.22);
}

.identity-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 88% 18%, rgba(255, 255, 255, 0.28), transparent 42%),
    radial-gradient(circle at 12% 88%, rgba(255, 138, 61, 0.22), transparent 46%);
  pointer-events: none;
}

.identity-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 24px;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 6px 16px rgba(15, 40, 80, 0.18);

  &.busy {
    pointer-events: none;
  }

  &:hover .avatar-mask,
  &:focus-within .avatar-mask {
    opacity: 1;
  }
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.35);
}

.avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 40, 80, 0.45);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.identity-meta {
  min-width: 0;
  flex: 1;

  h1 {
    margin: 0 0 10px;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-size: 12px;
  backdrop-filter: blur(4px);

  &.role {
    background: rgba(255, 138, 61, 0.92);
    border-color: transparent;
    font-weight: 600;
  }
}

.phone-line {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  letter-spacing: 0.04em;
}

.panel {
  margin-bottom: 16px;
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 8px;

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $color-text;
  }
}

.link-btn {
  border: none;
  background: transparent;
  color: $color-primary;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;

  &:hover {
    color: $color-primary-dark;
  }
}

.setting-list {
  list-style: none;
  margin: 0;
  padding: 4px 0 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 18px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #f8fafc;
  }

  .label {
    flex-shrink: 0;
    width: 72px;
    font-size: 14px;
    color: $color-text;
  }

  .value {
    flex: 1;
    text-align: right;
    font-size: 14px;
    color: $color-text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.muted {
      color: $color-primary;
    }

    &.gender-value {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }
  }

  .arrow {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-right: 2px solid #c5cad3;
    border-bottom: 2px solid #c5cad3;
    transform: rotate(-45deg);
  }
}

.dialog-tip {
  margin: 0 0 16px;
  font-size: 13px;
  color: $color-text-secondary;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: $color-text;
}

.gender-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.gender-btn {
  height: 36px;
  border: 1px solid $color-border;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: $color-text-secondary;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background 0.2s ease,
    transform 0.15s ease;

  &:hover {
    border-color: rgba(59, 158, 255, 0.45);
    color: $color-text;
  }

  &.active {
    border-color: $color-primary;
    color: $color-primary;
    background: $color-primary-light;
    font-weight: 600;
  }

  &:active {
    transform: scale(0.98);
  }
}

.code-row {
  display: flex;
  gap: 8px;

  .el-input {
    flex: 1;
  }
}

@media (max-width: $breakpoint-md) {
  .profile-page {
    padding: 16px 12px 40px;
  }

  .identity-body {
    padding: 22px 16px;
    gap: 14px;
  }

  .avatar-wrap {
    width: 72px;
    height: 72px;
  }

  .identity-meta h1 {
    font-size: 22px;
  }

  .avatar-mask {
    opacity: 1;
    background: rgba(15, 40, 80, 0.35);
    font-size: 12px;
  }
}
</style>

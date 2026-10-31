<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  apiLogin,
  apiLoginByPassword,
  apiRegisterByPassword,
  apiSendCode,
} from "@/api";
import GenderIcon from "@/components/common/GenderIcon.vue";
import { APP_NAME } from "@/constants";
import type { UserGender, UserRole } from "@/types";
import {
  errorMessage,
  isStrongPassword,
  PASSWORD_RULE_HINT,
  passwordRuleError,
} from "@/utils";
import {
  assertSmsSendable,
  getSmsCooldownRemain,
  markSmsSent,
  SMS_COOLDOWN_SECONDS,
} from "@/utils/smsLimit";

type AuthMode = "code" | "password";
type PasswordMode = "login" | "register";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const sending = ref(false);
const authMode = ref<AuthMode>("code");
const passwordMode = ref<PasswordMode>("login");
const codeStep = ref<"phone" | "code">("phone");
const phoneRegistered = ref(true);
const agreed = ref(true);
const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const queryRole = route.query.role as string | undefined;
const isAdminEntry = queryRole === "admin";

const form = reactive({
  phone: "",
  code: "",
  password: "",
  confirmPassword: "",
  gender: "male" as UserGender,
  age: "" as string | number,
  role: (queryRole === "teacher" ? "teacher" : "student") as UserRole,
});

const roles = [
  { value: "student" as const, title: "我是学员", desc: "找老师、发需求" },
  { value: "teacher" as const, title: "我是老师", desc: "入驻接单、收咨询" },
];

const phoneValid = computed(() => /^1\d{10}$/.test(form.phone));
const codeValid = computed(() => /^\d{6}$/.test(form.code));
const passwordValid = computed(() => {
  if (passwordMode.value === "register") return isStrongPassword(form.password);
  return form.password.length > 0 && form.password.length <= 32;
});
const confirmValid = computed(() => form.password === form.confirmPassword);
const ageNumber = computed(() => {
  const n = Number(form.age);
  return Number.isInteger(n) ? n : NaN;
});
const ageValid = computed(() => ageNumber.value >= 1 && ageNumber.value <= 120);
const registerProfileValid = computed(
  () => (form.gender === "male" || form.gender === "female") && ageValid.value,
);
const maskedPhone = computed(() => {
  if (!phoneValid.value) return form.phone;
  return `${form.phone.slice(0, 3)} **** ${form.phone.slice(7)}`;
});
const submitRole = computed<UserRole>(() =>
  isAdminEntry ? "admin" : form.role,
);
const sendLabel = computed(() => {
  if (sending.value) return "发送中";
  if (countdown.value > 0) return `${countdown.value}s 后重发`;
  return codeStep.value === "code" ? "重新发送" : "获取验证码";
});
const titleText = computed(() => {
  if (authMode.value === "code") {
    if (codeStep.value === "phone") return "验证码登录";
    return phoneRegistered.value ? "输入验证码" : "完善资料并登录";
  }
  return passwordMode.value === "login" ? "账号密码登录" : "注册账号";
});
const descText = computed(() => {
  if (authMode.value === "code") {
    if (codeStep.value === "code") {
      if (!phoneRegistered.value) {
        return `新手机号 ${maskedPhone.value}，请填写性别和年龄后登录`;
      }
      return `验证码已发送至 ${maskedPhone.value}`;
    }
    return "已注册手机号直接登录；新手机号需补充性别和年龄";
  }
  if (passwordMode.value === "login") {
    return "使用手机号和密码登录已有账号";
  }
  return "设置密码后，下次可直接账号密码登录";
});

watch(
  () => form.phone,
  () => {
    if (codeStep.value === "code") {
      codeStep.value = "phone";
      form.code = "";
      phoneRegistered.value = true;
      clearTimer();
      countdown.value = 0;
      restoreDeviceCooldown();
    }
  },
);

watch(authMode, () => {
  codeStep.value = "phone";
  phoneRegistered.value = true;
  passwordMode.value = "login";
  form.code = "";
  form.password = "";
  form.confirmPassword = "";
  form.age = "";
  form.gender = "male";
  clearTimer();
  countdown.value = 0;
  restoreDeviceCooldown();
});

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function startCountdown(seconds = SMS_COOLDOWN_SECONDS) {
  clearTimer();
  countdown.value = seconds;
  if (seconds <= 0) return;
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) clearTimer();
  }, 1000);
}

function restoreDeviceCooldown() {
  const remain = getSmsCooldownRemain();
  if (remain > 0) startCountdown(remain);
  else {
    clearTimer();
    countdown.value = 0;
  }
}

onMounted(restoreDeviceCooldown);
onUnmounted(clearTimer);

function ensureAgreed() {
  if (!agreed.value) {
    ElMessage.warning("请先同意用户协议和隐私政策");
    return false;
  }
  return true;
}

async function afterLogin(user: { name: string; role: UserRole }) {
  ElMessage.success(`欢迎，${user.name}`);
  const redirect =
    (route.query.redirect as string) ||
    (user.role === "admin" ? "/admin" : "/");
  router.replace(redirect);
}

async function sendCode() {
  if (!phoneValid.value) {
    ElMessage.warning("请输入正确的手机号");
    return;
  }
  if (!ensureAgreed()) return;
  if (countdown.value > 0 || sending.value) {
    if (countdown.value > 0) {
      ElMessage.warning(`发送太频繁，请 ${countdown.value} 秒后再试`);
    }
    return;
  }
  try {
    assertSmsSendable();
  } catch (error: unknown) {
    restoreDeviceCooldown();
    ElMessage.warning(errorMessage(error, "发送太频繁，请稍后再试"));
    return;
  }

  sending.value = true;
  try {
    const res = await apiSendCode(form.phone);
    phoneRegistered.value = Boolean(res.registered);
    markSmsSent();
    ElMessage.success(
      phoneRegistered.value
        ? res.message
        : `${res.message}，请补充性别和年龄`,
    );
    codeStep.value = "code";
    startCountdown(res.cooldown || SMS_COOLDOWN_SECONDS);
  } catch (error: unknown) {
    restoreDeviceCooldown();
    ElMessage.error(errorMessage(error, "发送失败"));
  } finally {
    sending.value = false;
  }
}

function backToPhone() {
  codeStep.value = "phone";
  form.code = "";
  phoneRegistered.value = true;
  clearTimer();
  countdown.value = 0;
  restoreDeviceCooldown();
}

async function submitCodeLogin() {
  if (!phoneValid.value) {
    ElMessage.warning("请输入正确的手机号");
    return;
  }
  if (!codeValid.value) {
    ElMessage.warning("请输入 6 位验证码");
    return;
  }
  if (!phoneRegistered.value && !registerProfileValid.value) {
    ElMessage.warning("新手机号请选择性别并填写 1-120 的年龄");
    return;
  }
  if (!ensureAgreed()) return;

  loading.value = true;
  try {
    const user = await apiLogin(
      form.phone,
      form.code,
      submitRole.value,
      phoneRegistered.value
        ? undefined
        : { gender: form.gender, age: ageNumber.value },
    );
    await afterLogin(user);
  } catch (error: unknown) {
    ElMessage.error(errorMessage(error, "登录失败"));
  } finally {
    loading.value = false;
  }
}

async function submitPassword() {
  if (!phoneValid.value) {
    ElMessage.warning("请输入正确的手机号");
    return;
  }
  if (passwordMode.value === "register") {
    const ruleError = passwordRuleError(form.password);
    if (ruleError) {
      ElMessage.warning(ruleError);
      return;
    }
  } else if (!passwordValid.value) {
    ElMessage.warning("请输入密码");
    return;
  }
  if (passwordMode.value === "register" && !confirmValid.value) {
    ElMessage.warning("两次输入的密码不一致");
    return;
  }
  if (passwordMode.value === "register" && !registerProfileValid.value) {
    ElMessage.warning("请选择性别并填写 1-120 的年龄");
    return;
  }
  if (!ensureAgreed()) return;

  loading.value = true;
  try {
    const user =
      passwordMode.value === "register"
        ? await apiRegisterByPassword(
            form.phone,
            form.password,
            submitRole.value,
            { gender: form.gender, age: ageNumber.value },
          )
        : await apiLoginByPassword(form.phone, form.password, submitRole.value);
    await afterLogin(user);
  } catch (error: unknown) {
    ElMessage.error(
      errorMessage(
        error,
        passwordMode.value === "register" ? "注册失败" : "登录失败",
      ),
    );
  } finally {
    loading.value = false;
  }
}

function onPrimarySubmit() {
  if (authMode.value === "code") {
    if (codeStep.value === "phone") sendCode();
    else submitCodeLogin();
    return;
  }
  submitPassword();
}
</script>

<template>
  <div class="login-page">
    <div class="login-shell">
      <aside class="login-aside">
        <p class="eyebrow">{{ APP_NAME }}</p>
        <h1>欢迎回来</h1>
        <p class="aside-desc">
          支持手机验证码登录，也可以用账号密码登录。学员找老师、老师接咨询，选好身份后继续。
        </p>
        <ul class="aside-points">
          <li>验证码登录：新号需填性别年龄</li>
          <li>账号密码：适合常用登录</li>
          <li>平台只做信息撮合，不收取课时费</li>
        </ul>
      </aside>

      <section class="login-panel">
        <div class="mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :class="['mode-tab', { active: authMode === 'code' }]"
            @click="authMode = 'code'"
          >
            验证码登录
          </button>
          <button
            type="button"
            role="tab"
            :class="['mode-tab', { active: authMode === 'password' }]"
            @click="authMode = 'password'"
          >
            账号密码
          </button>
        </div>

        <div class="panel-head">
          <h2>{{ titleText }}</h2>
          <p class="panel-desc" style="color: red;">暂时未接通短信服务商，短信密码为<span style="font-weight: bold;font-size: 20px;">123456</span></p>
          <p class="panel-desc">
            {{ descText }}
            <button
              v-if="authMode === 'code' && codeStep === 'code'"
              type="button"
              class="text-btn"
              @click="backToPhone"
            >
              修改
            </button>
          </p>
        </div>

        <div v-if="!isAdminEntry" class="role-grid">
          <button
            v-for="item in roles"
            :key="item.value"
            type="button"
            :class="['role-card', { active: form.role === item.value }]"
            @click="form.role = item.value"
          >
            <span class="role-title">{{ item.title }}</span>
            <span class="role-desc">{{ item.desc }}</span>
          </button>
        </div>
        <p v-else class="admin-tip">正在进入管理后台登录</p>

        <form class="login-form" @submit.prevent="onPrimarySubmit">
          <label
            v-if="authMode === 'code' ? codeStep === 'phone' : true"
            class="field"
          >
            <span class="field-label">手机号</span>
            <input
              v-model="form.phone"
              class="field-input"
              type="tel"
              inputmode="numeric"
              maxlength="11"
              autocomplete="tel"
              placeholder="请输入 11 位手机号"
            />
          </label>

          <template v-if="authMode === 'code'">
            <label v-if="codeStep === 'code'" class="field">
              <span class="field-label">验证码</span>
              <div class="code-row">
                <input
                  v-model="form.code"
                  class="field-input"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  autocomplete="one-time-code"
                  placeholder="请输入 6 位验证码"
                />
                <button
                  type="button"
                  class="ghost-btn"
                  :disabled="sending || countdown > 0"
                  @click="sendCode"
                >
                  {{ sendLabel }}
                </button>
              </div>
            </label>
            <div
              v-if="codeStep === 'code' && !phoneRegistered"
              class="profile-row"
            >
              <label class="field">
                <span class="field-label">性别</span>
                <div class="gender-row">
                  <button
                    type="button"
                    :class="['gender-btn', { active: form.gender === 'male' }]"
                    @click="form.gender = 'male'"
                  >
                    <GenderIcon gender="male" />
                    男
                  </button>
                  <button
                    type="button"
                    :class="['gender-btn', { active: form.gender === 'female' }]"
                    @click="form.gender = 'female'"
                  >
                    <GenderIcon gender="female" />
                    女
                  </button>
                </div>
              </label>
              <label class="field">
                <span class="field-label">年龄</span>
                <input
                  v-model="form.age"
                  class="field-input"
                  type="number"
                  min="1"
                  max="120"
                  inputmode="numeric"
                  placeholder="请输入年龄"
                />
              </label>
            </div>
          </template>

          <template v-else>
            <label class="field">
              <span class="field-label">密码</span>
              <input
                v-model="form.password"
                class="field-input"
                type="password"
                maxlength="32"
                autocomplete="current-password"
                :placeholder="
                  passwordMode === 'register'
                    ? PASSWORD_RULE_HINT
                    : '请输入密码'
                "
              />
            </label>
            <label v-if="passwordMode === 'register'" class="field">
              <span class="field-label">确认密码</span>
              <input
                v-model="form.confirmPassword"
                class="field-input"
                type="password"
                maxlength="32"
                autocomplete="new-password"
                placeholder="请再次输入密码"
              />
            </label>
            <p v-if="passwordMode === 'register'" class="field-tip">
              {{ PASSWORD_RULE_HINT }}
            </p>
            <div v-if="passwordMode === 'register'" class="profile-row">
              <label class="field">
                <span class="field-label">性别</span>
                <div class="gender-row">
                  <button
                    type="button"
                    :class="['gender-btn', { active: form.gender === 'male' }]"
                    @click="form.gender = 'male'"
                  >
                    <GenderIcon gender="male" />
                    男
                  </button>
                  <button
                    type="button"
                    :class="['gender-btn', { active: form.gender === 'female' }]"
                    @click="form.gender = 'female'"
                  >
                    <GenderIcon gender="female" />
                    女
                  </button>
                </div>
              </label>
              <label class="field">
                <span class="field-label">年龄</span>
                <input
                  v-model="form.age"
                  class="field-input"
                  type="number"
                  min="1"
                  max="120"
                  inputmode="numeric"
                  placeholder="请输入年龄"
                />
              </label>
            </div>
          </template>

          <label class="agree">
            <input v-model="agreed" type="checkbox" />
            <span>
              我已阅读并同意
              <router-link to="/legal/agreement" target="_blank"
                >《用户协议》</router-link
              >
              和
              <router-link to="/legal/privacy" target="_blank"
                >《隐私政策》</router-link
              >
            </span>
          </label>

          <button
            v-if="authMode === 'code' && codeStep === 'phone'"
            type="submit"
            class="primary-btn"
            :disabled="sending || !phoneValid"
          >
            {{ sending ? "发送中…" : "获取验证码" }}
          </button>
          <button
            v-else-if="authMode === 'code'"
            type="submit"
            class="primary-btn"
            :disabled="
              loading ||
              !codeValid ||
              (!phoneRegistered && !registerProfileValid)
            "
          >
            {{
              loading
                ? "登录中…"
                : phoneRegistered
                  ? "登录"
                  : "注册并登录"
            }}
          </button>
          <button
            v-else
            type="submit"
            class="primary-btn"
            :disabled="
              loading ||
              !phoneValid ||
              !passwordValid ||
              (passwordMode === 'register' &&
                (!confirmValid || !registerProfileValid))
            "
          >
            {{
              loading
                ? passwordMode === "register"
                  ? "注册中…"
                  : "登录中…"
                : passwordMode === "register"
                  ? "注册并登录"
                  : "登录"
            }}
          </button>
        </form>

        <div v-if="authMode === 'password'" class="switch-row">
          <template v-if="passwordMode === 'login'">
            <span>还没有账号？</span>
            <button
              type="button"
              class="text-btn"
              @click="passwordMode = 'register'"
            >
              去注册
            </button>
          </template>
          <template v-else>
            <span>已有账号？</span>
            <button
              type="button"
              class="text-btn"
              @click="passwordMode = 'login'"
            >
              去登录
            </button>
          </template>
        </div>

        <p class="footer-tip">
          验证码 5
          分钟内有效。仅用验证码登录的账号，需要先注册并设置密码后，才能用账号密码登录。
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  position: relative;
  isolation: isolate;
  min-height: calc(100vh - #{$header-height} - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px 48px;
  background: #1b2a3d;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    background: url("/images/login-tutor-bg.jpg") center / cover no-repeat;
  }
}

.login-shell {
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 22px 56px rgba(16, 32, 54, 0.28);
  backdrop-filter: blur(14px);
}

.login-aside {
  position: relative;
  overflow: hidden;
  padding: 40px 36px;
  color: #fff;
  background:
    linear-gradient(165deg, rgb(68 45 18 / 40%), rgba(42, 127, 212, 0.62)),
    url(/images/login-tutor-bg.jpg) center / cover no-repeat;

  &::after {
    content: "";
    position: absolute;
    inset: auto 0 0;
    height: 42%;
    background: linear-gradient(180deg, transparent, rgba(12, 28, 48, 0.35));
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 13px;
  letter-spacing: 0.08em;
  opacity: 0.86;
}

.login-aside h1 {
  margin: 0 0 14px;
  font-size: 32px;
  line-height: 1.25;
  font-weight: 700;
}

.aside-desc {
  margin: 0 0 28px;
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.92;
}

.aside-points {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;

  li {
    position: relative;
    padding-left: 18px;
    font-size: 13px;
    line-height: 1.6;
    opacity: 0.94;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: $color-accent;
    }
  }
}

.login-panel {
  padding: 32px 28px 36px;
  background: #fff;
}

.mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  border-radius: 14px;
  background: #f3f6fb;
}

.mode-tab {
  height: 40px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: $color-text-secondary;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &.active {
    background: #fff;
    color: $color-primary-dark;
    box-shadow: 0 1px 4px rgba(31, 41, 55, 0.08);
  }
}

.panel-head {
  margin-bottom: 18px;

  h2 {
    margin: 0 0 8px;
    font-size: 22px;
    color: $color-text;
  }
}

.panel-desc {
  margin: 0;
  color: $color-text-secondary;
  font-size: 13px;
  line-height: 1.6;
}

.text-btn {
  margin-left: 4px;
  border: 0;
  background: transparent;
  color: $color-primary;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.role-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  padding: 14px 14px 12px;
  border: 1px solid $color-border;
  border-radius: 14px;
  background: #fafbfd;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: rgba(59, 158, 255, 0.45);
  }

  &.active {
    border-color: $color-primary;
    background: $color-primary-light;
    box-shadow: inset 0 0 0 1px rgba(59, 158, 255, 0.25);
  }
}

.role-title {
  font-size: 15px;
  font-weight: 600;
  color: $color-text;
}

.role-desc {
  font-size: 12px;
  color: $color-text-secondary;
}

.admin-tip {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 10px;
  background: $color-accent-light;
  color: #b35a1a;
  font-size: 13px;
}

.login-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  color: $color-text-secondary;
}

.field-input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border: 1px solid $color-border;
  border-radius: 12px;
  background: #fff;
  color: $color-text;
  font-size: 15px;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus {
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba(59, 158, 255, 0.16);
  }

  &::placeholder {
    color: #9ca3af;
  }
}

.code-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.ghost-btn,
.primary-btn {
  height: 46px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.ghost-btn {
  min-width: 108px;
  padding: 0 14px;
  border: 1px solid rgba(59, 158, 255, 0.35);
  background: $color-primary-light;
  color: $color-primary-dark;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.primary-btn {
  border: 0;
  background: linear-gradient(135deg, $color-primary, $color-primary-dark);
  color: #fff;
  box-shadow: 0 10px 24px rgba(59, 158, 255, 0.28);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }
}

.agree {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: $color-text-secondary;
  line-height: 1.6;

  input {
    margin-top: 3px;
  }

  a {
    color: $color-primary;
  }
}

.switch-row {
  margin-top: 14px;
  font-size: 13px;
  color: $color-text-secondary;
}

.field-tip {
  margin: -4px 0 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}

.profile-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.gender-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.gender-btn {
  height: 40px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  background: #fff;
  color: $color-text-secondary;
  cursor: pointer;
  font-size: 14px;
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

.footer-tip {
  margin: 16px 0 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}

@media (max-width: $breakpoint-md) {
  .login-page {
    padding: 20px 12px 36px;
    align-items: flex-start;
  }

  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-aside {
    padding: 28px 22px 24px;

    h1 {
      font-size: 26px;
    }
  }

  .aside-points {
    display: none;
  }

  .login-panel {
    padding: 22px 16px 28px;
  }

  .panel-head h2 {
    font-size: 20px;
  }
}
</style>

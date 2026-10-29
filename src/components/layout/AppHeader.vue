<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog.vue'
import StudentDemandDialog from '@/components/demand/StudentDemandDialog.vue'
import TeacherJoinDialog from '@/components/teacher/TeacherJoinDialog.vue'
import CityPicker from './CityPicker.vue'
import { useUserStore } from '@/store'
import { APP_NAME } from '@/constants'
import { errorMessage, resolveAvatar } from '@/utils'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const menuOpen = ref(false)
const passwordDialogVisible = ref(false)
const studentDemandVisible = ref(false)
const teacherJoinVisible = ref(false)

const navItems = computed(() => {
  const role = userStore.userInfo?.role
  const items = [
    { path: '/', label: '首页' },
    { path: '/teachers', label: '找老师', hideFor: 'teacher' as const },
    { path: '/students', label: '找学生', hideFor: 'student' as const },
    { path: '/#stages', label: '学段与科目' },
  ]
  return items.filter((item) => !('hideFor' in item && item.hideFor === role))
})

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const displayName = computed(() => userStore.userInfo?.name || '')
const avatarUrl = computed(() =>
  resolveAvatar(userStore.userInfo?.avatar, userStore.userInfo?.gender),
)

function go(path: string) {
  menuOpen.value = false
  if (path === '/#stages') {
    if (route.path === '/') {
      document.getElementById('stages')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    router.push({ path: '/', hash: '#stages' })
    return
  }
  router.push(path)
}

function openChangePassword() {
  menuOpen.value = false
  passwordDialogVisible.value = true
}

function goProfile() {
  menuOpen.value = false
  router.push('/profile')
}

function onUserCommand(command: string) {
  if (command === 'profile') goProfile()
  else if (command === 'admin') go('/admin')
  else if (command === 'password') openChangePassword()
  else if (command === 'logout') logout()
}

function onPublishClick() {
  menuOpen.value = false
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录后再发布需求')
    router.push({ path: '/auth/login', query: { redirect: route.fullPath } })
    return
  }
  const role = userStore.userInfo?.role
  if (role === 'teacher') {
    teacherJoinVisible.value = true
    return
  }
  if (role === 'student') {
    studentDemandVisible.value = true
    return
  }
  // 管理员默认打开学生求学表单
  studentDemandVisible.value = true
}

async function logout() {
  try {
    await userStore.logout()
    menuOpen.value = false
    router.push('/')
  } catch (error: unknown) {
    ElMessage.error(errorMessage(error, '退出失败'))
  }
}
</script>

<template>
  <header class="app-header" :class="{ 'on-home': route.path === '/' }">
    <div class="page-container header-inner">
      <div class="brand" @click="go('/')">
        <img class="brand-logo" src="/logo/logo.png" :alt="APP_NAME" />
        <span class="brand-text">
          <span class="brand-name">{{ APP_NAME }}</span>
          <span class="brand-en">全国综合家教平台</span>
        </span>
      </div>

      <nav class="nav-desktop">
        <a
          v-for="item in navItems"
          :key="item.path"
          :class="['nav-link', { active: isActive(item.path) }]"
          @click.prevent="go(item.path)"
        >
          {{ item.label }}
        </a>
      </nav>

      <div class="header-actions">
        <div class="action-utils">
          <CityPicker />
        </div>

        <button class="cta-btn" type="button" @click="onPublishClick">
          <img src="/images/home/plus.svg" width="16" height="16" alt="" />
          发布需求
        </button>

        <i class="action-split" aria-hidden="true" />

        <template v-if="userStore.isLogin">
          <el-dropdown trigger="click" @command="onUserCommand">
            <button type="button" class="user-chip">
              <img
                class="user-avatar"
                :src="avatarUrl"
                alt="头像"
                @error="($event.target as HTMLImageElement).src = resolveAvatar(undefined, userStore.userInfo?.gender)"
              />
              <span class="user-entry">
                {{ displayName }}
                <el-tag v-if="userStore.isAdmin" size="small" type="warning" effect="plain">管理</el-tag>
              </span>
              <span class="user-caret" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin">管理后台</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <button class="login-link" type="button" @click="go('/auth/login')">登录 / 注册</button>
        </template>

        <button class="menu-btn" type="button" aria-label="菜单" @click="menuOpen = !menuOpen">
          <span /><span /><span />
        </button>
      </div>
    </div>

    <div v-if="menuOpen" class="nav-mobile">
      <a
        v-for="item in navItems"
        :key="item.path"
        :class="['nav-link', { active: isActive(item.path) }]"
        @click.prevent="go(item.path)"
      >
        {{ item.label }}
      </a>
      <a class="nav-link" @click.prevent="onPublishClick">发布需求</a>
      <a v-if="userStore.isAdmin" class="nav-link" @click.prevent="go('/admin')">管理后台</a>
      <a v-if="!userStore.isLogin" class="nav-link" @click.prevent="go('/auth/login')">登录/注册</a>
      <template v-else>
        <a class="nav-link" @click.prevent="goProfile">个人中心</a>
        <a class="nav-link" @click.prevent="openChangePassword">修改密码</a>
        <a class="nav-link" @click.prevent="logout">退出登录</a>
      </template>
    </div>

    <ChangePasswordDialog v-model="passwordDialogVisible" />
    <StudentDemandDialog v-model="studentDemandVisible" />
    <TeacherJoinDialog v-model="teacherJoinVisible" />
  </header>
</template>

<style scoped lang="scss">
.app-header {
  z-index: 100;
  background: rgba(255, 255, 255, 0.91);
  border-bottom: 1px solid rgba(230, 236, 245, 0.8);

  &.on-home {
    background: #fff;
    border-bottom-color: transparent;
  }
}

.header-inner {
  height: 88px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.brand-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-name {
  font-size: 23px;
  font-weight: 800;
  color: #173b3d;
  line-height: 1.2;
}

.brand-en {
  color: #687e7e;
  font-size: 10px;
  font-weight: 400;
}

.nav-desktop {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-left: 8px;
}

.nav-link {
  position: relative;
  color: #33445d;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  padding: 6px 0;

  &.active {
    color: #13857d;
    font-weight: 700;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -2px;
      width: 16px;
      height: 3px;
      border-radius: 99px;
      background: #13857d;
      transform: translateX(-50%);
    }
  }

  &:hover {
    color: #13857d;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}

.action-utils {
  display: inline-flex;
  align-items: center;
}

.action-split {
  width: 1px;
  height: 20px;
  background: #e6ecf5;
  flex-shrink: 0;
}

.login-link,
.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 46px;
  padding: 0 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

.login-link {
  border: 0;
  background: transparent;
  color: #173b3d;
  padding: 0;

  &:hover {
    color: #13857d;
  }
}

.cta-btn {
  border: 0;
  background: #13857d;
  color: #fff;
  box-shadow: none;

  &:hover {
    background: #0f736c;
  }
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 10px 0 4px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(40, 120, 255, 0.06);
  }
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  background: #f3f5f8;
  border: 1px solid #e6ecf5;
}

.user-entry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #33445d;
  font-size: 14px;
  font-weight: 600;
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-caret {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #c0c4cc;
}

.menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  padding: 6px;

  span {
    display: block;
    height: 2px;
    background: $color-text;
    border-radius: 2px;
  }
}

.nav-mobile {
  display: none;
  flex-direction: column;
  padding: 8px 16px 16px;
  border-top: 1px solid $color-border;
  background: #fff;
}

@media (max-width: $breakpoint-md) {
  .nav-desktop,
  .login-link,
  .cta-btn,
  .action-split,
  .user-entry,
  .user-caret,
  .brand-en {
    display: none;
  }

  .menu-btn {
    display: flex;
  }

  .nav-mobile {
    display: flex;
  }

  .brand-name {
    font-size: 16px;
  }

  .user-chip {
    padding: 0;
  }
}
</style>

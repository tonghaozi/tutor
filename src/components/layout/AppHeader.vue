<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog.vue'
import CityPicker from './CityPicker.vue'
import { useUserStore } from '@/store'
import { APP_NAME } from '@/constants'
import { errorMessage, resolveAvatar } from '@/utils'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const menuOpen = ref(false)
const passwordDialogVisible = ref(false)

const navItems = [
  { path: '/', label: '首页' },
  { path: '/teachers', label: '找老师' },
  { path: '/demand/publish', label: '学员求聘' },
  { path: '/teacher/join', label: '老师入驻' },
]

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
  <header class="app-header">
    <div class="page-container header-inner">
      <div class="brand" @click="go('/')">
        <img class="brand-logo" src="/logo/logo.png" :alt="APP_NAME" />
        <span class="brand-name">{{ APP_NAME }}</span>
      </div>

      <CityPicker />

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
        <template v-if="userStore.isLogin">
          <div class="user-area">
            <button class="avatar-btn" type="button" title="个人中心" @click="goProfile">
              <img
                class="user-avatar"
                :src="avatarUrl"
                alt="头像"
                @error="($event.target as HTMLImageElement).src = resolveAvatar(undefined, userStore.userInfo?.gender)"
              />
            </button>
            <el-dropdown>
              <span class="user-entry">
                {{ displayName }}
                <el-tag v-if="userStore.isAdmin" size="small" type="warning" effect="plain">管理</el-tag>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="userStore.isAdmin" @click="go('/admin')">
                    管理后台
                  </el-dropdown-item>
                  <el-dropdown-item @click="openChangePassword">修改密码</el-dropdown-item>
                  <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
        <el-button v-else type="primary" round @click="go('/auth/login')">登录/注册</el-button>

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
      <a v-if="userStore.isAdmin" class="nav-link" @click.prevent="go('/admin')">管理后台</a>
      <a v-if="!userStore.isLogin" class="nav-link" @click.prevent="go('/auth/login')">登录/注册</a>
      <template v-else>
        <a class="nav-link" @click.prevent="goProfile">个人中心</a>
        <a class="nav-link" @click.prevent="openChangePassword">修改密码</a>
        <a class="nav-link" @click.prevent="logout">退出登录</a>
      </template>
    </div>

    <ChangePasswordDialog v-model="passwordDialogVisible" />
  </header>
</template>

<style scoped lang="scss">
.app-header {
  z-index: 100;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid $color-border;
  backdrop-filter: blur(8px);
}

.header-inner {
  height: $header-height;
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.brand-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: $color-text;
  line-height: 1.2;
}

.nav-desktop {
  display: flex;
  gap: 8px;
  flex: 1;
  margin-left: 24px;
}

.nav-link {
  padding: 8px 12px;
  border-radius: $radius-sm;
  color: $color-text-secondary;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover,
  &.active {
    color: $color-primary;
    background: $color-primary-light;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.user-area {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.avatar-btn {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  background: #f3f5f8;
}

.user-entry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: $color-text;
  font-size: 14px;
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
  .nav-desktop {
    display: none;
  }

  .menu-btn {
    display: flex;
  }

  .nav-mobile {
    display: flex;
  }

  .brand-logo {
    width: 40px;
    height: 40px;
  }

  .brand-name {
    font-size: 15px;
  }
}
</style>

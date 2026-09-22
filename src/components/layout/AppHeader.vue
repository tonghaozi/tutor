<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { APP_NAME } from '@/constants'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const menuOpen = ref(false)

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

function go(path: string) {
  menuOpen.value = false
  router.push(path)
}

function logout() {
  userStore.logout()
  menuOpen.value = false
  router.push('/')
}
</script>

<template>
  <header class="app-header">
    <div class="page-container header-inner">
      <div class="brand" @click="go('/')">
        <span class="brand-mark">同</span>
        <span class="brand-name">{{ APP_NAME }}</span>
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
        <template v-if="userStore.isLogin">
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
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
      <a v-else class="nav-link" @click.prevent="logout">退出登录</a>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
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
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, $color-primary, #5eb0ff);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: $color-text;
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

  .brand-name {
    font-size: 14px;
  }
}
</style>

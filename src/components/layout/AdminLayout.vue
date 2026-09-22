<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/store'
import { APP_NAME } from '@/constants'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const menus = [
  { path: '/admin', label: '数据看板' },
  { path: '/admin/users', label: '用户管理' },
  { path: '/admin/audit', label: '老师资质审核' },
  { path: '/admin/demands', label: '需求管理' },
  { path: '/admin/comments', label: '评论管理' },
]

function logout() {
  userStore.logout()
  router.push('/auth/login')
}
</script>

<template>
  <div class="admin-layout" :class="{ collapsed: appStore.sidebarCollapsed }">
    <aside class="sidebar">
      <div class="side-brand">
        <span>{{ APP_NAME }}</span>
        <small>管理后台</small>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        :collapse="appStore.sidebarCollapsed"
        background-color="#1f2a37"
        text-color="#cbd5e1"
        active-text-color="#3b9eff"
      >
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          {{ m.label }}
        </el-menu-item>
      </el-menu>
    </aside>

    <div class="admin-main">
      <header class="admin-top">
        <el-button text @click="appStore.toggleSidebar()">
          {{ appStore.sidebarCollapsed ? '展开菜单' : '收起菜单' }}
        </el-button>
        <div class="top-right">
          <span>{{ userStore.userInfo?.name }}</span>
          <el-button text type="primary" @click="router.push('/')">返回前台</el-button>
          <el-button text type="danger" @click="logout">退出</el-button>
        </div>
      </header>
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: $color-bg;
}

.sidebar {
  width: 220px;
  background: #1f2a37;
  flex-shrink: 0;
  transition: width 0.2s;
}

.admin-layout.collapsed .sidebar {
  width: 64px;
}

.side-brand {
  padding: 20px 16px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  span {
    display: block;
    font-weight: 700;
    font-size: 15px;
  }

  small {
    color: rgba(255, 255, 255, 0.55);
  }
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-top {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid $color-border;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.admin-content {
  padding: 20px;
}

@media (max-width: $breakpoint-md) {
  .admin-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100% !important;
  }

  .admin-top {
    flex-wrap: wrap;
    height: auto;
    gap: 8px;
    padding: 10px 12px;
  }
}
</style>

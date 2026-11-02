<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiGetDashboard } from '@/api'
import { errorMessage } from '@/utils'

const loading = ref(false)
const stats = ref({
  teacherCount: 0,
  studentCount: 0,
  pendingCount: 0,
  demandCount: 0,
  commentCount: 0,
  pageViewToday: 0,
  pageView7d: 0,
  copyPhone7d: 0,
  searchTeachers7d: 0,
  loginSuccess7d: 0,
  publishDemand7d: 0,
  teacherJoin7d: 0,
  topEvents7d: [] as Array<{ name: string; count: number }>,
})

onMounted(async () => {
  loading.value = true
  try {
    stats.value = {
      ...stats.value,
      ...(await apiGetDashboard()),
    }
  } catch (error: unknown) {
    ElMessage.error(errorMessage(error, '看板加载失败'))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading" class="dashboard">
    <h1>数据看板</h1>
    <p class="hint">业务数据 + 近 7 日埋点。管理员入口：登录页加 <code>?role=admin</code></p>

    <h2>业务概况</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <span>已通过老师</span>
        <strong>{{ stats.teacherCount }}</strong>
      </div>
      <div class="stat-card accent">
        <span>学员用户</span>
        <strong>{{ stats.studentCount }}</strong>
      </div>
      <div class="stat-card warn">
        <span>待审核老师</span>
        <strong>{{ stats.pendingCount }}</strong>
      </div>
      <div class="stat-card">
        <span>开放需求</span>
        <strong>{{ stats.demandCount }}</strong>
      </div>
      <div class="stat-card">
        <span>评论总数</span>
        <strong>{{ stats.commentCount }}</strong>
      </div>
    </div>

    <h2>使用埋点（近 7 日）</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <span>今日 PV</span>
        <strong>{{ stats.pageViewToday || 0 }}</strong>
      </div>
      <div class="stat-card">
        <span>近 7 日 PV</span>
        <strong>{{ stats.pageView7d || 0 }}</strong>
      </div>
      <div class="stat-card accent">
        <span>找老师搜索</span>
        <strong>{{ stats.searchTeachers7d || 0 }}</strong>
      </div>
      <div class="stat-card accent">
        <span>复制手机号</span>
        <strong>{{ stats.copyPhone7d || 0 }}</strong>
      </div>
      <div class="stat-card">
        <span>登录成功</span>
        <strong>{{ stats.loginSuccess7d || 0 }}</strong>
      </div>
      <div class="stat-card">
        <span>发布需求</span>
        <strong>{{ stats.publishDemand7d || 0 }}</strong>
      </div>
      <div class="stat-card">
        <span>老师入驻</span>
        <strong>{{ stats.teacherJoin7d || 0 }}</strong>
      </div>
    </div>

    <div v-if="stats.topEvents7d?.length" class="top-events">
      <h3>事件排行</h3>
      <ul>
        <li v-for="item in stats.topEvents7d" :key="item.name">
          <span>{{ item.name }}</span>
          <strong>{{ item.count }}</strong>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
h1 {
  margin: 0 0 8px;
  font-size: 22px;
}

h2 {
  margin: 28px 0 12px;
  font-size: 16px;
  font-weight: 600;
}

h3 {
  margin: 0 0 10px;
  font-size: 14px;
}

.hint {
  margin: 0 0 18px;
  color: $color-text-secondary;
  font-size: 13px;

  code {
    padding: 1px 6px;
    border-radius: 4px;
    background: #f3f5f7;
    color: #13857d;
  }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.stat-card {
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 18px;
  border-top: 3px solid $color-primary;

  span {
    display: block;
    color: $color-text-secondary;
    font-size: 13px;
    margin-bottom: 8px;
  }

  strong {
    font-size: 28px;
    color: $color-text;
  }

  &.accent {
    border-top-color: $color-accent;
  }

  &.warn {
    border-top-color: $color-warning;
  }
}

.top-events {
  margin-top: 20px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 16px 18px;

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #f0f2f4;
    font-size: 13px;

    &:last-child {
      border-bottom: 0;
    }
  }
}
</style>

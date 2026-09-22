<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiGetDashboard } from '@/api'

const loading = ref(false)
const stats = ref({
  teacherCount: 0,
  studentCount: 0,
  pendingCount: 0,
  demandCount: 0,
  commentCount: 0,
})

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await apiGetDashboard()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading" class="dashboard">
    <h1>数据看板</h1>
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
  </div>
</template>

<style scoped lang="scss">
h1 {
  margin: 0 0 20px;
  font-size: 22px;
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
</style>

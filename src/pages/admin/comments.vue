<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCommentStore, useTeacherStore } from '@/store'
import { formatDate } from '@/utils'

const commentStore = useCommentStore()
const teacherStore = useTeacherStore()
const list = computed(() => commentStore.list)

function teacherName(id: string) {
  return teacherStore.getById(id)?.name || id
}

function toggleVisible(id: string, visible: boolean) {
  commentStore.setVisible(id, visible)
  ElMessage.success(visible ? '已显示' : '已隐藏')
}

async function remove(id: string) {
  await ElMessageBox.confirm('确认删除该评论？', '提示', { type: 'warning' })
  commentStore.remove(id)
  ElMessage.success('已删除')
}
</script>

<template>
  <div>
    <h1 class="title">评论管理</h1>
    <el-table :data="list" stripe border>
      <el-table-column label="老师" min-width="100">
        <template #default="{ row }">{{ teacherName(row.teacherId) }}</template>
      </el-table-column>
      <el-table-column prop="userName" label="学员" width="120" />
      <el-table-column prop="rating" label="评分" width="80" />
      <el-table-column prop="content" label="内容" min-width="220" show-overflow-tooltip />
      <el-table-column label="可见" width="90">
        <template #default="{ row }">
          <el-switch
            :model-value="row.visible"
            @change="(v: boolean) => toggleVisible(row.id, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="时间" width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button text type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.title {
  margin: 0 0 16px;
  font-size: 22px;
}
</style>

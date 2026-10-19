<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiLoadComments, apiLoadTeachers, apiRemoveComment, apiSetCommentVisible } from '@/api'
import { useCommentStore, useTeacherStore } from '@/store'
import { errorMessage, formatDate } from '@/utils'

const commentStore = useCommentStore()
const teacherStore = useTeacherStore()
const list = computed(() => commentStore.list)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([apiLoadComments(), apiLoadTeachers()])
  } catch (error: unknown) {
    ElMessage.error(errorMessage(error, '评论列表加载失败'))
  } finally {
    loading.value = false
  }
})

function teacherName(id: string) {
  return teacherStore.getById(id)?.name || id
}

async function toggleVisible(id: string, visible: boolean) {
  try {
    await apiSetCommentVisible(id, visible)
    ElMessage.success(visible ? '已显示' : '已隐藏')
  } catch (error: unknown) {
    ElMessage.error(errorMessage(error, '更新失败'))
  }
}

async function remove(id: string) {
  await ElMessageBox.confirm('确认删除该评论？', '提示', { type: 'warning' })
  try {
    await apiRemoveComment(id)
    ElMessage.success('已删除')
  } catch (error: unknown) {
    ElMessage.error(errorMessage(error, '删除失败'))
  }
}
</script>

<template>
  <div>
    <h1 class="title">评论管理</h1>
    <el-table v-loading="loading" :data="list" stripe border>
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

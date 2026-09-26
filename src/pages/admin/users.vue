<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiAdminDeleteUser, apiAdminUpdateUserRole, apiAdminUsers } from '@/api'
import { formatDate } from '@/utils'
import type { UserInfo, UserRole } from '@/types'

const users = ref<UserInfo[]>([])
const loading = ref(false)

const roleMap: Record<UserRole, string> = {
  student: '学员',
  teacher: '老师',
  admin: '管理员',
}

async function load() {
  loading.value = true
  try {
    users.value = await apiAdminUsers()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function changeRole(id: string, role: UserRole) {
  await apiAdminUpdateUserRole(id, role)
  ElMessage.success('角色已更新')
  await load()
}

async function remove(id: string) {
  await ElMessageBox.confirm('确认删除该用户？', '提示', { type: 'warning' })
  await apiAdminDeleteUser(id)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="title">用户管理</h1>
    <el-table v-loading="loading" :data="users" stripe border style="width: 100%">
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column prop="phone" label="手机号" min-width="120" />
      <el-table-column label="角色" min-width="140">
        <template #default="{ row }">
          <el-select
            :model-value="row.role"
            size="small"
            style="width: 110px"
            @change="(v: UserRole) => changeRole(row.id, v)"
          >
            <el-option v-for="(label, key) in roleMap" :key="key" :label="label" :value="key" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" min-width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            text
            type="danger"
            :disabled="row.role === 'admin'"
            @click="remove(row.id)"
          >
            删除
          </el-button>
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

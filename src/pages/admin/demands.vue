<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDemandStore } from '@/store'
import { TEACH_MODE_MAP } from '@/constants'
import { formatDate, maskPhone } from '@/utils'

const demandStore = useDemandStore()
const list = computed(() => demandStore.list)

async function close(id: string) {
  demandStore.close(id)
  ElMessage.success('已关闭需求')
}

async function remove(id: string) {
  await ElMessageBox.confirm('确认删除该需求？', '提示', { type: 'warning' })
  demandStore.remove(id)
  ElMessage.success('已删除')
}
</script>

<template>
  <div>
    <h1 class="title">需求管理</h1>
    <el-table :data="list" stripe border>
      <el-table-column prop="subject" label="科目" width="90" />
      <el-table-column prop="district" label="区域" width="100" />
      <el-table-column label="预算" width="100">
        <template #default="{ row }">¥{{ row.budget }}</template>
      </el-table-column>
      <el-table-column label="方式" width="100">
        <template #default="{ row }">{{ TEACH_MODE_MAP[row.teachMode as keyof typeof TEACH_MODE_MAP] }}</template>
      </el-table-column>
      <el-table-column prop="schedule" label="时间" min-width="140" />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column label="手机号" width="120">
        <template #default="{ row }">{{ maskPhone(row.phone) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'open' ? 'success' : 'info'" size="small">
            {{ row.status === 'open' ? '开放' : '关闭' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'open'"
            text
            type="warning"
            @click="close(row.id)"
          >
            关闭
          </el-button>
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

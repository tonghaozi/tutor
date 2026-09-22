<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiAuditTeacher } from '@/api'
import { useTeacherStore } from '@/store'
import { AUDIT_STATUS_MAP, TEACH_MODE_MAP } from '@/constants'
import { formatDate } from '@/utils'
import type { AuditStatus } from '@/types'

const teacherStore = useTeacherStore()
const statusFilter = ref<AuditStatus | ''>('pending')

const list = computed(() => {
  if (!statusFilter.value) return teacherStore.list
  return teacherStore.list.filter((t) => t.status === statusFilter.value)
})

async function approve(id: string) {
  await apiAuditTeacher(id, 'approved')
  ElMessage.success('已通过，老师将对外展示')
}

async function reject(id: string) {
  const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回审核', {
    confirmButtonText: '驳回',
    cancelButtonText: '取消',
    inputPlaceholder: '如：证书信息不清晰',
  })
  await apiAuditTeacher(id, 'rejected', value || '资料不符合要求')
  ElMessage.success('已驳回')
}
</script>

<template>
  <div>
    <div class="head">
      <h1>老师资质审核</h1>
      <el-radio-group v-model="statusFilter" size="small">
        <el-radio-button value="pending">待审核</el-radio-button>
        <el-radio-button value="approved">已通过</el-radio-button>
        <el-radio-button value="rejected">已驳回</el-radio-button>
        <el-radio-button value="">全部</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="list" stripe border>
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column label="科目" min-width="120">
        <template #default="{ row }">{{ row.subjects.join('、') }}</template>
      </el-table-column>
      <el-table-column label="区域" min-width="140">
        <template #default="{ row }">{{ row.districts.join('、') }}</template>
      </el-table-column>
      <el-table-column label="报价" width="90">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column label="方式" width="100">
        <template #default="{ row }">{{ TEACH_MODE_MAP[row.teachMode as keyof typeof TEACH_MODE_MAP] }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'"
            size="small"
          >
            {{ AUDIT_STATUS_MAP[row.status as AuditStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button text type="success" @click="approve(row.id)">通过</el-button>
            <el-button text type="danger" @click="reject(row.id)">驳回</el-button>
          </template>
          <span v-else class="muted">{{ row.rejectReason || '-' }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  h1 {
    margin: 0;
    font-size: 22px;
  }
}

.muted {
  color: $color-text-secondary;
  font-size: 12px;
}
</style>

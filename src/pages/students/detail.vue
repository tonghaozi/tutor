<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiGetDemandDetail } from '@/api'
import { TEACH_MODE_MAP } from '@/constants'
import { formatDate } from '@/utils'
import { formatRegion } from '@/utils/region'
import type { Demand } from '@/types'

const route = useRoute()
const router = useRouter()
const demand = ref<Demand | null>(null)
const loading = ref(false)

const id = computed(() => route.params.id as string)

function genderLabel(gender?: string) {
  if (gender === 'female') return '女'
  if (gender === 'male') return '男'
  return '未填写'
}

async function load() {
  loading.value = true
  try {
    demand.value = await apiGetDemandDetail(id.value)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
    router.replace('/students')
  } finally {
    loading.value = false
  }
}

function copyPhone() {
  if (!demand.value?.phone) return
  navigator.clipboard?.writeText(demand.value.phone).then(
    () => ElMessage.success('手机号已复制'),
    () => ElMessage.info(demand.value!.phone),
  )
}

onMounted(load)
</script>

<template>
  <div v-loading="loading" class="page-container detail-page">
    <template v-if="demand">
      <el-button text type="primary" class="back" @click="router.push('/students')">← 返回找学生</el-button>

      <section class="profile">
        <div class="info">
          <div class="tags">
            <el-tag effect="plain">{{ demand.subject }}</el-tag>
            <el-tag type="warning" effect="plain">{{ TEACH_MODE_MAP[demand.teachMode] }}</el-tag>
            <el-tag v-if="demand.status === 'open'" type="success" effect="plain">招募中</el-tag>
            <el-tag v-else type="info" effect="plain">已关闭</el-tag>
          </div>
          <h1>{{ demand.remark || `${demand.subject}家教需求` }}</h1>
          <p class="price">预算 <em>¥{{ demand.budget }}</em> / 课时</p>
          <p class="area">上课地区：{{ formatRegion(demand.district) || '全国' }}</p>
          <p class="area">上课时间：{{ demand.schedule || '时间可议' }}</p>
          <p class="area">
            学员资料：{{ genderLabel(demand.gender) }}
            <template v-if="demand.age"> · {{ demand.age }}岁</template>
          </p>
          <div class="contact">
            <strong>{{ demand.phone }}</strong>
            <el-button type="primary" @click="copyPhone">复制手机号</el-button>
          </div>
        </div>
      </section>

      <section class="block">
        <h2>需求说明</h2>
        <p>{{ demand.remark || '学员暂未填写更多说明，可先电话沟通基础与目标。' }}</p>
        <p class="sub">发布时间：{{ formatDate(demand.createdAt) }}</p>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.back {
  margin-bottom: 8px;
}

.profile {
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 24px;
  margin-bottom: 16px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

h1 {
  margin: 0 0 12px;
  font-size: 24px;
  line-height: 1.4;
  color: $color-navy;
}

.price {
  margin: 0 0 8px;
  color: $color-text-secondary;

  em {
    font-style: normal;
    color: #f5222d;
    font-size: 22px;
    font-weight: 700;
  }
}

.area {
  margin: 0 0 6px;
  color: $color-text-secondary;
  font-size: 14px;
}

.contact {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  flex-wrap: wrap;

  strong {
    font-size: 18px;
    letter-spacing: 0.5px;
  }
}

.block {
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 20px 24px;
  margin-bottom: 16px;

  h2 {
    margin: 0 0 12px;
    font-size: 16px;
  }

  p {
    margin: 0;
    line-height: 1.7;
    color: $color-text;
  }

  .sub {
    margin-top: 12px;
    color: $color-text-secondary;
    font-size: 13px;
  }
}
</style>

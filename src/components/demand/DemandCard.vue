<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Demand } from '@/types'
import { TEACH_MODE_MAP } from '@/constants'
import { formatDate, maskPhone } from '@/utils'
import { formatRegion } from '@/utils/region'

defineProps<{ demand: Demand }>()

const router = useRouter()

function goDetail(id: string) {
  router.push(`/students/${id}`)
}

function profileText(demand: Demand) {
  const parts: string[] = []
  if (demand.gender === 'female') parts.push('女')
  if (demand.gender === 'male') parts.push('男')
  if (demand.age) parts.push(`${demand.age}岁`)
  return parts.length ? parts.join(' ') : '学员'
}
</script>

<template>
  <article class="demand-card" @click="goDetail(demand.id)">
    <div class="top">
      <div class="badge">
        <b>{{ demand.subject }}</b>
        <span v-if="demand.age">{{ demand.age }}岁</span>
        <span v-else>{{ TEACH_MODE_MAP[demand.teachMode] }}</span>
      </div>
      <div class="budget">
        <em>¥{{ demand.budget }}</em>
        <span>/时</span>
      </div>
    </div>

    <h3>{{ demand.remark || `${demand.subject}家教需求` }}</h3>

    <div class="meta">
      <span>{{ formatRegion(demand.district) || '全国' }}</span>
      <span>{{ demand.schedule || '时间可议' }}</span>
      <span>{{ TEACH_MODE_MAP[demand.teachMode] }}</span>
    </div>

    <div class="foot">
      <span>{{ profileText(demand) }} · {{ maskPhone(demand.phone) }}</span>
      <span class="time">{{ formatDate(demand.createdAt) }}</span>
    </div>
  </article>
</template>

<style scoped lang="scss">
.demand-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  background: $color-white;
  border: 1px solid rgba(0, 26, 61, 0.06);
  border-radius: $radius-lg;
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.25s;
  height: 100%;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-3px);
  }
}

.top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.badge {
  display: flex;
  align-items: center;
  gap: 8px;

  b {
    font-size: 15px;
    color: $color-navy;
  }

  span {
    font-size: 12px;
    color: $color-text-secondary;
    background: rgba(0, 26, 61, 0.04);
    padding: 2px 8px;
    border-radius: 999px;
  }
}

.budget {
  flex-shrink: 0;
  text-align: right;

  em {
    font-style: normal;
    color: #f5222d;
    font-size: 20px;
    font-weight: 700;
  }

  span {
    font-size: 12px;
    color: $color-text-secondary;
  }
}

h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: $color-text;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.meta,
.foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 12px;
  color: $color-text-secondary;
}

.foot {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 26, 61, 0.06);
  justify-content: space-between;
}

.time {
  flex-shrink: 0;
}
</style>

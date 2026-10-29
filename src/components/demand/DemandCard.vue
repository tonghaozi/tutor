<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Demand, Stage } from '@/types'
import { SUBJECTS_BY_STAGE, TEACH_MODE_MAP } from '@/constants'
import { splitRegionPath } from '@/utils/region'

const props = withDefaults(
  defineProps<{
    demand: Demand
    /** compact：首页等紧凑卡；list：学员需求列表横向卡 */
    variant?: 'compact' | 'list'
  }>(),
  { variant: 'compact' },
)

const router = useRouter()

const stageOf = computed<Stage>(() => {
  if (props.demand.stage) return props.demand.stage
  if (SUBJECTS_BY_STAGE.音乐.includes(props.demand.subject)) return '音乐'
  if (['物理', '化学', '生物'].includes(props.demand.subject)) return '高中'
  return '小学'
})

const stageTone = computed(() => {
  if (stageOf.value === '音乐') return 'warm'
  if (stageOf.value === '初中') return 'sky'
  return 'mint'
})

const title = computed(() => {
  const remark = (props.demand.remark || '').trim()
  const first = remark.split(/[。！？\n；]/)[0]?.trim() || ''
  if (first && first.length <= 16) return first
  return props.demand.subject || '学习需求'
})

const focusLine = computed(() => {
  const remark = (props.demand.remark || '').trim()
  if (!remark) return ''
  const first = remark.split(/[。！？\n；]/)[0]?.trim() || ''
  if (!first || first === title.value) {
    return stageOf.value === '音乐'
      ? `${props.demand.subject}学习`
      : `${stageOf.value}${props.demand.subject}`
  }
  return first.length > 28 ? `${first.slice(0, 28)}…` : first
})

const description = computed(() => {
  const remark = (props.demand.remark || '').trim()
  if (!remark) return '希望沟通学习目标、时间与授课方式，具体内容双方自行确认。'
  return remark
})

const placeText = computed(() => {
  const parts = splitRegionPath(props.demand.district || '')
  if (parts.length >= 3) {
    const city = parts[1].replace(/市$/, '')
    return `${city} · ${parts[2]}`
  }
  if (parts.length === 2) {
    return `${parts[1].replace(/市$/, '') || parts[0]}`
  }
  if (parts.length === 1) return parts[0].replace(/市$/, '') || parts[0]
  return '全国'
})

const modeLabel = computed(() => {
  if (props.demand.teachMode === 'both') return '线上或线下'
  return TEACH_MODE_MAP[props.demand.teachMode] || '不限'
})

const budgetText = computed(() => {
  const n = Number(props.demand.budget)
  if (!Number.isFinite(n) || n <= 0) return '面议'
  return String(Math.round(n))
})

function goDetail() {
  router.push(`/students/${props.demand.id}`)
}
</script>

<template>
  <article
    v-if="variant === 'list'"
    class="demand-card is-list"
    @click="goDetail"
  >
    <div class="list-top">
      <div :class="['stage-badge', stageTone]">
        <b>{{ stageOf }}</b>
        <span>{{ demand.subject }}</span>
      </div>

      <div class="list-theme">
        <div class="title-row">
          <h3>{{ title }}</h3>
        </div>
        <p v-if="focusLine" class="focus">{{ focusLine }}</p>
      </div>

      <div class="list-budget">
        <small>意向预算 · 非平台报价</small>
        <em>{{ budgetText }}</em>
        <span>元 / 小时</span>
      </div>
    </div>

    <p class="list-desc">{{ description }}</p>

    <div class="list-foot">
      <div class="list-meta">
        <span class="place">
          <img src="/images/home/figma/map-pin-fig.svg" width="14" height="14" alt="" />
          {{ placeText }}
        </span>
        <span>{{ demand.schedule || '时间可议' }}</span>
        <span class="mode-tag">{{ modeLabel }}</span>
      </div>
      <button type="button" class="detail-btn" @click.stop="goDetail">
        查看详情
        <img src="/images/home/figma/arrow-right-teal.svg" width="17" height="17" alt="" />
      </button>
    </div>
  </article>

  <article v-else class="demand-card compact" @click="goDetail">
    <div class="top">
      <div class="badge">
        <b>{{ demand.subject }}</b>
        <span>{{ TEACH_MODE_MAP[demand.teachMode] }}</span>
      </div>
      <div class="budget">
        <em>¥{{ demand.budget }}</em>
        <span>/时</span>
      </div>
    </div>

    <h3>{{ demand.remark || `${demand.subject}家教需求` }}</h3>

    <div class="meta">
      <span>{{ placeText }}</span>
      <span>{{ demand.schedule || '时间可议' }}</span>
      <span>{{ TEACH_MODE_MAP[demand.teachMode] }}</span>
    </div>
  </article>
</template>

<style scoped lang="scss">
.demand-card {
  --teal: #13857d;
  --ink: #173b3d;
  --muted: #687e7e;
  --line: #dce8e3;
  --mint: #eaf6f1;
  --soft: #f3f7f4;
  --warm: #fff0df;
  --sky: #edf4fa;
  --page: #fbfcfa;
  --budget: #b87336;
  cursor: pointer;
}

.demand-card.is-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  transition: box-shadow 0.25s, border-color 0.25s;

  &:hover {
    border-color: rgba(19, 133, 125, 0.35);
    box-shadow: 0 12px 28px rgba(23, 59, 61, 0.06);
  }
}

.list-top {
  display: flex;
  align-items: center;
  gap: 18px;
}

.stage-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 62px;
  height: 68px;
  border-radius: 10px;
  background: var(--mint);
  flex-shrink: 0;
  text-align: center;

  b {
    font-size: 16px;
    font-weight: 700;
    color: var(--teal);
  }

  span {
    font-size: 11px;
    color: var(--muted);
  }

  &.sky {
    background: var(--sky);

    b {
      color: #3d6f8a;
    }
  }

  &.warm {
    background: var(--warm);

    b {
      color: var(--budget);
    }
  }
}

.list-theme {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.demand-card.is-list h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
}

.focus {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.4;
}

.list-budget {
  width: 174px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  text-align: right;

  small,
  span {
    font-size: 11px;
    color: var(--muted);
  }

  em {
    font-style: normal;
    font-size: 23px;
    font-weight: 700;
    color: var(--budget);
    line-height: 1.1;
  }
}

.list-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.list-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  color: var(--muted);
}

.place {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.mode-tag {
  padding: 5px 11px;
  border-radius: 6px;
  background: var(--mint);
  color: var(--teal);
  font-weight: 500;
}

.detail-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 46px;
  padding: 0 20px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  color: var(--teal);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    border-color: var(--teal);
  }
}

.compact {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  background: #fff;
  border: 1px solid rgba(0, 26, 61, 0.06);
  border-radius: 16px;
  height: 100%;
  transition: box-shadow 0.25s, transform 0.25s;

  &:hover {
    box-shadow: 0 10px 24px rgba(23, 59, 61, 0.08);
    transform: translateY(-3px);
  }

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
    color: var(--ink);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
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
    color: var(--ink);
  }

  span {
    font-size: 12px;
    color: var(--muted);
    background: var(--soft);
    padding: 2px 8px;
    border-radius: 999px;
  }
}

.budget {
  flex-shrink: 0;
  text-align: right;

  em {
    font-style: normal;
    color: var(--budget);
    font-size: 20px;
    font-weight: 700;
  }

  span {
    font-size: 12px;
    color: var(--muted);
  }
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 900px) {
  .list-top {
    flex-wrap: wrap;
  }

  .list-budget {
    width: auto;
    margin-left: auto;
    align-items: flex-end;
  }

  .list-foot {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .demand-card.is-list {
    padding: 18px;
  }

  .demand-card.is-list h3 {
    font-size: 16px;
  }

  .list-budget em {
    font-size: 20px;
  }
}
</style>

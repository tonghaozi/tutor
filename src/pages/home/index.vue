<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import TeacherCard from '@/components/teacher/TeacherCard.vue'
import { apiGetDemands, apiGetHotTeachers } from '@/api'
import { DISTRICTS, SUBJECTS, TEACH_MODE_MAP } from '@/constants'
import { formatDate, maskPhone } from '@/utils'
import type { Demand, Teacher, TeacherFilter } from '@/types'

const router = useRouter()
const hotTeachers = ref<Teacher[]>([])
const demands = ref<Demand[]>([])
const loading = ref(false)

const quick = reactive<TeacherFilter>({
  keyword: '',
  subject: '',
  district: '',
  teachMode: '',
})

const subjectQuick = ['吉他', '钢琴', '文化课'] as const
const modeQuick = [
  { label: '上门', value: 'offline' as const },
  { label: '线上', value: 'online' as const },
]

async function load() {
  loading.value = true
  try {
    ;[hotTeachers.value, demands.value] = await Promise.all([
      apiGetHotTeachers(),
      apiGetDemands(),
    ])
  } finally {
    loading.value = false
  }
}

function searchGo() {
  router.push({
    path: '/teachers',
    query: {
      keyword: quick.keyword || undefined,
      subject: quick.subject || undefined,
      district: quick.district || undefined,
      teachMode: quick.teachMode || undefined,
    },
  })
}

function setSubject(s: string) {
  quick.subject = quick.subject === s ? '' : (s as any)
  searchGo()
}

function setMode(m: 'offline' | 'online') {
  quick.teachMode = quick.teachMode === m ? '' : m
  searchGo()
}

function setDistrict(d: string) {
  quick.district = quick.district === d ? '' : (d as any)
  searchGo()
}

onMounted(load)
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div class="page-container hero-inner">
        <p class="eyebrow">合肥同城 · 信息撮合</p>
        <h1>找靠谱吉他家教，从同城开始</h1>
        <p class="hero-desc">
          主打吉他家教，同步覆盖钢琴与文化课。连接学员与老师，平台不收取课时费、不担保教学质量。
        </p>
        <div class="search-box">
          <el-input
            v-model="quick.keyword"
            size="large"
            clearable
            placeholder="搜索老师姓名、科目，如：吉他 蜀山区"
            @keyup.enter="searchGo"
          >
            <template #append>
              <el-button type="primary" @click="searchGo">搜索</el-button>
            </template>
          </el-input>
        </div>
        <div class="quick-filters">
          <div class="filter-row">
            <span class="label">科目</span>
            <button
              v-for="s in subjectQuick"
              :key="s"
              type="button"
              :class="['chip', { active: quick.subject === s }]"
              @click="setSubject(s)"
            >
              {{ s }}
            </button>
          </div>
          <div class="filter-row">
            <span class="label">方式</span>
            <button
              v-for="m in modeQuick"
              :key="m.value"
              type="button"
              :class="['chip', { active: quick.teachMode === m.value }]"
              @click="setMode(m.value)"
            >
              {{ m.label }}
            </button>
          </div>
          <div class="filter-row districts">
            <span class="label">区域</span>
            <button
              v-for="d in DISTRICTS"
              :key="d"
              type="button"
              :class="['chip', { active: quick.district === d }]"
              @click="setDistrict(d)"
            >
              {{ d }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="page-container section">
      <div class="section-head">
        <h2 class="section-title">热门老师</h2>
        <router-link to="/teachers" class="more">查看全部</router-link>
      </div>
      <div v-loading="loading" class="card-grid">
        <TeacherCard v-for="t in hotTeachers" :key="t.id" :teacher="t" />
      </div>
    </section>

    <section class="page-container section">
      <div class="section-head">
        <h2 class="section-title">学员最新需求</h2>
        <router-link to="/demand/publish" class="more">发布需求</router-link>
      </div>
      <div class="demand-list">
        <article v-for="d in demands.slice(0, 5)" :key="d.id" class="demand-item">
          <div class="demand-main">
            <el-tag size="small" type="warning" effect="plain">{{ d.subject }}</el-tag>
            <strong>{{ d.district }} · {{ TEACH_MODE_MAP[d.teachMode] }}</strong>
            <span class="budget">预算 ¥{{ d.budget }}/课时</span>
          </div>
          <p>{{ d.remark }}</p>
          <div class="demand-meta">
            <span>{{ d.schedule }}</span>
            <span>{{ maskPhone(d.phone) }}</span>
            <span>{{ formatDate(d.createdAt) }}</span>
          </div>
        </article>
        <el-empty v-if="!demands.length" description="暂无需求" />
      </div>
    </section>

    <section class="page-container section about">
      <h2 class="section-title">平台简介</h2>
      <p class="section-desc">
        合肥同城家教是本地信息撮合平台：学员可以浏览已审核老师、发布求聘需求；老师可提交入驻资料，经管理员审核通过后对外展示。平台不提供支付功能，课时费用由双方自行约定与结算。当前开放科目：{{
          SUBJECTS.join('、')
        }}。
      </p>
      <div class="about-actions">
        <el-button type="primary" @click="router.push('/teachers')">立即找老师</el-button>
        <el-button @click="router.push('/teacher/join')">我要入驻</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.hero {
  background:
    radial-gradient(circle at 12% 20%, rgba(59, 158, 255, 0.18), transparent 42%),
    radial-gradient(circle at 88% 10%, rgba(255, 138, 61, 0.16), transparent 36%),
    linear-gradient(180deg, #f0f7ff 0%, $color-bg 100%);
  padding: 36px 0 28px;
  margin-top: -20px;
}

.hero-inner {
  max-width: 860px;
}

.eyebrow {
  margin: 0 0 8px;
  color: $color-primary;
  font-size: 13px;
  font-weight: 600;
}

h1 {
  margin: 0 0 12px;
  font-size: 34px;
  line-height: 1.25;
  color: $color-text;
}

.hero-desc {
  margin: 0 0 20px;
  color: $color-text-secondary;
  line-height: 1.7;
  font-size: 15px;
}

.search-box {
  margin-bottom: 18px;
}

.quick-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 13px;
  color: $color-text-secondary;
  width: 36px;
}

.chip {
  border: 1px solid $color-border;
  background: #fff;
  color: $color-text-secondary;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;

  &.active,
  &:hover {
    border-color: $color-primary;
    color: $color-primary;
    background: $color-primary-light;
  }
}

.section {
  padding-top: 28px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .section-title {
    margin: 0;
  }
}

.more {
  font-size: 13px;
}

.demand-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demand-item {
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 14px 16px;

  p {
    margin: 8px 0;
    font-size: 14px;
    color: $color-text;
    line-height: 1.6;
  }
}

.demand-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;

  strong {
    font-size: 14px;
  }
}

.budget {
  color: $color-accent;
  font-weight: 600;
  font-size: 13px;
}

.demand-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 12px;
  color: $color-text-secondary;
}

.about {
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 24px;
  margin-top: 28px;
}

.about-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: $breakpoint-md) {
  h1 {
    font-size: 24px;
  }

  .hero {
    padding-top: 24px;
  }
}
</style>

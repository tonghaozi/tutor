<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DemandCard from '@/components/demand/DemandCard.vue'
import { apiGetDemands } from '@/api'
import {
  STAGES,
  SUBJECTS,
  SUBJECTS_BY_STAGE,
  TEACH_MODE_MAP,
  TEACH_MODE_OPTIONS,
} from '@/constants'
import { useAppStore } from '@/store'
import type { Demand, DemandFilter, Stage, Subject, TeachMode } from '@/types'
import { splitRegionPath } from '@/utils/region'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const cities = [
  { label: '北京', path: '北京市/北京市' },
  { label: '上海', path: '上海市/上海市' },
  { label: '广州', path: '广东省/广州市' },
  { label: '深圳', path: '广东省/深圳市' },
  { label: '杭州', path: '浙江省/杭州市' },
  { label: '南京', path: '江苏省/南京市' },
  { label: '成都', path: '四川省/成都市' },
  { label: '武汉', path: '湖北省/武汉市' },
  { label: '西安', path: '陕西省/西安市' },
  { label: '重庆', path: '重庆市/重庆市' },
  { label: '苏州', path: '江苏省/苏州市' },
  { label: '合肥', path: '安徽省/合肥市' },
]

const TIME_OPTIONS = ['不限', '工作日白天', '工作日晚上', '周末', '周六上午', '周六下午', '周日晚间'] as const

const tipSteps = [
  {
    no: '一',
    title: '方向是否合适',
    desc: '确认学段、科目与学习目标是否在自己的教学范围内。',
  },
  {
    no: '二',
    title: '安排是否匹配',
    desc: '确认授课方式、区域、时间和意向预算，避免仓促约定。',
  },
  {
    no: '三',
    title: '沟通注意边界',
    desc: '身份材料需双方自行核验，未成年人由监护人参与沟通。',
  },
]

const list = ref<Demand[]>([])
const loading = ref(false)
const openMenu = ref<'city' | 'stage' | 'subject' | 'mode' | 'time' | ''>('')
const timeChip = ref('')

const cityLabel = ref(appStore.cityLabel || '全国')
const cityPath = ref(appStore.cityPath || '')

const filter = reactive<DemandFilter>({
  keyword: '',
  subject: '',
  stage: '',
  district: '',
  teachMode: '',
  budgetMin: null,
  budgetMax: null,
})

const subjectOptions = computed(() =>
  filter.stage ? SUBJECTS_BY_STAGE[filter.stage as Stage] || [] : SUBJECTS,
)

const modeLabel = computed(() => {
  if (!filter.teachMode) return '不限'
  return TEACH_MODE_MAP[filter.teachMode as TeachMode]
})

const cityDisplay = computed(() =>
  cityLabel.value === '全国' || !cityLabel.value ? '全国城市' : cityLabel.value,
)

const timeLabel = computed(() => timeChip.value || '不限')

const displayedList = computed(() => {
  if (!timeChip.value) return list.value
  const key = timeChip.value
  return list.value.filter((item) => {
    const schedule = item.schedule || ''
    if (key === '周末') return /周末|周六|周日/.test(schedule)
    if (key === '工作日晚上') return /晚上|工作日晚上|周[一二三四五].*晚|19:|20:|21:/.test(schedule)
    if (key === '工作日白天') return /白天|上午|下午|工作日白天|10:|11:|14:|15:|16:/.test(schedule)
    return schedule.includes(key)
  })
})

watch(
  () => filter.stage,
  (next) => {
    if (!next || !filter.subject) return
    const subjects = SUBJECTS_BY_STAGE[next as Stage] || []
    if (!subjects.includes(filter.subject as Subject)) {
      filter.subject = ''
    }
  },
)

function toggleMenu(key: typeof openMenu.value) {
  openMenu.value = openMenu.value === key ? '' : key
}

function chooseCity(label: string, path: string) {
  cityLabel.value = label
  cityPath.value = path
  filter.district = path
  if (path) {
    const [province, city] = splitRegionPath(path)
    if (province && city) appStore.setCity(province, city)
  }
  openMenu.value = ''
}

function chooseStage(value: Stage | '') {
  filter.stage = value
  openMenu.value = ''
}

function chooseSubject(value: Subject | '') {
  filter.subject = value
  openMenu.value = ''
}

function chooseMode(value: TeachMode | '') {
  filter.teachMode = value
  openMenu.value = ''
}

function chooseTime(value: string) {
  timeChip.value = value === '不限' ? '' : value
  openMenu.value = ''
}

async function load(payload: DemandFilter = filter) {
  loading.value = true
  try {
    list.value = await apiGetDemands({
      ...payload,
      district: payload.district || '',
    })
  } finally {
    loading.value = false
  }
}

function syncRouteQuery() {
  router.replace({
    path: '/students',
    query: {
      subject: filter.subject || undefined,
      stage: filter.stage || undefined,
      district: filter.district || undefined,
      teachMode: filter.teachMode || undefined,
      keyword: filter.keyword || undefined,
    },
  })
}

function search() {
  openMenu.value = ''
  syncRouteQuery()
  load()
}

function resetFilters() {
  filter.keyword = ''
  filter.subject = ''
  filter.stage = ''
  filter.teachMode = ''
  filter.budgetMin = null
  filter.budgetMax = null
  filter.district = ''
  cityLabel.value = '全国'
  cityPath.value = ''
  timeChip.value = ''
  syncRouteQuery()
  load()
}

function initFromRoute() {
  filter.keyword = (route.query.keyword as string) || ''
  filter.subject = (route.query.subject as Subject | '') || ''
  filter.stage = (route.query.stage as Stage | '') || ''
  filter.teachMode = (route.query.teachMode as TeachMode | '') || ''
  const queryDistrict = (route.query.district as string) || ''
  if (queryDistrict) {
    filter.district = queryDistrict
    cityPath.value = queryDistrict
    const parts = splitRegionPath(queryDistrict)
    if (parts[0] && parts[1]) {
      cityLabel.value =
        parts[0].replace(/市$/, '') === parts[1].replace(/市$/, '')
          ? parts[0].replace(/市$/, '')
          : parts[1].replace(/市$/, '') || parts[0]
      const matched = cities.find((c) => c.path === queryDistrict)
      if (matched) cityLabel.value = matched.label
    }
  } else if (appStore.cityPath) {
    filter.district = appStore.cityPath
    cityPath.value = appStore.cityPath
    cityLabel.value = appStore.cityLabel || '全国'
  } else {
    filter.district = ''
    cityPath.value = ''
    cityLabel.value = '全国'
  }
}

onMounted(() => {
  initFromRoute()
  load()
})
</script>

<template>
  <div class="students-page" @click="openMenu = ''">
    <section class="hero">
      <div class="wrap">
        <nav class="crumb">
          <router-link to="/">首页</router-link>
          <img src="/images/home/chevron-right.svg" width="12" height="12" alt="" />
          <span>学员需求</span>
        </nav>

        <div class="hero-head">
          <div>
            <h1>按你的教学方向，了解学习需要</h1>
            <p class="hero-sub">先看学习目标、城市与时间，再判断是否适合进一步沟通。</p>
          </div>
        </div>

        <div class="filter-card" @click.stop>
          <div class="filter-row">
            <button type="button" class="field" @click="toggleMenu('city')">
              <small>所在城市</small>
              <span>
                <b>{{ cityDisplay }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="13" height="13" alt="" />
              </span>
              <ul v-if="openMenu === 'city'" class="menu">
                <li @click="chooseCity('全国', '')">全国城市</li>
                <li v-for="item in cities" :key="item.label" @click="chooseCity(item.label, item.path)">
                  {{ item.label }}
                </li>
              </ul>
            </button>

            <button type="button" class="field" @click="toggleMenu('stage')">
              <small>学习阶段</small>
              <span>
                <b>{{ filter.stage || '全部学段' }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="13" height="13" alt="" />
              </span>
              <ul v-if="openMenu === 'stage'" class="menu">
                <li @click="chooseStage('')">全部学段</li>
                <li v-for="item in STAGES" :key="item" @click="chooseStage(item)">{{ item }}</li>
              </ul>
            </button>

            <button type="button" class="field" @click="toggleMenu('subject')">
              <small>学习科目</small>
              <span>
                <b>{{ filter.subject || '全部科目' }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="13" height="13" alt="" />
              </span>
              <ul v-if="openMenu === 'subject'" class="menu">
                <li @click="chooseSubject('')">全部科目</li>
                <li v-for="item in subjectOptions" :key="item" @click="chooseSubject(item)">
                  {{ item }}
                </li>
              </ul>
            </button>

            <button type="button" class="field" @click="toggleMenu('mode')">
              <small>授课方式</small>
              <span>
                <b>{{ modeLabel }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="13" height="13" alt="" />
              </span>
              <ul v-if="openMenu === 'mode'" class="menu">
                <li @click="chooseMode('')">不限</li>
                <li
                  v-for="item in TEACH_MODE_OPTIONS"
                  :key="item.value"
                  @click="chooseMode(item.value)"
                >
                  {{ TEACH_MODE_MAP[item.value] }}
                </li>
              </ul>
            </button>

            <button type="button" class="field" @click="toggleMenu('time')">
              <small>可约时间</small>
              <span>
                <b>{{ timeLabel }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="13" height="13" alt="" />
              </span>
              <ul v-if="openMenu === 'time'" class="menu">
                <li v-for="item in TIME_OPTIONS" :key="item" @click="chooseTime(item)">
                  {{ item }}
                </li>
              </ul>
            </button>

            <button type="button" class="search-btn" @click="search">
              筛选需求
              <img src="/images/home/figma/search-white.svg" width="17" height="17" alt="" />
            </button>
          </div>

          <div class="divider" />

          <div class="filter-foot">
            <p>线上可跨城沟通；线下请进一步确认区域与距离。</p>
            <button type="button" class="reset" @click="resetFilters">重置筛选</button>
          </div>
        </div>
      </div>
    </section>

    <section class="results">
      <div class="wrap layout">
        <div class="main">
          <div class="result-head">
            <div class="count">
              <strong>学习需求</strong>
              <span>共 {{ displayedList.length }} 条需求</span>
            </div>
          </div>

          <div v-loading="loading" class="result-list">
            <DemandCard
              v-for="item in displayedList"
              :key="item.id"
              :demand="item"
              variant="list"
            />
          </div>

          <el-empty v-if="!loading && !displayedList.length" description="没有符合条件的学员需求" />

          <div v-if="!loading && displayedList.length" class="list-end">
            <p>已展示全部 {{ displayedList.length }} 条需求</p>
            <p class="end-hint">先完善教师资料，让沟通从清楚的介绍开始。</p>
          </div>
        </div>

        <aside class="sidebar">
          <div class="cta-card">
            <div class="cta-icon">
              <img src="/images/home/figma/notebook-pen.svg" width="24" height="24" alt="" />
            </div>
            <h3>先让家长了解你</h3>
            <p>补充教学方向、个人介绍与可约时间，让双方有更清楚的沟通起点。</p>
            <router-link class="cta-btn" to="/teacher/join">
              完善教师资料
              <img src="/images/home/figma/arrow-right-white.svg" width="17" height="17" alt="" />
            </router-link>
            <p class="cta-note">资料展示不等于平台认证，不代表已审核通过。</p>
          </div>

          <div class="tips-card">
            <div class="tips-title">
              <img src="/images/home/figma/messages.svg" width="22" height="22" alt="" />
              <strong>联系前，想清楚</strong>
            </div>
            <div v-for="step in tipSteps" :key="step.no" class="tip-step">
              <span class="step-no">{{ step.no }}</span>
              <div>
                <b>{{ step.title }}</b>
                <p>{{ step.desc }}</p>
              </div>
            </div>
            <router-link class="tips-link" to="/legal/agreement">
              阅读沟通与安全指南 ↗
            </router-link>
          </div>

          <div class="boundary-card">
            <img src="/images/home/figma/shield-alert.svg" width="18" height="18" alt="" />
            <div>
              <strong>只做信息撮合</strong>
              <p>平台不提供授课服务，不收取课时费，不提供支付结算，也不承诺教学结果。</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.students-page {
  --teal: #13857d;
  --ink: #173b3d;
  --muted: #687e7e;
  --line: #dce8e3;
  --mint: #eaf6f1;
  --soft: #f3f7f4;
  --warm: #fff0df;
  --page: #fbfcfa;
  background: var(--page);
  color: var(--ink);
  min-height: 100%;
}

.wrap {
  width: min(1248px, calc(100% - 48px));
  margin: 0 auto;
}

.hero {
  background: var(--mint);
  padding: 26px 0 30px;
}

.crumb {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 22px;

  a {
    color: var(--muted);
    text-decoration: none;
  }

  span {
    color: var(--teal);
  }
}

.hero-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;

  h1 {
    margin: 0 0 9px;
    font-size: 32px;
    line-height: 1.4;
    font-weight: 700;
  }
}

.hero-sub {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.filter-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 12px 32px rgba(32, 77, 61, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.field {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;

  small {
    color: var(--ink);
    font-size: 13px;
    font-weight: 500;
  }

  > span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 46px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--page);
  }

  b {
    font-size: 14px;
    font-weight: 400;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 8;
  min-width: 160px;
  max-height: 240px;
  overflow: auto;
  margin: 0;
  padding: 8px;
  list-style: none;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(23, 59, 61, 0.08);

  li {
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;

    &:hover {
      background: var(--mint);
      color: var(--teal);
    }
  }
}

.search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 46px;
  padding: 0 20px;
  border: 1px solid var(--teal);
  border-radius: 10px;
  background: var(--teal);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.divider {
  height: 1px;
  background: var(--line);
}

.filter-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 12px;
  color: var(--muted);

  p {
    margin: 0;
  }
}

.reset {
  border: 0;
  background: transparent;
  color: var(--teal);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}

.results {
  padding: 30px 0 48px;
}

.layout {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.count {
  display: flex;
  align-items: baseline;
  gap: 12px;

  strong {
    font-size: 23px;
    font-weight: 700;
  }

  span {
    color: var(--muted);
    font-size: 12px;
  }
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 120px;
}

.list-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  padding: 14px 0 0;
  color: var(--muted);
  font-size: 12px;

  p {
    margin: 0;
  }
}

.end-hint {
  color: var(--teal) !important;
  font-size: 13px !important;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cta-card {
  background: var(--mint);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  > p {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.85;
  }
}

.cta-icon {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  background: #fff;
  display: grid;
  place-content: center;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 46px;
  padding: 0 20px;
  border-radius: 10px;
  background: var(--teal);
  border: 1px solid var(--teal);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.cta-note {
  font-size: 11px !important;
  line-height: 1.8 !important;
}

.tips-card {
  background: var(--mint);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 10px;

  strong {
    font-size: 19px;
  }
}

.tip-step {
  display: flex;
  gap: 11px;

  b {
    display: block;
    margin-bottom: 7px;
    font-size: 14px;
  }

  p {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.85;
  }
}

.step-no {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #fff;
  color: var(--teal);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tips-link {
  color: var(--teal);
  font-size: 12px;
  text-decoration: none;
}

.boundary-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 10px;
  background: var(--warm);

  strong {
    display: block;
    margin-bottom: 5px;
    font-size: 13px;
  }

  p {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.85;
  }
}

:deep(.el-loading-mask) {
  border-radius: 12px;
}

@media (max-width: 1100px) {
  .layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}

@media (max-width: 900px) {
  .filter-row {
    flex-wrap: wrap;
  }

  .field {
    flex: 1 1 calc(50% - 16px);
  }

  .search-btn {
    width: 100%;
  }

  .hero-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .safety-inner {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .wrap {
    width: calc(100% - 32px);
  }

  .hero-head h1 {
    font-size: 26px;
  }

  .field {
    flex: 1 1 100%;
  }

  .filter-foot {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

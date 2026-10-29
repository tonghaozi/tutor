<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import TeacherCard from '@/components/teacher/TeacherCard.vue'
import StudentDemandDialog from '@/components/demand/StudentDemandDialog.vue'
import TeacherJoinDialog from '@/components/teacher/TeacherJoinDialog.vue'
import { apiGetTeachers } from '@/api'
import {
  GRADES_BY_STAGE,
  STAGES,
  SUBJECTS,
  SUBJECTS_BY_STAGE,
  TEACH_MODE_MAP,
  TEACH_MODE_OPTIONS,
} from '@/constants'
import { useAppStore, useUserStore } from '@/store'
import type { Stage, Subject, TeachMode, Teacher, TeacherFilter as FilterType } from '@/types'
import { splitRegionPath } from '@/utils/region'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

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

const FOCUS_BY_STAGE: Record<Stage, string[]> = {
  小学: ['计算基础', '应用题思路', '几何与空间', '学习习惯'],
  初中: ['概念理解', '解题思路', '错题整理', '学习习惯'],
  高中: ['知识体系', '解题方法', '薄弱突破', '学习习惯'],
  音乐: ['兴趣启蒙', '基础技法', '考级辅导', '表达与舞台'],
}

const TIME_CHIPS = ['工作日白天', '工作日晚上', '周末'] as const

const tipSteps = [
  {
    no: '一',
    title: '学习目标',
    desc: '孩子在哪些题型上容易卡住？希望怎样安排学习节奏？',
  },
  {
    no: '二',
    title: '时间与方式',
    desc: '确认可约时段、线上工具，或线下的具体区域。',
  },
  {
    no: '三',
    title: '材料与约定',
    desc: '自行核验身份与相关材料，充分沟通授课安排与费用。',
  },
]

const list = ref<Teacher[]>([])
const loading = ref(false)
const studentDemandVisible = ref(false)
const teacherJoinVisible = ref(false)
const openMenu = ref<'city' | 'stage' | 'grade' | 'subject' | 'mode' | 'sort' | ''>('')
const sortBy = ref<'default' | 'priceAsc' | 'priceDesc'>('default')
const focusChip = ref('')
const timeChip = ref('')
const grade = ref('四年级')

const cityLabel = ref(appStore.cityLabel || '全国')
const cityPath = ref(appStore.cityPath || '')

const filter = reactive<FilterType>({
  keyword: '',
  subject: '',
  stage: '',
  district: '',
  teachMode: '',
  priceMin: null,
  priceMax: null,
})

const stage = computed({
  get: () => (filter.stage as Stage) || '小学',
  set: (value: Stage) => {
    filter.stage = value
  },
})

const subjectOptions = computed(() =>
  filter.stage ? SUBJECTS_BY_STAGE[filter.stage as Stage] || [] : SUBJECTS,
)
const gradeOptions = computed(() =>
  filter.stage ? GRADES_BY_STAGE[filter.stage as Stage] || [] : GRADES_BY_STAGE.小学,
)
const focusOptions = computed(() =>
  filter.stage ? FOCUS_BY_STAGE[filter.stage as Stage] || FOCUS_BY_STAGE.小学 : FOCUS_BY_STAGE.小学,
)

const modeLabel = computed(() => {
  if (!filter.teachMode) return '线上 / 线下不限'
  return TEACH_MODE_MAP[filter.teachMode as TeachMode]
})

const cityDisplay = computed(() => (cityLabel.value === '全国' || !cityLabel.value ? '全国城市' : cityLabel.value))

const pageTitle = computed(() => {
  if (filter.subject && grade.value) return `找到适合${grade.value}的${filter.subject}老师`
  if (filter.subject && filter.stage) return `找到适合的${filter.stage}${filter.subject}老师`
  if (filter.stage) return `找到适合的${filter.stage}老师`
  return '找到适合的老师'
})

const conditionTags = computed(() => {
  const tags = [cityDisplay.value]
  if (filter.stage && grade.value) tags.push(`${filter.stage} · ${grade.value}`)
  else if (filter.stage) tags.push(String(filter.stage))
  if (filter.subject) tags.push(String(filter.subject))
  tags.push(modeLabel.value)
  if (focusChip.value) tags.push(focusChip.value)
  if (timeChip.value) tags.push(timeChip.value)
  return tags
})

const sortLabel = computed(() => {
  if (sortBy.value === 'priceAsc') return '价格从低到高'
  if (sortBy.value === 'priceDesc') return '价格从高到低'
  return '默认排序'
})

const displayedList = computed(() => {
  let rows = [...list.value]

  if (focusChip.value) {
    const key = focusChip.value
    rows = rows.filter((t) => {
      const blob = `${t.introduction || ''} ${t.experience || ''} ${(t.subjects || []).join(' ')}`
      return blob.includes(key)
    })
  }

  if (timeChip.value) {
    const key = timeChip.value
    rows = rows.filter((t) => {
      const times = (t.availableTimes || []).join(' ')
      if (key === '周末') return /周末|周六|周日/.test(times)
      if (key === '工作日晚上') return /晚上|工作日晚上|周[一二三四五].*晚|19:|20:|21:/.test(times)
      if (key === '工作日白天') return /白天|上午|下午|工作日白天|10:|11:|14:|15:|16:/.test(times)
      return times.includes(key)
    })
  }

  if (sortBy.value === 'priceAsc') rows.sort((a, b) => a.price - b.price)
  if (sortBy.value === 'priceDesc') rows.sort((a, b) => b.price - a.price)
  return rows
})

watch(stage, (next) => {
  const grades = GRADES_BY_STAGE[next] || []
  if (!grades.includes(grade.value)) {
    grade.value = grades[Math.min(3, Math.max(0, grades.length - 1))] || grades[0] || ''
  }
  const subjects = SUBJECTS_BY_STAGE[next] || []
  if (filter.subject && !subjects.includes(filter.subject as Subject)) {
    filter.subject = subjects[0] || ''
  }
  if (!FOCUS_BY_STAGE[next]?.includes(focusChip.value)) {
    focusChip.value = ''
  }
})

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

function chooseStage(value: Stage) {
  filter.stage = value
  openMenu.value = ''
}

function chooseGrade(value: string) {
  grade.value = value
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

function chooseSort(value: typeof sortBy.value) {
  sortBy.value = value
  openMenu.value = ''
}

function syncRouteQuery() {
  router.replace({
    path: '/teachers',
    query: {
      subject: filter.subject || undefined,
      stage: filter.stage || undefined,
      district: filter.district || undefined,
      teachMode: filter.teachMode || undefined,
      keyword: filter.keyword || undefined,
      priceMin: filter.priceMin != null ? String(filter.priceMin) : undefined,
      priceMax: filter.priceMax != null ? String(filter.priceMax) : undefined,
    },
  })
}

async function load(payload: FilterType = filter) {
  loading.value = true
  try {
    list.value = await apiGetTeachers({
      ...payload,
      district: payload.district || '',
    })
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function search() {
  syncRouteQuery()
  load()
}

function resetFilters() {
  filter.keyword = ''
  filter.subject = ''
  filter.stage = ''
  filter.teachMode = ''
  filter.priceMin = null
  filter.priceMax = null
  filter.district = ''
  cityLabel.value = '全国'
  cityPath.value = ''
  grade.value = GRADES_BY_STAGE.小学[3]
  focusChip.value = ''
  timeChip.value = ''
  sortBy.value = 'default'
  syncRouteQuery()
  load()
}

function openPublish() {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录后再发布需求')
    router.push({ path: '/auth/login', query: { redirect: '/teachers' } })
    return
  }
  if (userStore.userInfo?.role === 'teacher') {
    teacherJoinVisible.value = true
    return
  }
  studentDemandVisible.value = true
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
      cityLabel.value = parts[0].replace(/市$/, '') === parts[1].replace(/市$/, '')
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

  const min = Number(route.query.priceMin)
  const max = Number(route.query.priceMax)
  filter.priceMin = Number.isFinite(min) ? min : null
  filter.priceMax = Number.isFinite(max) ? max : null

  if (filter.stage) {
    const grades = GRADES_BY_STAGE[filter.stage as Stage] || []
    grade.value = grades[Math.min(3, grades.length - 1)] || grades[0] || grade.value
  }
}

onMounted(() => {
  initFromRoute()
  load()
})
</script>

<template>
  <div class="teachers-page" @click="openMenu = ''">
    <section class="hero">
      <div class="wrap">
        <nav class="crumb">
          <router-link to="/">首页</router-link>
          <img src="/images/home/chevron-right.svg" width="12" height="12" alt="" />
          <span>找老师</span>
        </nav>

        <div class="hero-head">
          <div>
            <h1>{{ pageTitle }}</h1>
            <p class="hero-sub">从教学侧重、授课方式与可约时间，找到更合拍的学习陪伴。</p>
          </div>
          <button type="button" class="demand-link" @click="openPublish">
            也可以发布学习需求
            <img src="/images/home/figma/arrow-up-right-teal.svg" width="16" height="16" alt="" />
          </button>
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
                <b>{{ filter.stage || '不限' }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="13" height="13" alt="" />
              </span>
              <ul v-if="openMenu === 'stage'" class="menu">
                <li @click="filter.stage = ''; openMenu = ''">不限</li>
                <li v-for="item in STAGES" :key="item" @click="chooseStage(item)">{{ item }}</li>
              </ul>
            </button>

            <button type="button" class="field" @click="toggleMenu('grade')">
              <small>当前年级</small>
              <span>
                <b>{{ grade || '不限' }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="13" height="13" alt="" />
              </span>
              <ul v-if="openMenu === 'grade'" class="menu">
                <li v-for="item in gradeOptions" :key="item" @click="chooseGrade(item)">{{ item }}</li>
              </ul>
            </button>

            <button type="button" class="field" @click="toggleMenu('subject')">
              <small>授课科目</small>
              <span>
                <b>{{ filter.subject || '不限' }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="13" height="13" alt="" />
              </span>
              <ul v-if="openMenu === 'subject'" class="menu">
                <li @click="chooseSubject('')">不限</li>
                <li
                  v-for="item in subjectOptions"
                  :key="item"
                  @click="chooseSubject(item)"
                >
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
                <li @click="chooseMode('')">线上 / 线下不限</li>
                <li
                  v-for="item in TEACH_MODE_OPTIONS"
                  :key="item.value"
                  @click="chooseMode(item.value)"
                >
                  {{ TEACH_MODE_MAP[item.value] }}
                </li>
              </ul>
            </button>

            <button type="button" class="search-btn" @click="search">
              查找合适的老师
              <img src="/images/home/figma/search-white.svg" width="17" height="17" alt="" />
            </button>
          </div>

          <div class="divider" />

          <div class="chip-row">
            <span class="chip-label">教学侧重</span>
            <div class="chips">
              <button
                type="button"
                :class="['chip', { on: !focusChip }]"
                @click="focusChip = ''"
              >
                不限
              </button>
              <button
                v-for="item in focusOptions"
                :key="item"
                type="button"
                :class="['chip', { on: focusChip === item }]"
                @click="focusChip = focusChip === item ? '' : item"
              >
                {{ item }}
              </button>
            </div>
          </div>

          <div class="chip-row">
            <span class="chip-label">可约时间</span>
            <div class="chips">
              <button
                type="button"
                :class="['chip', { on: !timeChip }]"
                @click="timeChip = ''"
              >
                不限
              </button>
              <button
                v-for="item in TIME_CHIPS"
                :key="item"
                type="button"
                :class="['chip', { on: timeChip === item }]"
                @click="timeChip = timeChip === item ? '' : item"
              >
                {{ item }}
              </button>
            </div>
          </div>

          <div class="filter-foot">
            <p>线上可跨城联系；如需线下授课，请先选择城市，再确认区域与距离。</p>
            <button type="button" class="reset" @click="resetFilters">重置筛选</button>
          </div>
        </div>
      </div>
    </section>

    <section class="results">
      <div class="wrap">
        <div class="condition-row">
          <span class="cond-label">当前条件</span>
          <span v-for="tag in conditionTags" :key="tag" class="cond-tag">{{ tag }}</span>
        </div>

        <div class="layout">
          <div class="main">
            <div class="result-head">
              <div class="count">
                <strong>{{ displayedList.length }} 位老师</strong>
                <span>符合当前条件</span>
              </div>
              <div class="sort" @click.stop>
                <span>排序</span>
                <button type="button" class="sort-btn" @click="toggleMenu('sort')">
                  {{ sortLabel }}
                  <img src="/images/home/figma/chevron-down-muted.svg" width="13" height="13" alt="" />
                </button>
                <ul v-if="openMenu === 'sort'" class="menu sort-menu">
                  <li @click="chooseSort('default')">默认排序</li>
                  <li @click="chooseSort('priceAsc')">价格从低到高</li>
                  <li @click="chooseSort('priceDesc')">价格从高到低</li>
                </ul>
              </div>
            </div>

            <div v-loading="loading" class="result-list">
              <TeacherCard
                v-for="t in displayedList"
                :key="t.id"
                :teacher="t"
                variant="list"
              />
            </div>

            <el-empty v-if="!loading && !displayedList.length" description="没有符合条件的老师" />

            <div v-if="!loading && displayedList.length" class="list-end">
              <p>已展示全部 {{ displayedList.length }} 位老师</p>
              <p class="end-hint">还想看看其他选择？调整上方条件，继续发现合拍的老师。</p>
            </div>
          </div>

          <aside class="sidebar">
            <div class="tips-card">
              <div class="tips-title">
                <img src="/images/home/figma/messages.svg" width="23" height="23" alt="" />
                <strong>先了解，再沟通</strong>
              </div>
              <p class="tips-lead">资料是交流的起点，不是选择的全部。联系前，可以先想好这些问题。</p>
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

            <div class="demand-card">
              <div class="demand-photo">
                <img src="/images/home/figma/hero-family.png" alt="家庭学习场景" />
              </div>
              <div class="demand-body">
                <h3>让老师也了解你的需要</h3>
                <p>写下孩子的学习情况、目标与时间，让沟通从清晰的需求开始。</p>
                <button type="button" class="demand-btn" @click="openPublish">
                  发布学习需求
                  <span class="plus">＋</span>
                </button>
              </div>
            </div>

            <div class="boundary-card">
              <div class="boundary-title">
                <img src="/images/home/figma/info-amber.svg" width="18" height="18" alt="" />
                <strong>只做信息撮合</strong>
              </div>
              <p>平台不提供授课服务，不收取课时费，不提供支付结算，也不承诺教学结果。</p>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <StudentDemandDialog v-model="studentDemandVisible" />
    <TeacherJoinDialog v-model="teacherJoinVisible" />
  </div>
</template>

<style scoped lang="scss">
.teachers-page {
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
  align-items: flex-end;
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

.demand-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: var(--teal);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  padding: 0;
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
    color: var(--muted);
    font-size: 11px;
  }

  > span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    height: 44px;
    padding: 0 13px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--page);
  }

  b {
    font-size: 14px;
    font-weight: 700;
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

.chip-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.chip-label {
  width: 64px;
  flex-shrink: 0;
  color: var(--muted);
  font-size: 13px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  border: 0;
  border-radius: 6px;
  padding: 6px 14px;
  background: #fff;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;

  &.on {
    background: var(--mint);
    color: var(--teal);
    font-weight: 700;
  }
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

.condition-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.cond-label {
  color: var(--muted);
  font-size: 12px;
}

.cond-tag {
  padding: 5px 11px;
  border-radius: 6px;
  background: var(--mint);
  color: var(--teal);
  font-size: 12px;
  font-weight: 700;
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
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.count {
  display: flex;
  align-items: baseline;
  gap: 10px;

  strong {
    font-size: 23px;
    font-weight: 700;
  }

  span {
    color: var(--muted);
    font-size: 12px;
  }
}

.sort {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
  font-size: 12px;
}

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--teal);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.sort-menu {
  right: 0;
  left: auto;
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
  padding: 15px 0 7px;
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

.tips-card {
  background: var(--mint);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 9px;

  strong {
    font-size: 19px;
  }
}

.tips-lead {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}

.tip-step {
  display: flex;
  gap: 11px;

  b {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
  }

  p {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.8;
  }
}

.step-no {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #fff;
  color: var(--teal);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tips-link {
  color: var(--teal);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.demand-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
}

.demand-photo {
  height: 170px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.demand-body {
  padding: 23px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  h3 {
    margin: 0;
    font-size: 19px;
    line-height: 1.5;
  }

  p {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.8;
  }
}

.demand-btn {
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
}

.plus {
  font-size: 16px;
  line-height: 1;
}

.boundary-card {
  background: var(--warm);
  border-radius: 20px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  p {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.85;
  }
}

.boundary-title {
  display: flex;
  align-items: center;
  gap: 8px;

  strong {
    font-size: 14px;
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

  .chip-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
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

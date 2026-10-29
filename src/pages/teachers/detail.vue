<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ConsultDialog from '@/components/teacher/ConsultDialog.vue'
import { apiGetComments, apiGetTeacherDetail } from '@/api'
import { TEACH_MODE_MAP } from '@/constants'
import { formatDate, resolveAvatar } from '@/utils'
import { formatRegions, splitRegionPath } from '@/utils/region'
import type { Comment, Teacher } from '@/types'

const FAV_KEY = 'tonghao_fav_teachers'
const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const
const PERIODS = ['上午', '下午', '晚上'] as const

const FOCUS_HINTS: Record<string, string> = {
  语文: '从阅读理解与表达入手，梳理字词句段，鼓励孩子把想法说清楚。',
  数学: '从运算过程与题意拆解入手，讨论容易混淆的环节与检查方法。',
  英语: '围绕词汇、句型与阅读听力，结合情境练习，逐步建立表达自信。',
  物理: '结合生活现象讲清概念，先画图再列式，强调因果与单位。',
  化学: '从实验现象与方程式入手，理清反应条件与常见易错点。',
  生物: '用图示梳理结构与过程，把知识点连成可复述的脉络。',
  钢琴: '从识谱与手型开始，分段练习曲目，培养节奏与听力。',
  吉他: '从基础指法与节奏型入手，用简单曲目建立练习习惯。',
  声乐: '关注气息与咬字，循序渐进扩展音域与表现力。',
  小提琴: '强调姿势与音准，慢练音阶与短句，逐步过渡到乐曲。',
  音乐理论: '用听辨与书写结合，把节奏、音程与调性讲清楚。',
}

const THINKING_STEPS = [
  { title: '一、先听孩子怎么想', desc: '用一道熟悉的题，了解当前思路。' },
  { title: '二、再一起拆解问题', desc: '把条件、关系和步骤逐一说明。' },
  { title: '三、最后回顾与表达', desc: '请孩子用自己的话说说过程。' },
]

const CHECKLIST = [
  {
    mark: '一',
    title: '孩子的学习情况',
    desc: '当前年级、教材与近期困惑；可以准备已去除个人信息的例题。',
  },
  {
    mark: '二',
    title: '时间、地点与预算',
    desc: '确认可沟通时段、线上工具或线下区域，并自行商议费用。',
  },
  {
    mark: '三',
    title: '身份与相关材料',
    desc: '资料不等于认证，请双方自行核验，未成年人由监护人参与。',
  },
]

const route = useRoute()
const router = useRouter()
const teacher = ref<Teacher | null>(null)
const comments = ref<Comment[]>([])
const loading = ref(false)
const consultOpen = ref(false)
const favorited = ref(false)

const id = computed(() => route.params.id as string)

function readFavIds(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.map(String) : []
  } catch {
    return []
  }
}

function syncFavorite(teacherId: string) {
  favorited.value = readFavIds().includes(teacherId)
}

function toggleFavorite() {
  if (!teacher.value) return
  const tid = teacher.value.id
  const ids = readFavIds()
  const next = favorited.value ? ids.filter((x) => x !== tid) : [...ids, tid]
  localStorage.setItem(FAV_KEY, JSON.stringify(next))
  favorited.value = !favorited.value
  ElMessage.success(favorited.value ? '已收藏老师' : '已取消收藏')
}

function shortPlace(path: string) {
  const parts = splitRegionPath(path)
  if (!parts.length) return ''
  const city = (parts[1] || parts[0] || '').replace(/(省|市|自治区|特别行政区)$/, '')
  const district = (parts[2] || '').replace(/(区|县|市)$/, '')
  if (city && district) return `${city} · ${district}`
  return city || parts[parts.length - 1]
}

const locationLabel = computed(() => {
  const districts = teacher.value?.districts || []
  if (!districts.length) return '全国可约'
  const labels = districts.map(shortPlace).filter(Boolean)
  return [...new Set(labels)].slice(0, 2).join(' / ') || formatRegions(districts)
})

const subjectStageLine = computed(() => {
  if (!teacher.value) return ''
  const subjects = teacher.value.subjects?.length ? teacher.value.subjects.join('、') : '待补充科目'
  const stages = teacher.value.stages?.length ? teacher.value.stages.join('、') : ''
  return stages ? `${subjects} · ${stages}` : subjects
})

const headline = computed(() => {
  if (!teacher.value) return ''
  const exp = teacher.value.experience?.trim()
  if (exp) {
    const cut = exp.split(/[。！？\n]/).find((s) => s.trim())
    if (cut) return cut.trim().endsWith('。') ? cut.trim() : `${cut.trim()}。`
  }
  const intro = teacher.value.introduction?.trim()
  if (intro) {
    return intro.length > 36 ? `${intro.slice(0, 36)}…` : intro
  }
  return '欢迎了解教学思路与可约时间，再决定是否沟通。'
})

const focusCards = computed(() => {
  if (!teacher.value) return []
  const subjects = teacher.value.subjects || []
  const exp = teacher.value.experience || ''
  const intro = teacher.value.introduction || ''
  const pool = subjects.length ? subjects.slice(0, 2) : ['教学沟通']
  return pool.map((subject, index) => {
    const hint = FOCUS_HINTS[subject]
    if (hint) return { title: subject, desc: hint }
    const source = [exp, intro].filter(Boolean).join(' ')
    const snippet = source
      .replace(/\s+/g, ' ')
      .slice(index * 28, index * 28 + 42)
      .trim()
    return {
      title: subject,
      desc: snippet
        ? `${snippet}${snippet.length >= 40 ? '…' : ''}`
        : `围绕「${subject}」交流学习目标、薄弱环节与练习节奏。`,
    }
  })
})

const focusTags = computed(() => focusCards.value.map((c) => c.title))

const showOffline = computed(() => {
  const mode = teacher.value?.teachMode
  return mode === 'offline' || mode === 'both'
})

const showOnline = computed(() => {
  const mode = teacher.value?.teachMode
  return mode === 'online' || mode === 'both'
})

const offlineTitle = computed(() => {
  const place = locationLabel.value
  return place && place !== '全国可约' ? `线下 · ${place}` : '线下授课'
})

const times = computed(() => teacher.value?.availableTimes?.filter(Boolean) || [])

const canUseWeekGrid = computed(() => {
  if (!times.value.length) return false
  return times.value.some((t) =>
    WEEK_DAYS.some((d) => t.includes(d)) || PERIODS.some((p) => t.includes(p)),
  )
})

function slotActive(day: string, period: string) {
  return times.value.some((t) => {
    const hasDay = t.includes(day)
    const hasPeriod = PERIODS.some((p) => t.includes(p))
    if (hasDay && hasPeriod) return t.includes(period)
    if (hasDay && !hasPeriod) return true
    if (!hasDay && hasPeriod) return t.includes(period) && !WEEK_DAYS.some((d) => t.includes(d))
    return false
  })
}

async function load() {
  loading.value = true
  try {
    teacher.value = await apiGetTeacherDetail(id.value)
    comments.value = await apiGetComments(id.value)
    syncFavorite(teacher.value.id)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
    router.replace('/teachers')
  } finally {
    loading.value = false
  }
}

watch(id, () => {
  if (id.value) load()
})

onMounted(load)
</script>

<template>
  <div v-loading="loading" class="detail-page">
    <template v-if="teacher">
      <div class="page-guide">
        <div class="wrap">
          <nav class="crumb" aria-label="面包屑">
            <router-link to="/">首页</router-link>
            <span class="sep">›</span>
            <router-link to="/teachers">找老师</router-link>
            <span class="sep">›</span>
            <span class="current">教师详情</span>
          </nav>
          <div class="page-head">
            <div>
              <h1>先了解老师，再聊聊学习需要</h1>
              <p>从教学思路与时间安排开始，判断是否适合进一步沟通。</p>
            </div>
          </div>
        </div>
      </div>

      <div class="wrap content">
        <div class="tip-banner">
          <img src="/images/teachers/info.svg" width="18" height="18" alt="" />
          <p>资料由老师自行填写，仅供沟通参考；不代表学历、资质认证或教学效果承诺。请双方自行核验身份及相关材料。</p>
        </div>

        <section class="hero">
          <div class="avatar-box">
            <img
              :src="resolveAvatar(teacher.avatar, teacher.gender)"
              :alt="teacher.name"
              class="avatar"
              @error="($event.target as HTMLImageElement).src = resolveAvatar(undefined, teacher.gender)"
            />
          </div>

          <div class="hero-main">
            <div class="name-row">
              <h2>{{ teacher.name }}</h2>
            </div>
            <p class="subject-line">{{ subjectStageLine }}</p>
            <p class="headline">{{ headline }}</p>
            <div class="focus-tags">
              <span v-for="tag in focusTags" :key="tag" class="mint-tag">{{ tag }}</span>
            </div>
            <div class="meta-row">
              <img src="/images/teachers/map-pin.svg" width="16" height="16" alt="" />
              <span>{{ locationLabel }}　｜　{{ TEACH_MODE_MAP[teacher.teachMode] }}</span>
            </div>
          </div>

          <div class="hero-actions">
            <button type="button" class="btn-primary" @click="consultOpen = true">
              联系意向
              <img src="/images/teachers/message-circle.svg" width="17" height="17" alt="" />
            </button>
            <button
              type="button"
              class="btn-secondary"
              :class="{ active: favorited }"
              @click="toggleFavorite"
            >
              {{ favorited ? '已收藏' : '收藏老师' }}
              <img src="/images/teachers/heart.svg" width="17" height="17" alt="" />
            </button>
            <p class="action-note">平台仅协助撮合沟通，不安排授课，也不收取课时费。</p>
          </div>
        </section>

        <div class="columns">
          <div class="main-col">
            <section class="card">
              <h3>自我介绍</h3>
              <p class="body-text">{{ teacher.introduction || '老师暂未填写自我介绍，可先通过联系意向了解教学方向。' }}</p>
              <p v-if="teacher.experience" class="fine-print">教学经历：{{ teacher.experience }}</p>
              <p class="fine-print">以上介绍供沟通参考。真实沟通时，请双方自行核验身份及相关材料。</p>
            </section>

            <section class="card">
              <div class="card-head">
                <h3>教学侧重与思路</h3>
                <p class="sub">以下展示交流方向，不代表教学效果承诺。</p>
              </div>
              <div class="focus-grid">
                <article v-for="item in focusCards" :key="item.title" class="focus-card">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.desc }}</p>
                </article>
              </div>
              <div class="thinking-steps">
                <div v-for="step in THINKING_STEPS" :key="step.title" class="step">
                  <strong>{{ step.title }}</strong>
                  <p>{{ step.desc }}</p>
                </div>
              </div>
            </section>

            <section class="card">
              <h3>授课区域与方式</h3>
              <div class="mode-grid">
                <article v-if="showOffline" class="mode-card">
                  <h4>{{ offlineTitle }}</h4>
                  <p>仅展示区域意向，具体距离与场所需双方进一步确认；不公开详细地址。</p>
                </article>
                <article v-if="showOnline" class="mode-card">
                  <h4>线上 · 可跨城沟通</h4>
                  <p>使用工具、设备和材料由双方确认；未成年人由监护人参与沟通。</p>
                </article>
              </div>
            </section>

            <section class="card">
              <div class="card-head">
                <h3>可约时间</h3>
                <p class="sub">
                  <template v-if="times.length">{{ times.join('；') }}。以下为可沟通时段参考，不代表实时空档。</template>
                  <template v-else>老师暂未标注具体时段，可在沟通时确认。</template>
                </p>
              </div>

              <div v-if="canUseWeekGrid" class="week-grid">
                <div class="week-row head">
                  <span class="period-label">时段</span>
                  <span v-for="day in WEEK_DAYS" :key="day" class="cell head-cell">{{ day }}</span>
                </div>
                <div v-for="period in PERIODS" :key="period" class="week-row">
                  <span class="period-label">{{ period }}</span>
                  <span
                    v-for="day in WEEK_DAYS"
                    :key="`${day}-${period}`"
                    class="cell"
                    :class="{ active: slotActive(day, period) }"
                  >
                    {{ slotActive(day, period) ? '可沟通' : '—' }}
                  </span>
                </div>
              </div>

              <div v-else-if="times.length" class="time-chips">
                <span v-for="t in times" :key="t" class="mint-tag">{{ t }}</span>
              </div>

              <p v-else class="empty-times">暂无可约时间说明</p>

              <p class="fine-print">具体起止时间、频率与课时安排需另行商议；本页不能直接约课。</p>
            </section>

            <section v-if="comments.length" class="card comments-card">
              <h3>学员评价</h3>
              <div class="comments">
                <article v-for="c in comments" :key="c.id" class="comment">
                  <div class="comment-head">
                    <strong>{{ c.userName }}</strong>
                    <span>★ {{ c.rating }}</span>
                    <span class="muted">{{ formatDate(c.createdAt) }}</span>
                  </div>
                  <p>{{ c.content }}</p>
                </article>
              </div>
            </section>
          </div>

          <aside class="side-col">
            <section class="side-check">
              <div class="side-title">
                <img src="/images/teachers/messages-square.svg" width="22" height="22" alt="" />
                <h3>沟通前，先确认</h3>
              </div>
              <div v-for="item in CHECKLIST" :key="item.mark" class="check-item">
                <span class="mark">{{ item.mark }}</span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.desc }}</p>
                </div>
              </div>
              <router-link class="guide-link" to="/legal/agreement">阅读沟通与安全指南 ↗</router-link>
            </section>

            <section class="side-warm">
              <img src="/images/teachers/shield-alert.svg" width="18" height="18" alt="" />
              <div>
                <strong>只做信息撮合</strong>
                <p>平台仅提供信息展示与联系撮合，不提供授课服务，不收取课时费，不提供支付结算，也不承诺教学结果。</p>
              </div>
            </section>

            <section class="side-feedback">
              <strong>发现资料有疑问？</strong>
              <p>不要仅凭展示资料作出决定。如遇可疑信息或异常转账要求，请停止沟通并反馈。</p>
              <router-link to="/legal/agreement">反馈与举报 ↗</router-link>
            </section>
          </aside>
        </div>
      </div>

      <ConsultDialog
        v-model="consultOpen"
        :teacher-id="teacher.id"
        :teacher-name="teacher.name"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.detail-page {
  --teal: #13857d;
  --ink: #173b3d;
  --muted: #687e7e;
  --line: #dce8e3;
  --mint: #eaf6f1;
  --soft: #f3f7f4;
  --warm: #fff0df;
  min-height: 100%;
  background: #fbfcfa;
  color: var(--ink);
}

.wrap {
  width: min(1248px, calc(100% - 48px));
  margin: 0 auto;
}

.page-guide {
  background: var(--mint);
  padding: 26px 0 30px;
}

.crumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 22px;
  font-size: 12px;
  color: var(--muted);

  a {
    color: var(--muted);

    &:hover {
      color: var(--teal);
    }
  }

  .current {
    color: var(--ink);
  }

  .sep {
    opacity: 0.7;
  }
}

.page-head {
  h1 {
    margin: 0 0 9px;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.4;
    color: var(--ink);
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--muted);
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 30px 0 48px;
}

.tip-banner {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 10px;
  background: var(--soft);

  img {
    flex-shrink: 0;
    margin-top: 1px;
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.85;
    color: var(--muted);
  }
}

.hero {
  display: flex;
  gap: 30px;
  align-items: center;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #fff;
}

.avatar-box {
  flex-shrink: 0;
  width: 176px;
  height: 218px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--soft);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.name-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    color: var(--ink);
  }
}

.mint-tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 6px;
  background: var(--mint);
  color: var(--teal);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.subject-line {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--teal);
}

.headline {
  margin: 0;
  font-size: 21px;
  font-weight: 500;
  line-height: 1.6;
  color: var(--ink);
}

.focus-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--muted);

  img {
    flex-shrink: 0;
  }
}

.hero-actions {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 46px;
  padding: 0 20px;
  border-radius: 10px;
  border: 1px solid var(--teal);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, background 0.2s, color 0.2s;

  &:hover {
    opacity: 0.92;
  }
}

.btn-primary {
  background: var(--teal);
  color: #fff;
}

.btn-secondary {
  background: #fff;
  color: var(--teal);
  border-color: var(--line);

  &.active {
    background: var(--mint);
    border-color: var(--teal);
  }
}

.action-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.85;
  text-align: center;
  color: var(--muted);
}

.columns {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.main-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.side-col {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 22px;

  h3 {
    margin: 0;
    font-size: 21px;
    font-weight: 700;
    color: var(--ink);
  }
}

.card-head {
  display: flex;
  flex-direction: column;
  gap: 7px;

  .sub {
    margin: 0;
    font-size: 12px;
    line-height: 1.8;
    color: var(--muted);
  }
}

.body-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.95;
  color: var(--muted);
}

.fine-print {
  margin: 0;
  font-size: 11px;
  line-height: 1.8;
  color: var(--muted);
}

.focus-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.focus-card {
  padding: 20px;
  border-radius: 10px;
  background: var(--soft);
  display: flex;
  flex-direction: column;
  gap: 10px;

  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--teal);
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.85;
    color: var(--muted);
  }
}

.thinking-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  .step {
    display: flex;
    flex-direction: column;
    gap: 8px;

    strong {
      font-size: 14px;
      color: var(--ink);
    }

    p {
      margin: 0;
      font-size: 12px;
      line-height: 1.85;
      color: var(--muted);
    }
  }
}

.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.mode-card {
  display: flex;
  flex-direction: column;
  gap: 9px;

  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.85;
    color: var(--muted);
  }
}

.week-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-x: auto;
}

.week-row {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 560px;

  &.head {
    color: var(--muted);
    font-size: 12px;
  }
}

.period-label {
  width: 62px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--muted);
}

.cell {
  flex: 1;
  min-width: 0;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--soft);
  font-size: 11px;
  color: var(--muted);

  &.head-cell {
    height: auto;
    background: transparent;
    font-size: 12px;
  }

  &.active {
    background: var(--mint);
    color: var(--teal);
  }
}

.time-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.empty-times {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.comments {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment {
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--line);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  p {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.7;
    color: var(--muted);
  }
}

.comment-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
  color: var(--ink);

  .muted {
    color: var(--muted);
  }
}

.side-check {
  padding: 24px;
  border-radius: 20px;
  background: var(--mint);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.side-title {
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    color: var(--ink);
  }
}

.check-item {
  display: flex;
  gap: 11px;
  align-items: flex-start;

  .mark {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--teal);
  }

  strong {
    display: block;
    margin-bottom: 7px;
    font-size: 14px;
    color: var(--ink);
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.85;
    color: var(--muted);
  }
}

.guide-link {
  font-size: 12px;
  line-height: 1.8;
  color: var(--teal);

  &:hover {
    text-decoration: underline;
  }
}

.side-warm {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 10px;
  background: var(--warm);

  img {
    flex-shrink: 0;
    margin-top: 1px;
  }

  strong {
    display: block;
    margin-bottom: 5px;
    font-size: 13px;
    color: var(--ink);
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.85;
    color: var(--muted);
  }
}

.side-feedback {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;

  strong {
    font-size: 16px;
    color: var(--ink);
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.85;
    color: var(--muted);
  }

  a {
    font-size: 13px;
    font-weight: 700;
    color: var(--teal);

    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 1024px) {
  .columns {
    flex-direction: column;
  }

  .side-col {
    width: 100%;
  }

  .hero {
    flex-wrap: wrap;
  }

  .hero-actions {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-head h1 {
    font-size: 24px;
  }

  .headline {
    font-size: 18px;
  }

  .name-row h2 {
    font-size: 24px;
  }

  .hero {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    padding: 20px;
  }

  .avatar-box {
    width: 100%;
    height: 220px;
  }

  .focus-grid,
  .mode-grid,
  .thinking-steps {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 20px;
  }

  .wrap {
    width: min(1248px, calc(100% - 32px));
  }
}
</style>

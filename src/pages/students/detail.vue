<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiGetDemandDetail } from '@/api'
import { TEACH_MODE_MAP } from '@/constants'
import { formatDate } from '@/utils'
import { formatRegion } from '@/utils/region'
import type { Demand } from '@/types'

const CONTACT_TIPS = [
  {
    mark: '一',
    title: '先核对科目与时段',
    desc: '确认科目、学段与可上课时间是否匹配，再决定是否联系。',
  },
  {
    mark: '二',
    title: '电话沟通基础信息',
    desc: '可先确认年级、目标与预算区间；未成年人请由监护人参与。',
  },
  {
    mark: '三',
    title: '自行核验再约定',
    desc: '平台仅撮合沟通，不安排授课、不收课时费；请双方自行核验身份。',
  },
]

const route = useRoute()
const router = useRouter()
const demand = ref<Demand | null>(null)
const loading = ref(false)

const id = computed(() => route.params.id as string)

const pageTitle = computed(() => {
  if (!demand.value) return '需求详情'
  return demand.value.remark?.trim() || `${demand.value.subject}家教需求`
})

const subjectStageLine = computed(() => {
  if (!demand.value) return ''
  const subject = demand.value.subject || '待补充科目'
  const stage = demand.value.stage
  return stage ? `${subject} · ${stage}` : subject
})

const statusLabel = computed(() => (demand.value?.status === 'open' ? '招募中' : '已关闭'))

const profileLine = computed(() => {
  if (!demand.value) return '未填写'
  const parts: string[] = []
  if (demand.value.gender === 'female') parts.push('女')
  else if (demand.value.gender === 'male') parts.push('男')
  else parts.push('未填写性别')
  if (demand.value.age) parts.push(`${demand.value.age}岁`)
  return parts.join(' · ')
})

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
  <div v-loading="loading" class="detail-page">
    <template v-if="demand">
      <div class="page-guide">
        <div class="wrap">
          <nav class="crumb" aria-label="面包屑">
            <router-link to="/">首页</router-link>
            <span class="sep">›</span>
            <router-link to="/students">学员需求</router-link>
            <span class="sep">›</span>
            <span class="current">需求详情</span>
          </nav>
          <div class="page-head">
            <div class="head-copy">
              <h1>了解需求详情，再决定是否联系</h1>
              <p>核对科目、时段与预算后，再电话沟通基础信息与学习目标。</p>
            </div>
            <span v-if="demand.stage" class="stage-badge">{{ demand.stage }}</span>
          </div>
        </div>
      </div>

      <div class="wrap content">
        <div class="tip-banner">
          <img src="/images/teachers/info.svg" width="18" height="18" alt="" />
          <p>
            需求由家长或学员自行填写，仅供沟通参考；不代表平台审核结果或教学效果承诺。请双方自行核验身份及相关材料。
          </p>
        </div>

        <section class="hero">
          <div class="hero-main">
            <div class="name-row">
              <h2>{{ pageTitle }}</h2>
              <span class="status-tag" :class="demand.status === 'open' ? 'open' : 'closed'">
                {{ statusLabel }}
              </span>
            </div>
            <p class="subject-line">{{ subjectStageLine }}</p>
            <div class="focus-tags">
              <span class="mint-tag">{{ demand.subject }}</span>
              <span v-if="demand.stage" class="mint-tag">{{ demand.stage }}</span>
              <span class="mint-tag">{{ TEACH_MODE_MAP[demand.teachMode] }}</span>
            </div>
            <div class="meta-row">
              <img src="/images/teachers/map-pin.svg" width="16" height="16" alt="" />
              <span>
                {{ formatRegion(demand.district) || '全国' }}　｜　{{ demand.schedule || '时间可议' }}
              </span>
            </div>
            <p class="budget-line">
              预算 <em>¥{{ demand.budget }}</em><span> / 课时</span>
            </p>
          </div>

          <div class="hero-actions">
            <div class="phone-box">
              <span class="phone-label">联系电话</span>
              <strong>{{ demand.phone }}</strong>
            </div>
            <button type="button" class="btn-primary" @click="copyPhone">复制手机号</button>
            <p class="action-note">平台仅协助撮合沟通，不安排授课，也不收取课时费。</p>
          </div>
        </section>

        <div class="columns">
          <div class="main-col">
            <section class="card">
              <div class="card-head">
                <h3>需求要点</h3>
                <p class="sub">科目、时段、方式与预算一览，便于快速判断是否匹配。</p>
              </div>
              <div class="fact-grid">
                <article class="fact">
                  <span class="label">科目 / 学段</span>
                  <strong>{{ subjectStageLine }}</strong>
                </article>
                <article class="fact">
                  <span class="label">上课时间</span>
                  <strong>{{ demand.schedule || '时间可议' }}</strong>
                </article>
                <article class="fact">
                  <span class="label">授课方式</span>
                  <strong>{{ TEACH_MODE_MAP[demand.teachMode] }}</strong>
                </article>
                <article class="fact">
                  <span class="label">上课地区</span>
                  <strong>{{ formatRegion(demand.district) || '全国' }}</strong>
                </article>
                <article class="fact">
                  <span class="label">课时预算</span>
                  <strong class="price">¥{{ demand.budget }} / 课时</strong>
                </article>
                <article class="fact">
                  <span class="label">学员资料</span>
                  <strong>{{ profileLine }}</strong>
                </article>
              </div>
            </section>

            <section class="card">
              <h3>需求说明</h3>
              <p class="body-text">
                {{ demand.remark || '学员暂未填写更多说明，可先电话沟通基础与目标。' }}
              </p>
              <p class="fine-print">发布时间：{{ formatDate(demand.createdAt) }}</p>
              <p class="fine-print">以上说明供沟通参考。真实沟通时，请双方自行核验身份及相关材料。</p>
            </section>
          </div>

          <aside class="side-col">
            <section class="side-check">
              <div class="side-title">
                <img src="/images/teachers/messages-square.svg" width="22" height="22" alt="" />
                <h3>联系前小贴士</h3>
              </div>
              <div v-for="item in CONTACT_TIPS" :key="item.mark" class="check-item">
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
                <p>
                  平台仅提供信息展示与联系撮合，不提供授课服务，不收取课时费，不提供支付结算，也不承诺教学结果。
                </p>
              </div>
            </section>

            <section class="side-cta">
              <strong>下一步</strong>
              <p>返回浏览更多需求，或先完善教师资料，方便家长了解你。</p>
              <router-link class="btn-primary link-btn" to="/students">返回需求列表</router-link>
              <router-link class="btn-secondary link-btn" to="/teacher/join">完善教师资料</router-link>
            </section>
          </aside>
        </div>
      </div>
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
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

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

.head-copy {
  flex: 1;
  min-width: 0;
}

.stage-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 8px;
  background: #fff;
  color: var(--teal);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid var(--line);
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
    font-size: 28px;
    font-weight: 700;
    line-height: 1.35;
    color: var(--ink);
  }
}

.status-tag,
.mint-tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-tag.open,
.mint-tag {
  background: var(--mint);
  color: var(--teal);
}

.status-tag.closed {
  background: var(--soft);
  color: var(--muted);
}

.subject-line {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--teal);
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

.budget-line {
  margin: 0;
  font-size: 14px;
  color: var(--muted);

  em {
    font-style: normal;
    margin: 0 2px;
    color: var(--teal);
    font-size: 24px;
    font-weight: 700;
  }

  span {
    font-size: 13px;
  }
}

.hero-actions {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phone-box {
  padding: 16px;
  border-radius: 10px;
  background: var(--soft);
  display: flex;
  flex-direction: column;
  gap: 6px;

  .phone-label {
    font-size: 12px;
    color: var(--muted);
  }

  strong {
    font-size: 18px;
    letter-spacing: 0.4px;
    color: var(--ink);
  }
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
  text-decoration: none;
  box-sizing: border-box;

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

.fact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.fact {
  padding: 18px 20px;
  border-radius: 10px;
  background: var(--soft);
  display: flex;
  flex-direction: column;
  gap: 8px;

  .label {
    font-size: 12px;
    color: var(--muted);
  }

  strong {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.5;
    color: var(--ink);
  }

  .price {
    color: var(--teal);
  }
}

.body-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.95;
  color: var(--muted);
  white-space: pre-wrap;
}

.fine-print {
  margin: 0;
  font-size: 11px;
  line-height: 1.8;
  color: var(--muted);
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

.side-cta {
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

  .link-btn {
    text-align: center;
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

  .name-row h2 {
    font-size: 22px;
  }

  .hero {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    padding: 20px;
  }

  .fact-grid {
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

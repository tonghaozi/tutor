<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { apiPublishDemand } from '@/api'
import {
  GRADES_BY_STAGE,
  STAGES,
  SUBJECTS_BY_STAGE,
  TEACH_MODE_MAP,
} from '@/constants'
import RegionCascader from '@/components/common/RegionCascader.vue'
import { useUserStore } from '@/store'
import type { Demand, Stage, Subject, TeachMode } from '@/types'
import { formatRegion, splitRegionPath } from '@/utils/region'

const DRAFT_KEY = 'tonghao_demand_draft'
const SCHEDULE_OPTIONS = [
  '工作日晚上',
  '周六上午',
  '周六下午',
  '周日上午',
  '周日下午',
  '周末全天',
  '时间可协商',
]

const MODE_CHIPS: { label: string; value: TeachMode }[] = [
  { label: '线上', value: 'online' },
  { label: '线下', value: 'offline' },
  { label: '线上或线下', value: 'both' },
]

const userStore = useUserStore()
const loading = ref(false)
const agreed = ref(false)

const form = reactive({
  district: '' as Demand['district'],
  stage: '小学' as Stage,
  grade: '四年级',
  subject: '数学' as Subject,
  statusText: '',
  goalText: '',
  teachMode: 'offline' as TeachMode,
  scheduleSlot: '周六上午',
  frequency: '',
  budgetMin: 120,
  budgetMax: 180,
  guardianLabel: '',
  phone: userStore.userInfo?.phone || '',
})

const subjectOptions = computed(() => SUBJECTS_BY_STAGE[form.stage] || [])
const gradeOptions = computed(() => GRADES_BY_STAGE[form.stage] || [])

watch(
  () => form.stage,
  (next) => {
    const grades = GRADES_BY_STAGE[next] || []
    if (!grades.includes(form.grade)) form.grade = grades[0] || ''
    const subjects = SUBJECTS_BY_STAGE[next] || []
    if (!subjects.includes(form.subject)) form.subject = subjects[0]
  },
)

const shortPlace = computed(() => {
  const parts = splitRegionPath(form.district)
  if (!parts.length) return '待选择城市区域'
  const city = (parts[1] || parts[0] || '').replace(/(省|市|自治区|特别行政区)$/, '')
  const district = parts[2] || ''
  return district ? `${city} · ${district}` : city || formatRegion(form.district)
})

const modeLabel = computed(() => {
  const chip = MODE_CHIPS.find((m) => m.value === form.teachMode)
  return chip?.label || TEACH_MODE_MAP[form.teachMode]
})

const previewTitle = computed(() => {
  const focus = form.goalText.trim().slice(0, 18) || '学习沟通'
  return `${form.grade}${form.subject}　${focus}${form.goalText.trim().length > 18 ? '…' : ''}`
})

const previewBudget = computed(() => {
  const min = Number(form.budgetMin) || 0
  const max = Number(form.budgetMax) || 0
  if (min && max) return `${min}–${max} 元 / 小时`
  if (max) return `${max} 元 / 小时`
  return '待填写预算'
})

function buildSchedule() {
  const parts = [form.scheduleSlot, form.frequency.trim()].filter(Boolean)
  return parts.join('；') || form.scheduleSlot
}

function buildRemark() {
  const chunks: string[] = []
  if (form.guardianLabel.trim()) chunks.push(`监护人称呼：${form.guardianLabel.trim()}`)
  if (form.grade) chunks.push(`年级：${form.grade}`)
  if (form.statusText.trim()) chunks.push(`学习现状：${form.statusText.trim()}`)
  if (form.goalText.trim()) chunks.push(`学习目标：${form.goalText.trim()}`)
  const min = Number(form.budgetMin) || 0
  const max = Number(form.budgetMax) || 0
  if (min && max && min !== max) chunks.push(`意向预算区间：${min}-${max}元/小时`)
  return chunks.join('\n')
}

function validate(): string | null {
  if (!form.district) return '请选择所在城市与区域'
  if (!form.stage) return '请选择学习阶段'
  if (!form.grade) return '请选择当前年级'
  if (!form.subject) return '请选择学习科目'
  if (!form.statusText.trim()) return '请填写学习现状'
  if (!form.goalText.trim()) return '请填写学习目标'
  if (!form.teachMode) return '请选择授课方式'
  if (!form.scheduleSlot) return '请选择可约时间'
  if (!form.budgetMin || !form.budgetMax) return '请填写意向预算'
  if (form.budgetMin > form.budgetMax) return '最低预算不能高于最高预算'
  if (!form.phone.trim()) return '请填写监护人手机号'
  if (!/^1\d{10}$/.test(form.phone.trim())) return '手机号格式不正确'
  if (!agreed.value) return '请先阅读并勾选同意条款'
  return null
}

function saveDraft() {
  const payload = {
    ...form,
    agreed: agreed.value,
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
  ElMessage.success('草稿已保存到本机')
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as Partial<typeof form> & { agreed?: boolean }
    Object.assign(form, {
      district: data.district || form.district,
      stage: data.stage || form.stage,
      grade: data.grade || form.grade,
      subject: data.subject || form.subject,
      statusText: data.statusText || '',
      goalText: data.goalText || '',
      teachMode: data.teachMode || form.teachMode,
      scheduleSlot: data.scheduleSlot || form.scheduleSlot,
      frequency: data.frequency || '',
      budgetMin: data.budgetMin ?? form.budgetMin,
      budgetMax: data.budgetMax ?? form.budgetMax,
      guardianLabel: data.guardianLabel || '',
      phone: data.phone || form.phone,
    })
    if (typeof data.agreed === 'boolean') agreed.value = data.agreed
  } catch {
    /* ignore broken draft */
  }
}

async function submit() {
  const err = validate()
  if (err) {
    ElMessage.warning(err)
    return
  }
  loading.value = true
  try {
    const budget = Math.round((Number(form.budgetMin) + Number(form.budgetMax)) / 2)
    await apiPublishDemand({
      subject: form.subject,
      stage: form.stage,
      district: form.district,
      budget,
      schedule: buildSchedule(),
      teachMode: form.teachMode,
      remark: buildRemark(),
      phone: form.phone.trim(),
      userId: userStore.userInfo?.id,
    })
    localStorage.removeItem(DRAFT_KEY)
    ElMessage.success('需求已发布')
    form.statusText = ''
    form.goalText = ''
    form.frequency = ''
    form.guardianLabel = ''
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || '发布失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!form.phone) form.phone = userStore.userInfo?.phone || ''
  loadDraft()
})
</script>

<template>
  <div class="publish-page">
    <div class="page-guide">
      <div class="wrap">
        <nav class="crumb" aria-label="面包屑">
          <router-link to="/">首页</router-link>
          <span class="sep">›</span>
          <span class="current">发布学习需求</span>
        </nav>
        <div class="page-head">
          <div>
            <h1>说清学习需要，让沟通更有方向</h1>
            <p>由监护人填写；可先保存草稿，再检查后发布。平台仅做信息撮合，不收取课时费。</p>
          </div>
          <span class="status-pill">填写中 · 尚未提交</span>
        </div>
      </div>
    </div>

    <div class="wrap content">
      <div class="main-col">
        <div class="tip-banner">
          <img src="/images/teachers/info.svg" width="18" height="18" alt="" />
          <div>
            <strong>只写学习需要，不公开孩子的个人信息</strong>
            <p>请勿填写未成年人姓名、学校、详细住址或公开手机号。学习内容可按实际情况调整。</p>
          </div>
        </div>

        <section class="card">
          <header class="card-head">
            <h2>学习基本信息</h2>
            <p>城市用于确定沟通范围，线下授课只展示到区。</p>
          </header>
          <div class="field">
            <label>所在城市 · 区域 · 必填</label>
            <RegionCascader v-model="form.district" placeholder="请选择省 / 市 / 区" />
          </div>
          <div class="grid-3">
            <div class="field">
              <label>学习阶段 · 必填</label>
              <el-select v-model="form.stage" style="width: 100%">
                <el-option v-for="s in STAGES" :key="s" :label="s" :value="s" />
              </el-select>
            </div>
            <div class="field">
              <label>当前年级 · 必填</label>
              <el-select v-model="form.grade" style="width: 100%">
                <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
              </el-select>
            </div>
            <div class="field">
              <label>学习科目 · 必填</label>
              <el-select v-model="form.subject" style="width: 100%">
                <el-option v-for="s in subjectOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </div>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2>学习现状与目标</h2>
            <p>具体描述遇到的困难与期待，不必填写分数或个人身份信息。</p>
          </header>
          <div class="field">
            <label>学习现状 · 必填</label>
            <el-input
              v-model="form.statusText"
              type="textarea"
              :rows="4"
              maxlength="300"
              show-word-limit
              placeholder="例如：基础计算可以独立完成，遇到文字较长的应用题时不太会表达解题思路。"
            />
            <p class="hint">填写示例，仅描述学习情况；不要出现孩子姓名、学校或班级。</p>
          </div>
          <div class="field">
            <label>学习目标 · 必填</label>
            <el-input
              v-model="form.goalText"
              type="textarea"
              :rows="4"
              maxlength="300"
              show-word-limit
              placeholder="例如：希望围绕应用题梳理思路，练习读题、画图和说明数量关系。"
            />
            <p class="hint">目标用于双方沟通，不代表平台或老师作出效果承诺。</p>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2>授课安排与意向预算</h2>
            <p>以下都是沟通意向，具体安排及费用由双方自主协商。</p>
          </header>
          <div class="field">
            <label>授课方式 · 必填</label>
            <div class="chips">
              <button
                v-for="m in MODE_CHIPS"
                :key="m.value"
                type="button"
                :class="['chip', { on: form.teachMode === m.value }]"
                @click="form.teachMode = m.value"
              >
                <img
                  v-if="form.teachMode === m.value"
                  src="/images/home/figma/check-teal.svg"
                  width="14"
                  height="14"
                  alt=""
                />
                {{ m.label }}
              </button>
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label>可约时间 · 必填</label>
              <el-select v-model="form.scheduleSlot" style="width: 100%">
                <el-option v-for="s in SCHEDULE_OPTIONS" :key="s" :label="s" :value="s" />
              </el-select>
              <p class="hint">具体起止时间由双方进一步确认。</p>
            </div>
            <div class="field">
              <label>期望频率 · 选填</label>
              <el-input v-model="form.frequency" placeholder="例如：每周一次，具体课时可沟通" />
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label>最低意向预算 · 必填</label>
              <el-input-number v-model="form.budgetMin" :min="50" :max="2000" :step="10" />
              <span class="unit">元 / 小时</span>
            </div>
            <div class="field">
              <label>最高意向预算 · 必填</label>
              <el-input-number v-model="form.budgetMax" :min="50" :max="2000" :step="10" />
              <span class="unit">元 / 小时</span>
            </div>
          </div>
          <div class="inline-tip">
            <img src="/images/teachers/info.svg" width="18" height="18" alt="" />
            <p>意向预算不代表平台报价。平台不收取课时费，也不提供支付结算；请勿提前支付大额费用。</p>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2>监护人联系方式</h2>
            <p>仅由成年监护人填写，不填写孩子的联系方式。</p>
          </header>
          <div class="grid-2">
            <div class="field">
              <label>监护人称呼 · 选填</label>
              <el-input v-model="form.guardianLabel" maxlength="20" placeholder="请输入称呼，无需真实姓名" />
            </div>
            <div class="field">
              <label>监护人手机号 · 必填</label>
              <el-input v-model="form.phone" maxlength="11" placeholder="请输入监护人手机号" />
            </div>
          </div>
          <div class="inline-tip">
            <img src="/images/teachers/info.svg" width="18" height="18" alt="" />
            <div>
              <strong>联系方式不在需求列表中公开</strong>
              <p>联系方式仅用于必要沟通，不随需求公开展示。</p>
            </div>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2>发布须知与同意条款</h2>
          </header>
          <p class="notice">
            请如实描述学习需要，不包含敏感信息、虚假招募或教学效果保证。平台仅做信息展示和联系撮合，不提供授课服务、不收取课时费、不提供支付结算，不承诺教学结果。身份及相关材料需双方自行核验，未成年人由监护人参与沟通。
          </p>
          <label class="agree">
            <input v-model="agreed" type="checkbox" />
            <span>
              我确认由监护人填写，已阅读并同意《需求发布须知》《用户协议》及《隐私政策》，并知悉信息撮合与隐私保护边界。
            </span>
          </label>
          <p class="agree-hint">
            {{ agreed ? '已勾选同意条款，可发布需求。' : '当前条款尚未勾选；请勾选后再发布需求。' }}
          </p>
        </section>

        <section class="actions">
          <div>
            <strong>{{ agreed ? '可以发布' : '尚未勾选条款' }}</strong>
            <p>草稿保存在本机；发布后老师可在「找学生」中看到。</p>
          </div>
          <div class="btns">
            <button type="button" class="btn-ghost" @click="saveDraft">保存草稿</button>
            <button type="button" class="btn-primary" :disabled="loading" @click="submit">
              {{ loading ? '发布中…' : '发布需求' }}
              <img src="/images/home/figma/arrow-right-teal.svg" width="17" height="17" alt="" />
            </button>
          </div>
        </section>
      </div>

      <aside class="side-col">
        <div class="tips-card">
          <div class="tips-title">
            <img src="/images/teachers/messages-square.svg" width="22" height="22" alt="" />
            <h3>一份清楚的需求</h3>
          </div>
          <div class="tip-item">
            <span>一</span>
            <div>
              <strong>说清学习方向</strong>
              <p>选择当前学段、年级与科目，描述需要讨论的具体问题。</p>
            </div>
          </div>
          <div class="tip-item">
            <span>二</span>
            <div>
              <strong>留出沟通空间</strong>
              <p>时间和预算都是意向，可在双方了解后再确认。</p>
            </div>
          </div>
          <div class="tip-item">
            <span>三</span>
            <div>
              <strong>保护孩子隐私</strong>
              <p>只展示城市与区域，不填写姓名、学校或详细住址。</p>
            </div>
          </div>
          <p class="tips-foot">填写 → 预览检查 → 发布需求</p>
        </div>

        <div class="preview-card">
          <div class="preview-head">
            <h3>本次填写预览</h3>
            <span class="status-pill sm">未发布</span>
          </div>
          <p class="preview-title">{{ previewTitle }}</p>
          <p>{{ shortPlace }}</p>
          <p>{{ modeLabel }} · {{ form.scheduleSlot }}</p>
          <p>{{ previewBudget }}</p>
          <p class="preview-note">预览随表单实时更新；发布后才会对外展示。</p>
        </div>

        <div class="warm-tip">
          <img src="/images/teachers/shield-alert.svg" width="18" height="18" alt="" />
          <div>
            <strong>预览前再检查一次</strong>
            <p>确认学习信息完整、联系方式没有写进公开描述，并由监护人阅读相关条款。</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.publish-page {
  --teal: #13857d;
  --ink: #173b3d;
  --muted: #687e7e;
  --mint: #eaf6f1;
  --line: #dce8e3;
  --warm: #fff0df;
  --bg: #fbfcfa;
  --soft: #f3f7f4;
  background: var(--bg);
  color: var(--ink);
  min-height: 100%;
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
  gap: 8px;
  align-items: center;
  margin-bottom: 22px;
  font-size: 12px;
  color: var(--muted);

  a {
    color: var(--muted);
    text-decoration: none;
    &:hover {
      color: var(--teal);
    }
  }

  .sep {
    opacity: 0.7;
  }

  .current {
    color: var(--ink);
  }
}

.page-head {
  display: flex;
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

.status-pill {
  flex-shrink: 0;
  padding: 5px 11px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--teal);
  font-size: 12px;
  font-weight: 500;

  &.sm {
    background: var(--mint);
  }
}

.content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
  padding: 30px 0 48px;
}

.main-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.side-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 88px;
}

.tip-banner,
.inline-tip {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 10px;
  background: var(--soft);

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

  img {
    flex-shrink: 0;
    margin-top: 1px;
  }
}

.card,
.actions,
.preview-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 28px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.card-head {
  h2 {
    margin: 0 0 7px;
    font-size: 21px;
    font-weight: 700;
    color: var(--ink);
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.8;
    color: var(--muted);
  }
}

.field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  label {
    width: 100%;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select__wrapper),
  :deep(.el-cascader) {
    border-radius: 10px;
    min-height: 46px;
    background: var(--bg);
    box-shadow: 0 0 0 1px var(--line) inset;
  }

  :deep(.el-textarea__inner) {
    min-height: 104px;
    padding: 12px 14px;
  }

  :deep(.el-input-number) {
    width: 160px;
  }
}

.hint {
  width: 100%;
  margin: 0;
  font-size: 11px;
  line-height: 1.7;
  color: var(--muted);
}

.unit {
  font-size: 13px;
  color: var(--muted);
}

.grid-2,
.grid-3 {
  display: grid;
  gap: 16px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;

  &.on {
    background: var(--mint);
    border-color: var(--teal);
    color: var(--teal);
  }
}

.notice {
  margin: 0;
  font-size: 13px;
  line-height: 1.95;
  color: var(--muted);
}

.agree {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.85;
  color: var(--muted);
  cursor: pointer;

  input {
    margin-top: 3px;
    width: 17px;
    height: 17px;
    accent-color: var(--teal);
  }
}

.agree-hint {
  margin: 0;
  font-size: 11px;
  color: var(--teal);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;

  strong {
    display: block;
    margin-bottom: 5px;
    font-size: 13px;
    color: var(--ink);
  }

  p {
    margin: 0;
    font-size: 11px;
    color: var(--muted);
  }
}

.btns {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.btn-ghost,
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 46px;
  padding: 0 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-ghost {
  border: 1px solid var(--line);
  background: #fff;
  color: var(--teal);
}

.btn-primary {
  border: 1px solid var(--teal);
  background: var(--teal);
  color: #fff;

  img {
    filter: brightness(0) invert(1);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
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

  h3 {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    color: var(--ink);
  }
}

.tip-item {
  display: flex;
  gap: 11px;
  align-items: flex-start;

  span {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: #fff;
    color: var(--teal);
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

.tips-foot {
  margin: 0;
  font-size: 12px;
  line-height: 1.8;
  color: var(--teal);
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;

  p {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--ink);
  }
}

.preview-title {
  font-size: 16px !important;
  font-weight: 700;
  line-height: 1.7;
  color: var(--ink) !important;
}

.preview-note {
  font-size: 11px !important;
  line-height: 1.85;
}

.warm-tip {
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
    color: var(--ink);
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.85;
    color: var(--muted);
  }

  img {
    flex-shrink: 0;
  }
}

@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }

  .side-col {
    position: static;
  }

  .page-head {
    flex-direction: column;
  }

  .grid-3 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .wrap {
    width: calc(100% - 32px);
  }

  .page-head h1 {
    font-size: 24px;
  }

  .grid-2,
  .actions {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .btns {
    width: 100%;
    flex-direction: column;
  }

  .btn-ghost,
  .btn-primary {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { apiSubmitTeacherJoin } from '@/api'
import { GRADES_BY_STAGE, STAGES, SUBJECTS, TEACH_MODE_MAP } from '@/constants'
import RegionCascader from '@/components/common/RegionCascader.vue'
import { useUserStore } from '@/store'
import type { RegionPath, Stage, Subject, TeachMode } from '@/types'
import { formatRegions, splitRegionPath } from '@/utils/region'

const DRAFT_KEY = 'tonghao_teacher_join_draft'
const TIME_CHIPS = ['周二晚上', '周四晚上', '周六上午', '周日上午', '工作日晚上', '其他时段']

const userStore = useUserStore()
const loading = ref(false)
const agreed = ref(false)

const form = reactive({
  name: userStore.userInfo?.name || '',
  phone: userStore.userInfo?.phone || '',
  introduction: '',
  stages: ['小学'] as Stage[],
  grades: ['三年级', '四年级', '五年级', '六年级'] as string[],
  subjects: ['数学'] as Subject[],
  focus: '',
  expPeriod: '',
  expScope: '',
  experience: '',
  districts: [] as RegionPath[],
  modeOnline: true,
  modeOffline: true,
  availableTimes: ['周二晚上', '周四晚上', '周六上午'] as string[],
  timeExtra: '',
  price: 150,
})

const gradeOptions = computed(() => {
  const set = new Set<string>()
  form.stages.forEach((stage) => {
    ;(GRADES_BY_STAGE[stage] || []).forEach((g) => set.add(g))
  })
  return [...set]
})

watch(
  () => [...form.stages],
  () => {
    const allowed = new Set(gradeOptions.value)
    form.grades = form.grades.filter((g) => allowed.has(g))
  },
)

const teachMode = computed<TeachMode>(() => {
  if (form.modeOnline && form.modeOffline) return 'both'
  if (form.modeOnline) return 'online'
  return 'offline'
})

const modeLabel = computed(() => TEACH_MODE_MAP[teachMode.value])

const placeLabel = computed(() => {
  if (!form.districts.length) return '待选择授课区域'
  const labels = form.districts.map((path) => {
    const parts = splitRegionPath(path)
    const city = (parts[1] || parts[0] || '').replace(/(省|市|自治区|特别行政区)$/, '')
    const district = parts[2] || ''
    return district ? `${city} · ${district}` : city
  })
  return [...new Set(labels)].slice(0, 2).join(' / ') || formatRegions(form.districts)
})

function toggleStage(stage: Stage) {
  const i = form.stages.indexOf(stage)
  if (i >= 0) {
    if (form.stages.length === 1) return
    form.stages.splice(i, 1)
  } else {
    form.stages.push(stage)
  }
}

function toggleGrade(grade: string) {
  const i = form.grades.indexOf(grade)
  if (i >= 0) form.grades.splice(i, 1)
  else form.grades.push(grade)
}

function toggleTime(slot: string) {
  const i = form.availableTimes.indexOf(slot)
  if (i >= 0) form.availableTimes.splice(i, 1)
  else form.availableTimes.push(slot)
}

function buildExperience() {
  const chunks: string[] = []
  if (form.focus.trim()) chunks.push(`教学侧重：${form.focus.trim()}`)
  if (form.grades.length) chunks.push(`授课年级：${form.grades.join('、')}`)
  if (form.expPeriod.trim() || form.expScope.trim() || form.experience.trim()) {
    const head = [form.expPeriod.trim(), form.expScope.trim()].filter(Boolean).join(' · ')
    const body = form.experience.trim()
    chunks.push(head && body ? `教学经历：${head}；${body}` : `教学经历：${head || body}`)
  }
  return chunks.join('\n')
}

function buildAvailableTimes() {
  const list = [...form.availableTimes]
  if (form.timeExtra.trim()) list.push(form.timeExtra.trim())
  return list.filter(Boolean)
}

function validate(): string | null {
  if (!form.name.trim()) return '请填写公开称呼'
  if (!form.introduction.trim()) return '请填写个人简介'
  if (!form.stages.length) return '请选择学习阶段'
  if (!form.subjects.length) return '请选择授课科目'
  if (!form.districts.length) return '请选择授课区域'
  if (!form.modeOnline && !form.modeOffline) return '请选择授课方式'
  if (!form.availableTimes.length && !form.timeExtra.trim()) return '请选择可约时间'
  if (!form.price) return '请填写课时报价'
  if (!form.phone.trim()) return '请填写联系手机号'
  if (!/^1\d{10}$/.test(form.phone.trim())) return '手机号格式不正确'
  if (!agreed.value) return '请先勾选资料真实性声明'
  return null
}

function saveDraft() {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      ...form,
      agreed: agreed.value,
    }),
  )
  ElMessage.success('草稿已保存到本机')
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as Partial<typeof form> & { agreed?: boolean }
    Object.assign(form, {
      name: data.name ?? form.name,
      phone: data.phone ?? form.phone,
      introduction: data.introduction ?? '',
      stages: data.stages?.length ? data.stages : form.stages,
      grades: data.grades ?? form.grades,
      subjects: data.subjects?.length ? data.subjects : form.subjects,
      focus: data.focus ?? '',
      expPeriod: data.expPeriod ?? '',
      expScope: data.expScope ?? '',
      experience: data.experience ?? '',
      districts: data.districts ?? [],
      modeOnline: data.modeOnline ?? true,
      modeOffline: data.modeOffline ?? true,
      availableTimes: data.availableTimes ?? form.availableTimes,
      timeExtra: data.timeExtra ?? '',
      price: data.price ?? form.price,
    })
    if (typeof data.agreed === 'boolean') agreed.value = data.agreed
  } catch {
    /* ignore */
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
    const experience = buildExperience() || form.experience.trim() || '暂无补充经历'
    await apiSubmitTeacherJoin({
      name: form.name.trim(),
      phone: form.phone.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.phone.trim()}`,
      stages: form.stages,
      subjects: form.subjects,
      districts: form.districts,
      price: form.price,
      teachMode: teachMode.value,
      experience,
      introduction: form.introduction.trim(),
      certificates: [],
      availableTimes: buildAvailableTimes(),
      userId: userStore.userInfo?.id,
    })
    localStorage.removeItem(DRAFT_KEY)
    ElMessage.success('入驻资料已提交，状态为待审核，通过后才会对外展示')
    form.introduction = ''
    form.focus = ''
    form.experience = ''
    form.expPeriod = ''
    form.expScope = ''
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || '提交失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!form.name) form.name = userStore.userInfo?.name || ''
  if (!form.phone) form.phone = userStore.userInfo?.phone || ''
  loadDraft()
})
</script>

<template>
  <div class="join-page">
    <div class="page-guide">
      <div class="wrap">
        <nav class="crumb" aria-label="面包屑">
          <router-link to="/">首页</router-link>
          <span class="sep">›</span>
          <span>教师入驻</span>
          <span class="sep">›</span>
          <span class="current">完善资料</span>
        </nav>
        <div class="page-head">
          <div>
            <h1>认真介绍自己，让合拍从了解开始</h1>
            <p>填写公开资料与教学安排，可先保存草稿再提交；提交后默认为待审核。</p>
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
            <strong>资料展示不等于平台认证</strong>
            <p>请仅填写可核实的信息，不作学历、认证或效果保证。提交后需审核通过才会出现在找老师列表。</p>
          </div>
        </div>

        <section class="card">
          <header class="card-head">
            <h2>公开称呼与个人简介</h2>
            <p>仅展示适合公开的信息，不填写真实全名、证件号或联系方式。</p>
          </header>
          <div class="field">
            <label>公开称呼 · 必填</label>
            <el-input v-model="form.name" maxlength="20" placeholder="例如：周老师" />
            <p class="hint">建议使用姓氏加“老师”，避免公开完整身份信息。</p>
          </div>
          <div class="field">
            <label>个人简介 · 必填</label>
            <el-input
              v-model="form.introduction"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              placeholder="说明自己的教学侧重与沟通方式，不作提分或结果承诺。"
            />
          </div>
          <div class="field">
            <label>联系手机号 · 必填（不公开展示）</label>
            <el-input v-model="form.phone" maxlength="11" placeholder="仅用于平台联系与审核" />
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2>教学方向</h2>
            <p>按实际情况选择教学范围，让家长清楚了解你的方向。</p>
          </header>
          <div class="field">
            <label>学习阶段 · 必填</label>
            <div class="chips">
              <button
                v-for="s in STAGES"
                :key="s"
                type="button"
                :class="['chip', { on: form.stages.includes(s) }]"
                @click="toggleStage(s)"
              >
                <img
                  v-if="form.stages.includes(s)"
                  src="/images/home/figma/check-teal.svg"
                  width="14"
                  height="14"
                  alt=""
                />
                {{ s }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>授课年级 · 可多选</label>
            <div class="chips">
              <button
                v-for="g in gradeOptions"
                :key="g"
                type="button"
                :class="['chip', { on: form.grades.includes(g) }]"
                @click="toggleGrade(g)"
              >
                <img
                  v-if="form.grades.includes(g)"
                  src="/images/home/figma/check-teal.svg"
                  width="14"
                  height="14"
                  alt=""
                />
                {{ g }}
              </button>
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label>授课科目 · 必填</label>
              <el-select v-model="form.subjects" multiple style="width: 100%" placeholder="请选择科目">
                <el-option v-for="s in SUBJECTS" :key="s" :label="s" :value="s" />
              </el-select>
            </div>
            <div class="field">
              <label>教学侧重 · 选填</label>
              <el-input v-model="form.focus" placeholder="例如：计算基础、应用题思路" />
            </div>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2>教学经历</h2>
            <p>如有相关经历，请如实填写；暂不填写时，不会生成任何经历描述。</p>
          </header>
          <div class="grid-2">
            <div class="field">
              <label>经历时间 · 选填</label>
              <el-input v-model="form.expPeriod" placeholder="例如：2022.09–2024.06" />
            </div>
            <div class="field">
              <label>相关学段与科目 · 选填</label>
              <el-input v-model="form.expScope" placeholder="例如：小学数学" />
            </div>
          </div>
          <div class="field">
            <label>经历说明 · 选填</label>
            <el-input
              v-model="form.experience"
              type="textarea"
              :rows="4"
              maxlength="300"
              show-word-limit
              placeholder="请描述实际承担的教学内容与沟通方式。不要填写学生姓名、学校或具体成绩。"
            />
            <p class="hint">无相关经历可留空；侧重与年级会一并写入经历说明提交。</p>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2>授课区域、方式与时间</h2>
            <p>只展示城市和区域，具体地址及授课安排由双方另行确认。</p>
          </header>
          <div class="field">
            <label>授课区域 · 必填（可多选）</label>
            <RegionCascader
              v-model="form.districts"
              multiple
              placeholder="可多选省市区，如：上海市/上海市/徐汇区"
            />
          </div>
          <div class="field">
            <label>授课方式 · 可多选</label>
            <div class="chips">
              <button
                type="button"
                :class="['chip', { on: form.modeOnline }]"
                @click="form.modeOnline = !form.modeOnline"
              >
                <img
                  v-if="form.modeOnline"
                  src="/images/home/figma/check-teal.svg"
                  width="14"
                  height="14"
                  alt=""
                />
                线上
              </button>
              <button
                type="button"
                :class="['chip', { on: form.modeOffline }]"
                @click="form.modeOffline = !form.modeOffline"
              >
                <img
                  v-if="form.modeOffline"
                  src="/images/home/figma/check-teal.svg"
                  width="14"
                  height="14"
                  alt=""
                />
                线下
              </button>
            </div>
          </div>
          <div class="field">
            <label>可约时间 · 可多选</label>
            <div class="chips">
              <button
                v-for="t in TIME_CHIPS"
                :key="t"
                type="button"
                :class="['chip', { on: form.availableTimes.includes(t) }]"
                @click="toggleTime(t)"
              >
                <img
                  v-if="form.availableTimes.includes(t)"
                  src="/images/home/figma/check-teal.svg"
                  width="14"
                  height="14"
                  alt=""
                />
                {{ t }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>时间补充 · 选填</label>
            <el-input v-model="form.timeExtra" placeholder="可在上述时段进一步沟通，具体起止时间另行确认。" />
          </div>
          <div class="field">
            <label>课时报价 · 必填</label>
            <el-input-number v-model="form.price" :min="50" :max="2000" :step="10" />
            <span class="unit">元 / 课时（意向，双方可再协商）</span>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2>资料、隐私与真实性声明</h2>
          </header>
          <div class="inline-tip">
            <img src="/images/teachers/info.svg" width="18" height="18" alt="" />
            <div>
              <strong>保护自己，也保护学员</strong>
              <p>
                不公开证件号、手机号、社交账号、详细住址或学员个人信息；如需交流身份材料，请双方自行核验并妥善保护。
              </p>
            </div>
          </div>
          <p class="notice">
            平台仅提供信息展示与联系撮合，不提供授课服务、不收取课时费、不提供支付结算，也不承诺教学结果。资料展示不等于平台认证，未成年人应由监护人参与沟通。
          </p>
          <label class="agree">
            <input v-model="agreed" type="checkbox" />
            <span>
              我声明所填资料真实、准确，不含虚构学历、认证、经历或效果承诺；已阅读并同意《教师资料展示须知》《用户协议》及《隐私政策》。
            </span>
          </label>
          <p class="agree-hint">
            {{ agreed ? '已勾选声明，可提交资料。' : '声明尚未勾选；勾选后再提交，不代表已审核通过。' }}
          </p>
        </section>

        <section class="actions">
          <div>
            <strong>{{ agreed ? '可以提交' : '尚未勾选声明' }}</strong>
            <p>草稿保存在本机；提交后进入待审核。</p>
          </div>
          <div class="btns">
            <button type="button" class="btn-ghost" @click="saveDraft">保存草稿</button>
            <button type="button" class="btn-primary" :disabled="loading" @click="submit">
              {{ loading ? '提交中…' : '提交资料' }}
              <img src="/images/home/figma/arrow-right-teal.svg" width="17" height="17" alt="" />
            </button>
          </div>
        </section>
      </div>

      <aside class="side-col">
        <div class="tips-card">
          <div class="tips-title">
            <img src="/images/teachers/messages-square.svg" width="22" height="22" alt="" />
            <h3>一份真实的介绍</h3>
          </div>
          <div class="tip-item">
            <span>一</span>
            <div>
              <strong>让教学方向清晰</strong>
              <p>用具体的学段、科目与教学侧重代替笼统的能力描述。</p>
            </div>
          </div>
          <div class="tip-item">
            <span>二</span>
            <div>
              <strong>写事实，不写保证</strong>
              <p>有经历就如实填写，没有经历可留空；不承诺分数或结果。</p>
            </div>
          </div>
          <div class="tip-item">
            <span>三</span>
            <div>
              <strong>预览后再决定</strong>
              <p>检查哪些内容适合公开，保护自己与学员的个人信息。</p>
            </div>
          </div>
          <p class="tips-foot">填写 → 保存草稿 / 提交资料</p>
        </div>

        <div class="preview-card">
          <div class="preview-head">
            <h3>哪些信息会展示</h3>
            <span class="status-pill sm">说明</span>
          </div>
          <div class="scope">
            <strong>公开展示范围</strong>
            <p>公开称呼、简介、教学方向、已填写的经历、城市区域、方式与时间。</p>
          </div>
          <div class="scope">
            <strong>不要填写的内容</strong>
            <p>证件号、联系方式、详细地址、未成年人身份信息与隐私材料。</p>
          </div>
          <div class="live">
            <strong>{{ form.name || '公开称呼' }}</strong>
            <p>{{ form.subjects.join('、') || '科目' }} · {{ form.stages.join('、') }}</p>
            <p>{{ placeLabel }}　｜　{{ modeLabel }}</p>
            <p>{{ form.price }} 元 / 课时</p>
          </div>
        </div>

        <div class="warm-tip">
          <img src="/images/teachers/shield-alert.svg" width="18" height="18" alt="" />
          <div>
            <strong>不是认证申请结果</strong>
            <p>填写资料与提交均不代表平台完成身份核验或资质认证。本页不展示任何已审核通过状态。</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.join-page {
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

.main-col,
.side-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.side-col {
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
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.85;
    color: var(--muted);
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

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
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
  }
}

.tip-item {
  display: flex;
  gap: 11px;

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
  color: var(--teal);
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }
}

.scope,
.live {
  strong {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.85;
    color: var(--muted);
  }
}

.live {
  padding-top: 8px;
  border-top: 1px solid var(--line);

  strong {
    font-size: 16px;
  }

  p {
    font-size: 13px;
  }
}

.warm-tip {
  display: flex;
  gap: 10px;
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
    font-size: 12px;
    line-height: 1.85;
    color: var(--muted);
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

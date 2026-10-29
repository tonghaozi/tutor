<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  apiGetDemands,
  apiGetHotTeachers,
  apiGetTeachers,
} from "@/api";
import {
  GRADES_BY_STAGE,
  STAGES,
  SUBJECTS_BY_STAGE,
  TEACH_MODE_MAP,
  TEACH_MODE_OPTIONS,
} from "@/constants";
import StudentDemandDialog from "@/components/demand/StudentDemandDialog.vue";
import TeacherJoinDialog from "@/components/teacher/TeacherJoinDialog.vue";
import { useAppStore, useUserStore } from "@/store";
import type { Demand, Stage, Subject, TeachMode, Teacher } from "@/types";
import { resolveAvatar } from "@/utils";
import { formatRegion, formatRegions, splitRegionPath } from "@/utils/region";

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

const stageTabs = [
  { id: "小学" as Stage, hint: "打好基础", icon: "book-open-tab.svg" },
  { id: "初中" as Stage, hint: "理解与应用", icon: "flask.svg" },
  { id: "高中" as Stage, hint: "思维与方法", icon: "atom-tab.svg" },
  { id: "音乐" as Stage, hint: "兴趣与表达", icon: "music-tab.svg" },
];

const stageCards = [
  {
    id: "小学" as Stage,
    range: "一年级 — 六年级",
    subjects: "语文　数学　英语",
    desc: ["从阅读、计算到表达，", "找到适合孩子的学习节奏。"],
    icon: "book-open-card.svg",
    tone: "mint",
  },
  {
    id: "初中" as Stage,
    range: "初一 — 初三",
    subjects: "语文　数学　英语\n物理　化学",
    desc: ["梳理知识联系，理解解题思路。"],
    icon: "flask-card.svg",
    tone: "sky",
  },
  {
    id: "高中" as Stage,
    range: "高一 — 高三",
    subjects: "数学　物理　化学\n语文　英语　生物等",
    desc: ["围绕薄弱环节，交流学习方法。"],
    icon: "atom-card.svg",
    tone: "mint",
  },
  {
    id: "音乐" as Stage,
    range: "启蒙 · 兴趣 · 进阶",
    subjects: "钢琴　吉他　声乐\n小提琴　乐理等",
    desc: ["从第一段旋律，到自在表达。"],
    icon: "music-card.svg",
    tone: "warm",
  },
];

const steps = [
  {
    no: "01",
    title: "说清学习需求",
    desc: "选择城市、学段与科目，补充学习目标、可约时间和意向预算。",
    icon: "clipboard.svg",
  },
  {
    no: "02",
    title: "双向发现彼此",
    desc: "家长浏览老师资料，老师查看学员需求，按各自条件自由选择。",
    icon: "scan-search.svg",
  },
  {
    no: "03",
    title: "先沟通，再约课",
    desc: "核验身份与相关材料，交流教学思路，商议是否安排试听。",
    icon: "messages.svg",
  },
  {
    no: "04",
    title: "双方自主确定",
    desc: "自行约定授课、课时和费用；平台不收取课时费，不提供支付结算。",
    icon: "handshake.svg",
  },
];

const cities = [
  { label: "北京", path: "北京市/北京市" },
  { label: "上海", path: "上海市/上海市" },
  { label: "广州", path: "广东省/广州市" },
  { label: "深圳", path: "广东省/深圳市" },
  { label: "杭州", path: "浙江省/杭州市" },
  { label: "南京", path: "江苏省/南京市" },
  { label: "成都", path: "四川省/成都市" },
  { label: "武汉", path: "湖北省/武汉市" },
  { label: "西安", path: "陕西省/西安市" },
  { label: "重庆", path: "重庆市/重庆市" },
  { label: "苏州", path: "江苏省/苏州市" },
];

const safeguards = [
  {
    icon: "contact.svg",
    title: "身份与资料，亲自核验",
    lines: ["联系后核对身份、教学经历及相关材料，", "资料展示不等于平台认证。"],
  },
  {
    icon: "wallet-trust.svg",
    title: "先约沟通，不盲目预付",
    lines: ["提前说清试听、费用与取消约定，", "不要预付大额课时费。"],
  },
  {
    icon: "users-trust.svg",
    title: "未成年人，监护人参与",
    lines: ["首次见面选择安全环境，", "由监护人陪同沟通与试听。"],
  },
  {
    icon: "shield-alert.svg",
    title: "异常收费，保持警惕",
    lines: ["警惕保证金、培训费等异常要求，", "保存记录，必要时举报或报警。"],
  },
];

const stage = ref<Stage>("小学");
const grade = ref("四年级");
const subject = ref<Subject>("数学");
const teachMode = ref<TeachMode | "">("");
const cityLabel = ref(appStore.cityLabel || "全国");
const cityPath = ref(appStore.cityPath || "");
const openMenu = ref<"city" | "grade" | "subject" | "mode" | "">("");
const tutorFilter = ref<Stage | "全部">("全部");
const hotTeachers = ref<Teacher[]>([]);
const allTeachers = ref<Teacher[]>([]);
const demands = ref<Demand[]>([]);
const loading = ref(false);
const studentDemandVisible = ref(false);
const teacherJoinVisible = ref(false);
const activeCity = ref("北京");

const subjectOptions = computed(() => SUBJECTS_BY_STAGE[stage.value] || []);
const gradeOptions = computed(() => GRADES_BY_STAGE[stage.value] || []);
const modeLabel = computed(() => {
  if (!teachMode.value) return "线上 / 线下不限";
  return TEACH_MODE_MAP[teachMode.value];
});

const searchHint = computed(() => {
  const subs = subjectOptions.value.join("、");
  return `当前：${stage.value} · ${grade.value} · ${subject.value}　 /　${stage.value}可选${subs}；切换学段后，年级与科目同步更新。`;
});

const displayedTeachers = computed(() => {
  const source = allTeachers.value.length ? allTeachers.value : hotTeachers.value;
  const filtered =
    tutorFilter.value === "全部"
      ? source
      : source.filter((t) => (t.stages || []).includes(tutorFilter.value as Stage) || !(t.stages || []).length);
  return filtered.slice(0, 4);
});

watch(stage, (next) => {
  const grades = GRADES_BY_STAGE[next];
  const subjects = SUBJECTS_BY_STAGE[next];
  grade.value = grades[Math.min(3, grades.length - 1)] || grades[0];
  subject.value = subjects[0];
});

function shortArea(paths: string[] = []) {
  const text = formatRegions(paths);
  if (!text) return "全国可约";
  return text
    .split(" / ")
    .map((part) => splitRegionPath(part).slice(-1)[0] || part)
    .slice(0, 2)
    .join(" · ");
}

function demandCity(path = "") {
  const parts = splitRegionPath(path);
  if (parts.length >= 2) return `${parts[1].replace(/市$/, "")} · ${parts[parts.length - 1]}`;
  return formatRegion(path) || "全国";
}

function teacherStage(teacher: Teacher): Stage {
  if (teacher.stages?.length) return teacher.stages[0];
  const music = SUBJECTS_BY_STAGE.音乐;
  if (teacher.subjects.some((s) => music.includes(s))) return "音乐";
  if (teacher.subjects.some((s) => ["物理", "化学", "生物"].includes(s))) return "高中";
  return "小学";
}

function demandStage(item: Demand): Stage {
  if (item.stage) return item.stage;
  if (SUBJECTS_BY_STAGE.音乐.includes(item.subject)) return "音乐";
  if (["物理", "化学", "生物"].includes(item.subject)) return "高中";
  return "小学";
}

function teacherFocus(teacher: Teacher) {
  const sub = teacher.subjects.slice(0, 2).join(" / ") || "综合辅导";
  const stageLabel = (teacher.stages || []).join("、") || teacher.experience.slice(0, 10);
  return `${sub} · ${stageLabel}`;
}

function modeText(mode: TeachMode) {
  return TEACH_MODE_MAP[mode] || "线上 / 线下";
}

function toggleMenu(key: typeof openMenu.value) {
  openMenu.value = openMenu.value === key ? "" : key;
}

function chooseCity(label: string, path: string) {
  cityLabel.value = label;
  cityPath.value = path;
  openMenu.value = "";
}

function chooseGrade(value: string) {
  grade.value = value;
  openMenu.value = "";
}

function chooseSubject(value: Subject) {
  subject.value = value;
  openMenu.value = "";
}

function chooseMode(value: TeachMode | "") {
  teachMode.value = value;
  openMenu.value = "";
}

function searchGo() {
  router.push({
    path: "/teachers",
    query: {
      subject: subject.value || undefined,
      stage: stage.value || undefined,
      district: cityPath.value || undefined,
      teachMode: teachMode.value || undefined,
    },
  });
}

function goTeachers(extra?: { stage?: Stage; subject?: string; district?: string; teachMode?: string }) {
  router.push({
    path: "/teachers",
    query: {
      stage: extra?.stage,
      subject: extra?.subject,
      district: extra?.district,
      teachMode: extra?.teachMode,
    },
  });
}

function goTeacher(id: string) {
  router.push(`/teachers/${id}`);
}

function goDemand(id: string) {
  router.push(`/students/${id}`);
}

function goCity(label: string, path: string) {
  activeCity.value = label;
  goTeachers({ district: path });
}

function openPublish() {
  if (!userStore.isLogin) {
    ElMessage.warning("请先登录后再发布需求");
    router.push({ path: "/auth/login", query: { redirect: "/" } });
    return;
  }
  if (userStore.userInfo?.role === "teacher") {
    teacherJoinVisible.value = true;
    return;
  }
  studentDemandVisible.value = true;
}

function openTeacherJoin() {
  if (!userStore.isLogin) {
    ElMessage.warning("请先登录后再完善资料");
    router.push({ path: "/auth/login", query: { redirect: "/teacher/join" } });
    return;
  }
  teacherJoinVisible.value = true;
}

async function load() {
  loading.value = true;
  try {
    const [hot, list, demandsList] = await Promise.all([
      apiGetHotTeachers(),
      apiGetTeachers().catch(() => [] as Teacher[]),
      apiGetDemands(),
    ]);
    hotTeachers.value = hot;
    const merged = [...hot];
    for (const item of list) {
      if (!merged.some((t) => t.id === item.id)) merged.push(item);
    }
    allTeachers.value = merged;
    demands.value = demandsList.slice(0, 4);
  } catch {
    hotTeachers.value = [];
    allTeachers.value = [];
    demands.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="home" @click="openMenu = ''">
    <section class="hero">
      <div class="wrap hero-top">
        <div class="hero-copy">
          <div class="eyebrow">
            <i class="line" />
            <span>从学科探索，到音乐热爱</span>
          </div>
          <h1>每个学习阶段，<br />都有合拍的老师。</h1>
          <p class="lead">
            小学语数英、初高中数理化，也有钢琴与吉他。<br />
            在同号，按孩子的阶段与兴趣，寻找适合的陪伴。
          </p>
          <div class="checks">
            <span><img src="/images/home/figma/check-teal.svg" width="15" height="15" alt="" />全国信息撮合</span>
            <span><img src="/images/home/figma/check-teal.svg" width="15" height="15" alt="" />线上 / 线下可选</span>
            <span><img src="/images/home/figma/check-teal.svg" width="15" height="15" alt="" />不收取课时费</span>
          </div>
        </div>
        <div class="hero-photo">
          <img src="/images/home/figma/hero-family.png" alt="家庭学习场景" />
          <div class="photo-chip">
            <img src="/images/home/figma/sprout.svg" width="22" height="22" alt="" />
            <b>让好奇心，慢慢长大</b>
          </div>
        </div>
      </div>

      <div class="wrap">
        <div class="search-card" @click.stop>
          <div class="stage-tabs">
            <button
              v-for="item in stageTabs"
              :key="item.id"
              type="button"
              :class="['stage-tab', { on: stage === item.id }]"
              @click="stage = item.id"
            >
              <img :src="`/images/home/figma/${item.icon}`" width="19" height="19" alt="" />
              <strong>{{ item.id }}</strong>
              <em>{{ item.hint }}</em>
            </button>
          </div>

          <div class="filters">
            <button type="button" class="filter" @click="toggleMenu('city')">
              <small>所在城市</small>
              <span>
                <b>{{ cityLabel === "全国" ? "全国城市" : cityLabel }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="15" height="15" alt="" />
              </span>
              <ul v-if="openMenu === 'city'" class="menu">
                <li @click="chooseCity('全国', '')">全国城市</li>
                <li v-for="item in cities" :key="item.label" @click="chooseCity(item.label, item.path)">
                  {{ item.label }}
                </li>
              </ul>
            </button>
            <i class="split" />
            <button type="button" class="filter" @click="toggleMenu('grade')">
              <small>年级 · {{ stage }}</small>
              <span>
                <b>{{ grade }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="15" height="15" alt="" />
              </span>
              <ul v-if="openMenu === 'grade'" class="menu">
                <li v-for="item in gradeOptions" :key="item" @click="chooseGrade(item)">{{ item }}</li>
              </ul>
            </button>
            <i class="split" />
            <button type="button" class="filter" @click="toggleMenu('subject')">
              <small>科目 · 随学段切换</small>
              <span>
                <b>{{ subject }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="15" height="15" alt="" />
              </span>
              <ul v-if="openMenu === 'subject'" class="menu">
                <li v-for="item in subjectOptions" :key="item" @click="chooseSubject(item)">{{ item }}</li>
              </ul>
            </button>
            <i class="split" />
            <button type="button" class="filter wide" @click="toggleMenu('mode')">
              <small>授课方式</small>
              <span>
                <b>{{ modeLabel }}</b>
                <img src="/images/home/figma/chevron-down-muted.svg" width="15" height="15" alt="" />
              </span>
              <ul v-if="openMenu === 'mode'" class="menu">
                <li @click="chooseMode('')">线上 / 线下不限</li>
                <li v-for="item in TEACH_MODE_OPTIONS" :key="item.value" @click="chooseMode(item.value)">
                  {{ TEACH_MODE_MAP[item.value] }}
                </li>
              </ul>
            </button>
            <button type="button" class="search-btn" @click="searchGo">
              查找合适的老师
              <img src="/images/home/figma/search-white.svg" width="17" height="17" alt="" />
            </button>
          </div>
          <p class="hint">{{ searchHint }}</p>
        </div>
      </div>
    </section>

    <section id="stages" class="section">
      <div class="wrap">
        <header class="head">
          <p class="kicker">EXPLORE / 学段与兴趣</p>
          <h2>先选学习阶段，再找到方向</h2>
          <p class="sub">学科辅导与音乐学习，各有清晰入口。按当前年级和学习目标，进一步了解老师。</p>
        </header>
        <div class="stage-grid">
          <article
            v-for="card in stageCards"
            :key="card.id"
            :class="['stage-card', card.tone]"
            @click="goTeachers({ stage: card.id })"
          >
            <div class="stage-card-top">
              <img :src="`/images/home/figma/${card.icon}`" width="30" height="30" alt="" />
              <img src="/images/home/figma/arrow-up-right.svg" width="20" height="20" alt="" />
            </div>
            <h3>{{ card.id }}</h3>
            <p class="range">{{ card.range }}</p>
            <p class="subs">{{ card.subjects }}</p>
            <p class="desc">
              <template v-for="(line, i) in card.desc" :key="i">{{ line }}<br v-if="i < card.desc.length - 1" /></template>
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="section tutors">
      <div class="wrap">
        <header class="head row">
          <div>
            <p class="kicker">MEET YOUR TUTOR / 教师发现</p>
            <h2>合适的老师，不止一种模样</h2>
            <p class="sub">从授课科目、教学侧重与可约时间开始了解，再决定是否联系。</p>
          </div>
          <button type="button" class="more" @click="goTeachers()">
            查看全部老师
            <img src="/images/home/figma/arrow-right-teal.svg" width="18" height="18" alt="" />
          </button>
        </header>

        <div class="tutor-tools">
          <div class="chips">
            <button
              type="button"
              :class="['chip', { on: tutorFilter === '全部' }]"
              @click="tutorFilter = '全部'"
            >
              全部
            </button>
            <button
              v-for="item in STAGES"
              :key="item"
              type="button"
              :class="['chip', { on: tutorFilter === item }]"
              @click="tutorFilter = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div v-loading="loading" class="tutor-grid">
          <article
            v-for="tutor in displayedTeachers"
            :key="tutor.id"
            class="tutor"
            @click="goTeacher(tutor.id)"
          >
            <div class="tutor-photo">
              <img
                :src="resolveAvatar(tutor.avatar, tutor.gender)"
                :alt="tutor.name"
                @error="($event.target as HTMLImageElement).src = resolveAvatar(undefined, tutor.gender)"
              />
              <span class="badge">{{ teacherStage(tutor) }}</span>
            </div>
            <div class="tutor-body">
              <div class="name-row">
                <strong>{{ tutor.name }}</strong>
              </div>
              <p class="focus">{{ teacherFocus(tutor) }}</p>
              <p class="intro">{{ tutor.introduction.slice(0, 28) || tutor.experience.slice(0, 28) }}</p>
              <p class="place">{{ shortArea(tutor.districts) }}　·　{{ modeText(tutor.teachMode) }}</p>
              <div class="tutor-foot">
                <span>{{ tutor.availableTimes?.[0] || "可沟通时间待确认" }}</span>
                <button type="button" @click.stop="goTeacher(tutor.id)">
                  看资料
                  <img src="/images/home/figma/arrow-right-sm.svg" width="15" height="15" alt="" />
                </button>
              </div>
            </div>
          </article>
        </div>
        <el-empty v-if="!loading && !displayedTeachers.length" description="暂无老师资料" />
      </div>
    </section>

    <section class="section demands">
      <div class="wrap demand-layout">
        <div class="demand-intro">
          <p class="kicker">FIND YOUR STUDENT / 学员需求</p>
          <h2>你的擅长，<br />也许正被需要。</h2>
          <p class="sub">老师也可以主动发现需求。按学段、科目和城市，寻找时间与方向都合适的学生。</p>
          <button type="button" class="ghost-btn" @click="router.push('/students')">
            我是老师，浏览需求
            <img src="/images/home/figma/arrow-up-right-teal.svg" width="17" height="17" alt="" />
          </button>
          <div class="info-box">
            <img src="/images/home/figma/info-amber.svg" width="16" height="16" alt="" />
            <p>意向预算仅供参考，费用由双方自行沟通确认。</p>
          </div>
        </div>
        <div class="demand-list">
          <article
            v-for="item in demands"
            :key="item.id"
            class="demand"
            @click="goDemand(item.id)"
          >
            <div :class="['stage-box', { warm: item.stage === '音乐' || (!item.stage && SUBJECTS_BY_STAGE.音乐.includes(item.subject)) }]">
              <b>{{ item.stage || demandStage(item) }}</b>
              <span>{{ item.subject }}</span>
            </div>
            <div class="demand-main">
              <strong>{{ item.remark || `${item.subject}家教需求` }}</strong>
              <p>{{ demandCity(item.district) }}　/　{{ modeText(item.teachMode) }}　/　{{ item.schedule }}</p>
              <p>{{ item.remark ? `希望了解：${item.subject}` : "欢迎先沟通学习目标与时间" }}</p>
            </div>
            <div class="demand-side">
              <b>{{ item.budget }} 元 / 小时</b>
              <button type="button" @click.stop="goDemand(item.id)">
                查看需求
                <img src="/images/home/figma/arrow-right-demand.svg" width="14" height="14" alt="" />
              </button>
            </div>
          </article>
          <el-empty v-if="!demands.length" description="暂无学员需求" />
        </div>
      </div>
    </section>

    <section class="section process">
      <div class="wrap">
        <header class="head row">
          <div>
            <p class="kicker">HOW IT WORKS / 认识同号</p>
            <h2>把选择留给你，把沟通变简单</h2>
            <p class="sub">不代替家庭与老师做决定，让每一次联系都从清楚的信息开始。</p>
          </div>
          <button type="button" class="more" @click="router.push('/legal/agreement')">
            了解平台说明
            <img src="/images/home/figma/arrow-right-teal.svg" width="18" height="18" alt="" />
          </button>
        </header>
        <div class="step-grid">
          <article v-for="item in steps" :key="item.no" class="step">
            <div class="step-top">
              <span class="icon"><img :src="`/images/home/figma/${item.icon}`" width="23" height="23" alt="" /></span>
              <em>{{ item.no }}</em>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section cities">
      <div class="wrap">
        <header class="head">
          <p class="kicker">NEAR & FAR / 全国发现</p>
          <h2>在你的城市，也在屏幕另一端</h2>
          <p class="sub">先确定城市，再选学段与科目；线上学习可跨城联系，线下授课请进一步确认区域与距离。</p>
        </header>
        <div class="city-layout">
          <div class="city-panel">
            <div class="city-head">
              <div>
                <img src="/images/home/figma/map-pin-city.svg" width="20" height="20" alt="" />
                <strong>从一座城市开始</strong>
              </div>
              <button type="button" @click="goTeachers()">全部城市 A–Z　↗</button>
            </div>
            <div class="city-grid">
              <button
                v-for="item in cities"
                :key="item.label"
                type="button"
                :class="{ on: activeCity === item.label }"
                @click="goCity(item.label, item.path)"
              >
                {{ item.label }}
              </button>
              <button type="button" @click="goTeachers()">更多城市</button>
            </div>
            <p class="city-note">
              发现路径示例：北京 → 初中 → 化学 → 线上 / 线下<br />
              城市入口仅用于信息筛选，不代表当地师资数量或服务承诺。
            </p>
          </div>
          <div class="mode-cards">
            <button type="button" class="mode-card sky" @click="goTeachers({ teachMode: 'offline' })">
              <img src="/images/home/figma/map-pinned.svg" width="34" height="34" alt="" />
              <div>
                <strong>线下见面，关注距离</strong>
                <p>按城市与区域寻找，沟通上门或约定地点。<br />首次见面建议监护人陪同。</p>
              </div>
              <img src="/images/home/figma/arrow-up-right-light.svg" width="19" height="19" alt="" />
            </button>
            <button type="button" class="mode-card warm" @click="goTeachers({ teachMode: 'online' })">
              <img src="/images/home/figma/monitor.svg" width="34" height="34" alt="" />
              <div>
                <strong>线上相遇，不限同城</strong>
                <p>跨城市了解老师，提前确认设备、<br />上课工具与双方可用时间。</p>
              </div>
              <img src="/images/home/figma/arrow-up-right-light.svg" width="19" height="19" alt="" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="section trust">
      <div class="wrap trust-layout">
        <div class="trust-photo">
          <img src="/images/home/figma/cta-bg.png" alt="沟通场景示意" />
          <div class="photo-chip">
            <img src="/images/home/figma/messages-trust.svg" width="22" height="22" alt="" />
            <b>先聊清楚，再做决定</b>
          </div>
        </div>
        <div class="trust-copy">
          <p class="kicker">CLEAR & CAREFUL / 安心沟通</p>
          <h2>信息撮合，边界说在前面</h2>
          <p class="sub">
            同号家教仅提供信息展示与联系撮合，不提供授课服务；不收取课时费，不提供支付结算，也不承诺教学结果。
          </p>
          <div class="safeguard-grid">
            <article v-for="item in safeguards" :key="item.title" class="safeguard">
              <img :src="`/images/home/figma/${item.icon}`" width="21" height="21" alt="" />
              <div>
                <strong>{{ item.title }}</strong>
                <p>
                  <template v-for="(line, i) in item.lines" :key="i">{{ line }}<br v-if="i < item.lines.length - 1" /></template>
                </p>
              </div>
            </article>
          </div>
          <div class="trust-links">
            <button type="button" @click="router.push('/legal/agreement')">阅读安全指南 ↗</button>
            <button type="button" class="muted" @click="router.push('/legal/agreement')">发现可疑信息？反馈与举报 →</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section cta">
      <div class="wrap">
        <header class="cta-head">
          <h2>下一次合拍，从这里开始</h2>
          <p>无论寻找学习陪伴，还是分享自己的所长，都值得认真介绍。</p>
        </header>
        <div class="cta-grid">
          <article class="cta-card family">
            <img src="/images/home/figma/sprout-cta.svg" width="42" height="42" alt="" />
            <div>
              <span>FOR FAMILIES / 我是家长</span>
              <h3>说说孩子需要怎样的老师</h3>
              <p>写清学段、科目与时间，让沟通更有方向。</p>
              <button type="button" @click="openPublish">
                发布学习需求
                <img src="/images/home/figma/arrow-up-right-teal.svg" width="17" height="17" alt="" />
              </button>
            </div>
          </article>
          <article class="cta-card tutor">
            <img src="/images/home/figma/presentation.svg" width="42" height="42" alt="" />
            <div>
              <span>FOR TUTORS / 我是老师</span>
              <h3>让你的擅长，被合适的人看见</h3>
              <p>如实填写教学方向、授课区域与可约时间。</p>
              <button type="button" @click="openTeacherJoin">
                完善教师资料
                <img src="/images/home/figma/arrow-up-right-cta.svg" width="17" height="17" alt="" />
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <StudentDemandDialog v-model="studentDemandVisible" />
    <TeacherJoinDialog v-model="teacherJoinVisible" />
  </div>
</template>

<style scoped lang="scss">
.home {
  --teal: #13857d;
  --ink: #173b3d;
  --muted: #687e7e;
  --line: #dce8e3;
  --mint: #eaf6f1;
  --soft: #f3f7f4;
  --warm: #fff0df;
  --sky: #edf4fa;
  --page: #fbfcfa;
  background: var(--page);
  color: var(--ink);
}

.wrap {
  width: min(1248px, calc(100% - 48px));
  margin: 0 auto;
}

.hero {
  background: var(--mint);
  padding: 48px 0 36px;
}

.hero-top {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 66px;
  align-items: center;
  margin-bottom: 30px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--teal);
  font-size: 13px;

  .line {
    width: 26px;
    height: 2px;
    background: var(--teal);
  }
}

h1 {
  margin: 22px 0 0;
  font-size: clamp(34px, 4.2vw, 54px);
  line-height: 1.35;
  font-weight: 800;
}

.lead,
.sub {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.85;
}

.sub {
  font-size: 15px;
  line-height: 1.7;
  max-width: 850px;
}

.checks {
  display: flex;
  flex-wrap: wrap;
  gap: 23px;
  margin-top: 22px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #086b65;
    font-size: 12px;
  }
}

.hero-photo,
.trust-photo {
  position: relative;
  border-radius: 32px;
  overflow: hidden;
  height: 360px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.photo-chip {
  position: absolute;
  left: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(23, 59, 61, 0.1);

  b {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.35;
    white-space: nowrap;
  }
}

.search-card {
  background: #fff;
  border-radius: 20px;
  padding: 22px;
  box-shadow: 0 12px 32px rgba(32, 77, 61, 0.05);
}

.stage-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stage-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 48px;
  border: 0;
  border-radius: 10px;
  background: var(--soft);
  cursor: pointer;

  strong {
    font-size: 16px;
    color: var(--ink);
  }

  em {
    font-style: normal;
    font-size: 11px;
    color: var(--muted);
  }

  &.on {
    background: var(--teal);

    strong {
      color: #fff;
    }

    em {
      color: #d5f1ea;
    }
  }
}

.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.filter {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 154px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &.wide {
    min-width: 180px;
  }

  small {
    color: var(--muted);
    font-size: 11px;
  }

  span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  b {
    font-size: 15px;
  }
}

.split {
  width: 1px;
  height: 34px;
  background: var(--line);
  flex-shrink: 0;
}

.menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 5;
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

.search-btn,
.ghost-btn,
.more,
.cta-card button,
.trust-links button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 46px;
  padding: 0 20px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.search-btn {
  margin-left: auto;
  background: var(--teal);
  color: #fff;
}

.hint {
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 11px;
}

.section {
  padding: 72px 0;
}

.head {
  margin-bottom: 30px;

  &.row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
  }
}

.kicker {
  margin: 0;
  color: var(--teal);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

h2 {
  margin: 10px 0 0;
  font-size: clamp(26px, 3vw, 34px);
  line-height: 1.35;
  font-weight: 800;
}

.more {
  height: auto;
  padding: 0;
  background: transparent;
  color: var(--teal);
}

.stage-grid,
.tutor-grid,
.step-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.stage-card {
  padding: 24px;
  border-radius: 20px;
  cursor: pointer;
  min-height: 264px;

  &.mint {
    background: var(--mint);
  }

  &.sky {
    background: var(--sky);
  }

  &.warm {
    background: var(--warm);
  }

  h3 {
    margin: 15px 0 0;
    font-size: 25px;
  }

  .range {
    margin: 5px 0 0;
    color: var(--muted);
    font-size: 12px;
  }

  .subs {
    margin: 15px 0 0;
    min-height: 48px;
    white-space: pre-line;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.8;
  }

  .desc {
    margin: 15px 0 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.8;
  }
}

.stage-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tutors,
.trust {
  background: var(--soft);
}

.tutor-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  height: 26px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: #fff;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;

  &.on {
    background: var(--teal);
    color: #fff;
  }
}

.tutor {
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  cursor: pointer;
}

.tutor-photo {
  position: relative;
  height: 188px;
  background: #dfece7;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .badge {
    position: absolute;
    top: 14px;
    left: 14px;
    padding: 5px 10px;
    background: #fff;
    border-radius: 999px;
    color: var(--teal);
    font-size: 11px;
    font-weight: 700;
  }
}

.tutor-body {
  padding: 20px;
}

.name-row {
  display: flex;
  align-items: center;

  strong {
    font-size: 20px;
  }
}

.focus {
  margin: 13px 0 0;
  color: var(--teal);
  font-size: 13px;
  font-weight: 700;
}

.intro {
  margin: 13px 0 0;
  min-height: 43px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.place {
  margin: 13px 0 0;
  color: var(--muted);
  font-size: 11px;
}

.tutor-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 11px;

  button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 0;
    background: transparent;
    color: var(--teal);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
}

.demand-layout,
.trust-layout,
.city-layout {
  display: grid;
  gap: 54px;
}

.demand-layout {
  grid-template-columns: 330px 1fr;
  align-items: center;
}

.demand-intro {
  .sub {
    font-size: 15px;
    line-height: 1.85;
  }

  h2 {
    margin-top: 22px;
  }
}

.ghost-btn {
  margin-top: 22px;
  background: #fff;
  color: var(--teal);
}

.info-box {
  display: flex;
  gap: 8px;
  margin-top: 22px;
  padding: 14px;
  border-radius: 10px;
  background: var(--warm);
  color: #b87336;
  font-size: 11px;
  line-height: 1.7;

  p {
    margin: 0;
  }
}

.demand-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demand {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 19px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}

.stage-box {
  display: grid;
  place-content: center;
  width: 54px;
  height: 62px;
  border-radius: 10px;
  background: var(--mint);
  text-align: center;

  &.warm {
    background: var(--warm);
  }

  b {
    color: #086b65;
    font-size: 15px;
  }

  span {
    color: var(--muted);
    font-size: 9px;
  }
}

.demand-main {
  flex: 1;
  min-width: 0;

  strong {
    font-size: 15px;
  }

  p {
    margin: 7px 0 0;
    color: var(--muted);
    font-size: 11px;
  }
}

.demand-side {
  width: 151px;
  text-align: right;

  b {
    display: block;
    color: #b87336;
    font-size: 12px;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    border: 0;
    background: transparent;
    color: var(--teal);
    font-size: 11px;
    cursor: pointer;
  }
}

.process {
  background: var(--mint);
}

.step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .icon {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: #fff;
  }

  em {
    color: #6e9d8e;
    font-size: 30px;
    font-style: normal;
    font-weight: 500;
  }
}

.step {
  h3 {
    margin: 16px 0 0;
    font-size: 20px;
  }

  p {
    margin: 16px 0 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.9;
  }
}

.city-layout {
  grid-template-columns: 700px 1fr;
  gap: 24px;
}

.city-panel {
  padding: 28px;
  border-radius: 20px;
  background: #153e3d;
  color: #fff;
}

.city-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  div {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  strong {
    font-size: 19px;
  }

  button {
    border: 0;
    background: transparent;
    color: #c2d8d2;
    font-size: 12px;
    cursor: pointer;
  }
}

.city-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-top: 24px;

  button {
    height: 40px;
    border: 0;
    border-radius: 8px;
    background: #28524f;
    color: #fff;
    font-size: 13px;
    cursor: pointer;

    &.on {
      background: #d2ece3;
      color: var(--ink);
    }
  }
}

.city-note {
  margin: 24px 0 0;
  color: #c2d8d2;
  font-size: 12px;
  line-height: 1.8;
}

.mode-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  padding: 24px;
  border: 0;
  border-radius: 20px;
  text-align: left;
  cursor: pointer;

  &.sky {
    background: var(--sky);
  }

  &.warm {
    background: var(--warm);
  }

  strong {
    display: block;
    font-size: 19px;
  }

  p {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.85;
  }

  div {
    flex: 1;
  }
}

.trust-layout {
  grid-template-columns: 420px 1fr;
  gap: 64px;
  align-items: center;
}

.trust-photo {
  height: 428px;
}

.safeguard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 23px;
}

.safeguard {
  display: flex;
  gap: 11px;

  strong {
    font-size: 14px;
  }

  p {
    margin: 6px 0 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.8;
  }
}

.trust-links {
  display: flex;
  gap: 24px;
  margin-top: 8px;

  button {
    height: auto;
    padding: 0;
    background: transparent;
    color: var(--teal);
    font-size: 13px;

    &.muted {
      color: var(--muted);
      font-weight: 400;
      font-size: 12px;
    }
  }
}

.cta {
  padding-top: 64px;
  padding-bottom: 64px;
}

.cta-head {
  text-align: center;
  margin-bottom: 28px;

  h2 {
    font-size: 30px;
  }

  p {
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 14px;
  }
}

.cta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.cta-card {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 30px;
  border-radius: 20px;

  span {
    font-size: 11px;
  }

  h3 {
    margin: 12px 0 0;
    font-size: 22px;
  }

  p {
    margin: 12px 0 0;
    font-size: 12px;
  }

  button {
    margin-top: 12px;
  }

  &.family {
    background: var(--teal);
    color: #fff;

    span,
    p {
      color: #d7ede6;
    }

    button {
      background: #fff;
      color: var(--teal);
    }
  }

  &.tutor {
    background: var(--warm);

    span {
      color: #b87336;
    }

    p {
      color: var(--muted);
    }

    button {
      background: var(--teal);
      color: #fff;
    }
  }
}

@media (max-width: 1100px) {
  .hero-top,
  .demand-layout,
  .city-layout,
  .trust-layout,
  .cta-grid,
  .stage-grid,
  .tutor-grid,
  .step-grid {
    grid-template-columns: 1fr 1fr;
  }

  .filters {
    flex-wrap: wrap;
  }

  .search-btn {
    width: 100%;
    margin-left: 0;
  }

  .city-layout {
    grid-template-columns: 1fr;
  }

  .city-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 720px) {
  .wrap {
    width: calc(100% - 32px);
  }

  .hero-top,
  .demand-layout,
  .trust-layout,
  .cta-grid,
  .stage-grid,
  .tutor-grid,
  .step-grid,
  .stage-tabs,
  .safeguard-grid {
    grid-template-columns: 1fr;
  }

  .head.row,
  .tutor-tools,
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter,
  .filter.wide {
    width: 100%;
  }

  .split {
    display: none;
  }

  .demand {
    flex-direction: column;
    align-items: flex-start;
  }

  .demand-side {
    width: 100%;
    text-align: left;
  }

  .city-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  apiGetComments,
  apiGetDashboard,
  apiGetDemands,
  apiGetHotTeachers,
  apiGetTeachers,
} from "@/api";
import { SUBJECTS, TEACH_MODE_MAP } from "@/constants";
import { useAppStore } from "@/store";
import type { Comment, Demand, Teacher } from "@/types";
import { formatDate, resolveAvatar } from "@/utils";
import { formatRegion, formatRegions, splitRegionPath } from "@/utils/region";

const router = useRouter();
const appStore = useAppStore();

const subjects = SUBJECTS.slice(0, 10);
const cities = [
  { label: "全国", path: "" },
  { label: "上海", path: "上海市/上海市" },
  { label: "北京", path: "北京市/北京市" },
  { label: "合肥", path: "安徽省/合肥市" },
  { label: "深圳", path: "广东省/深圳市" },
  { label: "杭州", path: "浙江省/杭州市" },
  { label: "广州", path: "广东省/广州市" },
  { label: "成都", path: "四川省/成都市" },
  { label: "武汉", path: "湖北省/武汉市" },
];
const hotTags = [
  { label: "钢琴启蒙", subject: "钢琴", tone: "solid" },
  { label: "声乐基础", subject: "声乐", tone: "plain" },
  { label: "吉他流行", subject: "吉他", tone: "plain" },
  { label: "乐理辅导", subject: "音乐理论", tone: "warm" },
];
const budgets = [
  { label: "不限预算", min: undefined as number | undefined, max: undefined as number | undefined },
  { label: "100–180 元", min: 100, max: 180 },
  { label: "180–250 元", min: 180, max: 250 },
  { label: "250–400 元", min: 250, max: 400 },
  { label: "400 元以上", min: 400, max: undefined },
];

const subject = ref("钢琴");
const cityLabel = ref(appStore.cityLabel || "全国");
const cityPath = ref(appStore.cityPath || "");
const budgetIndex = ref(2);
const openMenu = ref<"subject" | "city" | "budget" | "">("");
const saved = ref<Record<string, boolean>>({});
const hotTeachers = ref<Teacher[]>([]);
const demands = ref<Demand[]>([]);
const stories = ref<
  { quote: string; avatar: string; name: string; role: string; featured: boolean; rating: number }[]
>([]);
const teacherTotal = ref(0);
const demandTotal = ref(0);
const commentTotal = ref(0);
const loading = ref(false);

const washes = ["#eaf2ff", "#fff1e6", "#ddf8ee", "#f0eaff"];

const steps = [
  {
    icon: "sliders",
    wash: "#eaf2ff",
    no: "01",
    title: "发布学琴需求",
    desc: "填写乐器科目、所在城市与课时预算，1 分钟发布需求。",
    arrow: true,
  },
  {
    icon: "users-round",
    wash: "#fff1e6",
    no: "02",
    title: "系统匹配老师",
    desc: "浏览全国认证老师，或等待附近合适老师主动联系你。",
    arrow: true,
  },
  {
    icon: "messages-square",
    wash: "#ddf8ee",
    no: "03",
    title: "沟通试听",
    desc: "先聊教学思路与时间，满意后再约上门或线上试听。",
    arrow: true,
  },
  {
    icon: "handshake",
    wash: "#f0eaff",
    no: "04",
    title: "自主开课",
    desc: "双方自行确定课时与费用，平台不收取课时费。",
    arrow: false,
  },
];

const subjectsGrid = [
  { icon: "sigma", wash: "#eaf2ff", name: "钢琴", count: "考级陪练" },
  { icon: "languages", wash: "#fff1e6", name: "声乐", count: "流行美声" },
  { icon: "book-open-text", wash: "#f0eaff", name: "吉他", count: "主打热门" },
  { icon: "atom", wash: "#ddf8ee", name: "古筝", count: "民乐入门" },
  { icon: "pencil-ruler", wash: "#fff7d9", name: "小提琴", count: "基础乐团" },
  { icon: "palette", wash: "#ffeaf1", name: "架子鼓", count: "节奏乐队" },
];

const areas = [
  { name: "上海", path: "上海市/上海市", count: "长三角", active: true },
  { name: "北京", path: "北京市/北京市", count: "华北", active: false },
  { name: "合肥", path: "安徽省/合肥市", count: "华东热门", active: false },
  { name: "深圳", path: "广东省/深圳市", count: "珠三角", active: false },
  { name: "杭州", path: "浙江省/杭州市", count: "线上活跃", active: false },
  { name: "广州", path: "广东省/广州市", count: "华南", active: false },
  { name: "成都", path: "四川省/成都市", count: "西南", active: false },
  { name: "武汉", path: "湖北省/武汉市", count: "华中", active: false },
];

const safeguards = [
  {
    icon: "scan-face",
    title: "老师资料审核",
    desc: "入驻需提交真实手机与教学经历，管理员审核通过后展示。",
  },
  {
    icon: "message-lock",
    title: "隐私分级展示",
    desc: "联系方式不公开展示，双方确认意向后再自主交换。",
  },
  {
    icon: "dollar",
    title: "平台不代收课时费",
    desc: "课时与费用由双方协商，平台不抽成、不提供资金托管。",
  },
  {
    icon: "siren",
    title: "举报与风险提醒",
    desc: "遇到诱导转账、证件异常等情况，可快速举报并获取协助。",
  },
];

const budgetLabel = computed(() => budgets[budgetIndex.value]?.label || "不限预算");
const featuredTeacher = computed(() => hotTeachers.value[0]);
const matchedCount = computed(() => Math.max(hotTeachers.value.length, teacherTotal.value, 1));

const statsCards = computed(() => [
  {
    icon: "users",
    value: teacherTotal.value > 0 ? `${teacherTotal.value.toLocaleString()}+` : "—",
    label: "全国音乐家教资料",
    tip: "持续更新",
  },
  {
    icon: "home",
    value: demandTotal.value > 0 ? `${demandTotal.value.toLocaleString()}+` : "—",
    label: "家庭发布需求",
    tip: "真实全国",
  },
  {
    icon: "message-circle-light",
    value: commentTotal.value > 0 ? `${Math.min(99, Math.round((commentTotal.value / Math.max(teacherTotal.value, 1)) * 20) + 80)}%` : "96%",
    label: "需求获得响应",
    tip: "平均 18 分钟",
  },
  {
    icon: "map",
    value: "9 年",
    label: "专注全国音乐家教",
    tip: "全国服务",
  },
]);

function shortArea(paths: string[] = []) {
  const text = formatRegions(paths);
  if (!text) return "全国可约";
  return text
    .split(" / ")
    .map((part) => splitRegionPath(part).slice(-1)[0] || part)
    .slice(0, 2)
    .join(" / ");
}

function teacherSubline(teacher?: Teacher) {
  if (!teacher) return "音乐学院 · 全国";
  const city = shortArea(teacher.districts);
  const exp = teacher.experience?.slice(0, 10) || "音乐老师";
  return `${exp} · ${city}`;
}

function demandCity(path = "") {
  const parts = splitRegionPath(path);
  if (parts.length >= 2) return `${parts[1].replace(/市$/, "")} · ${parts[parts.length - 1]}`;
  return formatRegion(path) || "全国";
}

function relativeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}分钟前发布`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前发布`;
  return formatDate(iso);
}

function toggleMenu(key: "subject" | "city" | "budget") {
  openMenu.value = openMenu.value === key ? "" : key;
}

function chooseSubject(value: string) {
  subject.value = value;
  openMenu.value = "";
}

function chooseCity(label: string, path: string) {
  cityLabel.value = label;
  cityPath.value = path;
  openMenu.value = "";
}

function chooseBudget(index: number) {
  budgetIndex.value = index;
  openMenu.value = "";
}

function searchGo() {
  const budget = budgets[budgetIndex.value];
  router.push({
    path: "/teachers",
    query: {
      subject: subject.value || undefined,
      district: cityPath.value || undefined,
      priceMin: budget?.min != null ? String(budget.min) : undefined,
      priceMax: budget?.max != null ? String(budget.max) : undefined,
    },
  });
}

function pickHot(tag: { label: string; subject: string }) {
  subject.value = tag.subject;
  searchGo();
}

function goTeachers(keyword?: string) {
  router.push({ path: "/teachers", query: keyword ? { keyword } : undefined });
}

function goCity(path: string) {
  router.push({ path: "/teachers", query: { district: path } });
}

function goTeacher(id: string) {
  router.push(`/teachers/${id}`);
}

function buildStories(list: Comment[], teachers: Teacher[]) {
  const fallbacks = [
    { role: "全国 · 音乐学员", avatar: "/images/home/review-1.png" },
    { role: "上海 · 钢琴家长", avatar: "/images/home/review-2.png" },
    { role: "合肥 · 吉他学员", avatar: "/images/home/review-3.png" },
  ];
  return list.slice(0, 3).map((c, i) => {
    const teacher = teachers.find((t) => t.id === c.teacherId);
    return {
      quote: `“${c.content}”`,
      avatar: fallbacks[i]?.avatar || "/images/home/review-1.png",
      name: c.userName,
      role: teacher ? `${shortArea(teacher.districts)} · ${teacher.subjects[0] || "音乐"}` : fallbacks[i]?.role || "全国 · 音乐学员",
      featured: i === 1,
      rating: c.rating,
    };
  });
}

async function load() {
  loading.value = true;
  try {
    const [hot, list, dash, all] = await Promise.all([
      apiGetHotTeachers(),
      apiGetDemands(),
      apiGetDashboard().catch(() => null),
      apiGetTeachers().catch(() => [] as Teacher[]),
    ]);
    const merged = [...hot];
    for (const item of all) {
      if (!merged.some((t) => t.id === item.id)) merged.push(item);
    }
    hotTeachers.value = merged.slice(0, 4);
    demands.value = list.slice(0, 4);
    teacherTotal.value = dash?.teacherCount ?? all.length ?? hot.length;
    demandTotal.value = dash?.demandCount ?? list.length;
    commentTotal.value = dash?.commentCount ?? 0;

    const commentGroups = await Promise.all(
      hotTeachers.value.slice(0, 4).map((t) => apiGetComments(t.id).catch(() => [] as Comment[])),
    );
    const flat = commentGroups.flat().filter((c) => c.visible !== false);
    stories.value = buildStories(flat, hotTeachers.value);
  } catch {
    hotTeachers.value = [];
    demands.value = [];
    stories.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="home" @click="openMenu = ''">
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <div class="trust-pill">
            <img src="/images/home/shield-check.svg" width="16" height="16" alt="" />
            <span>全国音乐家教 · 真人信息核验 · 双向自由联系</span>
          </div>
          <h1>找到合拍的音乐老师，<br />从试听开始</h1>
          <p class="lead">
            覆盖钢琴、声乐、吉他、尤克里里等多种乐器，按科目、级别与城市快速匹配。平台仅做信息撮合，不收取课时费。
          </p>

          <div class="search" @click.stop>
            <div class="search-row">
              <button type="button" class="cond" @click="toggleMenu('subject')">
                <span class="cond-icon"><img src="/images/home/graduation-cap.svg" width="17" height="17" alt="" /></span>
                <span class="cond-text">
                  <small>想学什么</small>
                  <strong>{{ subject }}</strong>
                </span>
                <img src="/images/home/chevron-down.svg" width="15" height="15" alt="" />
                <ul v-if="openMenu === 'subject'" class="menu">
                  <li v-for="item in subjects" :key="item" @click="chooseSubject(item)">{{ item }}</li>
                </ul>
              </button>
              <i class="split" />
              <button type="button" class="cond" @click="toggleMenu('city')">
                <span class="cond-icon"><img src="/images/home/map-pin.svg" width="16" height="16" alt="" /></span>
                <span class="cond-text">
                  <small>上课城市</small>
                  <strong>{{ cityLabel }}</strong>
                </span>
                <img src="/images/home/chevron-down.svg" width="15" height="15" alt="" />
                <ul v-if="openMenu === 'city'" class="menu">
                  <li v-for="item in cities" :key="item.label" @click="chooseCity(item.label, item.path)">
                    {{ item.label }}
                  </li>
                </ul>
              </button>
              <i class="split" />
              <button type="button" class="cond budget" @click="toggleMenu('budget')">
                <span class="cond-icon"><img src="/images/home/wallet.svg" width="17" height="17" alt="" /></span>
                <span class="cond-text">
                  <small>课时预算</small>
                  <strong>{{ budgetLabel }}</strong>
                </span>
                <img src="/images/home/chevron-down.svg" width="15" height="15" alt="" />
                <ul v-if="openMenu === 'budget'" class="menu">
                  <li
                    v-for="(item, index) in budgets"
                    :key="item.label"
                    @click="chooseBudget(index)"
                  >
                    {{ item.label }}
                  </li>
                </ul>
              </button>
              <button type="button" class="search-btn" aria-label="搜索老师" @click="searchGo">
                <img src="/images/home/search.svg" width="23" height="23" alt="" />
              </button>
            </div>
            <div class="hot">
              <span>热门：</span>
              <button
                v-for="tag in hotTags"
                :key="tag.label"
                type="button"
                :class="['chip', tag.tone, { on: subject === tag.subject }]"
                @click="pickHot(tag)"
              >
                {{ tag.label }}
              </button>
            </div>
          </div>

          <div class="hints">
            <span><img src="/images/home/circle-check.svg" width="15" height="15" alt="" />免费发布需求</span>
            <span><img src="/images/home/circle-check.svg" width="15" height="15" alt="" />无中介抽成</span>
            <span><img src="/images/home/circle-check.svg" width="15" height="15" alt="" />直接沟通试听</span>
          </div>
        </div>

        <div class="hero-photo">
          <img class="cover" src="/images/home/hero-music.png" alt="音乐老师一对一授课" />
          <div class="float match">
            <div class="match-top">
              <strong>已匹配 {{ matchedCount }} 位老师</strong>
              <em><i />可联系</em>
            </div>
            <div class="match-body">
              <img
                class="avatar"
                :src="resolveAvatar(featuredTeacher?.avatar, featuredTeacher?.gender)"
                alt=""
              />
              <div>
                <b>{{ featuredTeacher?.name || "音乐老师" }} · {{ featuredTeacher?.subjects?.[0] || "钢琴" }}</b>
                <small>{{ teacherSubline(featuredTeacher) }}</small>
              </div>
              <img src="/images/home/message-circle.svg" width="18" height="18" alt="" />
            </div>
          </div>
          <div class="float speed">
            <span class="zap"><img src="/images/home/zap.svg" width="16" height="16" alt="" /></span>
            <div>
              <b>平均 18 分钟响应</b>
              <small>今日 {{ Math.max(teacherTotal, hotTeachers.length, 1) }} 位老师在线</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-wrap">
      <div class="wrap stats">
        <div class="stats-lead">
          <strong>被全国家庭信赖</strong>
          <p>每一条资料都经过基础信息审核</p>
        </div>
        <div v-for="item in statsCards" :key="item.label" class="stat">
          <span class="stat-icon"><img :src="`/images/home/${item.icon}.svg`" width="20" height="20" alt="" /></span>
          <div>
            <b>{{ item.value }}</b>
            <span>{{ item.label }}</span>
            <small>{{ item.tip }}</small>
          </div>
        </div>
      </div>
    </section>

    <section class="band">
      <div class="wrap">
        <header class="block-head">
          <div>
            <p class="kicker"><i />HOT TUTORS</p>
            <h2>这些老师，正在全国各地教授音乐</h2>
            <p>资料透明、时间可约，先看看教学经历与家长评价，再决定是否联系。</p>
          </div>
          <button type="button" class="more" @click="goTeachers()">
            查看全部老师
            <img src="/images/home/arrow-right.svg" width="17" height="17" alt="" />
          </button>
        </header>
        <div v-loading="loading" class="tutor-grid">
          <article
            v-for="(tutor, index) in hotTeachers"
            :key="tutor.id"
            class="tutor"
            @click="goTeacher(tutor.id)"
          >
            <div class="tutor-photo" :style="{ background: washes[index % washes.length] }">
              <img
                :src="resolveAvatar(tutor.avatar, tutor.gender)"
                :alt="tutor.name"
                @error="($event.target as HTMLImageElement).src = resolveAvatar(undefined, tutor.gender)"
              />
              <span class="pop"><img src="/images/home/sparkles.svg" width="13" height="13" alt="" />本周受欢迎</span>
            </div>
            <div class="tutor-body">
              <div class="name-row">
                <div class="name-line">
                  <strong>{{ tutor.name }}</strong>
                  <em v-if="tutor.status === 'approved'">
                    <img src="/images/home/badge-check.svg" width="14" height="14" alt="" />身份已核验
                  </em>
                </div>
                <button
                  type="button"
                  class="heart"
                  :class="{ on: saved[tutor.id] }"
                  aria-label="收藏"
                  @click.stop="saved[tutor.id] = !saved[tutor.id]"
                >
                  <img src="/images/home/heart.svg" width="16" height="16" alt="" />
                </button>
              </div>
              <p class="cred">
                <b>{{ tutor.subjects.slice(0, 2).join(" · ") || "音乐" }}</b>
                <span>{{ TEACH_MODE_MAP[tutor.teachMode] }}</span>
              </p>
              <span class="subject-pill">{{ tutor.experience.slice(0, 18) || "音乐家教" }}</span>
              <div class="meta">
                <span>
                  <img src="/images/home/map-pin-muted.svg" width="14" height="14" alt="" />
                  {{ shortArea(tutor.districts) }}
                </span>
                <span>{{ tutor.rating.toFixed(1) }} · {{ tutor.reviewCount }}条评价</span>
              </div>
              <div class="price-row">
                <b>¥{{ tutor.price }}/课时</b>
                <button type="button" class="chat" @click.stop="goTeacher(tutor.id)">
                  <img src="/images/home/message-white.svg" width="14" height="14" alt="" />聊一聊
                </button>
              </div>
            </div>
          </article>
        </div>
        <el-empty v-if="!loading && !hotTeachers.length" description="暂无热门老师" />
      </div>
    </section>

    <section id="requests" class="requests">
      <div class="wrap request-layout">
        <div class="request-intro">
          <p class="kicker"><i />NEW REQUESTS</p>
          <h2>全国学员正在<br />寻找这样的老师</h2>
          <p>老师可按科目、城市和时间筛选真实需求，双方先沟通，再约试听。</p>
          <img class="scene" src="/images/home/request-scene.png" alt="音乐学习场景" />
          <button type="button" class="soft-btn" @click="router.push('/students')">
            <img src="/images/home/briefcase.svg" width="18" height="18" alt="" />
            我是老师，去找学生
          </button>
        </div>
        <div class="request-list">
          <div class="request-status">
            <strong>最新 {{ demands.length }} 条真实需求</strong>
            <em><i />实时更新中</em>
          </div>
          <article
            v-for="item in demands"
            :key="item.id"
            class="request"
            @click="router.push(`/students/${item.id}`)"
          >
            <div class="req-badge">
              <b>{{ item.subject }}</b>
              <span>{{ item.age ? `${item.age}岁` : TEACH_MODE_MAP[item.teachMode] }}</span>
            </div>
            <div class="req-main">
              <div class="req-title">
                <strong>{{ item.remark || `${item.subject}家教需求` }}</strong>
                <em><img src="/images/home/badge-check.svg" width="14" height="14" alt="" />手机已验证</em>
              </div>
              <div class="req-meta">
                <span>
                  <img src="/images/home/map-pin-muted.svg" width="14" height="14" alt="" />
                  {{ demandCity(item.district) }}
                </span>
                <span>
                  <img src="/images/home/clock.svg" width="13" height="13" alt="" />
                  {{ item.schedule || "时间可议" }}
                </span>
              </div>
            </div>
            <div class="req-budget">
              <b>{{ item.budget }}元/时</b>
              <span>{{ relativeAgo(item.createdAt) }}</span>
            </div>
            <span class="req-go" aria-hidden="true">
              <img src="/images/home/arrow-up-right.svg" width="17" height="17" alt="" />
            </span>
          </article>
          <el-empty v-if="!loading && !demands.length" description="暂无开放中的学员需求" />
        </div>
      </div>
    </section>

    <section class="band">
      <div class="wrap">
        <header class="block-head">
          <div>
            <p class="kicker"><i />HOW IT WORKS</p>
            <h2>四步，找到合拍的音乐老师</h2>
            <p>不绕弯、不代收费，把选择权交给老师与学员家庭。</p>
          </div>
        </header>
        <div class="steps">
          <article v-for="step in steps" :key="step.no" class="step">
            <div class="step-top">
              <span class="step-icon" :style="{ background: step.wash }">
                <img :src="`/images/home/${step.icon}.svg`" width="22" height="22" alt="" />
              </span>
              <span class="step-no">{{ step.no }}</span>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span v-if="step.arrow" class="step-arrow">
              <img src="/images/home/arrow-right-white.svg" width="14" height="14" alt="" />
            </span>
          </article>
        </div>
      </div>
    </section>

    <section class="explore">
      <div class="wrap">
        <header class="block-head">
          <div>
            <p class="kicker"><i />EXPLORE</p>
            <h2>按科目、按城市，都能更快找到</h2>
            <p>从钢琴到声乐、吉他与民乐，优先发现离你近、时间合适的老师。</p>
          </div>
        </header>
        <div class="explore-grid">
          <div class="subject-panel">
            <div class="panel-head">
              <strong>热门科目</strong>
              <button type="button" @click="goTeachers()">查看全部科目 →</button>
            </div>
            <div class="subject-grid">
              <button
                v-for="item in subjectsGrid"
                :key="item.name"
                type="button"
                class="subject-card"
                @click="goTeachers(item.name)"
              >
                <span class="subject-icon" :style="{ background: item.wash }">
                  <img :src="`/images/home/${item.icon}.svg`" width="21" height="21" alt="" />
                </span>
                <span>
                  <b>{{ item.name }}</b>
                  <small>{{ item.count }}</small>
                </span>
                <img src="/images/home/chevron-right.svg" width="15" height="15" alt="" />
              </button>
            </div>
          </div>
          <div class="area-panel">
            <div class="area-copy">
              <strong>热门授课城市</strong>
              <p>全国覆盖，优先匹配同城老师</p>
            </div>
            <div class="area-grid">
              <button
                v-for="area in areas"
                :key="area.name"
                type="button"
                :class="['area', { active: area.active }]"
                @click="goCity(area.path)"
              >
                <span>
                  <img
                    :src="area.active ? '/images/home/map-pin-white.svg' : '/images/home/map-pin-soft.svg'"
                    width="14"
                    height="14"
                    alt=""
                  />
                  {{ area.name }}
                </span>
                <small>{{ area.count }}</small>
              </button>
            </div>
            <p class="locate">
              <img src="/images/home/navigation.svg" width="16" height="16" alt="" />
              可在顶部切换定位城市，筛选附近老师
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="band safety">
      <div class="wrap safety-grid">
        <div class="safety-photo">
          <img src="/images/home/safety.png" alt="学员与老师沟通" />
          <div class="safety-float">
            <span><img src="/images/home/shield-check-green.svg" width="22" height="22" alt="" /></span>
            <div>
              <b>让沟通更放心</b>
              <small>审核 · 隐私 · 举报处理</small>
            </div>
          </div>
        </div>
        <div>
          <p class="kicker"><i />SAFETY FIRST</p>
          <h2>信息更透明，选择更安心</h2>
          <p class="sub">我们尽力做好信息审核与风险提示，但试听、授课和交易仍需双方独立判断。</p>
          <div class="safe-grid">
            <article v-for="item in safeguards" :key="item.title">
              <span><img :src="`/images/home/${item.icon}.svg`" width="19" height="19" alt="" /></span>
              <div>
                <b>{{ item.title }}</b>
                <p>{{ item.desc }}</p>
              </div>
            </article>
          </div>
          <div class="safe-actions">
            <button type="button" class="soft-btn" @click="router.push('/legal/agreement')">
              <img src="/images/home/shield.svg" width="18" height="18" alt="" />
              了解平台安全规则
            </button>
            <span>有疑问？工作日 9:00–18:00 在线响应</span>
          </div>
        </div>
      </div>
    </section>

    <section class="stories">
      <div class="wrap">
        <header class="block-head">
          <div>
            <p class="kicker"><i />REAL STORIES</p>
            <h2>来自老师与学员的真实声音</h2>
            <p>一次合拍的音乐课，往往从透明的信息和轻松的沟通开始。</p>
          </div>
        </header>
        <el-empty v-if="!loading && !stories.length" description="暂无学员评价" />
        <div v-else class="story-grid">
          <article v-for="story in stories" :key="story.name + story.quote" :class="{ featured: story.featured }">
            <div class="stars">
              <img
                v-for="n in 5"
                :key="n"
                :src="story.featured ? '/images/home/star-white.svg' : '/images/home/star.svg'"
                width="14"
                height="14"
                alt=""
              />
              <img
                class="quote"
                :src="story.featured ? '/images/home/quote-white.svg' : '/images/home/quote.svg'"
                width="26"
                height="26"
                alt=""
              />
            </div>
            <p>{{ story.quote }}</p>
            <div class="who">
              <img :src="story.avatar" alt="" />
              <div>
                <b>{{ story.name }}</b>
                <small>{{ story.role }}</small>
              </div>
              <em><img src="/images/home/badge-check.svg" width="14" height="14" alt="" />真实体验</em>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="cta band">
      <div class="wrap">
        <h2>今天，就从一次坦诚沟通开始</h2>
        <p>无论你在找音乐老师，还是想利用所长帮助学员，都能免费发布信息。</p>
        <div class="cta-grid">
          <article class="parent">
            <span class="cta-icon"><img src="/images/home/users-white.svg" width="31" height="31" alt="" /></span>
            <div>
              <small>I'M A STUDENT</small>
              <h3>告诉我们，你想学什么乐器</h3>
              <p>发布需求后，合适的同城或线上老师可以主动联系你。</p>
              <button type="button" @click="router.push('/demand/publish')">
                <img src="/images/home/arrow-blue.svg" width="18" height="18" alt="" />
                免费发布学琴需求
              </button>
            </div>
          </article>
          <article class="tutor-cta">
            <span class="cta-icon light"><img src="/images/home/cap-orange.svg" width="31" height="31" alt="" /></span>
            <div>
              <small>I'M A TUTOR</small>
              <h3>让全国学员看见你的专长</h3>
              <p>完善教学资料，按城市与时间在「找学生」中筛选真实需求。</p>
              <button type="button" class="orange" @click="router.push('/teacher/join')">
                <img src="/images/home/arrow-white.svg" width="18" height="18" alt="" />
                免费入驻成为老师
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.home {
  color: #13233b;
  background: #fff;
}

.wrap {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.hero {
  background: linear-gradient(168deg, #f8fbff 10%, #eaf5ff 57%, #fff2e9 91%);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 680px) minmax(280px, 1fr);
  gap: 64px;
  align-items: center;
  padding: 68px 0 70px;
}

.trust-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 13px;
  border: 1px solid #e6ecf5;
  border-radius: 999px;
  background: #fff;
  color: #33445d;
  font-size: 13px;
  font-weight: 700;
}

h1 {
  margin: 24px 0 0;
  font-size: 58px;
  line-height: 1.17;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.lead {
  max-width: 620px;
  margin: 24px 0 0;
  color: #33445d;
  font-size: 18px;
  line-height: 1.7;
}

.search {
  margin-top: 24px;
  padding: 12px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(23, 72, 136, 0.14);
}

.search-row {
  display: flex;
  align-items: center;
  min-height: 58px;
}

.cond {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  height: 58px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.cond-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #eaf2ff;
  flex-shrink: 0;
}

.cond-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  small {
    color: #718096;
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    color: #13233b;
    font-size: 15px;
    font-weight: 700;
  }
}

.split {
  width: 1px;
  height: 34px;
  background: #e6ecf5;
}

.search-btn {
  display: grid;
  place-items: center;
  width: 72px;
  height: 52px;
  border: 0;
  border-radius: 16px;
  background: #2878ff;
  cursor: pointer;
  flex-shrink: 0;
}

.menu {
  position: absolute;
  z-index: 5;
  top: calc(100% + 6px);
  left: 8px;
  min-width: 160px;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 36px rgba(27, 59, 112, 0.12);

  li {
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;

    &:hover {
      background: #eaf2ff;
      color: #1658d7;
    }
  }
}

.hot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 4px 0;
  color: #718096;
  font-size: 12px;
  font-weight: 700;
}

.chip {
  height: 34px;
  padding: 0 14px;
  border: 1px solid #e6ecf5;
  border-radius: 999px;
  background: #fff;
  color: #33445d;
  font-size: 13px;
  cursor: pointer;

  &.solid,
  &.on {
    border-color: #2878ff;
    background: #2878ff;
    color: #fff;
  }

  &.warm:not(.on) {
    background: #fff1e6;
    color: #d76254;
  }
}

.hints {
  display: flex;
  gap: 20px;
  margin-top: 24px;
  color: #718096;
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.hero-photo {
  position: relative;
  height: 560px;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 12px 18px rgba(27, 59, 112, 0.08);

  .cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.float {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 12px 36px rgba(27, 59, 112, 0.08);
}

.match {
  left: 22px;
  bottom: 22px;
  width: 226px;
  padding: 16px;
  border-radius: 18px;
}

.match-top,
.match-body,
.speed {
  display: flex;
  align-items: center;
}

.match-top {
  justify-content: space-between;
  font-size: 13px;
  font-weight: 800;

  em {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #178765;
    font-size: 10px;
    font-style: normal;
    font-weight: 400;

    i {
      width: 7px;
      height: 7px;
      border-radius: 99px;
      background: #178765;
    }
  }
}

.match-body {
  gap: 10px;
  margin-top: 10px;

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    object-fit: cover;
  }

  b,
  small {
    display: block;
  }

  b {
    font-size: 13px;
  }

  small {
    margin-top: 2px;
    color: #718096;
    font-size: 10px;
  }
}

.speed {
  top: 22px;
  right: 18px;
  gap: 8px;
  padding: 10px 13px;
  border-radius: 14px;

  b,
  small {
    display: block;
  }

  b {
    font-size: 13px;
  }

  small {
    color: #718096;
    font-size: 10px;
  }
}

.zap {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: #fff1e6;
}

.stats-wrap {
  padding: 40px 0;
  background: #fff;
}

.stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-radius: 24px;
  background: #112137;
  color: #fff;
}

.stats-lead {
  width: 220px;

  strong {
    font-size: 20px;
    font-weight: 800;
  }

  p {
    margin: 7px 0 0;
    color: #b8c8dc;
    font-size: 12px;
    line-height: 1.5;
  }
}

.stat {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 205px;

  b,
  small,
  > div span {
    display: block;
  }

  b {
    font-size: 23px;
    font-weight: 800;
  }

  > div span {
    margin-top: 2px;
    color: #d9e3f0;
    font-size: 12px;
    font-weight: 700;
  }

  small {
    margin-top: 2px;
    color: #8095ad;
    font-size: 10px;
  }
}

.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #243a57;

  img {
    display: block;
    width: 20px;
    height: 20px;
  }
}

.band {
  padding: 88px 0;
  background: #f7faff;
}

.block-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 34px;

  h2 {
    margin: 10px 0 0;
    font-size: 38px;
    line-height: 1.25;
    font-weight: 700;
  }

  p:last-child {
    margin: 10px 0 0;
    color: #718096;
    font-size: 16px;
    line-height: 1.7;
  }
}

.kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #2878ff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;

  i {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #ff9d57;
  }
}

.more {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: #2878ff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.tutor-grid,
.steps,
.story-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.story-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tutor {
  display: flex;
  flex-direction: column;
  min-height: 420px;
  border-radius: 24px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(27, 59, 112, 0.08);
}

.tutor-photo {
  position: relative;
  height: 184px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.pop {
  position: absolute;
  top: 14px;
  left: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.91);
  font-size: 10px;
  font-weight: 700;
}

.tutor-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 13px;
  padding: 18px;
}

.name-row,
.meta,
.price-row,
.req-title,
.req-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.name-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  strong {
    font-size: 19px;
  }

  em {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 9px;
    border-radius: 999px;
    background: #ddf8ee;
    color: #178765;
    font-size: 11px;
    font-style: normal;
    font-weight: 700;
    white-space: nowrap;
  }
}

.heart,
.req-go {
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 99px;
  background: #f7faff;
  cursor: pointer;
}

.heart {
  width: 32px;
  height: 32px;
  flex-shrink: 0;

  &.on {
    background: #ffe4ea;
  }
}

.cred {
  margin: 0;

  b,
  span {
    display: block;
  }

  b {
    color: #2878ff;
    font-size: 13px;
  }

  span {
    margin-top: 3px;
    color: #718096;
    font-size: 12px;
  }
}

.subject-pill {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border: 1px solid #e6ecf5;
  border-radius: 999px;
  font-size: 13px;
  color: #33445d;
}

.meta {
  color: #718096;
  font-size: 11px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
}

.price-row {
  margin-top: auto;
  padding-top: 5px;

  b {
    color: #d76254;
    font-size: 17px;
  }
}

.chat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  border: 0;
  border-radius: 99px;
  background: #2878ff;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.requests {
  padding: 88px 0;
  background: #fff;
}

.request-layout {
  display: grid;
  grid-template-columns: 355px minmax(0, 1fr);
  gap: 54px;
  align-items: start;
}

.request-intro {
  h2 {
    margin: 22px 0 0;
    font-size: 38px;
    line-height: 1.25;
    font-weight: 800;
  }

  p {
    margin: 22px 0 0;
    color: #718096;
    font-size: 15px;
    line-height: 1.7;
  }
}

.scene {
  width: 100%;
  height: 188px;
  margin-top: 22px;
  border-radius: 24px;
  object-fit: cover;
  display: block;
}

.soft-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  margin-top: 22px;
  padding: 0 22px;
  border: 0;
  border-radius: 999px;
  background: #eaf2ff;
  color: #1658d7;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.request-status {
  display: flex;
  justify-content: space-between;
  padding: 0 4px 12px;
  color: #33445d;
  font-size: 13px;

  em {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #178765;
    font-size: 11px;
    font-style: normal;

    i {
      width: 7px;
      height: 7px;
      border-radius: 99px;
      background: #178765;
    }
  }
}

.request {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding: 18px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 36px rgba(27, 59, 112, 0.08);
  cursor: pointer;
}

.req-badge {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: #eaf2ff;
  text-align: center;
  flex-shrink: 0;

  b {
    color: #2878ff;
    font-size: 12px;
  }

  span {
    color: #718096;
    font-size: 10px;
  }
}

.req-main {
  flex: 1;
  min-width: 0;
}

.req-title strong {
  overflow: hidden;
  font-size: 16px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.req-title em,
.who em {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  background: #ddf8ee;
  color: #178765;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  white-space: nowrap;
}

.req-meta {
  justify-content: flex-start;
  gap: 16px;
  margin-top: 7px;
  color: #718096;
  font-size: 11px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
}

.req-budget {
  width: 130px;
  text-align: right;

  b {
    display: block;
    color: #d76254;
    font-size: 15px;
    font-weight: 800;
  }

  span {
    color: #718096;
    font-size: 10px;
  }
}

.req-go {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.steps {
  gap: 18px;
}

.step {
  position: relative;
  min-height: 205px;
  padding: 22px;
  border-radius: 24px;
  background: #fff;

  h3 {
    margin: 17px 0 0;
    font-size: 19px;
  }

  p {
    margin: 17px 0 0;
    color: #718096;
    font-size: 13px;
    line-height: 1.65;
  }
}

.step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
}

.step-no {
  color: #718096;
  font-size: 13px;
  font-weight: 700;
}

.step-arrow {
  position: absolute;
  top: 50%;
  right: -14px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 99px;
  background: #2878ff;
  transform: translateY(-50%);
}

.explore {
  padding: 88px 0;
  background: #fff;
}

.explore-grid {
  display: grid;
  grid-template-columns: 736px minmax(0, 1fr);
  gap: 28px;
}

.subject-panel,
.area-panel {
  border-radius: 24px;
  padding: 28px;
}

.subject-panel {
  background: #f7faff;
}

.panel-head,
.area-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;

  strong {
    font-size: 18px;
  }

  button {
    border: 0;
    background: transparent;
    color: #2878ff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
}

.subject-grid,
.area-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.subject-card {
  display: flex;
  align-items: center;
  gap: 13px;
  width: calc(33.33% - 8px);
  height: 92px;
  padding: 15px;
  border: 0;
  border-radius: 16px;
  background: #fff;
  text-align: left;
  cursor: pointer;

  b,
  small {
    display: block;
  }

  b {
    font-size: 15px;
  }

  small {
    margin-top: 4px;
    color: #718096;
    font-size: 11px;
  }
}

.subject-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  flex-shrink: 0;
}

.area-panel {
  position: relative;
  overflow: hidden;
  background: #112137;
  color: #fff;

  &::after {
    content: "";
    position: absolute;
    right: -70px;
    bottom: -80px;
    width: 240px;
    height: 240px;
    border-radius: 999px;
    background: #1e4a7a;
    opacity: 0.6;
  }
}

.area-copy {
  position: relative;
  z-index: 1;
  display: block;

  p {
    margin: 7px 0 0;
    color: #9fb1c7;
    font-size: 12px;
  }
}

.area-grid {
  position: relative;
  z-index: 1;
  gap: 10px;
}

.area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(50% - 5px);
  height: 48px;
  padding: 0 14px;
  border: 0;
  border-radius: 13px;
  background: #203650;
  color: #fff;
  cursor: pointer;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 700;
  }

  small {
    color: #8195ab;
    font-size: 10px;
  }

  &.active {
    background: #2878ff;

    small {
      color: #ddeaff;
    }
  }
}

.locate {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 0 0;
  color: #b7c5d6;
  font-size: 11px;
}

.safety-grid {
  display: grid;
  grid-template-columns: 456px minmax(0, 1fr);
  gap: 56px;
  align-items: center;
}

.safety-photo {
  position: relative;
  height: 474px;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 12px 18px rgba(27, 59, 112, 0.08);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.safety-float {
  position: absolute;
  left: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 11px;
  width: 280px;
  padding: 15px;
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 12px 36px rgba(27, 59, 112, 0.08);

  span {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: #ddf8ee;
  }

  b,
  small {
    display: block;
  }

  small {
    margin-top: 3px;
    color: #718096;
    font-size: 10px;
  }
}

.safety h2 {
  margin: 10px 0 0;
  font-size: 38px;
  line-height: 1.25;
}

.sub {
  max-width: 650px;
  margin: 10px 0 0;
  color: #718096;
  font-size: 15px;
  line-height: 1.7;
}

.safe-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;

  article {
    display: flex;
    gap: 13px;
    width: calc(50% - 7px);
    min-height: 108px;
    padding: 16px;
    border-radius: 16px;
    background: #fff;
  }

  span {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 13px;
    background: #eaf2ff;
    flex-shrink: 0;
  }

  b {
    font-size: 14px;
  }

  p {
    margin: 5px 0 0;
    color: #718096;
    font-size: 11px;
    line-height: 1.55;
  }
}

.safe-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 28px;

  .soft-btn {
    margin-top: 0;
  }

  span {
    color: #718096;
    font-size: 12px;
  }
}

.stories {
  padding: 88px 0;
  background: #fff;
}

.story-grid article {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 278px;
  padding: 24px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 12px 36px rgba(27, 59, 112, 0.08);

  p {
    margin: 0;
    color: #33445d;
    font-size: 15px;
    line-height: 1.75;
  }

  &.featured {
    background: #2878ff;

    p,
    b {
      color: #fff;
    }

    small {
      color: #c9ddff;
    }

    em {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }
  }
}

.stars {
  display: flex;
  align-items: center;
  gap: 3px;

  .quote {
    margin-left: auto;
  }
}

.who {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;

  img {
    width: 44px;
    height: 44px;
    border-radius: 99px;
    object-fit: cover;
  }

  b,
  small {
    display: block;
  }

  b {
    font-size: 13px;
  }

  small {
    margin-top: 3px;
    color: #718096;
    font-size: 10px;
  }

  em {
    margin-left: auto;
    height: 22px;
    font-size: 9px;
  }
}

.cta {
  text-align: center;

  h2 {
    margin: 0;
    font-size: 34px;
  }

  > .wrap > p {
    margin: 8px 0 0;
    color: #718096;
    font-size: 14px;
  }
}

.cta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 26px;
  text-align: left;
}

.parent,
.tutor-cta {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 205px;
  padding: 30px;
  overflow: hidden;
  border-radius: 32px;
}

.parent {
  background: #2878ff;
  color: #fff;

  &::after {
    content: "";
    position: absolute;
    top: -72px;
    right: -60px;
    width: 210px;
    height: 210px;
    border-radius: 999px;
    background: #5a9aff;
    opacity: 0.55;
  }

  small {
    color: #cfe0ff;
  }

  p {
    color: #dde9ff;
  }

  button {
    background: #fff;
    color: #1658d7;
  }
}

.tutor-cta {
  background: #fff1e6;

  &::after {
    content: "";
    position: absolute;
    right: -54px;
    bottom: -85px;
    width: 220px;
    height: 220px;
    border-radius: 999px;
    background: #ffd3b5;
    opacity: 0.8;
  }

  small {
    color: #d76254;
  }

  h3 {
    color: #13233b;
  }

  p {
    color: #33445d;
  }
}

.cta-icon {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.14);
  flex-shrink: 0;

  &.light {
    background: #fff;
  }
}

.parent > div,
.tutor-cta > div {
  position: relative;
  z-index: 1;

  small {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  h3 {
    margin: 10px 0 0;
    font-size: 25px;
  }

  p {
    margin: 10px 0 0;
    font-size: 12px;
    line-height: 1.55;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 48px;
    margin-top: 10px;
    padding: 0 22px;
    border: 1px solid #e6ecf5;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;

    &.orange {
      border-color: transparent;
      background: #ff9d57;
      color: #fff;
    }
  }
}

@media (max-width: 1100px) {
  h1 {
    font-size: 42px;
  }

  .hero-grid,
  .request-layout,
  .explore-grid,
  .safety-grid,
  .cta-grid {
    grid-template-columns: 1fr;
  }

  .hero-photo,
  .safety-photo {
    height: 420px;
  }

  .tutor-grid,
  .steps {
    grid-template-columns: 1fr 1fr;
  }

  .stats {
    flex-wrap: wrap;
  }

  .stat,
  .stats-lead {
    width: calc(50% - 12px);
  }

  .subject-card,
  .area {
    width: calc(50% - 6px);
  }

  .step-arrow {
    display: none;
  }
}

@media (max-width: 720px) {
  .hero-grid {
    padding: 32px 0 48px;
  }

  h1,
  .block-head h2,
  .request-intro h2,
  .safety h2 {
    font-size: 30px;
  }

  .search-row,
  .request,
  .name-line {
    flex-wrap: wrap;
  }

  .split {
    display: none;
  }

  .search-btn {
    width: 100%;
    margin-top: 8px;
  }

  .cond {
    width: 100%;
    flex: none;
  }

  .tutor-grid,
  .steps,
  .story-grid,
  .safe-grid article,
  .subject-card,
  .area,
  .stat,
  .stats-lead {
    width: 100%;
    grid-template-columns: 1fr;
  }

  .tutor-grid,
  .steps,
  .story-grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  .req-budget {
    width: auto;
    text-align: left;
  }

  .band,
  .requests,
  .explore,
  .stories {
    padding: 56px 0;
  }
}
</style>


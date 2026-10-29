<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import GenderIcon from '@/components/common/GenderIcon.vue'
import type { Teacher } from '@/types'
import { TEACH_MODE_MAP } from '@/constants'
import { formatRegions, splitRegionPath } from '@/utils/region'
import { resolveAvatar } from '@/utils'

const props = withDefaults(
  defineProps<{
    teacher: Teacher
    /** portrait：首页竖向；compact：紧凑横向；list：搜索结果横向 */
    variant?: 'portrait' | 'compact' | 'list'
  }>(),
  { variant: 'portrait' },
)

const router = useRouter()

const FOCUS_TAGS = ['计算基础', '应用题思路', '几何与空间', '学习习惯', '阅读表达', '兴趣启蒙', '考级辅导']

const subjectStage = computed(() => {
  const sub = props.teacher.subjects.slice(0, 2).join(' / ') || '综合辅导'
  const stages = (props.teacher.stages || []).join('、')
  if (stages) return `${sub} · ${stages}`
  return sub
})

const headline = computed(() => {
  const text = (props.teacher.introduction || props.teacher.experience || '').trim()
  if (!text) return '耐心沟通，从了解孩子当前学习情况开始。'
  const cut = text.split(/[。！？\n]/)[0] || text
  return cut.length > 36 ? `${cut.slice(0, 36)}…` : cut
})

const snippet = computed(() => {
  const text = (props.teacher.introduction || props.teacher.experience || '').trim()
  if (!text) return '先查看资料，再决定是否联系沟通。'
  const rest = text.replace(headline.value, '').replace(/^[。！？\s]+/, '')
  const body = rest || text
  return body.length > 48 ? `${body.slice(0, 48)}…` : body
})

const focusTags = computed(() => {
  const blob = `${props.teacher.introduction || ''} ${props.teacher.experience || ''}`
  const matched = FOCUS_TAGS.filter((tag) => blob.includes(tag))
  if (matched.length) return matched.slice(0, 3)
  return props.teacher.subjects.slice(0, 3)
})

const placeText = computed(() => {
  const paths = props.teacher.districts || []
  if (!paths.length) return `全国可约 · ${TEACH_MODE_MAP[props.teacher.teachMode] || '线上 / 线下'}`
  const short = paths
    .map((path) => {
      const parts = splitRegionPath(path)
      if (parts.length >= 3) {
        const city = parts[1].replace(/市$/, '')
        return `${city} · ${parts[2]}`
      }
      if (parts.length === 2) return parts[1].replace(/市$/, '') || parts[0]
      return parts[0] || path
    })
    .slice(0, 1)
    .join('')
  const mode =
    props.teacher.teachMode === 'online'
      ? '仅线上'
      : props.teacher.teachMode === 'offline'
        ? '线下'
        : '线上 / 线下'
  return `${short} · ${mode}`
})

const timesText = computed(() => {
  const times = props.teacher.availableTimes || []
  if (!times.length) return '可沟通时间待确认'
  return times.slice(0, 2).join('；')
})

function goDetail(id: string) {
  router.push(`/teachers/${id}`)
}
</script>

<template>
  <article
    :class="['teacher-card', `is-${variant}`]"
    @click="goDetail(teacher.id)"
  >
    <template v-if="variant === 'list'">
      <div class="list-photo">
        <img
          :src="resolveAvatar(teacher.avatar, teacher.gender)"
          :alt="teacher.name"
          @error="($event.target as HTMLImageElement).src = resolveAvatar(undefined, teacher.gender)"
        />
      </div>

      <div class="list-body">
        <div class="list-name-row">
          <h3 class="list-name">{{ teacher.name }}</h3>
        </div>
        <p class="list-focus">{{ subjectStage }}</p>
        <div class="list-copy">
          <p class="list-headline">{{ headline }}</p>
          <p class="list-snippet">{{ snippet }}</p>
        </div>
        <div class="list-tags">
          <span v-for="tag in focusTags" :key="tag">{{ tag }}</span>
        </div>
        <p class="list-place">
          <img src="/images/home/figma/map-pin-fig.svg" width="14" height="14" alt="" />
          {{ placeText }}
        </p>
      </div>

      <div class="list-aside">
        <div class="list-times">
          <p class="times-label">可约时间</p>
          <p class="times-value">{{ timesText }}</p>
        </div>
        <div class="list-cta">
          <button type="button" class="detail-btn" @click.stop="goDetail(teacher.id)">
            查看资料
            <img src="/images/home/arrow-right-white.svg" width="17" height="17" alt="" />
          </button>
          <p class="cta-hint">先了解，再决定是否联系</p>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'portrait'">
      <div class="cover">
        <img
          :src="resolveAvatar(teacher.avatar, teacher.gender)"
          :alt="teacher.name"
          class="cover-img"
          @error="($event.target as HTMLImageElement).src = resolveAvatar(undefined, teacher.gender)"
        />
      </div>
      <div class="body">
        <div class="name-row">
          <h3 class="name">{{ teacher.name }}</h3>
          <span v-if="teacher.status === 'approved'" class="verified">已认证</span>
        </div>
        <div class="tags">
          <el-tag v-for="s in teacher.subjects.slice(0, 3)" :key="s" size="small" effect="plain">
            {{ s }}
          </el-tag>
        </div>
        <p class="meta-line">
          <span>{{ TEACH_MODE_MAP[teacher.teachMode] }}</span>
          <span>·</span>
          <span>{{ formatRegions(teacher.districts) }}</span>
        </p>
        <p class="intro">{{ teacher.introduction }}</p>
        <div class="card-foot">
          <div class="price">
            <em>¥{{ teacher.price }}</em>
            <span>/课时</span>
          </div>
          <el-button type="primary" round size="small" @click.stop="goDetail(teacher.id)">
            查看详情
          </el-button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="card-top">
        <img
          :src="resolveAvatar(teacher.avatar, teacher.gender)"
          :alt="teacher.name"
          class="avatar"
          @error="($event.target as HTMLImageElement).src = resolveAvatar(undefined, teacher.gender)"
        />
        <div class="meta">
          <h3 class="name-row">
            <span class="name">{{ teacher.name }}</span>
            <GenderIcon
              v-if="teacher.gender === 'male' || teacher.gender === 'female'"
              :gender="teacher.gender"
              class="gender"
            />
            <span v-if="teacher.age" class="age">{{ teacher.age }}岁</span>
          </h3>
          <div class="tags">
            <el-tag v-for="s in teacher.subjects" :key="s" size="small" effect="plain">{{ s }}</el-tag>
          </div>
        </div>
        <div class="price">
          <em>¥{{ teacher.price }}</em>
          <span>/课时</span>
        </div>
      </div>
      <p class="intro">{{ teacher.introduction }}</p>
      <div class="card-foot compact-foot">
        <span>{{ formatRegions(teacher.districts) }}</span>
        <span>{{ TEACH_MODE_MAP[teacher.teachMode] }}</span>
        <span>★ {{ teacher.rating }} ({{ teacher.reviewCount }})</span>
      </div>
    </template>
  </article>
</template>

<style scoped lang="scss">
.teacher-card {
  background: $color-white;
  border: 1px solid rgba(0, 26, 61, 0.06);
  border-radius: $radius-lg;
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.25s;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-3px);
  }
}

/* —— list：勿用裸 .list，会与页内列表容器的 scoped 样式互相串扰 —— */
.teacher-card.is-list {
  --teal: #13857d;
  --ink: #173b3d;
  --muted: #687e7e;
  --line: #dce8e3;
  --mint: #eaf6f1;
  --soft: #f3f7f4;

  flex-direction: row;
  align-items: center;
  gap: 22px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 20px;
  height: auto;
  min-height: 0;

  &:hover {
    transform: none;
    box-shadow: 0 10px 28px rgba(23, 59, 61, 0.06);
  }
}

.list-photo {
  position: relative;
  width: 136px;
  height: 174px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--soft);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.list-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.list-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.list-name {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
  white-space: nowrap;
}

.list-focus {
  margin: 0;
  color: var(--teal);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.list-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.list-headline {
  margin: 0;
  color: var(--ink);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.65;
}

.list-snippet {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;

  span {
    padding: 5px 11px;
    border-radius: 6px;
    background: var(--mint);
    color: var(--teal);
    font-size: 12px;
    font-weight: 700;
  }
}

.list-place {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.list-aside {
  width: 154px;
  height: 174px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
}

.list-times {
  width: 100%;
  text-align: right;
}

.times-label {
  margin: 0 0 7px;
  color: var(--muted);
  font-size: 11px;
}

.times-value {
  margin: 0;
  color: var(--ink);
  font-size: 12px;
  line-height: 1.8;
}

.list-cta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.detail-btn {
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
}

.cta-hint {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .teacher-card.is-list {
    flex-wrap: wrap;
  }

  .list-aside {
    width: 100%;
    height: auto;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .list-times {
    text-align: left;
  }

  .list-cta {
    align-items: flex-end;
  }
}

@media (max-width: 640px) {
  .list-photo {
    width: 100%;
    height: 200px;
  }

  .list-aside {
    flex-direction: column;
    align-items: stretch;
  }

  .list-cta {
    align-items: stretch;
  }

  .detail-btn {
    width: 100%;
  }
}

/* —— portrait —— */
.teacher-card.is-portrait {
  .cover {
    position: relative;
    aspect-ratio: 4 / 3;
    background: linear-gradient(145deg, $color-primary-light, #f0f4f8);
    overflow: hidden;
  }

  .cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .body {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }

  .name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $color-text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .verified {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    color: $color-success;
    background: rgba(82, 196, 26, 0.12);
    padding: 2px 8px;
    border-radius: 999px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .meta-line {
    margin: 0;
    font-size: 12px;
    color: $color-text-secondary;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .intro {
    margin: 0;
    font-size: 13px;
    color: $color-text-secondary;
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
  }

  .card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 10px;
    margin-top: auto;
    border-top: 1px solid rgba(0, 26, 61, 0.06);
  }

  .price {
    em {
      font-style: normal;
      color: #f5222d;
      font-size: 18px;
      font-weight: 700;
    }

    span {
      font-size: 12px;
      color: $color-text-secondary;
      margin-left: 2px;
    }
  }
}

/* —— compact —— */
.teacher-card.is-compact {
  padding: 16px;
  gap: 12px;
  border-radius: $radius-md;

  .card-top {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: $color-primary-light;
    flex-shrink: 0;
    object-fit: cover;
  }

  .meta {
    flex: 1;
    min-width: 0;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px;
    font-size: 16px;
    min-width: 0;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gender {
    font-size: 15px;
  }

  .age {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 500;
    color: $color-text-secondary;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .price {
    text-align: right;
    flex-shrink: 0;

    em {
      font-style: normal;
      color: $color-accent;
      font-size: 18px;
      font-weight: 700;
    }

    span {
      display: block;
      font-size: 12px;
      color: $color-text-secondary;
    }
  }

  .intro {
    margin: 0;
    font-size: 13px;
    color: $color-text-secondary;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
  }

  .compact-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    font-size: 12px;
    color: $color-text-secondary;
    padding-top: 8px;
    border-top: 1px dashed $color-border;
  }
}
</style>

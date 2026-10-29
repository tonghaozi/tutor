<script setup lang="ts">
import { useRouter } from 'vue-router'
import GenderIcon from '@/components/common/GenderIcon.vue'
import type { Teacher } from '@/types'
import { TEACH_MODE_MAP } from '@/constants'
import { formatRegions } from '@/utils/region'
import { resolveAvatar } from '@/utils'

withDefaults(
  defineProps<{
    teacher: Teacher
    /** portrait：首页竖向卡片；compact：列表紧凑横向 */
    variant?: 'portrait' | 'compact'
  }>(),
  { variant: 'portrait' },
)

const router = useRouter()

function goDetail(id: string) {
  router.push(`/teachers/${id}`)
}
</script>

<template>
  <article
    :class="['teacher-card', variant]"
    @click="goDetail(teacher.id)"
  >
    <template v-if="variant === 'portrait'">
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

/* —— portrait —— */
.portrait {
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
.compact {
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

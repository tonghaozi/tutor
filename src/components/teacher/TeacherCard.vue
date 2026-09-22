<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Teacher } from '@/types'
import { TEACH_MODE_MAP } from '@/constants'

defineProps<{
  teacher: Teacher
}>()

const router = useRouter()

function goDetail(id: string) {
  router.push(`/teachers/${id}`)
}
</script>

<template>
  <article class="teacher-card" @click="goDetail(teacher.id)">
    <div class="card-top">
      <img :src="teacher.avatar" :alt="teacher.name" class="avatar" />
      <div class="meta">
        <h3>{{ teacher.name }}</h3>
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
    <div class="card-foot">
      <span>{{ teacher.districts.join(' / ') }}</span>
      <span>{{ TEACH_MODE_MAP[teacher.teachMode] }}</span>
      <span>★ {{ teacher.rating }} ({{ teacher.reviewCount }})</span>
    </div>
  </article>
</template>

<style scoped lang="scss">
.teacher-card {
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }
}

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
}

.meta {
  flex: 1;
  min-width: 0;

  h3 {
    margin: 0 0 8px;
    font-size: 16px;
  }
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
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 12px;
  color: $color-text-secondary;
  padding-top: 8px;
  border-top: 1px dashed $color-border;
}
</style>

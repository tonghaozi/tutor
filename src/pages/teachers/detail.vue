<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ConsultDialog from '@/components/teacher/ConsultDialog.vue'
import { apiGetComments, apiGetTeacherDetail } from '@/api'
import { TEACH_MODE_MAP } from '@/constants'
import { formatDate } from '@/utils'
import type { Comment, Teacher } from '@/types'

const route = useRoute()
const router = useRouter()
const teacher = ref<Teacher | null>(null)
const comments = ref<Comment[]>([])
const loading = ref(false)
const consultOpen = ref(false)

const id = computed(() => route.params.id as string)

async function load() {
  loading.value = true
  try {
    teacher.value = await apiGetTeacherDetail(id.value)
    comments.value = await apiGetComments(id.value)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
    router.replace('/teachers')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div v-loading="loading" class="page-container detail-page">
    <template v-if="teacher">
      <el-button text type="primary" class="back" @click="router.push('/teachers')">← 返回列表</el-button>

      <section class="profile">
        <img :src="teacher.avatar" :alt="teacher.name" class="avatar" />
        <div class="info">
          <h1>{{ teacher.name }}</h1>
          <div class="tags">
            <el-tag v-for="s in teacher.subjects" :key="s" effect="plain">{{ s }}</el-tag>
            <el-tag type="warning" effect="plain">{{ TEACH_MODE_MAP[teacher.teachMode] }}</el-tag>
          </div>
          <p class="price">课时价 <em>¥{{ teacher.price }}</em> / 课时</p>
          <p class="area">授课区域：{{ teacher.districts.join('、') }}</p>
          <p class="rating">评分 ★ {{ teacher.rating }} · {{ teacher.reviewCount }} 条评价</p>
          <el-button type="primary" size="large" @click="consultOpen = true">咨询预约</el-button>
        </div>
      </section>

      <section class="block">
        <h2>教学介绍</h2>
        <p>{{ teacher.introduction }}</p>
        <p class="sub">教学经历：{{ teacher.experience }}</p>
      </section>

      <section class="block">
        <h2>证书展示</h2>
        <div class="certs">
          <el-tag v-for="c in teacher.certificates" :key="c" type="success" effect="plain">{{ c }}</el-tag>
          <span v-if="!teacher.certificates.length" class="muted">暂无证书</span>
        </div>
      </section>

      <section class="block">
        <h2>可授课时间</h2>
        <ul>
          <li v-for="t in teacher.availableTimes" :key="t">{{ t }}</li>
        </ul>
      </section>

      <section class="block">
        <h2>学员评价</h2>
        <div class="comments">
          <article v-for="c in comments" :key="c.id" class="comment">
            <div class="comment-head">
              <strong>{{ c.userName }}</strong>
              <span>★ {{ c.rating }}</span>
              <span class="muted">{{ formatDate(c.createdAt) }}</span>
            </div>
            <p>{{ c.content }}</p>
          </article>
          <el-empty v-if="!comments.length" description="暂无评价" />
        </div>
      </section>

      <ConsultDialog
        v-model="consultOpen"
        :teacher-id="teacher.id"
        :teacher-name="teacher.name"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.back {
  margin-bottom: 8px;
}

.profile {
  display: flex;
  gap: 24px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 24px;
  margin-bottom: 16px;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: $color-primary-light;
  flex-shrink: 0;
}

.info {
  h1 {
    margin: 0 0 10px;
    font-size: 26px;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.price {
  margin: 0 0 6px;

  em {
    font-style: normal;
    color: $color-accent;
    font-size: 24px;
    font-weight: 700;
  }
}

.area,
.rating {
  margin: 0 0 8px;
  color: $color-text-secondary;
  font-size: 14px;
}

.block {
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 20px;
  margin-bottom: 12px;

  h2 {
    margin: 0 0 12px;
    font-size: 17px;
  }

  p {
    margin: 0;
    line-height: 1.7;
    color: $color-text;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    line-height: 1.9;
    color: $color-text-secondary;
  }
}

.sub {
  margin-top: 10px !important;
  color: $color-text-secondary !important;
}

.certs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.muted {
  color: $color-text-secondary;
  font-size: 13px;
}

.comments {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment {
  padding: 12px 0;
  border-bottom: 1px dashed $color-border;

  &:last-child {
    border-bottom: none;
  }

  p {
    margin-top: 6px !important;
  }
}

.comment-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
}

@media (max-width: $breakpoint-md) {
  .profile {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

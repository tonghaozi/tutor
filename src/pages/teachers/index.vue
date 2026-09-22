<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import TeacherCard from '@/components/teacher/TeacherCard.vue'
import TeacherFilter from '@/components/teacher/TeacherFilter.vue'
import { apiGetTeachers } from '@/api'
import type { Teacher, TeacherFilter as FilterType } from '@/types'

const route = useRoute()
const list = ref<Teacher[]>([])
const loading = ref(false)
const filter = reactive<FilterType>({
  keyword: '',
  subject: '',
  district: '',
  teachMode: '',
  priceMin: null,
  priceMax: null,
})

async function load(payload: FilterType = filter) {
  loading.value = true
  try {
    list.value = await apiGetTeachers(payload)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  filter.keyword = (route.query.keyword as string) || ''
  filter.subject = (route.query.subject as any) || ''
  filter.district = (route.query.district as any) || ''
  filter.teachMode = (route.query.teachMode as any) || ''
  load()
})
</script>

<template>
  <div class="page-container teachers-page">
    <h1 class="section-title">找老师</h1>
    <p class="section-desc">多维度筛选合肥本地已审核老师，点击卡片查看详情并咨询预约。</p>

    <TeacherFilter v-model="filter" @search="load" />

    <div v-loading="loading" class="card-grid">
      <TeacherCard v-for="t in list" :key="t.id" :teacher="t" />
    </div>
    <el-empty v-if="!loading && !list.length" description="没有符合条件的老师" />
  </div>
</template>

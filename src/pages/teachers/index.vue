<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import TeacherCard from '@/components/teacher/TeacherCard.vue'
import TeacherFilter from '@/components/teacher/TeacherFilter.vue'
import { apiGetTeachers } from '@/api'
import { useAppStore } from '@/store'
import type { Teacher, TeacherFilter as FilterType } from '@/types'

const route = useRoute()
const appStore = useAppStore()
const list = ref<Teacher[]>([])
const loading = ref(false)
const filter = reactive<FilterType>({
  keyword: '',
  subject: '',
  district: appStore.regionPath,
  teachMode: '',
  priceMin: null,
  priceMax: null,
})

async function load(payload: FilterType = filter) {
  loading.value = true
  try {
    list.value = await apiGetTeachers({
      ...payload,
      district: payload.district || appStore.regionPath,
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  filter.keyword = (route.query.keyword as string) || ''
  filter.subject = (route.query.subject as any) || ''
  filter.teachMode = (route.query.teachMode as any) || ''
  const queryDistrict = (route.query.district as string) || ''
  if (queryDistrict) {
    filter.district = queryDistrict
  } else {
    filter.district = appStore.regionPath
  }
  load()
})
</script>

<template>
  <div class="page-container teachers-page">
    <h1 class="section-title">找老师</h1>
    <p class="section-desc">
      当前定位 {{ appStore.cityLabel }}，可在顶部切换城市，下方点选区县筛选已审核老师。
    </p>

    <TeacherFilter v-model="filter" @search="load" />

    <div v-loading="loading" class="card-grid">
      <TeacherCard v-for="t in list" :key="t.id" :teacher="t" />
    </div>
    <el-empty v-if="!loading && !list.length" description="没有符合条件的老师" />
  </div>
</template>

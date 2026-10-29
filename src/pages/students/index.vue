<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import DemandCard from '@/components/demand/DemandCard.vue'
import DemandFilterBar from '@/components/demand/DemandFilter.vue'
import { apiGetDemands } from '@/api'
import { useAppStore } from '@/store'
import type { Demand, DemandFilter } from '@/types'

const route = useRoute()
const appStore = useAppStore()
const list = ref<Demand[]>([])
const loading = ref(false)
const filter = reactive<DemandFilter>({
  keyword: '',
  subject: '',
  district: appStore.regionPath,
  teachMode: '',
  budgetMin: null,
  budgetMax: null,
})

async function load(payload: DemandFilter = filter) {
  loading.value = true
  try {
    list.value = await apiGetDemands({
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
  filter.district = queryDistrict || appStore.regionPath
  const min = Number(route.query.budgetMin)
  const max = Number(route.query.budgetMax)
  filter.budgetMin = Number.isFinite(min) ? min : null
  filter.budgetMax = Number.isFinite(max) ? max : null
  load()
})
</script>

<template>
  <div class="page-container students-page">
    <h1 class="section-title">找学生</h1>
    <p class="section-desc">
      当前定位 {{ appStore.cityLabel }}，可按科目、城市与授课方式筛选全国真实学员需求。
    </p>

    <DemandFilterBar v-model="filter" @search="load" />

    <div v-loading="loading" class="card-grid">
      <DemandCard v-for="item in list" :key="item.id" :demand="item" />
    </div>
    <el-empty v-if="!loading && !list.length" description="没有符合条件的学员需求" />
  </div>
</template>

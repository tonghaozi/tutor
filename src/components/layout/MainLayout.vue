<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import RiskNotice from './RiskNotice.vue'
</script>

<template>
  <div class="main-layout">
    <AppHeader class="layout-header" />
    <main class="main-content">
      <RouterView />
      <RiskNotice />
      <AppFooter />
    </main>
  </div>
</template>

<style scoped lang="scss">
.main-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-header {
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>

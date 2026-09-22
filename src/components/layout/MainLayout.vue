<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import RiskNotice from './RiskNotice.vue'
</script>

<template>
  <div class="main-layout">
    <AppHeader />
    <main class="main-content">
      <RouterView />
    </main>
    <RiskNotice />
    <AppFooter />
  </div>
</template>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 20px 0 32px;
}
</style>

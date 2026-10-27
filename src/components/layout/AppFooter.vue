<script setup lang="ts">
import { APP_NAME } from '@/constants'
</script>

<template>
  <footer class="app-footer">
    <div class="page-container footer-inner">
      <div class="footer-brand">
        <div class="brand-row">
          <img class="brand-logo" src="/logo/logo.png" :alt="APP_NAME" />
          <strong>{{ APP_NAME }}</strong>
        </div>
        <p>全国音乐家教信息撮合平台 · 吉他 / 钢琴 / 民乐 / 西洋乐等，支持省市区筛选</p>
      </div>
      <div class="footer-links">
        <router-link to="/legal/agreement">用户协议</router-link>
        <router-link to="/legal/privacy">隐私政策</router-link>
        <router-link to="/teachers">找老师</router-link>
        <router-link to="/teacher/join">老师入驻</router-link>
      </div>
      <p class="copyright">© 童浩工作室 2026</p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  background: #1f2a37;
  color: rgba(255, 255, 255, 0.78);
  padding: 18px 0 14px;
}

.footer-inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.brand-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
  display: block;
}

.footer-brand strong {
  color: #fff;
  font-size: 16px;
}

.footer-brand p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  a {
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;

    &:hover {
      color: $color-accent;
    }
  }
}

.copyright {
  margin: 0;
  font-size: 12px;
  opacity: 0.65;
}
</style>

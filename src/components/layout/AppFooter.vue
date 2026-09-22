<script setup lang="ts">
import { APP_NAME } from '@/constants'
</script>

<template>
  <footer class="app-footer">
    <div class="page-container footer-inner">
      <div class="footer-brand">
        <strong>{{ APP_NAME }}</strong>
        <p>合肥同城信息撮合平台 · 主打吉他家教，可扩展文化课</p>
      </div>
      <div class="footer-links">
        <router-link to="/legal/agreement">用户协议</router-link>
        <router-link to="/legal/privacy">隐私政策</router-link>
        <router-link to="/teachers">找老师</router-link>
        <router-link to="/teacher/join">老师入驻</router-link>
      </div>
      <p class="copyright">© {{ new Date().getFullYear() }} {{ APP_NAME }} MVP · 仅供演示</p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  background: #1f2a37;
  color: rgba(255, 255, 255, 0.78);
  padding: 36px 0 24px;
}

.footer-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-brand strong {
  display: block;
  color: #fff;
  font-size: 16px;
  margin-bottom: 8px;
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

<script setup lang="ts">
import { APP_NAME, APP_SLOGAN } from '@/constants'

const findLinks = [
  { label: '小学家教', to: '/teachers?stage=小学' },
  { label: '初中家教', to: '/teachers?stage=初中' },
  { label: '高中家教', to: '/teachers?stage=高中' },
  { label: '音乐家教', to: '/teachers?stage=音乐' },
]

const tutorLinks = [
  { label: '浏览学员需求', to: '/students' },
  { label: '完善教师资料', to: '/teacher/join' },
  { label: '资料填写指南', to: '/teacher/join' },
  { label: '信息发布规范', to: '/legal/agreement' },
]

const aboutLinks = [
  { label: '平台说明', to: '/' },
  { label: '常见问题', to: '/legal/agreement' },
  { label: '联系与反馈', to: '/legal/agreement' },
]

const safetyLinks = [
  { label: '安全指南', to: '/legal/agreement' },
  { label: '隐私政策', to: '/legal/privacy' },
  { label: '用户协议', to: '/legal/agreement' },
  { label: '反馈与举报', to: '/legal/agreement' },
]
</script>

<template>
  <footer class="app-footer">
    <div class="page-container footer-main">
      <div class="brand">
        <div class="brand-row">
          <img class="brand-logo" src="/logo/logo.png" :alt="APP_NAME" />
          <span class="brand-text">
            <strong>{{ APP_NAME }}</strong>
            <em>{{ APP_SLOGAN }}</em>
          </span>
        </div>
        <p>让每个学习阶段，都有更多合适的选择。<br />小学 · 初中 · 高中 · 音乐，全国信息撮合。</p>
      </div>

      <div class="col">
        <h4>找老师</h4>
        <router-link v-for="item in findLinks" :key="item.label" :to="item.to">{{ item.label }}</router-link>
      </div>
      <div class="col">
        <h4>我是老师</h4>
        <router-link v-for="item in tutorLinks" :key="item.label" :to="item.to">{{ item.label }}</router-link>
      </div>
      <div class="col">
        <h4>了解同号</h4>
        <router-link v-for="item in aboutLinks" :key="item.label" :to="item.to">{{ item.label }}</router-link>
      </div>
      <div class="col">
        <h4>安全与规则</h4>
        <router-link v-for="item in safetyLinks" :key="item.label" :to="item.to">{{ item.label }}</router-link>
      </div>
    </div>
    <div class="page-container copyright">
      <div class="copy-left">
        <p>© 2026 {{ APP_NAME }}</p>
        <a
          class="icp"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
        >皖ICP备2026038156号-1</a>
      </div>
      <p>平台仅提供信息撮合，不构成教学效果承诺；请自行核实对方身份与资料。</p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  background: #153e3d;
  color: #c2d8d2;
}

.footer-main {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  padding-top: 48px;
  padding-bottom: 35px;
}

.brand {
  width: 350px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 11px;
}

.brand-logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
  display: block;
  border-radius: 14px;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-row strong {
  color: #fff;
  font-size: 23px;
  line-height: 1.2;
}

.brand-row em {
  color: #c2d8d2;
  font-size: 10px;
  font-style: normal;
}

.brand p {
  margin: 18px 0 0;
  font-size: 12px;
  line-height: 1.9;
}

.col {
  width: 155px;

  h4 {
    margin: 0 0 13px;
    color: #fff;
    font-size: 13px;
  }

  a {
    display: block;
    margin-top: 13px;
    color: #c2d8d2;
    font-size: 11px;
    text-decoration: none;

    &:hover {
      color: #fff;
    }
  }
}

.copyright {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding-top: 22px;
  padding-bottom: 24px;
  border-top: 1px solid #365b56;
  color: #c2d8d2;
  font-size: 10px;

  p {
    margin: 0;
  }
}

.copy-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.icp {
  color: #c2d8d2;
  text-decoration: none;

  &:hover {
    color: #fff;
  }
}

@media (max-width: 900px) {
  .footer-main,
  .copyright {
    flex-direction: column;
  }

  .brand,
  .col {
    width: auto;
  }
}
</style>

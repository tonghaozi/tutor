<script setup lang="ts">
import { APP_NAME, APP_SLOGAN } from '@/constants'

const findLinks = [
  { label: '吉他家教', to: '/teachers?keyword=吉他' },
  { label: '钢琴家教', to: '/teachers?keyword=钢琴' },
  { label: '声乐辅导', to: '/teachers?keyword=声乐' },
  { label: '民乐启蒙', to: '/teachers?keyword=古筝' },
]

const tutorLinks = [
  { label: '老师入驻', to: '/teacher/join' },
  { label: '找学生', to: '/students' },
  { label: '资料完善指南', to: '/teacher/join' },
  { label: '授课安全须知', to: '/legal/agreement' },
]

const aboutLinks = [
  { label: '关于我们', to: '/' },
  { label: '平台规则', to: '/legal/agreement' },
  { label: '隐私保护', to: '/legal/privacy' },
  { label: '投诉与建议', to: '/legal/agreement' },
]
</script>

<template>
  <footer class="app-footer">
    <div class="page-container footer-main">
      <div class="brand">
        <div class="brand-row">
          <img class="brand-logo" src="/logo/logo.png" :alt="APP_NAME" />
          <strong>{{ APP_NAME }}</strong>
        </div>
        <p>{{ APP_SLOGAN }}，连接全国学员与音乐老师。平台仅提供信息撮合，不参与课时收费与教学质量担保。</p>
        <div class="contacts">
          <span>
            <img src="/images/home/phone.svg" width="15" height="15" alt="" />
            18655188242
          </span>
          <span>
            <img src="/images/home/mail.svg" width="15" height="15" alt="" />
            369948488@qq.com
          </span>
        </div>
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
        <h4>关于平台</h4>
        <router-link v-for="item in aboutLinks" :key="item.label" :to="item.to">{{ item.label }}</router-link>
      </div>

      <div class="wechat">
        <h4>微信服务号</h4>
        <div class="qr">
          <img src="/images/home/wechat-qr.png" width="80" height="80" alt="微信服务号二维码" />
        </div>
        <p>扫码获取需求提醒</p>
      </div>
    </div>
    <div class="page-container copyright">
      <p>© 童浩工作室 2026 · {{ APP_NAME }}</p>
      <div>
        <router-link to="/legal/agreement">用户协议</router-link>
        <router-link to="/legal/privacy">隐私政策</router-link>
        <router-link to="/legal/privacy">未成年人保护</router-link>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  background: #112137;
  color: #93a5bb;
}

.footer-main {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  padding-top: 58px;
  padding-bottom: 48px;
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
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
  filter: brightness(1.05);
}

.brand-row strong {
  color: #fff;
  font-size: 20px;
}

.brand p,
.wechat p {
  margin: 16px 0 0;
  font-size: 12px;
  line-height: 1.7;
}

.contacts {
  display: flex;
  gap: 18px;
  margin-top: 16px;
  color: #c5d1df;
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.col,
.wechat {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 150px;
}

.wechat {
  width: 170px;
}

h4 {
  margin: 0;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.col a {
  color: #93a5bb;
  font-size: 12px;

  &:hover {
    color: #fff;
  }
}

.qr {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;

  img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    display: block;
  }
}

.wechat p {
  margin: 0;
  font-size: 10px;
}

.copyright {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #29415e;
  padding-top: 22px;
  padding-bottom: 28px;
  color: #71869e;
  font-size: 10px;

  p {
    margin: 0;
  }

  div {
    display: flex;
    gap: 20px;
  }

  a {
    color: #71869e;
  }
}

@media (max-width: $breakpoint-md) {
  .footer-main {
    flex-wrap: wrap;
    padding-top: 36px;
  }

  .brand,
  .col,
  .wechat {
    width: calc(50% - 16px);
  }

  .copyright {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

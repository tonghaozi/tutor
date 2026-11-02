<script setup lang="ts">
import { APP_FEE_NOTICE, APP_NAME } from '@/constants'
</script>

<template>
  <div class="page-container legal-page">
    <h1 class="section-title">用户协议</h1>
    <div class="content">
      <p>欢迎使用{{ APP_NAME }}（以下简称「本平台」）。本平台为全国性综合家教信息撮合服务，不提供支付结算，不担保教学质量。</p>
      <h3>一、服务说明</h3>
      <p>用户可通过本平台发布需求、浏览老师信息、提交入驻申请。具体授课安排、费用与履约由用户自行协商。</p>
      <h3>二、费用与试用说明</h3>
      <p>{{ APP_FEE_NOTICE }}</p>
      <p>若后续开通增值服务，将提前在页面公示；是否购买增值服务不影响基础浏览与合理联系额度。</p>
      <h3>三、用户义务</h3>
      <p>用户应保证所填信息真实、合法，不得利用平台从事违法违规活动。</p>
      <h3>四、免责声明</h3>
      <p>因线下教学、人身财产安全、费用纠纷等产生的争议，由相关方自行解决，平台不承担责任。</p>
      <p class="muted">正式运营前建议结合实际业务由专业人士审核完善本协议。</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.content {
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 24px;
  line-height: 1.8;
  color: $color-text;

  h3 {
    margin: 20px 0 8px;
    font-size: 16px;
  }

  p {
    margin: 0 0 8px;
  }
}

.muted {
  margin-top: 20px !important;
  color: $color-text-secondary;
  font-size: 13px;
}
</style>

<template>
  <div class="page-container legal-page">
    <h1 class="section-title">用户协议</h1>
    <div class="content">
      <p>欢迎使用合肥同城家教平台（以下简称「本平台」）。本平台为同城家教信息撮合服务，不提供支付结算，不担保教学质量。</p>
      <h3>一、服务说明</h3>
      <p>用户可通过本平台发布需求、浏览老师信息、提交入驻申请。具体授课安排、费用与履约由用户自行协商。</p>
      <h3>二、用户义务</h3>
      <p>用户应保证所填信息真实、合法，不得利用平台从事违法违规活动。</p>
      <h3>三、免责声明</h3>
      <p>因线下教学、人身财产安全、费用纠纷等产生的争议，由相关方自行解决，平台不承担责任。</p>
      <p class="muted">本页为 MVP 演示文案，正式上线前请由法务审核完善。</p>
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

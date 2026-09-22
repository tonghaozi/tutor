<template>
  <div class="page-container legal-page">
    <h1 class="section-title">隐私政策</h1>
    <div class="content">
      <p>我们重视您的个人信息保护。本演示项目仅将数据保存在浏览器本地（localStorage），不会上传至服务器。</p>
      <h3>一、收集的信息</h3>
      <p>可能包括手机号、姓名、需求内容、老师入驻资料及评价信息，用于撮合展示与后台管理演示。</p>
      <h3>二、信息使用</h3>
      <p>用于账号登录、信息展示、审核管理。演示环境不会向第三方共享。</p>
      <h3>三、您的权利</h3>
      <p>您可随时清除浏览器本地存储以删除演示数据。</p>
      <p class="muted">本页为 MVP 演示文案，正式上线前请补充完整隐私条款。</p>
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

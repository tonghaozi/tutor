<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="risk-notice">
    <div class="page-container risk-inner">
      <span class="risk-icon">
        <img src="/images/home/alert.svg" width="21" height="21" alt="" />
      </span>
      <div class="risk-copy">
        <strong>温馨提示：请谨慎核验身份，不要提前支付大额费用</strong>
        <p>
          本平台仅提供音乐家教信息撮合服务，不参与双方交易、不收取课时费，也不对教学结果作承诺。建议在公共场所或有监护人陪同的环境中首次见面，拒绝任何“保证金”“培训费”等异常要求。
        </p>
      </div>
      <button type="button" class="guide" @click="router.push('/legal/agreement')">
        阅读安全指南
        <img src="/images/home/arrow-blue-sm.svg" width="14" height="14" alt="" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.risk-notice {
  background: #fff5e7;
}

.risk-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 22px;
  padding-bottom: 22px;
}

.risk-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #fff1e6;
  flex-shrink: 0;
}

.risk-copy {
  flex: 1;
  min-width: 0;

  strong {
    color: #13233b;
    font-size: 14px;
  }

  p {
    margin: 4px 0 0;
    color: #33445d;
    font-size: 11px;
    line-height: 1.55;
  }
}

.guide {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 99px;
  background: #fff;
  color: #2878ff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

@media (max-width: $breakpoint-md) {
  .risk-inner {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>

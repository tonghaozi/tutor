<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="risk-notice">
    <div class="page-container risk-inner">
      <span class="risk-icon">
        <img src="/images/home/figma/triangle-alert.svg" width="23" height="23" alt="" />
      </span>
      <div class="risk-copy">
        <strong>请谨慎核验身份，不要提前支付大额费用</strong>
        <p>
          平台不参与双方授课与交易，不提供支付结算。请保护个人隐私，拒绝异常转账要求，未成年人应由监护人参与沟通。
        </p>
      </div>
      <button type="button" class="guide" @click="router.push('/legal/agreement')">
        安全指南 ↗
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.risk-notice {
  background: #fff0df;
}

.risk-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 20px;
  padding-bottom: 20px;
}

.risk-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.risk-copy {
  flex: 1;
  min-width: 0;

  strong {
    color: #173b3d;
    font-size: 13px;
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
  height: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #13857d;
  font-size: 12px;
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

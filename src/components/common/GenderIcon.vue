<script setup lang="ts">
import { useId } from 'vue'
import type { UserGender } from '@/types'

defineProps<{
  gender: UserGender
}>()

const uid = useId()
const gradId = `gender-grad-${uid}`
</script>

<template>
  <span class="gender-icon" :class="gender" aria-hidden="true">
    <svg
      v-if="gender === 'male'"
      class="symbol"
      viewBox="0 0 24 24"
      fill="none"
    >
      <defs>
        <linearGradient
          :id="gradId"
          x1="4"
          y1="20"
          x2="20"
          y2="4"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#5BB8FF" />
          <stop offset="1" stop-color="#2A7FD4" />
        </linearGradient>
      </defs>
      <circle
        cx="9.2"
        cy="14.8"
        r="5.2"
        :stroke="`url(#${gradId})`"
        stroke-width="2.2"
      />
      <path
        d="M13.1 10.9L19.2 4.8"
        :stroke="`url(#${gradId})`"
        stroke-width="2.2"
        stroke-linecap="round"
      />
      <path
        d="M14.2 4.6h5.1v5.1"
        :stroke="`url(#${gradId})`"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <svg
      v-else
      class="symbol"
      viewBox="0 0 24 24"
      fill="none"
    >
      <defs>
        <linearGradient
          :id="gradId"
          x1="6"
          y1="2"
          x2="18"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FF8FBE" />
          <stop offset="1" stop-color="#E85A9B" />
        </linearGradient>
      </defs>
      <circle
        cx="12"
        cy="9.2"
        r="5.2"
        :stroke="`url(#${gradId})`"
        stroke-width="2.2"
      />
      <path
        d="M12 14.4V20.2"
        :stroke="`url(#${gradId})`"
        stroke-width="2.2"
        stroke-linecap="round"
      />
      <path
        d="M8.6 17.2h6.8"
        :stroke="`url(#${gradId})`"
        stroke-width="2.2"
        stroke-linecap="round"
      />
    </svg>
  </span>
</template>

<style scoped lang="scss">
.gender-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15em;
  height: 1.15em;
  flex-shrink: 0;
}

.symbol {
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>

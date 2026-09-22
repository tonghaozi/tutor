<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { apiSubmitConsult } from '@/api'
import { useUserStore } from '@/store'

const props = defineProps<{
  modelValue: boolean
  teacherId: string
  teacherName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const userStore = useUserStore()
const loading = ref(false)
const form = reactive({
  name: '',
  phone: '',
  message: '',
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.name = userStore.userInfo?.name || ''
      form.phone = userStore.userInfo?.phone || ''
      form.message = `您好，我想咨询${props.teacherName}老师的课程安排。`
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  if (!form.name.trim() || !/^1\d{10}$/.test(form.phone)) {
    ElMessage.warning('请填写姓名和正确手机号')
    return
  }
  loading.value = true
  try {
    const res = await apiSubmitConsult({
      teacherId: props.teacherId,
      teacherName: props.teacherName,
      name: form.name.trim(),
      phone: form.phone,
      message: form.message.trim(),
    })
    ElMessage.success(res.message)
    close()
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="咨询预约"
    width="480px"
    destroy-on-close
    @close="close"
  >
    <p class="tip">向「{{ teacherName }}」发送咨询，老师将通过手机号与您联系（演示环境不真实发送）。</p>
    <el-form label-width="72px">
      <el-form-item label="姓名" required>
        <el-input v-model="form.name" maxlength="20" placeholder="怎么称呼您" />
      </el-form-item>
      <el-form-item label="手机号" required>
        <el-input v-model="form.phone" maxlength="11" placeholder="方便老师回电" />
      </el-form-item>
      <el-form-item label="留言">
        <el-input v-model="form.message" type="textarea" :rows="3" maxlength="200" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">发送咨询</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.tip {
  margin: 0 0 16px;
  font-size: 13px;
  color: $color-text-secondary;
  line-height: 1.6;
}
</style>

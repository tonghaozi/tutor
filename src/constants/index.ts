import type { Subject, TeachMode } from '@/types'

export const APP_NAME = '同号音乐家教'

export const APP_SLOGAN = '全国音乐家教信息撮合'

export const SUBJECTS: Subject[] = [
  '吉他',
  '尤克里里',
  '钢琴',
  '电子琴',
  '声乐',
  '小提琴',
  '大提琴',
  '古筝',
  '二胡',
  '琵琶',
  '笛子',
  '萨克斯',
  '长笛',
  '单簧管',
  '架子鼓',
  '非洲鼓',
  '口琴',
  '音乐理论',
  '视唱练耳',
]

export const TEACH_MODE_OPTIONS: { label: string; value: TeachMode }[] = [
  { label: '上门', value: 'offline' },
  { label: '线上', value: 'online' },
  { label: '均可', value: 'both' },
]

export const TEACH_MODE_MAP: Record<TeachMode, string> = {
  offline: '上门',
  online: '线上',
  both: '上门/线上',
}

export const AUDIT_STATUS_MAP = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

/** 演示管理员账号 */
export const ADMIN_PHONE = '18800000000'

import type { Stage, Subject, TeachMode } from '@/types'

export const APP_NAME = '同号家教'

export const APP_SLOGAN = '全国综合家教平台'

/** 费用与试用说明（页脚、协议等处复用） */
export const APP_FEE_NOTICE =
  '当前为免费试用期：浏览、发布与基础联系功能免费开放。后续可能对置顶曝光、认证标识等增值服务收费；基础信息撮合将保留免费额度。平台始终不收取课时费。'

export const STAGES: Stage[] = ['小学', '初中', '高中', '音乐']

export const SUBJECTS_BY_STAGE: Record<Stage, Subject[]> = {
  小学: ['语文', '数学', '英语'],
  初中: ['语文', '数学', '英语', '物理', '化学'],
  高中: ['数学', '物理', '化学', '语文', '英语', '生物'],
  音乐: ['钢琴', '吉他', '声乐', '小提琴', '音乐理论', '古筝', '架子鼓', '尤克里里'],
}

export const GRADES_BY_STAGE: Record<Stage, string[]> = {
  小学: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  初中: ['初一', '初二', '初三'],
  高中: ['高一', '高二', '高三'],
  音乐: ['启蒙', '兴趣', '进阶', '考级'],
}

export const SUBJECTS: Subject[] = [
  '语文',
  '数学',
  '英语',
  '物理',
  '化学',
  '生物',
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
  { label: '线下', value: 'offline' },
  { label: '线上', value: 'online' },
  { label: '线上或线下均可', value: 'both' },
]

export const TEACH_MODE_MAP: Record<TeachMode, string> = {
  offline: '线下',
  online: '线上',
  both: '线上或线下均可',
}

export const AUDIT_STATUS_MAP = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

/** 演示管理员账号 */
export const ADMIN_PHONE = '18800000000'

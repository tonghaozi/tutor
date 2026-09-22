import type { Comment } from '@/types'

export const mockComments: Comment[] = [
  {
    id: 'c1',
    teacherId: 't1',
    userName: '学员小雨',
    content: '老师很耐心，从零基础教起，现在已经能弹唱两首歌了。',
    rating: 5,
    createdAt: '2026-03-01T10:00:00.000Z',
    visible: true,
  },
  {
    id: 'c2',
    teacherId: 't1',
    userName: '家长刘女士',
    content: '孩子很喜欢上吉他课，节奏安排合理，推荐蜀山区上门。',
    rating: 5,
    createdAt: '2026-02-20T14:00:00.000Z',
    visible: true,
  },
  {
    id: 'c3',
    teacherId: 't2',
    userName: '阿杰',
    content: '林老师弹奏示范很专业，上门教学方便。',
    rating: 5,
    createdAt: '2026-02-28T09:00:00.000Z',
    visible: true,
  },
  {
    id: 'c4',
    teacherId: 't3',
    userName: '小鱼',
    content: '线上课体验不错，课后视频点评很细致。',
    rating: 4,
    createdAt: '2026-03-05T20:00:00.000Z',
    visible: true,
  },
  {
    id: 'c5',
    teacherId: 't4',
    userName: '家长陈先生',
    content: '吉他和文化课一起辅导，对孩子帮助很大。',
    rating: 5,
    createdAt: '2026-03-08T11:00:00.000Z',
    visible: true,
  },
]

import { request } from '@/lib/http'
import { getDeviceId } from '@/utils/smsLimit'

export type TrackProps = Record<string, string | number | boolean | null | undefined>

const QUEUE_KEY = 'tonghao_track_queue'
const FLUSH_MS = 2500
const MAX_QUEUE = 40

type TrackItem = {
  event: string
  path?: string
  props?: TrackProps
  ts: number
}

let flushTimer: ReturnType<typeof setTimeout> | null = null
let flushing = false

function readQueue(): TrackItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(items: TrackItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)))
  } catch {
    // ignore quota errors
  }
}

async function flush() {
  if (flushing) return
  const items = readQueue()
  if (!items.length) return
  flushing = true
  writeQueue([])
  try {
    await request<{ ok: boolean }>('/events', {
      method: 'POST',
      data: {
        deviceId: getDeviceId(),
        events: items.map((item) => ({
          event: item.event,
          path: item.path || '',
          props: item.props || {},
          ts: item.ts,
        })),
      },
    })
  } catch {
    // 失败回写，下次再试
    writeQueue([...readQueue(), ...items].slice(-MAX_QUEUE))
  } finally {
    flushing = false
  }
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flush()
  }, FLUSH_MS)
}

/** 业务埋点：本地排队后批量上报，失败会重试 */
export function track(event: string, props?: TrackProps, path?: string) {
  const name = String(event || '').trim()
  if (!name) return
  const item: TrackItem = {
    event: name.slice(0, 64),
    path: (path || (typeof window !== 'undefined' ? window.location.pathname : '')).slice(0, 255),
    props,
    ts: Date.now(),
  }
  writeQueue([...readQueue(), item])
  scheduleFlush()
}

export function trackPageView(path: string, title?: string) {
  track('page_view', title ? { title } : undefined, path)
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    void flush()
  })
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush()
  })
}

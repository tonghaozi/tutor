import { regionData as rawRegionData } from 'element-china-area-data'

export interface RegionOption {
  value: string
  label: string
  children?: RegionOption[]
}

function mapNodes(nodes: Array<{ label: string; value?: string | number; children?: any[] }> = []): RegionOption[] {
  return nodes.map((node) => ({
    value: node.label,
    label: node.label,
    children: node.children?.length ? mapNodes(node.children) : undefined,
  }))
}

/** 省市区级联选项（value/label 均为中文名） */
export const REGION_OPTIONS: RegionOption[] = mapNodes(rawRegionData as any)

/** 仅省市两级，用于头部定位 */
export const CITY_OPTIONS: RegionOption[] = REGION_OPTIONS.map((province) => ({
  value: province.value,
  label: province.label,
  children: (province.children || []).map((city) => ({
    value: city.value,
    label: city.label,
  })),
}))

export const REGION_SEPARATOR = '/'

const MUNICIPALITIES = new Set(['北京市', '上海市', '天津市', '重庆市'])

export function joinRegionPath(path: string[] = []) {
  return path.filter(Boolean).join(REGION_SEPARATOR)
}

export function splitRegionPath(path = '') {
  return path
    .split(REGION_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)
}

/** 展示用：安徽省/合肥市/蜀山区 → 安徽省 · 合肥市 · 蜀山区 */
export function formatRegion(path = '') {
  const parts = splitRegionPath(path)
  return parts.length ? parts.join(' · ') : path
}

export function formatRegions(paths: string[] = []) {
  return paths.map(formatRegion).join(' / ')
}

/** 头部展示的城市名（直辖市显示省名） */
export function cityDisplayName(province = '', city = '') {
  if (!province && !city) return '选择城市'
  if (MUNICIPALITIES.has(province)) return province
  return city || province
}

export function findCityNode(province: string, city: string) {
  const provinceNode = REGION_OPTIONS.find((item) => item.value === province)
  if (!provinceNode) return null
  return (provinceNode.children || []).find((item) => item.value === city) || null
}

/** 当前市下的区县列表 */
export function getDistrictsOfCity(province: string, city: string) {
  const cityNode = findCityNode(province, city)
  return (cityNode?.children || []).map((item) => item.label)
}

export function buildCityPath(province: string, city: string) {
  return joinRegionPath([province, city])
}

export function buildDistrictPath(province: string, city: string, district: string) {
  return joinRegionPath([province, city, district])
}

/** 筛选匹配：支持省、省市、省市区前缀，兼容旧数据仅区名 */
export function regionMatches(teacherRegions: string[] = [], filter = '') {
  const target = filter.trim()
  if (!target) return true
  const targetLeaf = splitRegionPath(target).slice(-1)[0] || target
  return teacherRegions.some((region) => {
    const value = (region || '').trim()
    if (!value) return false
    if (value === target || value.startsWith(`${target}${REGION_SEPARATOR}`) || target.startsWith(`${value}${REGION_SEPARATOR}`)) {
      return true
    }
    return value === targetLeaf || value.endsWith(`${REGION_SEPARATOR}${targetLeaf}`)
  })
}

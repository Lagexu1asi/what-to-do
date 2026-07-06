import { useState, useEffect, useCallback } from 'react'

/**
 * useLocalStorage —— 将状态同步持久化到 localStorage 的自定义 Hook
 * @param {string} key - 存储键名
 * @param {*} initialValue - 初始值(无缓存数据时使用)
 * @returns {[any, Function]} [当前值, 设置函数]
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  // 值变化时写回 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* 存储满或隐私模式下静默忽略 */
    }
  }, [key, value])

  return [value, setValue]
}

/**
 * getTodayKey —— 返回当天日期字符串(YYYY-MM-DD),用于每日重置判断
 * @returns {string}
 */
export function getTodayKey() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * formatDateZh —— 将日期格式化为中文显示(7月6日 周一)
 * @returns {string}
 */
export function formatDateZh() {
  const d = new Date()
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${week[d.getDay()]}`
}

/**
 * daysBetween —— 计算两个日期字符串(YYYY-MM-DD)之间的整天天数差
 * @param {string} dateStr - 起始日期
 * @returns {number} 距今天数(今天减去该日期)
 */
function daysBetween(dateStr) {
  if (!dateStr) return Infinity
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const past = new Date(dateStr)
  past.setHours(0, 0, 0, 0)
  return Math.round((today - past) / (1000 * 60 * 60 * 24))
}

/**
 * isDueToday —— 根据周期与最后执行日期,判断某项家务今日是否到期
 * 从未执行过(lastDone 为 null)视为到期
 * 若设置了 nextDueOverride(预设下次执行日期),则按该日期判定:今天 >= 预设日即到期
 * @param {number} interval - 执行周期天数
 * @param {string|null} lastDone - 最后执行日期 'YYYY-MM-DD'
 * @param {string|null} nextDueOverride - 预设的下次执行日期 'YYYY-MM-DD'(可选)
 * @returns {boolean}
 */
export function isDueToday(interval, lastDone, nextDueOverride) {
  if (nextDueOverride) return daysBetween(nextDueOverride) >= 0
  if (!lastDone) return true
  return daysBetween(lastDone) >= interval
}

/**
 * getNextDueDate —— 计算下次到期日期字符串
 * 若设置了 nextDueOverride,直接返回预设日期;否则按 lastDone + interval 计算
 * @param {number} interval - 执行周期天数
 * @param {string|null} lastDone - 最后执行日期
 * @param {string|null} nextDueOverride - 预设的下次执行日期(可选)
 * @returns {string} 下次到期日期 'YYYY-MM-DD',未执行过则返回今天
 */
export function getNextDueDate(interval, lastDone, nextDueOverride) {
  if (nextDueOverride) return nextDueOverride
  if (!lastDone) return getTodayKey()
  const past = new Date(lastDone)
  past.setDate(past.getDate() + interval)
  const m = String(past.getMonth() + 1).padStart(2, '0')
  const day = String(past.getDate()).padStart(2, '0')
  return `${past.getFullYear()}-${m}-${day}`
}

/**
 * formatDateShort —— 将 'YYYY-MM-DD' 格式为 'M月D日' 中文显示
 * @param {string|null} dateStr
 * @returns {string}
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '从未执行'
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/**
 * describeInterval —— 将天数周期转换为人类可读描述
 * @param {number} days
 * @returns {string}
 */
export function describeInterval(days) {
  if (days === 1) return '每日'
  if (days === 7) return '每周'
  if (days === 14) return '每2周'
  if (days === 28) return '每4周'
  if (days === 30) return '每月'
  if (days === 90) return '每3月'
  if (days === 180) return '每半年'
  if (days % 7 === 0) return `每${days / 7}周`
  return `每${days}天`
}

/**
 * getDayStatus —— 判断某日期相对今天的状态
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {'past'|'today'|'future'} 过期/今日/未来
 */
export function getDayStatus(dateStr) {
  if (!dateStr) return 'future'
  const diff = daysBetween(dateStr)
  if (diff > 0) return 'past'
  if (diff === 0) return 'today'
  return 'future'
}

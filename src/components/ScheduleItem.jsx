import { useState } from 'react'
import { INTERVAL_PRESETS } from '../data/defaults'
import { describeInterval, formatDateShort, isDueToday, getNextDueDate, getTodayKey } from '../hooks/useLocalStorage'
import './ScheduleItem.css'

/**
 * ScheduleItem —— 单条家务周期设定项,可编辑周期、查看最后执行时间与下次到期
 * @param {Object} props
 * @param {Object} props.chore - 家务项 { id, title, category, interval, lastDone, nextDueOverride }
 * @param {Function} props.onIntervalChange - 修改周期回调 (id, interval) => void
 * @param {Function} props.onMarkDone - 标记为今日已执行(更新 lastDone)回调
 * @param {Function} props.onToggle - 撤销今日执行(恢复 lastDone)回调
 * @param {Function} props.onResetLastDone - 清除最后执行时间回调
 * @param {Function} props.onPresetNextDue - 预设下次执行日期 (id, 'YYYY-MM-DD') => void
 * @param {Function} props.onClearNextDue - 清除预设下次执行日期 (id) => void
 * @param {Function} props.onDelete - 删除回调
 */
export default function ScheduleItem({ chore, onIntervalChange, onMarkDone, onToggle, onResetLastDone, onPresetNextDue, onClearNextDue, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [customDays, setCustomDays] = useState('')
  // 预设日期输入框的临时值(空字符串表示未输入)
  const [presetDraft, setPresetDraft] = useState('')
  const due = isDueToday(chore.interval, chore.lastDone, chore.nextDueOverride)
  const nextDue = getNextDueDate(chore.interval, chore.lastDone, chore.nextDueOverride)
  const hasOverride = !!chore.nextDueOverride

  /** 应用自定义天数周期 */
  const applyCustom = () => {
    const n = parseInt(customDays, 10)
    if (n > 0 && n <= 365) {
      onIntervalChange(chore.id, n)
      setCustomDays('')
    }
  }

  /** 应用预设下次执行日期(空值不处理) */
  const applyPreset = () => {
    if (!presetDraft) return
    onPresetNextDue(chore.id, presetDraft)
    setPresetDraft('')
  }

  return (
    <li className={`sched-item ${due ? 'sched-item--due' : ''}`}>
      <div className="sched-head" onClick={() => setExpanded((e) => !e)}>
        <div className="sched-head-info">
          <span className="sched-title">{chore.title}</span>
          <span className="sched-cat">{chore.category}</span>
        </div>
        <div className="sched-head-right">
          <span className="sched-interval">{describeInterval(chore.interval)}</span>
          <svg className={`sched-chevron ${expanded ? 'sched-chevron--open' : ''}`} viewBox="0 0 24 24" width="18" height="18">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="sched-meta">
        <div className="sched-meta-item">
          <span className="sched-meta-label">最后执行</span>
          <span className="sched-meta-value">{formatDateShort(chore.lastDone)}</span>
        </div>
        <div className="sched-meta-item">
          <span className="sched-meta-label">下次到期</span>
          <span className={`sched-meta-value ${due ? 'sched-meta-value--due' : ''}`}>
            {formatDateShort(nextDue)}
            {hasOverride && <span className="sched-override-tag">预设</span>}
          </span>
        </div>
        <div className="sched-meta-item">
          <span className="sched-meta-label">今日状态</span>
          <span className={`sched-status-tag ${due ? 'sched-status-tag--due' : 'sched-status-tag--idle'}`}>
            {due ? '待执行' : '未到期'}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="sched-edit">
          <div className="sched-edit-label">执行周期</div>
          <div className="sched-presets">
            {INTERVAL_PRESETS.map((p) => (
              <button
                key={p.days}
                className={`sched-preset ${chore.interval === p.days ? 'sched-preset--active' : ''}`}
                onClick={() => onIntervalChange(chore.id, p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="sched-custom">
            <input
              type="number"
              min="1"
              max="365"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="自定义天数"
              className="sched-custom-input"
            />
            <button className="sched-custom-btn" onClick={applyCustom} disabled={!customDays}>
              应用
            </button>
          </div>

          {/* 预设下次执行日期:覆盖按周期计算的下次到期,一次性(标记已执行后自动清除) */}
          <div className="sched-edit-label">预设下次执行</div>
          {hasOverride ? (
            <div className="sched-preset-active">
              <span className="sched-preset-current">
                已设为 {formatDateShort(chore.nextDueOverride)}
              </span>
              <button
                className="sched-act sched-act--del"
                onClick={() => onClearNextDue(chore.id)}
              >
                清除预设
              </button>
            </div>
          ) : (
            <div className="sched-custom">
              <input
                type="date"
                min={getTodayKey()}
                value={presetDraft}
                onChange={(e) => setPresetDraft(e.target.value)}
                className="sched-custom-input"
              />
              <button className="sched-custom-btn" onClick={applyPreset} disabled={!presetDraft}>
                设定
              </button>
            </div>
          )}

          <div className="sched-actions">
            {/* 已完成今日显示撤销按钮,未完成显示标记按钮 */}
            {chore.done ? (
              <button className="sched-act" onClick={() => onToggle(chore.id)}>
                撤销今日执行
              </button>
            ) : (
              <button className="sched-act sched-act--done" onClick={() => onMarkDone(chore.id)}>
                标记今日已执行
              </button>
            )}
            <button className="sched-act" onClick={() => onResetLastDone(chore.id)}>
              清除执行记录
            </button>
            <button className="sched-act sched-act--del" onClick={() => onDelete(chore.id)}>
              删除
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

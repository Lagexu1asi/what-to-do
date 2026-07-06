import { useState } from 'react'
import { formatDateShort, getDayStatus } from '../hooks/useLocalStorage'
import './OneOffItem.css'

/**
 * OneOffItem —— 单次任务项(非周期性),展示标题、执行日期、状态,可勾选完成/删除
 * @param {Object} props
 * @param {Object} props.item - 单次任务 { id, title, category, date, done }
 * @param {Function} props.onToggle - 切换完成状态 (id) => void
 * @param {Function} [props.onDelete] - 删除 (id) => void,不传则不显示删除按钮(待办视图)
 */
export default function OneOffItem({ item, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const status = getDayStatus(item.date)
  // 已完成则不强调"今日到期"
  const dueToday = !item.done && status === 'today'
  const overdue = !item.done && status === 'past'

  /** 状态文案与样式类 */
  const statusInfo = item.done
    ? { text: '已完成', cls: 'oneoff-status--done' }
    : status === 'today'
      ? { text: '今日执行', cls: 'oneoff-status--today' }
      : status === 'past'
        ? { text: '已逾期', cls: 'oneoff-status--overdue' }
        : { text: '未到期', cls: 'oneoff-status--future' }

  return (
    <li
      className={`oneoff-item ${dueToday ? 'oneoff-item--due' : ''} ${item.done ? 'oneoff-item--done' : ''}`}
    >
      <div
        className="oneoff-head"
        onClick={() => onDelete && setExpanded((e) => !e)}
        role={onDelete ? 'button' : undefined}
      >
        <button
          className="oneoff-check"
          onClick={(e) => {
            e.stopPropagation()
            onToggle(item.id)
          }}
          aria-label={item.done ? '标记为未完成' : '标记为已完成'}
        >
          {item.done && (
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M5 12l5 5 9-11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <div className="oneoff-head-info">
          <span className="oneoff-title">{item.title}</span>
          <span className="oneoff-sub">
            <span className="oneoff-cat">{item.category}</span>
            <span className="oneoff-date">{formatDateShort(item.date)}</span>
          </span>
        </div>
        <span className={`oneoff-status ${statusInfo.cls}`}>{statusInfo.text}</span>
      </div>

      {onDelete && expanded && (
        <div className="oneoff-actions">
          <button className="oneoff-act" onClick={() => onToggle(item.id)}>
            {item.done ? '标记未完成' : '标记已完成'}
          </button>
          <button className="oneoff-act oneoff-act--del" onClick={() => onDelete(item.id)}>
            删除
          </button>
        </div>
      )}
    </li>
  )
}

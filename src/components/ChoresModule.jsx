import ProgressBar from './ProgressBar'
import ChoreItem from './ChoreItem'
import OneOffItem from './OneOffItem'
import { isDueToday, getDayStatus } from '../hooks/useLocalStorage'
import './Module.css'

/**
 * ChoresModule —— 家务待办模块:显示今日到期且未完成的家务 + 今日到期的单次任务
 * 家务到期判定:isDueToday(interval, lastDone, nextDueOverride) && !done
 * 单次任务到期判定:getDayStatus(date) === 'today' (或 'past' 视为逾期) && !done
 * @param {Object} props
 * @param {Array} props.chores - 全部家务列表(含 interval/lastDone/done/nextDueOverride)
 * @param {Array} props.oneOffs - 单次任务列表 { id, title, category, date, done }
 * @param {Function} props.onToggle - 切换家务完成(同时更新 lastDone)
 * @param {Function} props.onDelete - 删除家务项(保留接口)
 * @param {Function} props.onReset - 重置今日完成状态(保留接口)
 * @param {Function} props.onToggleOneOff - 切换单次任务完成状态
 * @param {Function} props.onAdd - 打开添加面板
 */
export default function ChoresModule({ chores, oneOffs, onToggle, onDelete, onReset, onToggleOneOff, onAdd }) {
  // 仅显示今日到期且未完成的家务(支持预设下次执行日期覆盖)
  const dueChores = chores.filter((c) => isDueToday(c.interval, c.lastDone, c.nextDueOverride) && !c.done)
  // 今日到期或已逾期且未完成的单次任务,一并显示在待办中
  const dueOneOffs = oneOffs.filter((o) => !o.done && getDayStatus(o.date) !== 'future')
  const todayDoneCount = chores.filter((c) => c.done).length + oneOffs.filter((o) => o.done && getDayStatus(o.date) !== 'future').length
  const totalDue = dueChores.length + dueOneOffs.length + todayDoneCount
  const usedCats = [...new Set(dueChores.map((c) => c.category))]

  return (
    <section className="module">
      <div className="module-summary">
        <ProgressBar
          done={todayDoneCount}
          total={totalDue}
          tone="terracotta"
          label={`今日到期 ${totalDue} 项 · 已完成 ${todayDoneCount}`}
        />
      </div>

      {dueChores.length === 0 && dueOneOffs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✨</span>
          <p>{totalDue > 0 ? '今日任务已全部完成!' : '今日暂无到期的任务'}</p>
        </div>
      ) : (
        <div className="groups">
          {usedCats.map((cat) => {
            const items = dueChores.filter((c) => c.category === cat)
            return (
              <div key={cat} className="group">
                <div className="group-head">
                  <h4 className="group-title">{cat}</h4>
                  <span className="group-count">{items.length} 项待办</span>
                </div>
                <ul className="item-list">
                  {items.map((c) => (
                    <ChoreItem key={c.id} chore={c} onToggle={onToggle} onDelete={onDelete} />
                  ))}
                </ul>
              </div>
            )
          })}

          {/* 今日到期的单次任务,独立分组展示 */}
          {dueOneOffs.length > 0 && (
            <div className="group">
              <div className="group-head">
                <h4 className="group-title">单次任务</h4>
                <span className="group-count">{dueOneOffs.length} 项待办</span>
              </div>
              <ul className="item-list">
                {dueOneOffs.map((o) => (
                  <OneOffItem
                    key={o.id}
                    item={o}
                    onToggle={onToggleOneOff}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button className="fab" onClick={onAdd} aria-label="添加家务">
        <svg viewBox="0 0 24 24" width="26" height="26">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </section>
  )
}

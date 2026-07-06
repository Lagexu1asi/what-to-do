import ScheduleItem from './ScheduleItem'
import OneOffItem from './OneOffItem'
import { isDueToday, getDayStatus } from '../hooks/useLocalStorage'
import './Module.css'
import './ScheduleModule.css'

/**
 * ScheduleModule —— 周期设定模块,含两个子分页:
 *   1. 周期任务:按分类分组,可编辑周期与预设下次执行日期
 *   2. 单次任务:非周期性,设定具体执行日期,执行后不再重复
 * @param {Object} props
 * @param {Array} props.chores - 周期家务列表(含 interval/lastDone/nextDueOverride)
 * @param {Array} props.oneOffs - 单次任务列表 { id, title, category, date, done }
 * @param {string} props.subTab - 子分页 'periodic' | 'oneoff'
 * @param {Function} props.onSubTabChange - 切换子分页
 * @param {Function} props.onIntervalChange - 修改周期
 * @param {Function} props.onMarkDone - 标记今日已执行
 * @param {Function} props.onToggle - 撤销今日执行(恢复 lastDone)
 * @param {Function} props.onResetLastDone - 清除执行记录
 * @param {Function} props.onPresetNextDue - 预设下次执行日期
 * @param {Function} props.onClearNextDue - 清除预设下次执行日期
 * @param {Function} props.onDelete - 删除家务项
 * @param {Function} props.onToggleOneOff - 切换单次任务完成状态
 * @param {Function} props.onDeleteOneOff - 删除单次任务
 * @param {Function} props.onAdd - 打开添加面板
 */
export default function ScheduleModule({
  chores,
  oneOffs,
  subTab,
  onSubTabChange,
  onIntervalChange,
  onMarkDone,
  onToggle,
  onResetLastDone,
  onPresetNextDue,
  onClearNextDue,
  onDelete,
  onToggleOneOff,
  onDeleteOneOff,
  onAdd,
}) {
  const dueCount = chores.filter((c) => isDueToday(c.interval, c.lastDone, c.nextDueOverride)).length
  const usedCats = [...new Set(chores.map((c) => c.category))]

  // 单次任务统计:今日执行数与已逾期数
  const todayOneOffs = oneOffs.filter((o) => !o.done && getDayStatus(o.date) === 'today').length
  const overdueOneOffs = oneOffs.filter((o) => !o.done && getDayStatus(o.date) === 'past').length

  return (
    <section className="module">
      {/* 子分页切换 */}
      <div className="sched-subtabs">
        <button
          className={`sched-subtab ${subTab === 'periodic' ? 'sched-subtab--active' : ''}`}
          onClick={() => onSubTabChange('periodic')}
        >
          周期任务
        </button>
        <button
          className={`sched-subtab ${subTab === 'oneoff' ? 'sched-subtab--active' : ''}`}
          onClick={() => onSubTabChange('oneoff')}
        >
          单次任务{oneOffs.length > 0 && ` (${oneOffs.length})`}
        </button>
      </div>

      {subTab === 'periodic' ? (
        <>
          <div className="module-summary">
            <div className="sched-overview">
              <div className="sched-overview-item">
                <span className="sched-overview-num">{chores.length}</span>
                <span className="sched-overview-label">家务总数</span>
              </div>
              <div className="sched-overview-divider" />
              <div className="sched-overview-item">
                <span className="sched-overview-num sched-overview-num--due">{dueCount}</span>
                <span className="sched-overview-label">今日到期</span>
              </div>
              <div className="sched-overview-divider" />
              <div className="sched-overview-item">
                <span className="sched-overview-num">{chores.length - dueCount}</span>
                <span className="sched-overview-label">未到期</span>
              </div>
            </div>
          </div>

          {chores.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📅</span>
              <p>还没有家务项,点击右下角 + 添加</p>
            </div>
          ) : (
            <div className="groups">
              {usedCats.map((cat) => {
                const items = chores.filter((c) => c.category === cat)
                const catDue = items.filter((c) => isDueToday(c.interval, c.lastDone, c.nextDueOverride)).length
                return (
                  <div key={cat} className="group">
                    <div className="group-head">
                      <h4 className="group-title">{cat}</h4>
                      <span className="group-count">
                        {catDue}/{items.length} 到期
                      </span>
                    </div>
                    <ul className="item-list">
                      {items.map((c) => (
                        <ScheduleItem
                          key={c.id}
                          chore={c}
                          onIntervalChange={onIntervalChange}
                          onMarkDone={onMarkDone}
                          onToggle={onToggle}
                          onResetLastDone={onResetLastDone}
                          onPresetNextDue={onPresetNextDue}
                          onClearNextDue={onClearNextDue}
                          onDelete={onDelete}
                        />
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="module-summary">
            <div className="sched-overview">
              <div className="sched-overview-item">
                <span className="sched-overview-num">{oneOffs.length}</span>
                <span className="sched-overview-label">单次任务</span>
              </div>
              <div className="sched-overview-divider" />
              <div className="sched-overview-item">
                <span className="sched-overview-num sched-overview-num--due">{todayOneOffs}</span>
                <span className="sched-overview-label">今日执行</span>
              </div>
              <div className="sched-overview-divider" />
              <div className="sched-overview-item">
                <span className="sched-overview-num sched-overview-num--due">{overdueOneOffs}</span>
                <span className="sched-overview-label">已逾期</span>
              </div>
            </div>
          </div>

          {oneOffs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📌</span>
              <p>还没有单次任务,点击右下角 + 添加</p>
              <p className="empty-hint">如:体检、缴费、约会提醒</p>
            </div>
          ) : (
            <ul className="item-list">
              {oneOffs.map((o) => (
                <OneOffItem
                  key={o.id}
                  item={o}
                  onToggle={onToggleOneOff}
                  onDelete={onDeleteOneOff}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <button className="fab" onClick={onAdd} aria-label={subTab === 'oneoff' ? '添加单次任务' : '添加家务'}>
        <svg viewBox="0 0 24 24" width="26" height="26">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </section>
  )
}

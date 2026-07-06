import { useState } from 'react'
import { getTodayKey } from '../hooks/useLocalStorage'
import './AddItemSheet.css'

/**
 * AddItemSheet —— 底部滑出的添加面板,家务/巡检/单次任务共用
 * @param {Object} props
 * @param {string} props.type - 'chore' | 'inspection' | 'oneoff' 决定字段与文案
 * @param {string[]} props.tags - 分类/区域标签列表
 * @param {Function} props.onAdd - 提交回调 (title, tag, date?) => void,date 仅 oneoff 需要
 * @param {Function} props.onClose - 关闭回调
 */
export default function AddItemSheet({ type, tags, onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState(tags[0] || '')
  // 单次任务执行日期,默认今天
  const [date, setDate] = useState(getTodayKey())

  const tagLabel = type === 'inspection' ? '区域' : '分类'
  const titleLabel =
    type === 'chore' ? '家务内容' : type === 'oneoff' ? '任务内容' : '巡检项目'
  const titlePlaceholder =
    type === 'chore'
      ? '如:擦拭餐桌'
      : type === 'oneoff'
        ? '如:年度体检'
        : '如:检查净水器滤芯'
  const sheetTitle =
    type === 'chore'
      ? '添加家务待办'
      : type === 'oneoff'
        ? '添加单次任务'
        : '添加巡检项'

  /** 提交表单:校验非空后回调,oneoff 必须有日期 */
  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    if (type === 'oneoff') {
      if (!date) return
      onAdd(t, tag, date)
    } else {
      onAdd(t, tag)
    }
    setTitle('')
  }

  /** 是否允许提交(单次任务需日期) */
  const canSubmit = title.trim() && (type !== 'oneoff' || !!date)

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <h3 className="sheet-title">{sheetTitle}</h3>

        <label className="sheet-field">
          <span className="sheet-label">{titleLabel}</span>
          <input
            className="sheet-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={titlePlaceholder}
            autoFocus
          />
        </label>

        <div className="sheet-field">
          <span className="sheet-label">{tagLabel}</span>
          <div className="sheet-tags">
            {tags.map((t) => (
              <button
                key={t}
                className={`sheet-tag ${tag === t ? 'sheet-tag--active' : ''}`}
                onClick={() => setTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 单次任务额外需要执行日期 */}
        {type === 'oneoff' && (
          <label className="sheet-field">
            <span className="sheet-label">执行日期</span>
            <input
              type="date"
              className="sheet-input"
              value={date}
              min={getTodayKey()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        )}

        <div className="sheet-btns">
          <button className="sheet-btn sheet-btn--cancel" onClick={onClose}>取消</button>
          <button className="sheet-btn sheet-btn--ok" onClick={handleSubmit} disabled={!canSubmit}>
            确认添加
          </button>
        </div>
      </div>
    </>
  )
}

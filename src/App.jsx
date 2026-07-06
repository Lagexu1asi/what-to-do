import { useState, useEffect, useCallback } from "react";
import TabNav from "./components/TabNav";
import ChoresModule from "./components/ChoresModule";
import ScheduleModule from "./components/ScheduleModule";
import InspectionModule from "./components/InspectionModule";
import AddItemSheet from "./components/AddItemSheet";
import {
  useLocalStorage,
  getTodayKey,
  formatDateZh,
} from "./hooks/useLocalStorage";
import {
  DEFAULT_CHORES,
  DEFAULT_INSPECTIONS,
  CHORE_CATEGORIES,
  INSPECTION_AREAS,
} from "./data/defaults";
import "./App.css";

const STATUS_CYCLE = { pending: "ok", ok: "issue", issue: "pending" };

/**
 * App —— 应用根组件,管理三模块数据(待办/周期/巡检)、每日自动重置、添加面板开关
 */
export default function App() {
  const [tab, setTab] = useState("chores");
  const [chores, setChores] = useLocalStorage("hc_chores", DEFAULT_CHORES);
  const [inspections, setInspections] = useLocalStorage(
    "hc_inspections",
    DEFAULT_INSPECTIONS,
  );
  const [lastReset, setLastReset] = useLocalStorage(
    "hc_lastReset",
    getTodayKey(),
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  // 右上角徽章文本,默认 "PWA",用户可点击编辑并持久化
  const [badgeText, setBadgeText] = useLocalStorage("hc_badgeText", "PWA");
  // 单次任务列表(非周期性,设定具体执行日期,执行后不再重复)
  // 结构:{ id, title, category, date: 'YYYY-MM-DD', done: boolean }
  const [oneOffs, setOneOffs] = useLocalStorage("hc_oneOffs", []);
  // 周期页子分页:'periodic' 周期任务 | 'oneoff' 单次任务
  const [schedSubTab, setSchedSubTab] = useState("periodic");

  /** 预设某条家务的下次执行日期(覆盖按周期计算的下次到期) */
  const presetNextDue = useCallback(
    (id, date) => {
      setChores((prev) =>
        prev.map((c) => (c.id === id ? { ...c, nextDueOverride: date } : c)),
      );
    },
    [setChores],
  );

  /** 清除某条家务的预设下次执行日期,恢复按周期计算 */
  const clearNextDue = useCallback(
    (id) => {
      setChores((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, nextDueOverride: null } : c,
        ),
      );
    },
    [setChores],
  );

  /** 每日自动重置:日期变更时清除家务完成态(保留 lastDone)与巡检状态 */
  useEffect(() => {
    const today = getTodayKey();
    if (lastReset !== today) {
      setChores((prev) => prev.map((c) => ({ ...c, done: false })));
      setInspections((prev) =>
        prev.map((i) => ({ ...i, status: "pending", note: "" })),
      );
      setLastReset(today);
    }
  }, []);

  /**
   * 数据迁移:兼容旧版数据(无 interval/lastDone 字段)
   * 旧家务项补全 interval=1、lastDone=null,确保周期功能正常
   */
  useEffect(() => {
    setChores((prev) => {
      const needsMigration = prev.some(
        (c) =>
          c.interval === undefined ||
          c.lastDone === undefined ||
          c.nextDueOverride === undefined,
      );
      if (!needsMigration) return prev;
      return prev.map((c) => ({
        ...c,
        interval: c.interval ?? 1,
        lastDone: c.lastDone ?? null,
        nextDueOverride: c.nextDueOverride ?? null,
        done: c.done ?? false,
      }));
    });
  }, []);

  /**
   * 切换某条家务的完成状态
   * 勾选完成时同步更新 lastDone 为今天;取消勾选时保留 lastDone 不变
   */
  const toggleChore = useCallback(
    (id) => {
      setChores((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const done = !c.done;
          return done
            ? { ...c, done: true, lastDone: getTodayKey() }
            : { ...c, done: false };
        }),
      );
    },
    [setChores],
  );

  /** 删除某条家务 */
  const deleteChore = useCallback(
    (id) => {
      setChores((prev) => prev.filter((c) => c.id !== id));
    },
    [setChores],
  );

  /** 手动重置今日家务完成状态(done 置 false,lastDone 保留) */
  const resetChores = useCallback(() => {
    setChores((prev) => prev.map((c) => ({ ...c, done: false })));
  }, [setChores]);

  /** 修改某条家务的执行周期天数 */
  const changeInterval = useCallback(
    (id, interval) => {
      setChores((prev) =>
        prev.map((c) => (c.id === id ? { ...c, interval } : c)),
      );
    },
    [setChores],
  );

  /** 在周期设定页标记某条家务今日已执行(更新 lastDone 为今天,并清除一次性预设) */
  const markChoreDone = useCallback(
    (id) => {
      setChores((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, lastDone: getTodayKey(), done: true, nextDueOverride: null }
            : c,
        ),
      );
    },
    [setChores],
  );

  /** 清除某条家务的最后执行记录(重置为从未执行,同时清除预设) */
  const resetLastDone = useCallback(
    (id) => {
      setChores((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, lastDone: null, done: false, nextDueOverride: null }
            : c,
        ),
      );
    },
    [setChores],
  );

  /** 巡检状态循环切换:待检 → 正常 → 异常 → 待检 */
  const cycleInspection = useCallback(
    (id) => {
      setInspections((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: STATUS_CYCLE[i.status] } : i,
        ),
      );
    },
    [setInspections],
  );

  /** 更新巡检备注 */
  const updateNote = useCallback(
    (id, note) => {
      setInspections((prev) =>
        prev.map((i) => (i.id === id ? { ...i, note } : i)),
      );
    },
    [setInspections],
  );

  /** 删除某条巡检项 */
  const deleteInspection = useCallback(
    (id) => {
      setInspections((prev) => prev.filter((i) => i.id !== id));
    },
    [setInspections],
  );

  /** 手动重置全部巡检为待检 */
  const resetInspections = useCallback(() => {
    setInspections((prev) =>
      prev.map((i) => ({ ...i, status: "pending", note: "" })),
    );
  }, [setInspections]);

  /** 切换单次任务完成状态 */
  const toggleOneOff = useCallback(
    (id) => {
      setOneOffs((prev) =>
        prev.map((o) => (o.id === id ? { ...o, done: !o.done } : o)),
      );
    },
    [setOneOffs],
  );

  /** 删除单次任务 */
  const deleteOneOff = useCallback(
    (id) => {
      setOneOffs((prev) => prev.filter((o) => o.id !== id));
    },
    [setOneOffs],
  );

  /**
   * 添加新项(家务/巡检/单次任务)
   * - 家务(待办页或周期页周期子页):默认周期1天、lastDone 为 null
   * - 单次任务(周期页单次子页):带执行日期 date,无周期
   * - 巡检:进入待检态
   */
  const handleAdd = useCallback(
    (title, tag, date) => {
      const id = `${Date.now()}`;
      if (tab === "schedule" && schedSubTab === "oneoff") {
        setOneOffs((prev) => [
          ...prev,
          { id, title, category: tag, date, done: false },
        ]);
      } else if (tab === "chores" || tab === "schedule") {
        setChores((prev) => [
          ...prev,
          {
            id,
            title,
            category: tag,
            interval: 1,
            lastDone: null,
            done: false,
          },
        ]);
      } else {
        setInspections((prev) => [
          ...prev,
          { id, title, area: tag, status: "pending", note: "" },
        ]);
      }
      setSheetOpen(false);
    },
    [tab, schedSubTab, setChores, setInspections, setOneOffs],
  );

  const sheetTags = tab === "inspection" ? INSPECTION_AREAS : CHORE_CATEGORIES;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <div>
            <h1 className="app-title">今天做什么</h1>
            <p className="app-date">{formatDateZh()}</p>
          </div>
          <input
            className="header-badge"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            maxLength={12}
            aria-label="徽章文本"
            spellCheck={false}
          />
        </div>
        <TabNav active={tab} onChange={setTab} />
      </header>

      <main className="app-main">
        {tab === "chores" && (
          <ChoresModule
            chores={chores}
            oneOffs={oneOffs}
            onToggle={toggleChore}
            onDelete={deleteChore}
            onReset={resetChores}
            onToggleOneOff={toggleOneOff}
            onAdd={() => setSheetOpen(true)}
          />
        )}

        {tab === "schedule" && (
          <ScheduleModule
            chores={chores}
            oneOffs={oneOffs}
            subTab={schedSubTab}
            onSubTabChange={setSchedSubTab}
            onIntervalChange={changeInterval}
            onMarkDone={markChoreDone}
            onResetLastDone={resetLastDone}
            onPresetNextDue={presetNextDue}
            onClearNextDue={clearNextDue}
            onDelete={deleteChore}
            onToggleOneOff={toggleOneOff}
            onDeleteOneOff={deleteOneOff}
            onAdd={() => setSheetOpen(true)}
          />
        )}

        {tab === "inspection" && (
          <InspectionModule
            items={inspections}
            onCycle={cycleInspection}
            onNote={updateNote}
            onDelete={deleteInspection}
            onReset={resetInspections}
            onAdd={() => setSheetOpen(true)}
          />
        )}
      </main>

      {sheetOpen && (
        <AddItemSheet
          type={
            tab === "inspection"
              ? "inspection"
              : tab === "schedule" && schedSubTab === "oneoff"
                ? "oneoff"
                : "chore"
          }
          tags={sheetTags}
          onAdd={handleAdd}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}

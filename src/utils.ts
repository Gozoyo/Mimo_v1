import type { AbandonedSession, CompletedSession, CompletedSessionSource } from "./types";

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDuration(sec: number) {
  if (sec < 60) return `${sec} 秒`;
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return seconds ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分钟`;
}

export function formatCsvDuration(sec: number) {
  return `${Math.round((sec / 60) * 10) / 10}分钟`;
}

export function todayTotalSec(sessions: CompletedSession[]) {
  const today = localDateString();
  return sessions
    .filter((session) => session.date === today)
    .reduce((sum, session) => sum + session.actualCompletedSec, 0);
}

export function totalCompletedSec(sessions: CompletedSession[]) {
  return sessions.reduce((sum, session) => sum + session.actualCompletedSec, 0);
}

export function averageCompletedSec(sessions: CompletedSession[]) {
  if (!sessions.length) return 0;
  return Math.round(totalCompletedSec(sessions) / sessions.length);
}

export function calculateStreak(sessions: CompletedSession[]) {
  const completedDates = new Set(sessions.map((session) => session.date));
  let cursor = new Date();
  let streak = 0;

  while (completedDates.has(localDateString(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function completedSessionSource(session: { source?: unknown }): CompletedSessionSource {
  return session.source === "exercise_library" ? "exercise_library" : "home_recommendation";
}

function csvCell(value: string | number) {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportActivityCsv(
  sessions: CompletedSession[],
  abandonedSessions: AbandonedSession[]
) {
  const header = [
    "记录ID",
    "日期",
    "发生时间",
    "类型",
    "来源",
    "计划时长",
    "实际完成时长",
    "完成动作数",
    "计划动作数",
    "重点部位",
    "完成状态",
    "退出位置",
    "动作ID"
  ];
  const completedRows = sessions.map((session) => [
    session.id,
    session.date,
    session.completedAt,
    "完成",
    completedSessionSource(session),
    formatCsvDuration(session.plannedDurationSec),
    formatCsvDuration(session.actualCompletedSec),
    session.movementCount,
    session.movementCount,
    session.targetAreas.join("、"),
    "completed",
    "",
    session.exerciseIds.join("|")
  ]);
  const abandonedRows = abandonedSessions.map((session) => [
    session.id,
    session.date,
    session.abandonedAt,
    "放弃",
    "",
    formatCsvDuration(session.plannedDurationSec),
    formatCsvDuration(session.actualCompletedSec),
    session.completedMovementCount,
    session.movementCount,
    session.targetAreas.join("、"),
    "abandoned",
    session.currentExerciseIndex + 1,
    session.exerciseIds.join("|")
  ]);
  const rows = [...completedRows, ...abandonedRows].sort((a, b) =>
    String(b[2]).localeCompare(String(a[2]))
  );
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvCell(cell)).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `micro-movement-activity-${localDateString()}.csv`);
}

export function exportActivityJson(
  sessions: CompletedSession[],
  abandonedSessions: AbandonedSession[]
) {
  const payload = {
    exportedAt: new Date().toISOString(),
    stats: {
      completedSessionCount: sessions.length,
      abandonedSessionCount: abandonedSessions.length,
      totalCompletedSec: totalCompletedSec(sessions),
      averageCompletedSec: averageCompletedSec(sessions),
      currentStreak: calculateStreak(sessions)
    },
    completedSessions: sessions,
    abandonedSessions
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  downloadBlob(blob, `micro-movement-activity-${localDateString()}.json`);
}

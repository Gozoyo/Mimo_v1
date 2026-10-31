import type {
  AbandonedSession,
  CompletedSession,
  LikedExerciseGroups,
  Preferences,
  RecommendationHistory
} from "./types";
import { exerciseCategories, type ExerciseCategory } from "./data/exercises";
import { supabase } from "./supabase";

const PREFERENCES_KEY = "microMovement.preferences";
const SESSIONS_KEY = "microMovement.sessions";
const ABANDONED_SESSIONS_KEY = "microMovement.abandonedSessions";
const LEARNED_EXERCISE_IDS_KEY = "learnedExerciseIds";
const LIKED_EXERCISE_GROUPS_KEY = "likedExerciseGroupIds";
const RECOMMENDATION_HISTORY_KEY = "microMovement.recommendationHistory";
const MIN_SESSION_DURATION_SEC = 30;
const MAX_SESSION_DURATION_SEC = 180;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadPreferences(): Preferences | null {
  const storedPreferences = readJson<(Preferences & { reminderFrequency?: unknown }) | null>(PREFERENCES_KEY, null);
  if (!storedPreferences) return null;
  const { reminderFrequency: _legacyReminderFrequency, ...preferences } = storedPreferences;
  const sessionDurationSec = Math.min(
    MAX_SESSION_DURATION_SEC,
    Math.max(
      MIN_SESSION_DURATION_SEC,
      preferences.sessionDurationSec ?? Math.round(preferences.durationMin * 60)
    )
  );
  const migratedTargetAreas = (preferences.targetAreas as string[]).flatMap((area) =>
    area === "背部与腰部" ? ["上背", "腰背"] : [area]
  );
  const targetAreas = Array.from(new Set(migratedTargetAreas)).filter(
    (area): area is ExerciseCategory => exerciseCategories.includes(area as ExerciseCategory)
  );
  return {
    ...preferences,
    durationMin: sessionDurationSec / 60,
    sessionDurationSec,
    targetAreas: targetAreas.length ? targetAreas : ["肩颈"],
    exerciseTypes: preferences.exerciseTypes && preferences.exerciseTypes.length > 0 ? preferences.exerciseTypes : ["拉伸"]
  };
}

export function savePreferences(preferences: Preferences) {
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));

  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      supabase.from('preferences').upsert({
        user_id: data.session.user.id,
        duration_min: preferences.durationMin,
        session_duration_sec: preferences.sessionDurationSec,
        exercise_types: preferences.exerciseTypes,
        target_areas: preferences.targetAreas,
        space: preferences.space,
        intensity: preferences.intensity,
        movement_mode: preferences.movementMode || null,
        updated_at: new Date().toISOString()
      }).then(({ error }) => { if (error) console.error("Supabase sync error:", error); });
    }
  });
}

export function loadSessions(): CompletedSession[] {
  return readJson<(CompletedSession & { source?: unknown })[]>(SESSIONS_KEY, []).map((session) => ({
    ...session,
    source: session.source === "exercise_library" ? "exercise_library" : "home_recommendation"
  }));
}

export function saveSessions(sessions: CompletedSession[]) {
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function appendSession(session: CompletedSession): CompletedSession[] {
  const next = [session, ...loadSessions()];
  saveSessions(next);

  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      supabase.from('completed_sessions').insert({
        id: session.id,
        user_id: data.session.user.id,
        source: session.source,
        completed_at: session.completedAt,
        date: session.date,
        planned_duration_sec: session.plannedDurationSec,
        actual_completed_sec: session.actualCompletedSec,
        movement_count: session.movementCount,
        target_areas: session.targetAreas,
        exercise_ids: session.exerciseIds
      }).then(({ error }) => { if (error) console.error("Supabase sync error:", error); });
    }
  });

  return next;
}

export function loadAbandonedSessions(): AbandonedSession[] {
  return readJson<AbandonedSession[]>(ABANDONED_SESSIONS_KEY, []);
}

export function saveAbandonedSessions(sessions: AbandonedSession[]) {
  window.localStorage.setItem(ABANDONED_SESSIONS_KEY, JSON.stringify(sessions));
}

export function appendAbandonedSession(session: AbandonedSession): AbandonedSession[] {
  const next = [session, ...loadAbandonedSessions()];
  saveAbandonedSessions(next);

  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      supabase.from('abandoned_sessions').insert({
        id: session.id,
        user_id: data.session.user.id,
        abandoned_at: session.abandonedAt,
        date: session.date,
        planned_duration_sec: session.plannedDurationSec,
        actual_completed_sec: session.actualCompletedSec,
        completed_movement_count: session.completedMovementCount,
        movement_count: session.movementCount,
        target_areas: session.targetAreas,
        exercise_ids: session.exerciseIds,
        current_exercise_index: session.currentExerciseIndex
      }).then(({ error }) => { if (error) console.error("Supabase sync error:", error); });
    }
  });

  return next;
}

export function loadLearnedExerciseIds(): string[] {
  const ids = readJson<unknown>(LEARNED_EXERCISE_IDS_KEY, []);
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

export function markExerciseLearned(exerciseId: string): string[] {
  const next = Array.from(new Set([...loadLearnedExerciseIds(), exerciseId]));
  window.localStorage.setItem(LEARNED_EXERCISE_IDS_KEY, JSON.stringify(next));
  return next;
}

export function loadLikedExerciseGroups(): LikedExerciseGroups {
  const liked = readJson<unknown>(LIKED_EXERCISE_GROUPS_KEY, {});
  if (!liked || typeof liked !== "object" || Array.isArray(liked)) return {};
  return Object.fromEntries(
    Object.entries(liked).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === "string" && typeof entry[1] === "string"
    )
  );
}

export function saveLikedExerciseGroups(liked: LikedExerciseGroups) {
  window.localStorage.setItem(LIKED_EXERCISE_GROUPS_KEY, JSON.stringify(liked));
}

export function loadRecommendationHistory(): RecommendationHistory {
  const history = readJson<unknown>(RECOMMENDATION_HISTORY_KEY, {});
  if (!history || typeof history !== "object" || Array.isArray(history)) return {};
  const candidate = history as RecommendationHistory;
  return {
    lastSessionFirstExerciseId:
      typeof candidate.lastSessionFirstExerciseId === "string"
        ? candidate.lastSessionFirstExerciseId
        : undefined,
    lastSessionExerciseIds: Array.isArray(candidate.lastSessionExerciseIds)
      ? candidate.lastSessionExerciseIds.filter((id): id is string => typeof id === "string")
      : undefined
  };
}

export function saveRecommendationHistory(history: RecommendationHistory) {
  window.localStorage.setItem(RECOMMENDATION_HISTORY_KEY, JSON.stringify(history));
}


export async function syncFromSupabase(): Promise<{
  preferences?: Preferences;
  sessions?: CompletedSession[];
  likedExerciseGroups?: LikedExerciseGroups;
}> {
  try {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;
    if (!userId) return {};

    // 1. 同步用户习惯与偏好 (Preferences)
    const { data: prefRow } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let cloudPreferences: Preferences | undefined;
    if (prefRow) {
      cloudPreferences = {
        durationMin: prefRow.duration_min,
        sessionDurationSec: prefRow.session_duration_sec,
        exerciseTypes: prefRow.exercise_types && prefRow.exercise_types.length > 0 ? prefRow.exercise_types : ["拉伸"],
        targetAreas: (prefRow.target_areas || ["肩颈"]) as ExerciseCategory[],
        space: prefRow.space as any,
        intensity: prefRow.intensity as any,
        movementMode: (prefRow.movement_mode as any) || undefined,
        updatedAt: prefRow.updated_at
      };
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(cloudPreferences));
    }

    // 2. 同步打卡记录 (Completed Sessions)
    const { data: sessionRows } = await supabase
      .from("completed_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    let cloudSessions: CompletedSession[] | undefined;
    if (sessionRows && sessionRows.length > 0) {
      cloudSessions = sessionRows.map((row) => ({
        id: row.id,
        source: row.source === "exercise_library" ? "exercise_library" : "home_recommendation",
        completedAt: row.completed_at,
        date: row.date,
        plannedDurationSec: row.planned_duration_sec,
        actualCompletedSec: row.actual_completed_sec,
        movementCount: row.movement_count,
        targetAreas: row.target_areas as ExerciseCategory[],
        exerciseIds: row.exercise_ids
      }));
      window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(cloudSessions));
    }

    // 3. 同步收藏动作 (Liked Exercises)
    const { data: likedRows } = await supabase
      .from("liked_exercises")
      .select("*")
      .eq("user_id", userId);

    let cloudLiked: LikedExerciseGroups | undefined;
    if (likedRows && likedRows.length > 0) {
      cloudLiked = {};
      for (const row of likedRows) {
        cloudLiked[row.group_id] = row.liked_at || new Date().toISOString();
      }
      window.localStorage.setItem(LIKED_EXERCISE_GROUPS_KEY, JSON.stringify(cloudLiked));
    }

    return {
      preferences: cloudPreferences,
      sessions: cloudSessions,
      likedExerciseGroups: cloudLiked
    };
  } catch (err) {
    console.error("Failed to sync from Supabase:", err);
    return {};
  }
}

export function clearLocalUserData() {
  window.localStorage.removeItem(PREFERENCES_KEY);
  window.localStorage.removeItem(SESSIONS_KEY);
  window.localStorage.removeItem(LIKED_EXERCISE_GROUPS_KEY);
  window.localStorage.removeItem(ABANDONED_SESSIONS_KEY);
}

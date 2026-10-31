import { exerciseCategories, exercises, groupIdForExercise, type Exercise } from "./data/exercises";
import type {
  AbandonedSession,
  CompletedSession,
  CompletedSessionSource,
  LikedExerciseGroups,
  MovementMode,
  Preferences,
  SessionPlan,
  TargetArea
} from "./types";
import { localDateString } from "./utils";

type SessionPreferences = Pick<
  Preferences,
  "durationMin" | "sessionDurationSec" | "exerciseTypes" | "targetAreas" | "space" | "intensity"
> & {
  movementMode?: MovementMode;
  recentExerciseIds?: string[];
  lastSessionFirstExerciseId?: string;
  lastSessionExerciseIds?: string[];
  likedExerciseGroups?: LikedExerciseGroups;
};

const RECENT_EXERCISE_LIMIT = 3;
const MUTUALLY_EXCLUSIVE_EXERCISES: Record<string, string[]> = {
  chest_interlaced_overhead_reach: ["chest_overhead_reach"],
  chest_overhead_reach: ["chest_interlaced_overhead_reach"]
};
const PAIRED_EXERCISES: Record<string, string> = {
  neck_side_tilt_left: "neck_side_tilt_right",
  neck_side_tilt_right: "neck_side_tilt_left",
  neck_forward_release: "neck_backward_release",
  neck_backward_release: "neck_forward_release",
  shoulder_posterior_stretch_left: "shoulder_posterior_stretch_right",
  shoulder_posterior_stretch_right: "shoulder_posterior_stretch_left",
  lower_back_overhead_side_bend_left: "lower_back_overhead_side_bend_right",
  lower_back_overhead_side_bend_right: "lower_back_overhead_side_bend_left",
  lower_back_rotation_side_bend_left: "lower_back_rotation_side_bend_right",
  lower_back_rotation_side_bend_right: "lower_back_rotation_side_bend_left"
};

function completionSourceFor(plan: SessionPlan): CompletedSessionSource {
  return plan.source === "single" ? "exercise_library" : "home_recommendation";
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function areaMatches(exercise: Exercise, area: TargetArea) {
  return exercise.category === area;
}

function anyAreaMatches(exercise: Exercise, areas: TargetArea[]) {
  return areas.some((area) => areaMatches(exercise, area));
}

function postureMatches(exercise: Exercise, movementMode?: SessionPreferences["movementMode"]) {
  if (movementMode === "seated") {
    return exercise.posture === "坐姿" || exercise.posture === "坐姿/站姿";
  }
  if (movementMode === "standing") {
    return exercise.posture === "站姿" || exercise.posture === "坐姿/站姿";
  }
  return true;
}

function candidatePools(preferences: SessionPreferences, slotArea: TargetArea) {
  const coreCandidates = exercises.filter(
    (exercise) => 
      postureMatches(exercise, preferences.movementMode) && 
      areaMatches(exercise, slotArea) &&
      (!preferences.exerciseTypes || preferences.exerciseTypes.length === 0 || preferences.exerciseTypes.includes(exercise.type as string))
  );
  const pools = [coreCandidates];
  const spaceCandidates = coreCandidates.filter((exercise) => exercise.space === preferences.space);
  if (spaceCandidates.length) pools.push(spaceCandidates);
  const intensityBase = pools.at(-1) ?? coreCandidates;
  const intensityCandidates = intensityBase.filter((exercise) => exercise.intensity === preferences.intensity);
  if (intensityCandidates.length) pools.push(intensityCandidates);
  const visibilityBase = pools.at(-1) ?? intensityBase;
  const lowVisibilityCandidates = visibilityBase.filter((exercise) => exercise.visibility === "低");
  if (lowVisibilityCandidates.length) pools.push(lowVisibilityCandidates);
  return pools;
}

function matchCandidates(
  preferences: SessionPreferences,
  slotArea: TargetArea,
  selectedIds: Set<string>
) {
  const pools = candidatePools(preferences, slotArea).filter((pool) => pool.length);
  const prioritizedPools = [...pools].reverse();
  const recentIds = new Set((preferences.recentExerciseIds ?? []).slice(0, RECENT_EXERCISE_LIMIT));
  const withoutSelected = (exercise: Exercise) => !selectedIds.has(exercise.id);
  const withoutRecent = (exercise: Exercise) => !recentIds.has(exercise.id);
  const passesBoth = (exercise: Exercise) => withoutSelected(exercise) && withoutRecent(exercise);

  for (const pool of prioritizedPools) {
    const candidates = pool.filter(passesBoth);
    if (candidates.length) return candidates;
  }
  for (const pool of prioritizedPools) {
    const candidates = pool.filter(withoutSelected);
    if (candidates.length) return candidates;
  }
  return [];
}

function weightedRandomPick(candidates: Exercise[], preferences: SessionPreferences, index: number) {
  const avoidFirstId = index === 0 ? preferences.lastSessionFirstExerciseId : undefined;
  const firstCandidates =
    avoidFirstId && candidates.length > 1
      ? candidates.filter((exercise) => exercise.id !== avoidFirstId)
      : candidates;
  const totalWeight = firstCandidates.reduce((total, exercise) => {
    const liked = Boolean(preferences.likedExerciseGroups?.[groupIdForExercise(exercise.id)]);
    return total + (liked ? 2.4 : 1);
  }, 0);
  let cursor = Math.random() * totalWeight;
  for (const exercise of firstCandidates) {
    const liked = Boolean(preferences.likedExerciseGroups?.[groupIdForExercise(exercise.id)]);
    cursor -= liked ? 2.4 : 1;
    if (cursor <= 0) return exercise;
  }
  return firstCandidates.at(-1);
}

function isSameExerciseSet(left: Exercise[], rightIds: string[] | undefined) {
  if (!rightIds?.length || left.length !== rightIds.length) return false;
  return left.every((exercise, index) => exercise.id === rightIds[index]);
}

function markExerciseSelected(exercise: Exercise, selectedIds: Set<string>) {
  selectedIds.add(exercise.id);
  MUTUALLY_EXCLUSIVE_EXERCISES[exercise.id]?.forEach((exerciseId) => selectedIds.add(exerciseId));
}

function pairedExerciseFor(
  exercise: Exercise,
  preferences: SessionPreferences,
  safeTargets: TargetArea[],
  selectedIds: Set<string>
) {
  const pairId = PAIRED_EXERCISES[exercise.id];
  if (!pairId || selectedIds.has(pairId)) return undefined;
  const paired = exercises.find((item) => item.id === pairId);
  if (!paired) return undefined;
  const matchesTarget = safeTargets.some((area) => areaMatches(paired, area));
  return postureMatches(paired, preferences.movementMode) && matchesTarget ? paired : undefined;
}

function storablePreferences(preferences: SessionPreferences): SessionPlan["preferences"] {
  return {
    durationMin: preferences.durationMin,
    sessionDurationSec: preferences.sessionDurationSec,
    exerciseTypes: preferences.exerciseTypes,
    targetAreas: preferences.targetAreas,
    space: preferences.space,
    intensity: preferences.intensity,
    movementMode: preferences.movementMode
  };
}

export function generateSession(preferences: SessionPreferences): SessionPlan {
  const desiredCount = Math.max(1, Math.floor(preferences.sessionDurationSec / 30));
  const safeTargets: TargetArea[] = preferences.targetAreas.length
    ? preferences.targetAreas
    : ["肩颈"];

  function buildSelection() {
    const selected: Exercise[] = [];
    const selectedIds = new Set<string>();

    for (let index = 0; index < desiredCount; index += 1) {
      const slotArea = safeTargets[index % safeTargets.length];
      const candidates = matchCandidates(preferences, slotArea, selectedIds);
      const remainingSlots = desiredCount - selected.length;
      const pairableCandidates =
        remainingSlots >= 2
          ? candidates.filter((exercise) =>
              Boolean(pairedExerciseFor(exercise, preferences, safeTargets, selectedIds))
            )
          : [];
      const next = weightedRandomPick(
        pairableCandidates.length ? pairableCandidates : candidates,
        preferences,
        selected.length
      );
      if (!next) continue;
      selected.push(next);
      markExerciseSelected(next, selectedIds);
      if (selected.length < desiredCount) {
        const paired = pairedExerciseFor(next, preferences, safeTargets, selectedIds);
        if (paired) {
          selected.push(paired);
          markExerciseSelected(paired, selectedIds);
          index += 1;
        }
      }
    }

    return selected;
  }

  let selected = buildSelection();
  for (let attempt = 0; attempt < 4 && isSameExerciseSet(selected, preferences.lastSessionExerciseIds); attempt += 1) {
    const retry = buildSelection();
    if (!isSameExerciseSet(retry, preferences.lastSessionExerciseIds)) {
      selected = retry;
      break;
    }
  }
  const fallbackExercise = exercises.find(
    (exercise) => postureMatches(exercise, preferences.movementMode) && anyAreaMatches(exercise, safeTargets)
  ) ?? exercises[0];
  const sessionExercises = selected.length ? selected : [fallbackExercise];

  return {
    id: uid("session"),
    source: "preferences",
    preferences: storablePreferences(preferences),
    exercises: sessionExercises,
    plannedDurationSec: sessionExercises.reduce((total, exercise) => total + exercise.duration, 0)
  };
}

export function generateSingleExerciseSession(exerciseOrExercises: Exercise | Exercise[]): SessionPlan {
  const sessionExercises = Array.isArray(exerciseOrExercises) ? exerciseOrExercises : [exerciseOrExercises];
  const exercise = sessionExercises[0] ?? exercises[0];

  return {
    id: uid("single"),
    source: "single",
    preferences: {
      durationMin: 0.5,
      sessionDurationSec: exercise.duration,
      exerciseTypes: ["拉伸"],
      targetAreas: [exercise.category],
      space: exercise.space,
      intensity: exercise.intensity
    },
    exercises: sessionExercises,
    plannedDurationSec: sessionExercises.reduce((total, item) => total + item.duration, 0)
  };
}

export function generateReplaySession(
  exerciseIds: string[],
  targetAreas: string[],
  plannedDurationSec: number
): SessionPlan {
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const selected = exerciseIds
    .map((id) => exerciseById.get(id))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
  const fallbackExercise = selected[0] ?? exercises[0];
  const replayExercises = selected.length ? selected : [fallbackExercise];
  const safeTargetAreas = targetAreas.filter((area): area is TargetArea =>
    exerciseCategories.includes(area as TargetArea)
  );
  const primaryExercise = replayExercises[0];

  return {
    id: uid("replay"),
    source: "replay",
    preferences: {
      durationMin: plannedDurationSec / 60,
      sessionDurationSec: plannedDurationSec,
      exerciseTypes: ["拉伸"],
      targetAreas: safeTargetAreas.length ? safeTargetAreas : [primaryExercise.category],
      space: primaryExercise.space,
      intensity: primaryExercise.intensity
    },
    exercises: replayExercises,
    plannedDurationSec: replayExercises.reduce((total, exercise) => total + exercise.duration, 0)
  };
}

export function createCompletedSession(
  plan: SessionPlan,
  actualCompletedSec: number,
  completedExerciseIds?: string[]
): CompletedSession {
  const now = new Date();
  const exerciseIds = completedExerciseIds ?? plan.exercises.map((exercise) => exercise.id);

  return {
    id: uid("done"),
    source: completionSourceFor(plan),
    completedAt: now.toISOString(),
    date: localDateString(now),
    plannedDurationSec: plan.plannedDurationSec,
    actualCompletedSec,
    movementCount: exerciseIds.length,
    targetAreas: plan.preferences.targetAreas,
    exerciseIds
  };
}

export function createAbandonedSession(
  plan: SessionPlan,
  actualCompletedSec: number,
  currentExerciseIndex: number
): AbandonedSession {
  const now = new Date();
  const completedMovementCount = Math.min(
    plan.exercises.length,
    Math.floor(actualCompletedSec / 30)
  );

  return {
    id: uid("abandoned"),
    abandonedAt: now.toISOString(),
    date: localDateString(now),
    plannedDurationSec: plan.plannedDurationSec,
    actualCompletedSec,
    completedMovementCount,
    movementCount: plan.exercises.length,
    targetAreas: plan.preferences.targetAreas,
    exerciseIds: plan.exercises.map((exercise) => exercise.id),
    currentExerciseIndex
  };
}

import type {
  Exercise,
  ExerciseCategory,
  ExerciseIntensity,
  ExerciseSpace
} from "./data/exercises";

export type TargetArea = ExerciseCategory;
export type MovementMode = "seated" | "standing";

export type Preferences = {
  durationMin: number;
  sessionDurationSec: number;
  exerciseTypes: string[];
  targetAreas: TargetArea[];
  space: ExerciseSpace;
  intensity: ExerciseIntensity;
  movementMode?: MovementMode;
  updatedAt: string;
};

export type LikedExerciseGroups = Record<string, string>;

export type RecommendationHistory = {
  lastSessionFirstExerciseId?: string;
  lastSessionExerciseIds?: string[];
};

export type CompletedSession = {
  id: string;
  source: CompletedSessionSource;
  completedAt: string;
  date: string;
  plannedDurationSec: number;
  actualCompletedSec: number;
  movementCount: number;
  targetAreas: string[];
  exerciseIds: string[];
};

export type CompletedSessionSource = "home_recommendation" | "exercise_library";

export type AbandonedSession = {
  id: string;
  abandonedAt: string;
  date: string;
  plannedDurationSec: number;
  actualCompletedSec: number;
  completedMovementCount: number;
  movementCount: number;
  targetAreas: string[];
  exerciseIds: string[];
  currentExerciseIndex: number;
};

export type SessionPlan = {
  id: string;
  source: "preferences" | "temporary" | "single" | "replay";
  preferences: Pick<Preferences, "durationMin" | "sessionDurationSec" | "exerciseTypes" | "targetAreas" | "space" | "intensity"> & {
    movementMode?: MovementMode;
  };
  exercises: Exercise[];
  plannedDurationSec: number;
};

export type Tab = "home" | "library" | "gallery" | "profile";

export type AppView =
  | { name: "auth" }
  | { name: "onboarding" }
  | { name: "home" }
  | { name: "temporary" }
  | { name: "edit-preferences"; returnTo: "home" | "profile" }
  | { name: "library-detail"; groupId: string }
  | { name: "player"; session: SessionPlan }
  | {
      name: "completion";
      session: CompletedSession;
      mode: "regular" | "single" | "replay";
      movementMode?: MovementMode;
    };

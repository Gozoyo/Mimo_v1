import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  Download,
  Heart,
  Home,
  Activity,
  Award,
  Calendar,
  ChevronRight,
  Flame,
  Images,
  Leaf,
  Maximize2,
  Smile,
  Trophy,
  ZoomIn,
  ZoomOut,
  LibraryBig,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Sparkles,
  UserRound,
  X,
  Zap,
  LogOut
} from "lucide-react";
import {
  exercises,
  exerciseGroupById,
  exerciseGroupExercises,
  exerciseCategories,
  groupIdForExercise,
  groupMatchesCategory,
  libraryExerciseGroups,
  primaryExerciseForGroup,
  type Exercise,
  type ExerciseCategory,
  type ExerciseGroup,
  type ExerciseIntensity,
  type ExerciseSpace
} from "./data/exercises";
import {
  appendAbandonedSession,
  appendSession,
  loadAbandonedSessions,
  loadLikedExerciseGroups,
  loadPreferences,
  loadLearnedExerciseIds,
  loadRecommendationHistory,
  loadSessions,
  markExerciseLearned,
  saveLikedExerciseGroups,
  saveRecommendationHistory,
  savePreferences,
  syncFromSupabase,
  clearLocalUserData
} from "./storage";
import {
  createAbandonedSession,
  createCompletedSession,
  generateReplaySession,
  generateSession,
  generateSingleExerciseSession
} from "./session";
import type {
  AbandonedSession,
  AppView,
  CompletedSession,
  LikedExerciseGroups,
  MovementMode,
  Preferences,
  Tab,
  TargetArea
} from "./types";
import {
  averageCompletedSec,
  calculateStreak,
  completedSessionSource,
  exportActivityCsv,
  exportActivityJson,
  formatDuration,
  totalCompletedSec,
  todayTotalSec
} from "./utils";
import { copy } from "./copy";
import { supabase } from "./supabase";
import type { Session as SupabaseSession } from "@supabase/supabase-js";
import Auth from "./Auth";
type PreferenceDraft = Pick<
  Preferences,
  "durationMin" | "sessionDurationSec" | "exerciseTypes" | "targetAreas" | "space" | "intensity"
> & {
  movementMode?: MovementMode;
};

const defaultDraft: PreferenceDraft = {
  durationMin: 1,
  sessionDurationSec: 60,
  exerciseTypes: ["拉伸"],
  targetAreas: ["肩颈"],
  space: "小空间",
  intensity: "温和"
};

type OnboardingDraft = Omit<PreferenceDraft, "space" | "intensity"> & {
  space: ExerciseSpace | null;
  intensity: ExerciseIntensity | null;
};

const onboardingDraft: OnboardingDraft = {
  durationMin: 1,
  sessionDurationSec: 60,
  exerciseTypes: ["拉伸"],
  targetAreas: [],
  space: null,
  intensity: null
};

const durationOptions = [30, 60, 90, 120, 150, 180];
const firstPracticeHint = "舒服就好，不必一定做满 30 秒。";
const practiceHintOptions = [
  "工作间隙轻轻拉伸一下，就已经很好了",
  "有轻微拉伸感即可，不需要追求更大幅度",
  "保持自然呼吸，让身体慢慢放松",
  "今天愿意停下来照顾一下身体，就很不错",
  "不需要做到标准，舒服、安全更重要",
  "觉得不舒服时，可以随时暂停或结束",
  "一次短短的活动，也是在打断久坐",
  "不求一次拉到位，慢慢来更容易坚持",
  "现在的这几十秒，也是在给身体回一点电"
];
const targetAreaOptions: Array<{ value: TargetArea; label: string; emoji: string }> = [
  { value: "肩颈", label: "肩颈", emoji: "💻" },
  { value: "上背", label: "上背", emoji: "🪽" },
  { value: "胸肩", label: "胸肩", emoji: "🙆" },
  { value: "腰背", label: "腰背", emoji: "🪑" }
];
const exerciseTypeOptions: Array<{ value: string; label: string; emoji: string }> = [
  { value: "拉伸", label: "拉伸", emoji: "🧘" },
  { value: "HIIT燃脂", label: "HIIT燃脂", emoji: "🔥" },
  { value: "增肌力量", label: "增肌力量", emoji: "💪" },
  { value: "平衡稳定", label: "平衡稳定", emoji: "⚖️" }
];
const getAsset = (path: string) => {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  const base = import.meta.env.BASE_URL || "/";
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
};

const onboardingIllustrations = [
  getAsset("/assets/ip/ip-1.png"),
  getAsset("/assets/ip/ip-2.png"),
  getAsset("/assets/ip/ip-3.png"),
  getAsset("/assets/ip/ip-4.png")
];
function areaLabel(area: string) {
  return targetAreaOptions.find((item) => item.value === area)?.label ?? area;
}

function areaLabels(areas: string[]) {
  return areas.map(areaLabel);
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function preferenceSummary(
  preferences: Pick<Preferences, "sessionDurationSec" | "targetAreas" | "space" | "intensity">
) {
  return copy.common.preferenceSummary(
    preferences.sessionDurationSec,
    areaLabels(preferences.targetAreas),
    preferences.space,
    preferences.intensity
  );
}

function fullPreferenceSummary(preferences: Preferences) {
  return preferenceSummary(preferences);
}

function completedSessionSourceLabel(session: CompletedSession) {
  return copy.profile.sourceLabels[completedSessionSource(session)];
}

function recentCompletedExerciseIds(sessions: CompletedSession[], limit = 3) {
  return [...sessions]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .flatMap((session) => session.exerciseIds)
    .slice(0, limit);
}

function sortGroupsByLike(groups: ExerciseGroup[], likedExerciseGroups: LikedExerciseGroups) {
  return groups
    .map((group, index) => ({ group, index, likedAt: likedExerciseGroups[group.id] }))
    .sort((left, right) => {
      if (left.likedAt && right.likedAt) return right.likedAt.localeCompare(left.likedAt);
      if (left.likedAt) return -1;
      if (right.likedAt) return 1;
      return left.index - right.index;
    })
    .map((item) => item.group);
}

function randomPracticeHint(previousHint: string) {
  const candidates =
    practiceHintOptions.length > 1
      ? practiceHintOptions.filter((hint) => hint !== previousHint)
      : practiceHintOptions;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? firstPracticeHint;
}

function App() {
  const [preferences, setPreferences] = useState<Preferences | null>(() => loadPreferences());
  const [sessions, setSessions] = useState<CompletedSession[]>(() => loadSessions());
  const [abandonedSessions, setAbandonedSessions] = useState<AbandonedSession[]>(() =>
    loadAbandonedSessions()
  );
  const [likedExerciseGroups, setLikedExerciseGroups] = useState<LikedExerciseGroups>(() =>
    loadLikedExerciseGroups()
  );
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [view, setView] = useState<AppView>(() =>
    loadPreferences() ? { name: "home" } : { name: "onboarding" }
  );

  const [authSession, setAuthSession] = useState<SupabaseSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    function syncCloudData() {
      syncFromSupabase().then((cloudData) => {
        if (cloudData.preferences) {
          setPreferences(cloudData.preferences);
          setView((curr) => (curr.name === "onboarding" || curr.name === "auth" ? { name: "home" } : curr));
        }
        if (cloudData.sessions) {
          setSessions(cloudData.sessions);
        }
        if (cloudData.likedExerciseGroups) {
          setLikedExerciseGroups(cloudData.likedExerciseGroups);
        }
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
      setAuthLoading(false);
      if (session?.user) {
        syncCloudData();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      if (session?.user) {
        syncCloudData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const recentlyRecommendedIds = useRef<string[]>([]);
  const recommendationHistoryRef = useRef(loadRecommendationHistory());
  const completedPlanIds = useRef(new Set<string>());

  const todaySec = todayTotalSec(sessions);
  const streak = calculateStreak(sessions);
  const recentExerciseIds = useMemo(() => recentCompletedExerciseIds(sessions), [sessions]);

  function recommendationHistory() {
    return Array.from(new Set([...recentlyRecommendedIds.current, ...recentExerciseIds]));
  }

  function rememberRecommendation(plan: ReturnType<typeof generateSession>) {
    const firstExerciseId = plan.exercises[0]?.id;
    if (!firstExerciseId) return;
    recentlyRecommendedIds.current = [
      firstExerciseId,
      ...recentlyRecommendedIds.current.filter((id) => id !== firstExerciseId)
    ].slice(0, 3);
    recommendationHistoryRef.current = {
      lastSessionFirstExerciseId: firstExerciseId,
      lastSessionExerciseIds: plan.exercises.map((exercise) => exercise.id)
    };
    saveRecommendationHistory(recommendationHistoryRef.current);
  }

  function toggleLikedExerciseGroup(groupId: string) {
    setLikedExerciseGroups((current) => {
      const next = { ...current };
      if (next[groupId]) {
        delete next[groupId];
      } else {
        next[groupId] = new Date().toISOString();
      }
      saveLikedExerciseGroups(next);
      return next;
    });
  }

  function persistPreferences(draft: PreferenceDraft, returnTo: "home" | "profile" = "home") {
    const { movementMode: _movementMode, ...preferenceValues } = draft;
    const next: Preferences = {
      ...preferenceValues,
      durationMin: draft.sessionDurationSec / 60,
      updatedAt: new Date().toISOString()
    };
    savePreferences(next);
    setPreferences(next);
    setActiveTab(returnTo);
    setView({ name: "home" });
  }

  function startFromPreferences(mode?: MovementMode) {
    if (!preferences) return;
    const spaceOverride: ExerciseSpace =
      mode === "seated"
        ? "小空间"
        : preferences.space === "小空间"
          ? "中空间"
          : preferences.space;
    const modePreferences = mode
      ? {
          ...preferences,
          movementMode: mode,
          space: spaceOverride,
          recentExerciseIds: recommendationHistory(),
          lastSessionFirstExerciseId: recommendationHistoryRef.current.lastSessionFirstExerciseId,
          lastSessionExerciseIds: recommendationHistoryRef.current.lastSessionExerciseIds,
          likedExerciseGroups
        }
      : {
          ...preferences,
          recentExerciseIds: recommendationHistory(),
          lastSessionFirstExerciseId: recommendationHistoryRef.current.lastSessionFirstExerciseId,
          lastSessionExerciseIds: recommendationHistoryRef.current.lastSessionExerciseIds,
          likedExerciseGroups
        };
    const plan = generateSession(modePreferences);
    rememberRecommendation(plan);
    setView({ name: "player", session: plan });
  }

  function startTemporary(draft: PreferenceDraft) {
    const plan = generateSession({
      ...draft,
      movementMode: draft.movementMode ?? "seated",
      recentExerciseIds: recommendationHistory(),
      lastSessionFirstExerciseId: recommendationHistoryRef.current.lastSessionFirstExerciseId,
      lastSessionExerciseIds: recommendationHistoryRef.current.lastSessionExerciseIds,
      likedExerciseGroups
    });
    rememberRecommendation(plan);
    setView({ name: "player", session: { ...plan, source: "temporary" } });
  }

  function completeSession(
    plan: AppView & { name: "player" },
    actualCompletedSec: number,
    completedExerciseIds?: string[]
  ) {
    if (completedPlanIds.current.has(plan.session.id)) return;
    completedPlanIds.current.add(plan.session.id);

    const completed = createCompletedSession(plan.session, actualCompletedSec, completedExerciseIds);
    if (plan.session.source === "single") {
      setSessions(appendSession(completed));
      setView({ name: "completion", session: completed, mode: "single" });
      return;
    }
    if (plan.session.source === "replay") {
      setView({ name: "completion", session: completed, mode: "replay" });
      return;
    }
    setSessions(appendSession(completed));
    setView({
      name: "completion",
      session: completed,
      mode: "regular",
      movementMode: plan.session.preferences.movementMode
    });
  }

  function abandonSession(
    plan: AppView & { name: "player" },
    actualCompletedSec: number,
    currentExerciseIndex: number
  ) {
    if (plan.session.source !== "single") {
      const abandoned = createAbandonedSession(
        plan.session,
        actualCompletedSec,
        currentExerciseIndex
      );
      setAbandonedSessions(appendAbandonedSession(abandoned));
    }
    setView({ name: "home" });
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authSession) {
    return <Auth />;
  }

  if (view.name === "onboarding") {
    return (
      <Shell hideNav>
        <Onboarding onSubmit={(draft) => persistPreferences(draft, "home")} />
      </Shell>
    );
  }

  if (!preferences) {
    return null;
  }

  if (view.name === "player") {
    return (
      <Shell hideNav>
        <ExercisePlayer
          session={view}
          likedExerciseGroups={likedExerciseGroups}
          onComplete={(actualCompletedSec, completedExerciseIds) =>
            completeSession(view, actualCompletedSec, completedExerciseIds)
          }
          onExit={(actualCompletedSec, currentExerciseIndex) =>
            abandonSession(view, actualCompletedSec, currentExerciseIndex)
          }
          onToggleLike={toggleLikedExerciseGroup}
        />
      </Shell>
    );
  }

  if (view.name === "completion") {
    return (
      <Shell hideNav>
        <Completion
          session={view.session}
          sessions={sessions}
          mode={view.mode}
          likedExerciseGroups={likedExerciseGroups}
          onHome={() => {
            setActiveTab(view.mode === "single" ? "library" : "home");
            setView({ name: "home" });
          }}
          onAgain={() => {
            if (view.mode === "single") {
              setActiveTab("library");
              setView({ name: "home" });
              return;
            }
            if (view.mode === "replay") {
              setActiveTab("profile");
              setView({ name: "home" });
              return;
            }
            startFromPreferences(view.movementMode);
          }}
          onToggleLike={toggleLikedExerciseGroup}
        />
      </Shell>
    );
  }

  if (view.name === "library-detail") {
    const group = exerciseGroupById(view.groupId);
    if (!group) {
      return (
        <Shell hideNav>
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-ink"
            onClick={() => {
              setActiveTab("library");
              setView({ name: "home" });
            }}
            type="button"
          >
            <ArrowLeft size={18} />
            {copy.common.back}
          </button>
        </Shell>
      );
    }
    return (
      <Shell hideNav>
        <LibraryDetail
          group={group}
          likedAt={likedExerciseGroups[group.id]}
          onBack={() => {
            setActiveTab("library");
            setView({ name: "home" });
          }}
          onStart={(exercisesForSession) =>
            setView({
              name: "player",
              session: generateSingleExerciseSession(exercisesForSession)
            })
          }
          onToggleLike={() => toggleLikedExerciseGroup(group.id)}
        />
      </Shell>
    );
  }

  if (view.name === "temporary") {
    return (
      <Shell hideNav>
        <PreferenceScreen
          title={copy.preferences.temporaryTitle}
          subtitle={copy.preferences.temporarySubtitle}
          initial={preferences}
          submitLabel={copy.preferences.temporarySubmit}
          includeMovementMode
          onBack={() => setView({ name: "home" })}
          onSubmit={startTemporary}
        />
      </Shell>
    );
  }

  if (view.name === "edit-preferences") {
    return (
      <Shell hideNav>
        <PreferenceScreen
          title={copy.preferences.editTitle}
          subtitle={copy.preferences.editSubtitle}
          initial={preferences}
          submitLabel={copy.preferences.editSubmit}
          includeMovementMode={false}
          onBack={() => {
            setActiveTab(view.returnTo);
            setView({ name: "home" });
          }}
          onSubmit={(draft) => persistPreferences(draft, view.returnTo)}
        />
      </Shell>
    );
  }

  return (
    <Shell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "home" && (
        <HomeScreen
          preferences={preferences}
          todaySec={todaySec}
          streak={streak}
          onStart={startFromPreferences}
          onTemporary={() => setView({ name: "temporary" })}
        />
      )}
      {activeTab === "library" && (
        <LibraryScreen
          likedExerciseGroups={likedExerciseGroups}
          onOpen={(group) => setView({ name: "library-detail", groupId: group.id })}
          onToggleLike={toggleLikedExerciseGroup}
        />
      )}
      {activeTab === "gallery" && (
        <GalleryScreen
          onOpenGroup={(groupId) => {
            setView({ name: "library-detail", groupId });
          }}
        />
      )}
      {activeTab === "profile" && (
        <ProfileScreen
          preferences={preferences}
          sessions={sessions}
          abandonedSessions={abandonedSessions}
          todaySec={todaySec}
          streak={streak}
          onEdit={() => setView({ name: "edit-preferences", returnTo: "profile" })}
          onReplay={(exerciseIds, targetAreas, plannedDurationSec) =>
            setView({
              name: "player",
              session: generateReplaySession(exerciseIds, targetAreas, plannedDurationSec)
            })
          }
          onSignOut={async () => {
            await supabase.auth.signOut();
            clearLocalUserData();
            setPreferences(null);
            setSessions([]);
            setLikedExerciseGroups({});
            setAbandonedSessions([]);
            setView({ name: "auth" });
          }}
        />
      )}
    </Shell>
  );
}

function Shell({
  children,
  activeTab,
  onTabChange,
  hideNav = false
}: {
  children: ReactNode;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-svh bg-paper text-ink flex flex-col">
      {/* 桌面端顶部自适应导航栏 (Desktop Top Header) */}
      {!hideNav && activeTab && onTabChange && (
        <header className="sticky top-0 z-30 hidden md:block border-b border-black/5 bg-paper/90 px-8 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf text-white font-bold shadow-sm">
                M
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight text-ink">{copy.app.name}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-moss/80 text-leaf">
                  微运动习惯 · 全端自适应
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-1.5 rounded-full bg-white/80 p-1 shadow-soft border border-black/5">
              <DesktopTabButton
                icon={<Home size={16} />}
                label={copy.tabs.home}
                active={activeTab === "home"}
                onClick={() => onTabChange("home")}
              />
              <DesktopTabButton
                icon={<LibraryBig size={16} />}
                label={copy.tabs.library}
                active={activeTab === "library"}
                onClick={() => onTabChange("library")}
              />
              <DesktopTabButton
                icon={<Images size={16} />}
                label={copy.tabs.gallery}
                active={activeTab === "gallery"}
                onClick={() => onTabChange("gallery")}
              />
              <DesktopTabButton
                icon={<UserRound size={16} />}
                label={copy.tabs.profile}
                active={activeTab === "profile"}
                onClick={() => onTabChange("profile")}
              />
            </nav>
          </div>
        </header>
      )}

      {/* 自适应容器 */}
      <main
        className={cn(
          "mx-auto min-h-svh w-full transition-all duration-200",
          hideNav
            ? "max-w-md md:max-w-2xl px-5 py-3 md:py-6"
            : "max-w-md md:max-w-5xl lg:max-w-6xl px-5 pb-28 pt-5 md:px-8 md:py-8"
        )}
      >
        {children}
      </main>

      {/* 移动端底部导航栏 (Mobile Bottom Nav) */}
      {!hideNav && activeTab && onTabChange && (
        <nav className="fixed inset-x-0 bottom-0 z-20 md:hidden border-t border-black/5 bg-paper/90 px-3 py-2 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-full bg-white/70 p-1 shadow-soft">
            <TabButton icon={<Home size={15} />} label={copy.tabs.home} active={activeTab === "home"} onClick={() => onTabChange("home")} />
            <TabButton icon={<LibraryBig size={15} />} label={copy.tabs.library} active={activeTab === "library"} onClick={() => onTabChange("library")} />
            <TabButton icon={<Images size={15} />} label="图库" active={activeTab === "gallery"} onClick={() => onTabChange("gallery")} />
            <TabButton icon={<UserRound size={15} />} label={copy.tabs.profile} active={activeTab === "profile"} onClick={() => onTabChange("profile")} />
          </div>
        </nav>
      )}
    </div>
  );
}

function DesktopTabButton({
  icon,
  label,
  active,
  onClick
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition",
        active ? "bg-leaf text-white shadow-sm" : "text-muted hover:bg-moss/50 hover:text-ink"
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-11 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] transition",
        active ? "bg-leaf text-white shadow-sm font-semibold" : "text-muted hover:bg-moss/60"
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Onboarding({ onSubmit }: { onSubmit: (draft: PreferenceDraft) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(onboardingDraft);
  const totalSteps = 3;
  const progressPercent = ((step + 1) / totalSteps) * 100;
  const needsConfirm = step === 0;
  const canContinueTypes = draft.exerciseTypes.length > 0;
  const canContinueAreas = draft.targetAreas.length > 0;
  const illustration = onboardingIllustrations[step];

  function completeDraft(nextDraft = draft): PreferenceDraft {
    return {
      ...nextDraft,
      space: nextDraft.space ?? "小空间",
      intensity: nextDraft.intensity ?? "温和"
    };
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
  }

  function goNext(nextDraft = draft) {
    if (step >= totalSteps - 1) {
      onSubmit(completeDraft(nextDraft));
      return;
    }
    setStep((current) => Math.min(totalSteps - 1, current + 1));
  }

  function toggleArea(area: TargetArea) {
    setDraft((current) => {
      const exists = current.targetAreas.includes(area);
      const next = exists
        ? current.targetAreas.filter((item) => item !== area)
        : [...current.targetAreas, area];
      return { ...current, targetAreas: next };
    });
  }

  function toggleExerciseType(type: string) {
    setDraft((current) => {
      const exists = current.exerciseTypes.includes(type);
      const next = exists
        ? current.exerciseTypes.filter((item) => item !== type)
        : [...current.exerciseTypes, type];
      return { ...current, exerciseTypes: next };
    });
  }

  return (
    <div className="flex min-h-[calc(100svh-40px)] animate-rise flex-col pb-40 pt-3">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg font-semibold text-leaf">{copy.onboarding.eyebrow}</p>
          <span className="rounded-full bg-moss px-3 py-1 text-sm font-semibold text-leaf">
            {copy.onboarding.progressLabel(step + 1, totalSteps)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-leaf transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className={step === 0 ? "relative min-h-[184px]" : "flex justify-end pt-8"}>
          {step === 0 ? (
            <>
              <div className="relative z-10">
                <h1 className="whitespace-nowrap text-[34px] font-semibold leading-tight tracking-normal">
                  {copy.onboarding.title}
                </h1>
                <p className="mt-3 max-w-[230px] text-base leading-7 text-muted">
                  {copy.onboarding.subtitle}
                </p>
              </div>
              <img
                alt=""
                aria-hidden="true"
                className="animate-float pointer-events-none absolute right-0 top-[86px] h-24 w-24 rounded-[8px] object-cover shadow-soft"
                src={illustration}
              />
            </>
          ) : (
            <img
              alt=""
              aria-hidden="true"
              className="animate-float pointer-events-none h-24 w-24 shrink-0 rounded-[8px] object-cover shadow-soft"
              src={illustration}
            />
          )}
        </div>
      </div>

      <div className="mt-5 flex-1">
        {step === 0 && (
          <Section title={copy.preferences.durationTitle} helper={copy.preferences.durationHelper}>
            <div className="rounded-[8px] bg-white/75 p-4 shadow-soft">
              <div className="mb-3 flex items-end justify-between">
                <span className="text-base font-semibold text-muted">⏱️ {copy.preferences.durationLabel}</span>
                <strong className="text-3xl font-semibold text-leaf">
                  {copy.common.durationSec(draft.sessionDurationSec)}
                </strong>
              </div>
              <input
                className="w-full accent-leaf"
                max={durationOptions.length - 1}
                min={0}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    durationMin: durationOptions[Number(event.target.value)] / 60,
                    sessionDurationSec: durationOptions[Number(event.target.value)]
                  }))
                }
                step={1}
                type="range"
                value={durationOptions.indexOf(draft.sessionDurationSec)}
              />
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>{copy.preferences.durationMinLabel}</span>
                <span>{copy.preferences.durationMaxLabel}</span>
              </div>
            </div>
          </Section>
        )}

        {step === 1 && (
          <section className="space-y-3">
            <h2 className="whitespace-nowrap text-[27px] font-semibold tracking-normal">
              {copy.preferences.exerciseTypesTitle}
            </h2>
            <div className="space-y-2">
              {exerciseTypeOptions.map((type) => (
                <OptionButton
                  key={type.value}
                  active={draft.exerciseTypes.includes(type.value)}
                  emoji={type.emoji}
                  label={type.label}
                  onClick={() => toggleExerciseType(type.value)}
                />
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-3">
            <h2 className="whitespace-nowrap text-[27px] font-semibold tracking-normal">
              {copy.preferences.targetAreasTitle}
            </h2>
            <div className="space-y-2">
              {targetAreaOptions.map((area) => (
                <OptionButton
                  key={area.value}
                  active={draft.targetAreas.includes(area.value)}
                  emoji={area.emoji}
                  label={area.label}
                  onClick={() => toggleArea(area.value)}
                />
              ))}
            </div>
          </section>
        )}

      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-paper/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto grid max-w-md gap-3">
          <button
            className="min-h-14 w-full rounded-full bg-white/75 px-6 py-4 text-base font-semibold text-ink disabled:text-muted"
            disabled={step === 0}
            onClick={goBack}
            type="button"
          >
            {copy.common.back}
          </button>
          <button
            className="min-h-14 w-full rounded-full bg-leaf px-4 py-3 text-base font-semibold text-white shadow-soft disabled:bg-muted/30 disabled:text-muted"
            disabled={(step === 1 && !canContinueTypes) || (step === 2 && !canContinueAreas)}
            onClick={() => goNext()}
            type="button"
          >
            {needsConfirm
              ? copy.onboarding.durationAction(draft.sessionDurationSec)
              : step === 2 ? copy.onboarding.startAction : copy.onboarding.targetAreasAction}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreferenceScreen({
  title,
  subtitle,
  initial,
  submitLabel,
  includeMovementMode,
  onBack,
  onSubmit
}: {
  title: string;
  subtitle: string;
  initial: PreferenceDraft;
  submitLabel: string;
  includeMovementMode: boolean;
  onBack: () => void;
  onSubmit: (draft: PreferenceDraft) => void;
}) {
  return (
    <div className="animate-rise space-y-6 pb-8">
      <button
        className="inline-flex min-h-12 min-w-36 items-center justify-center gap-2 rounded-full bg-white/75 px-6 py-3 text-base font-semibold text-muted shadow-sm"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft size={18} />
        {copy.common.back}
      </button>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
        <p className="text-sm leading-6 text-muted">{subtitle}</p>
      </div>
      <PreferenceForm
        initial={initial}
        includeMovementMode={includeMovementMode}
        submitLabel={submitLabel}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function PreferenceForm({
  initial,
  includeMovementMode,
  submitLabel,
  onSubmit
}: {
  initial: PreferenceDraft;
  includeMovementMode: boolean;
  submitLabel: string;
  onSubmit: (draft: PreferenceDraft) => void;
}) {
  const [draft, setDraft] = useState<PreferenceDraft>({
    ...defaultDraft,
    ...initial,
    durationMin: initial.sessionDurationSec / 60,
    targetAreas: initial.targetAreas.length ? initial.targetAreas : ["肩颈"],
    movementMode: initial.movementMode ?? (initial.space === "小空间" ? "seated" : "standing")
  });
  const canSubmit = draft.targetAreas.length > 0 && draft.exerciseTypes.length > 0 && (!includeMovementMode || Boolean(draft.movementMode));

  function toggleArea(area: TargetArea) {
    setDraft((current) => {
      const exists = current.targetAreas.includes(area);
      const next = exists
        ? current.targetAreas.filter((item) => item !== area)
        : [...current.targetAreas, area];
      return { ...current, targetAreas: next };
    });
  }

  function toggleExerciseType(type: string) {
    setDraft((current) => {
      const exists = current.exerciseTypes.includes(type);
      const next = exists
        ? current.exerciseTypes.filter((item) => item !== type)
        : [...current.exerciseTypes, type];
      return { ...current, exerciseTypes: next };
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      <Section title={copy.preferences.durationTitle} helper={copy.preferences.durationHelper}>
        <div className="rounded-[8px] bg-white/75 p-4 shadow-soft">
          <div className="mb-3 flex items-end justify-between">
            <span className="text-sm text-muted">{copy.preferences.durationLabel}</span>
            <strong className="text-3xl font-semibold text-leaf">
              {copy.common.durationSec(draft.sessionDurationSec)}
            </strong>
          </div>
          <input
            className="w-full accent-leaf"
            max={durationOptions.length - 1}
            min={0}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                durationMin: durationOptions[Number(event.target.value)] / 60,
                sessionDurationSec: durationOptions[Number(event.target.value)]
              }))
            }
            step={1}
            type="range"
            value={durationOptions.indexOf(draft.sessionDurationSec)}
          />
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{copy.preferences.durationMinLabel}</span>
            <span>{copy.preferences.durationMaxLabel}</span>
          </div>
        </div>
      </Section>

      <Section title={copy.preferences.exerciseTypesTitle}>
        <div className="space-y-2">
          {exerciseTypeOptions.map((type) => (
            <OptionButton
              key={type.value}
              active={draft.exerciseTypes.includes(type.value)}
              emoji={type.emoji}
              label={type.label}
              onClick={() => toggleExerciseType(type.value)}
            />
          ))}
        </div>
      </Section>

      <Section title={copy.preferences.targetAreasTitle}>
        <div className="space-y-2">
          {targetAreaOptions.map((area) => (
            <OptionButton
              key={area.value}
              active={draft.targetAreas.includes(area.value)}
              label={area.label}
              onClick={() => toggleArea(area.value)}
            />
          ))}
        </div>
      </Section>

      {includeMovementMode && (
        <Section title={copy.preferences.movementModeTitle}>
          <div className="grid grid-cols-2 gap-2">
            <OptionButton
              active={draft.movementMode === "seated"}
              label={copy.home.startSeated}
              onClick={() => setDraft((current) => ({ ...current, movementMode: "seated" }))}
            />
            <OptionButton
              active={draft.movementMode === "standing"}
              label={copy.home.startStanding}
              onClick={() => setDraft((current) => ({ ...current, movementMode: "standing" }))}
            />
          </div>
        </Section>
      )}

      <button
        className="h-13 w-full rounded-full bg-leaf px-5 py-4 font-semibold text-white shadow-soft transition hover:translate-y-[-1px] disabled:bg-muted/30 disabled:text-muted"
        disabled={!canSubmit}
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Section({
  title,
  helper,
  children
}: {
  title: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
        {helper && <p className="mt-1 text-sm leading-6 text-muted">{helper}</p>}
      </div>
      {children}
    </section>
  );
}

function OptionButton({
  active,
  emoji,
  label,
  description,
  onClick
}: {
  active: boolean;
  emoji?: string;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex min-h-14 w-full items-center justify-between gap-3 rounded-[8px] border px-4 py-3 text-left transition",
        active
          ? "border-leaf bg-moss text-ink"
          : "border-black/5 bg-white/70 text-ink hover:border-leaf/40"
      )}
      onClick={onClick}
      type="button"
    >
      <span>
        <span className="block text-base font-semibold">
          {emoji && <span className="mr-2" aria-hidden="true">{emoji}</span>}
          {label}
        </span>
        {description && <span className="mt-1 block text-xs leading-5 text-muted">{description}</span>}
      </span>
      {active && <Check className="shrink-0 text-leaf" size={18} />}
    </button>
  );
}

function HomeScreen({
  preferences,
  todaySec,
  streak,
  onStart,
  onTemporary
}: {
  preferences: Preferences;
  todaySec: number;
  streak: number;
  onStart: (mode?: MovementMode) => void;
  onTemporary: () => void;
}) {
  const [standingPromptOpen, setStandingPromptOpen] = useState(false);

  function choosePromptMode(mode: MovementMode) {
    setStandingPromptOpen(false);
    onStart(mode);
  }

  return (
    <div className="animate-rise space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-normal text-leaf">{copy.app.name}</h1>
          <p className="hidden md:block text-xs md:text-sm text-muted mt-1">办公久坐轻打断 · 30秒微运动充电站</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="rounded-full bg-sun/70 px-3 py-1 md:px-3.5 md:py-1.5 text-xs md:text-sm text-ink shadow-sm font-medium">
            {copy.home.todayPrefix} {formatDuration(todaySec)}
          </div>
          <div className="hidden md:inline-flex rounded-full bg-moss/80 px-3.5 py-1.5 text-xs md:text-sm text-leaf font-medium">
            🔥 连续打卡 {streak} 天
          </div>
        </div>
      </header>

      {/* 响应式栅格：移动端单列，桌面端双列 (7:5) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* 左侧核心：充电站大卡片 */}
        <div className="md:col-span-7 space-y-5">
          <section className="overflow-hidden rounded-[16px] bg-white shadow-soft border border-black/5">
            <div className="relative min-h-[230px] md:min-h-[260px] bg-moss px-5 py-6 md:p-8">
              <div className="absolute right-4 top-4 h-24 w-24 rounded-full border border-white/60" />
              <div className="absolute bottom-5 right-7 h-28 w-16 rounded-full bg-paper/70" />
              <div className="relative max-w-[280px] md:max-w-md space-y-3">
                <div className="inline-flex items-center gap-1 rounded-full bg-white/75 px-3 py-1 text-xs text-leaf font-medium">
                  <Sparkles size={14} />
                  {copy.home.eyebrow}
                </div>
                <h2 className="text-4xl md:text-5xl font-semibold leading-tight tracking-normal">{copy.home.heroTitle}</h2>
                <p className="text-sm md:text-base leading-6 text-ink/70">{copy.home.heroSubtitle}</p>
              </div>
            </div>
            <div className="space-y-4 p-5 md:p-6">
              <div className="rounded-[10px] bg-paper px-4 py-3">
                <p className="text-sm leading-6 text-ink/80">
                  {copy.home.recommendationPrefix}{preferenceSummary(preferences)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                  className="flex min-h-40 flex-col rounded-[12px] border border-white/35 bg-gradient-to-br from-leaf to-[#5f7f63] px-4 py-4 text-left text-white shadow-[0_7px_0_#4f6f54,0_15px_28px_rgba(47,50,45,0.18)] transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-[0_9px_0_#4f6f54,0_19px_34px_rgba(47,50,45,0.2)] active:translate-y-1 active:shadow-[0_2px_0_#4f6f54,0_8px_16px_rgba(47,50,45,0.14)]"
                  onClick={() => setStandingPromptOpen(true)}
                  type="button"
                >
                  <span className="block text-lg font-semibold">{copy.home.startSeated}</span>
                  <span className="mt-2 block text-xs leading-5 text-white/80">{copy.home.seatedDescription}</span>
                  <span className="mt-auto self-end text-sm font-semibold">{copy.home.startAction}</span>
                </button>
                <button
                  className="flex min-h-40 flex-col rounded-[12px] border border-white/70 bg-gradient-to-br from-[#e5efd8] to-moss px-4 py-4 text-left text-ink shadow-[0_7px_0_#bfd0ad,0_15px_28px_rgba(47,50,45,0.14)] transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-[0_9px_0_#bfd0ad,0_19px_34px_rgba(47,50,45,0.17)] active:translate-y-1 active:shadow-[0_2px_0_#bfd0ad,0_8px_16px_rgba(47,50,45,0.11)]"
                  onClick={() => onStart("standing")}
                  type="button"
                >
                  <span className="block text-lg font-semibold">{copy.home.startStanding}</span>
                  <span className="mt-2 block text-xs leading-5 text-ink/65">{copy.home.standingDescription}</span>
                  <span className="mt-auto self-end text-sm font-semibold text-leaf">{copy.home.startAction}</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* 右侧面板：统计、偏好摘要与办公人机工效建议 */}
        <div className="md:col-span-5 space-y-5">
          <section className="grid grid-cols-2 gap-3 md:gap-4">
            <Stat label={copy.home.todayTotal} value={formatDuration(todaySec)} quiet />
            <Stat label={copy.home.streak} value={copy.common.days(streak)} quiet />
          </section>

          {/* 习惯偏好卡片 */}
          <div className="rounded-[16px] bg-white p-5 shadow-soft border border-black/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink text-sm">当前习惯配置</h3>
              <button
                onClick={onTemporary}
                className="text-xs font-semibold text-leaf hover:underline"
                type="button"
              >
                快速自选
              </button>
            </div>
            <div className="text-xs text-ink/75 space-y-1.5 leading-relaxed">
              <p>⏱️ 单次时长：<strong>{preferences.durationMin} 分钟</strong> ({preferences.sessionDurationSec} 秒)</p>
              <p>🎯 重点部位：<strong>{preferences.targetAreas.join("、") || "全身体态"}</strong></p>
              <p>📐 工位空间：<strong>{preferences.space}</strong></p>
              <p>⚡ 运动强度：<strong>{preferences.intensity}</strong></p>
            </div>
            <button
              className="w-full rounded-full bg-paper px-4 py-3 text-xs md:text-sm font-semibold text-ink hover:bg-moss/40 transition"
              onClick={onTemporary}
              type="button"
            >
              {copy.home.temporary}
            </button>
          </div>

          {/* 桌面端人体工学贴士 */}
          <div className="hidden md:block rounded-[16px] bg-lavender/50 p-4 border border-black/5">
            <h4 className="text-xs font-semibold text-ink">💡 工位健康微贴士</h4>
            <p className="mt-1 text-xs leading-5 text-ink/70">
              每伏案工作 45~60 分钟进行一次 30 秒微伸展，能有效缓解上斜方肌与颈伸肌群痉挛，促进脑部供血。
            </p>
          </div>
        </div>
      </div>
      {standingPromptOpen && (
        <StandingPrompt
          onSeated={() => choosePromptMode("seated")}
          onStanding={() => choosePromptMode("standing")}
        />
      )}
    </div>
  );
}

function StandingPrompt({
  onSeated,
  onStanding
}: {
  onSeated: () => void;
  onStanding: () => void;
}) {
  const [tipIndex, setTipIndex] = useState(0);
  const currentTip = copy.home.standingPromptTips[tipIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % copy.home.standingPromptTips.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-30 grid place-items-end bg-ink/25 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-8 backdrop-blur-sm">
      <section
        aria-modal="true"
        className="w-full max-w-md animate-rise rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(47,50,45,0.24)]"
        role="dialog"
      >
        <div className="rounded-[18px] bg-moss/80 px-4 py-4">
          <p className="text-xs font-semibold text-leaf">久坐打断提醒</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal">
            {copy.home.standingPromptTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink/75">{copy.home.standingPromptLead}</p>
          <p
            aria-live="polite"
            className="mt-2 min-h-[3rem] rounded-[14px] bg-white/65 px-3 py-2 text-sm leading-6 text-ink/75 transition"
          >
            {currentTip}
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <button
            className="min-h-14 w-full rounded-full bg-leaf px-5 py-4 text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 active:translate-y-0.5"
            onClick={onStanding}
            type="button"
          >
            {copy.home.standingPromptStand}
          </button>
          <button
            className="min-h-14 w-full rounded-full bg-paper px-5 py-4 text-base font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 active:translate-y-0.5"
            onClick={onSeated}
            type="button"
          >
            {copy.home.standingPromptSit}
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, quiet = false }: { label: string; value: string; quiet?: boolean }) {
  return (
    <div className={cn("rounded-[8px] p-4", quiet ? "border border-black/5 bg-paper/70" : "bg-white/75 shadow-soft")}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function ExercisePlayer({
  session,
  likedExerciseGroups,
  onComplete,
  onExit,
  onToggleLike
}: {
  session: AppView & { name: "player" };
  likedExerciseGroups: LikedExerciseGroups;
  onComplete: (actualCompletedSec: number, completedExerciseIds?: string[]) => void;
  onExit: (actualCompletedSec: number, currentExerciseIndex: number) => void;
  onToggleLike: (groupId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const learnedExerciseIds = useRef(new Set(loadLearnedExerciseIds()));
  const initialExercise = session.session.exercises[0];
  const [phase, setPhase] = useState<"learning" | "transition" | "exercise">(() =>
    session.session.source === "single" || learnedExerciseIds.current.has(initialExercise?.id)
      ? "exercise"
      : "learning"
  );
  const [learningRemainingSec, setLearningRemainingSec] = useState(10);
  const [transitionRemainingSec, setTransitionRemainingSec] = useState(3);
  const [remainingSec, setRemainingSec] = useState(() => initialExercise?.duration ?? 30);
  const [running, setRunning] = useState(true);
  const [practiceHint, setPracticeHint] = useState(firstPracticeHint);
  const [practiceHintVisible, setPracticeHintVisible] = useState(true);
  const [actualCompletedSec, setActualCompletedSec] = useState(0);
  const [finished, setFinished] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const wasRunningBeforeTips = useRef(true);
  const completedExerciseIds = useRef<string[]>([]);
  const hintMainTimer = useRef<number | undefined>(undefined);
  const hintFadeTimer = useRef<number | undefined>(undefined);
  const hintStartedAt = useRef(0);
  const hintRemainingMs = useRef(6000);
  const lastPracticeHint = useRef(firstPracticeHint);
  const runningRef = useRef(running);
  const phaseRef = useRef(phase);
  const finishedRef = useRef(finished);
  const current = session.session.exercises[index];
  const total = session.session.exercises.length;
  const exerciseDurationSec = current.duration;
  const currentGroupId = groupIdForExercise(current.id);
  const currentLiked = Boolean(likedExerciseGroups[currentGroupId]);
  const usesLibrarySideTransition = session.session.source === "single" && total > 1;
  const exitLabel = session.session.source === "single" ? copy.library.backToLibrary : copy.common.backHome;

  useEffect(() => {
    runningRef.current = running;
    phaseRef.current = phase;
    finishedRef.current = finished;
  }, [finished, phase, running]);

  function recordCompletedExercise(exerciseId: string) {
    if (completedExerciseIds.current.includes(exerciseId)) return completedExerciseIds.current;
    completedExerciseIds.current = [...completedExerciseIds.current, exerciseId];
    return completedExerciseIds.current;
  }

  function clearPracticeHintTimers() {
    if (hintMainTimer.current) {
      window.clearTimeout(hintMainTimer.current);
      hintMainTimer.current = undefined;
    }
    if (hintFadeTimer.current) {
      window.clearTimeout(hintFadeTimer.current);
      hintFadeTimer.current = undefined;
    }
  }

  function resetPracticeHint() {
    clearPracticeHintTimers();
    hintRemainingMs.current = 6000;
    lastPracticeHint.current = firstPracticeHint;
    setPracticeHint(firstPracticeHint);
    setPracticeHintVisible(true);
  }

  function pausePracticeHintTimer() {
    if (hintMainTimer.current) {
      window.clearTimeout(hintMainTimer.current);
      hintMainTimer.current = undefined;
      hintRemainingMs.current = Math.max(0, hintRemainingMs.current - (Date.now() - hintStartedAt.current));
    }
    if (hintFadeTimer.current) {
      window.clearTimeout(hintFadeTimer.current);
      hintFadeTimer.current = undefined;
      setPracticeHintVisible(true);
    }
  }

  function startPracticeHintTimer() {
    clearPracticeHintTimers();
    hintStartedAt.current = Date.now();
    hintMainTimer.current = window.setTimeout(() => {
      hintMainTimer.current = undefined;
      setPracticeHintVisible(false);
      hintFadeTimer.current = window.setTimeout(() => {
        hintFadeTimer.current = undefined;
        const nextHint = randomPracticeHint(lastPracticeHint.current);
        lastPracticeHint.current = nextHint;
        hintRemainingMs.current = 5000;
        setPracticeHint(nextHint);
        setPracticeHintVisible(true);
        if (runningRef.current && phaseRef.current === "exercise" && !finishedRef.current) {
          startPracticeHintTimer();
        }
      }, 260);
    }, hintRemainingMs.current);
  }

  useEffect(() => {
    resetPracticeHint();
    return clearPracticeHintTimers;
  }, [current.id]);

  useEffect(() => {
    if (phase !== "exercise" || finished) {
      pausePracticeHintTimer();
      return undefined;
    }
    if (!running) {
      pausePracticeHintTimer();
      return undefined;
    }
    startPracticeHintTimer();
    return pausePracticeHintTimer;
  }, [current.id, finished, phase, running]);

  useEffect(() => {
    if (!running || finished) return undefined;
    const timer = window.setInterval(() => {
      if (phase === "learning") {
        setLearningRemainingSec((currentRemaining) => {
          if (currentRemaining > 1) return currentRemaining - 1;
          learnedExerciseIds.current.add(current.id);
          markExerciseLearned(current.id);
          setPhase("exercise");
          setRemainingSec(current.duration);
          return 0;
        });
        return;
      }
      if (phase === "transition") {
        setTransitionRemainingSec((currentRemaining) => {
          if (currentRemaining > 1) return currentRemaining - 1;
          showExercise(Math.min(index + 1, total - 1));
          return 3;
        });
        return;
      }
      setRemainingSec((currentRemaining) => {
        const nextRemaining = currentRemaining - 1;
        setActualCompletedSec((currentActual) => {
          const nextActual = currentActual + 1;
          const nextCompletedIds = nextRemaining <= 0
            ? recordCompletedExercise(current.id)
            : completedExerciseIds.current;
          if (nextRemaining <= 0 && index >= total - 1) {
            setFinished(true);
            setRunning(false);
            window.setTimeout(() => onComplete(nextActual, nextCompletedIds), 0);
          }
          return nextActual;
        });

        if (nextRemaining <= 0) {
          if (index < total - 1) {
            if (usesLibrarySideTransition) {
              window.setTimeout(() => {
                setTipsOpen(false);
                setPhase("transition");
                setTransitionRemainingSec(3);
              }, 0);
            } else {
              window.setTimeout(() => showExercise(index + 1), 0);
            }
          }
          return current.duration;
        }
        return nextRemaining;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [current.id, current.duration, finished, index, onComplete, phase, running, total, usesLibrarySideTransition]);

  function startExercise() {
    learnedExerciseIds.current.add(current.id);
    markExerciseLearned(current.id);
    resetPracticeHint();
    setPhase("exercise");
    setRemainingSec(current.duration);
    setRunning(true);
  }

  function showExercise(nextIndex: number) {
    const nextExercise = session.session.exercises[nextIndex];
    if (!nextExercise) return;
    setIndex(nextIndex);
    setTipsOpen(false);
    setRunning(true);
    if (session.session.source === "single" || learnedExerciseIds.current.has(nextExercise.id)) {
      setPhase("exercise");
      setRemainingSec(nextExercise.duration);
    } else {
      setPhase("learning");
      setLearningRemainingSec(10);
    }
  }

  function exitToHome() {
    setRunning(false);
    onExit(actualCompletedSec, index);
  }

  function previous() {
    if (index <= 0) return;
    showExercise(index - 1);
  }

  function skip() {
    if (index >= total - 1) {
      setFinished(true);
      setRunning(false);
      onComplete(actualCompletedSec, completedExerciseIds.current);
      return;
    }
    if (usesLibrarySideTransition) {
      setTipsOpen(false);
      setPhase("transition");
      setTransitionRemainingSec(3);
      setRunning(true);
      return;
    }
    showExercise(index + 1);
  }

  function cancelNextSide() {
    setFinished(true);
    setRunning(false);
    onComplete(actualCompletedSec, completedExerciseIds.current);
  }

  function restart() {
    resetPracticeHint();
    setRemainingSec(exerciseDurationSec);
    setRunning(true);
    if (phase === "exercise" && running && !finished) {
      window.setTimeout(() => {
        if (runningRef.current && phaseRef.current === "exercise" && !finishedRef.current) {
          startPracticeHintTimer();
        }
      }, 0);
    }
  }

  function openTips() {
    wasRunningBeforeTips.current = running;
    setRunning(false);
    setTipsOpen(true);
  }

  function closeTips() {
    setTipsOpen(false);
    setRunning(wasRunningBeforeTips.current);
  }

  const progressPercent = ((exerciseDurationSec - remainingSec) / exerciseDurationSec) * 100;

  if (phase === "learning") {
    return (
      <div className="flex min-h-[calc(100svh-24px)] animate-rise flex-col gap-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <header className="flex items-center justify-between">
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-ink"
            onClick={exitToHome}
            type="button"
          >
            <ArrowLeft size={18} />
            {exitLabel}
          </button>
          <div className="flex items-center gap-2">
            <LikeButton
              liked={currentLiked}
              label={currentLiked ? copy.common.unlike : copy.common.like}
              onClick={() => onToggleLike(currentGroupId)}
            />
            <span className="rounded-full bg-moss px-3 py-1 text-xs font-semibold text-leaf">
              {copy.player.progress(index + 1, total)}
            </span>
          </div>
        </header>

        <section className="text-center">
          <h1 className="text-3xl font-semibold tracking-normal">{copy.player.learningTitle}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{copy.player.learningPhilosophy}</p>
          <p className="mt-3 text-5xl font-semibold tabular-nums text-leaf" aria-label={`${learningRemainingSec} ${copy.common.seconds}`}>
            {learningRemainingSec}
          </p>
        </section>

        <ExerciseImage exercise={current} large />

        <div className="grid gap-3">
          <DetailPanel icon={<ClipboardList size={15} />} title={copy.player.instructionTitle} items={current.instructions} />
          <DetailPanel icon={<ShieldCheck size={15} />} title={copy.player.safetyTitle} items={current.safetyTips} safety />
        </div>

        <button
          className="mt-auto min-h-14 w-full rounded-full bg-leaf px-5 py-4 text-base font-semibold text-white shadow-soft transition active:scale-[0.99]"
          onClick={startExercise}
          type="button"
        >
          {copy.player.learnedAction}
        </button>
      </div>
    );
  }

  if (phase === "transition") {
    const nextExercise = session.session.exercises[Math.min(index + 1, total - 1)];
    return (
      <div className="flex min-h-[calc(100svh-24px)] animate-rise flex-col items-center justify-center gap-8 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] text-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-leaf">{copy.player.sideTransitionLabel}</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            {copy.player.sideTransitionTitle(nextExercise?.name ?? "")}
          </h1>
          <p className="text-8xl font-semibold leading-none tabular-nums text-leaf">
            {transitionRemainingSec}
          </p>
        </div>
        {nextExercise && <ExerciseImage exercise={nextExercise} />}
        <button
          className="mt-6 rounded-full bg-white/80 px-5 py-3 text-sm font-semibold text-muted shadow-sm"
          onClick={cancelNextSide}
          type="button"
        >
          {copy.player.cancelNextSide}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100svh-24px)] animate-rise flex-col gap-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)]">
      <header className="flex items-center justify-between pb-0.5">
        <button
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-1 py-1 text-sm font-semibold text-ink"
          onClick={exitToHome}
          type="button"
        >
          <ArrowLeft size={18} />
          {exitLabel}
        </button>
        <div className="flex items-center gap-2">
          <LikeButton
            liked={currentLiked}
            label={currentLiked ? copy.common.unlike : copy.common.like}
            onClick={() => onToggleLike(currentGroupId)}
          />
          <span className="rounded-full bg-moss px-3 py-1 text-xs font-semibold text-leaf">
            {copy.player.progress(index + 1, total)}
          </span>
        </div>
      </header>

      <p
        className={cn(
          "mx-auto min-h-6 max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-1 text-center text-[clamp(14px,3.75vw,16px)] font-medium leading-6 text-leaf/75 transition-opacity duration-300",
          practiceHintVisible ? "opacity-100" : "opacity-0"
        )}
      >
        {practiceHint}
      </p>

      <section className="flex flex-1 flex-col justify-start gap-3 py-0">
        <ExerciseImage exercise={current} immersive />
        <div className="text-center">
          <p className="text-6xl font-semibold leading-none tabular-nums text-leaf">{remainingSec}</p>
          <p className="mt-1 text-xs text-muted">{copy.common.seconds}</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-leaf transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      <button
        className="absolute bottom-[4.25rem] right-0 z-10 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold text-ink/75 shadow-sm backdrop-blur-md transition hover:bg-white/90"
        onClick={openTips}
        type="button"
      >
        {copy.player.tips}
      </button>

      <div className="grid grid-cols-4 gap-2 rounded-[8px] bg-paper/85 pt-1 backdrop-blur">
        <IconButton
          disabled={index === 0}
          icon={<ArrowLeft size={18} />}
          label={copy.player.previous}
          onClick={previous}
        />
        <IconButton
          icon={running ? <Pause size={18} /> : <Play size={18} />}
          label={running ? copy.player.pause : copy.player.resume}
          onClick={() => setRunning((currentRunning) => !currentRunning)}
          primary
        />
        <IconButton icon={<SkipForward size={18} />} label={copy.player.skip} onClick={skip} />
        <IconButton icon={<RotateCcw size={18} />} label={copy.player.restart} onClick={restart} />
      </div>

      {tipsOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink/20 px-5 py-8 backdrop-blur-sm">
          <section aria-modal="true" className="max-h-[80svh] w-full max-w-md overflow-y-auto rounded-[22px] border border-white/60 bg-white/75 p-5 shadow-[0_24px_80px_rgba(47,50,45,0.22)] backdrop-blur-xl" role="dialog">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">{copy.player.tips}</h2>
              <button
                aria-label={copy.player.closeTips}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-muted"
                onClick={closeTips}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <DetailPanel icon={<ClipboardList size={15} />} title={copy.player.instructionTitle} items={current.instructions} />
              <DetailPanel icon={<ShieldCheck size={15} />} title={copy.player.safetyTitle} items={current.safetyTips} safety />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function DetailPanel({
  icon,
  title,
  items,
  safety = false
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  safety?: boolean;
}) {
  return (
    <section className={cn("rounded-[8px] px-4 py-3", safety ? "bg-coral/15" : "bg-white/85 shadow-sm")}>
      <div className="flex items-center gap-2">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-white", safety ? "bg-coral" : "bg-leaf")}>
          {icon}
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-ink/80">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  primary = false,
  disabled = false
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[8px] text-xs font-semibold transition",
        primary ? "bg-leaf text-white shadow-soft" : "bg-white/85 text-ink shadow-sm",
        disabled && "cursor-not-allowed opacity-40"
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function LikeButton({
  liked,
  label,
  onClick,
  className
}: {
  liked: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/85 text-muted shadow-sm transition hover:bg-white",
        liked && "text-[#d94d5c]",
        className
      )}
      onClick={onClick}
      type="button"
    >
      <Heart fill={liked ? "currentColor" : "none"} size={19} />
    </button>
  );
}

function DetailHeroImage({ exercise }: { exercise: Exercise }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [exercise.id, exercise.coverImage]);

  return (
    <div className="relative h-[clamp(208px,25svh,224px)] w-full overflow-hidden rounded-[18px] bg-white shadow-soft">
      {!failed ? (
        <img
          alt={exercise.name}
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
          src={exercise.coverImage}
        />
      ) : (
        <div aria-label={copy.player.imagePlaceholder} className="grid h-full w-full place-items-center bg-moss/70 px-5 text-center text-sm leading-6 text-leaf">
          {copy.player.imagePlaceholder}
        </div>
      )}
    </div>
  );
}

function Completion({
  session,
  sessions,
  mode,
  likedExerciseGroups,
  onHome,
  onAgain,
  onToggleLike
}: {
  session: CompletedSession;
  sessions: CompletedSession[];
  mode: "regular" | "single" | "replay";
  likedExerciseGroups: LikedExerciseGroups;
  onHome: () => void;
  onAgain: () => void;
  onToggleLike: (groupId: string) => void;
}) {
  const modeLabel =
    mode === "single" ? copy.completion.singleMode : mode === "replay" ? copy.completion.replayMode : copy.completion.regularMode;
  const primaryLabel = mode === "regular" ? copy.completion.regularPrimary : copy.completion.replayPrimary;
  const secondaryLabel =
    mode === "single" ? copy.completion.backLibrary : mode === "replay" ? copy.completion.backProfile : copy.completion.again;
  const feedback =
    mode === "regular"
      ? copy.completion.regularFeedback
      : copy.completion.feedback[session.movementCount % copy.completion.feedback.length];
  const primaryGroupId = session.exerciseIds[0] ? groupIdForExercise(session.exerciseIds[0]) : undefined;

  return (
    <div className="flex min-h-[calc(100svh-40px)] animate-rise flex-col justify-between gap-8 py-6">
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-moss text-leaf">
            <Check size={28} />
          </div>
          {primaryGroupId && (
            <LikeButton
              liked={Boolean(likedExerciseGroups[primaryGroupId])}
              label={likedExerciseGroups[primaryGroupId] ? copy.common.unlike : copy.common.like}
              onClick={() => onToggleLike(primaryGroupId)}
            />
          )}
        </div>
        <div className="space-y-2">
          {mode !== "regular" && <p className="text-sm font-medium text-leaf">{modeLabel}</p>}
          <h1 className="text-4xl font-semibold leading-tight tracking-normal">
            {primaryLabel} {formatDuration(session.actualCompletedSec)}
          </h1>
          <p className="text-base leading-7 text-muted">{feedback}</p>
          <p className="text-base font-semibold leading-7 text-leaf">{copy.completion.sittingBreakFeedback}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat label={copy.completion.todayTotal} value={formatDuration(todayTotalSec(sessions))} />
        <Stat label={copy.completion.streak} value={copy.common.days(calculateStreak(sessions))} />
        <Stat label={copy.completion.movementCount} value={copy.common.movements(session.movementCount)} />
        <Stat label={copy.completion.targetAreas} value={copy.common.targetPriority(areaLabels(session.targetAreas))} />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button className="rounded-full bg-moss px-4 py-4 font-semibold text-ink" onClick={onHome} type="button">
          {copy.completion.home}
        </button>
        <button className="rounded-full bg-leaf px-4 py-4 font-semibold text-white shadow-soft" onClick={onAgain} type="button">
          {secondaryLabel}
        </button>
      </div>
    </div>
  );
}

function LibraryScreen({
  likedExerciseGroups,
  onOpen,
  onToggleLike
}: {
  likedExerciseGroups: LikedExerciseGroups;
  onOpen: (group: ExerciseGroup) => void;
  onToggleLike: (groupId: string) => void;
}) {
  const [filter, setFilter] = useState<TargetArea | typeof copy.library.all>(copy.library.all);
  const filtered = useMemo(() => {
    const groups = filter === copy.library.all
      ? libraryExerciseGroups()
      : libraryExerciseGroups().filter((group) => groupMatchesCategory(group, filter));
    return sortGroupsByLike(groups, likedExerciseGroups);
  }, [filter, likedExerciseGroups]);

  return (
    <div className="animate-rise space-y-5">
      <header className="space-y-2">
        <p className="text-sm font-medium text-leaf">{copy.library.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-normal">{copy.library.title}</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {([copy.library.all, ...exerciseCategories] as const).map((item) => (
          <button
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm transition",
              filter === item ? "bg-leaf text-white" : "bg-white/75 text-muted"
            )}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4">
        {filtered.map((group) => {
          const exercise = primaryExerciseForGroup(group);
          const isLiked = Boolean(likedExerciseGroups[group.id]);
          return (
          <article
            key={group.id}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-soft border border-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-leaf/30"
          >
            <button
              className="flex w-full items-center gap-3.5 p-3 pr-12 text-left"
              onClick={() => onOpen(group)}
              type="button"
            >
              {/* 精致缩略图：无白边，填满比例 */}
              <div className="relative h-18 w-22 md:h-20 md:w-26 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                <img
                  src={exercise.coverImage}
                  alt={group.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              {/* 极简文本：仅标题 + 分类微标签 + 时长 */}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-ink text-base tracking-tight truncate group-hover:text-leaf transition-colors">
                  {group.name}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-moss/70 px-2.5 py-0.5 text-xs font-medium text-leaf">
                    {exercise.category}
                  </span>
                  <span className="text-xs text-muted">
                    {copy.common.durationSec(exercise.duration)}
                  </span>
                </div>
              </div>
            </button>

            {/* 收藏按钮 */}
            <LikeButton
              className="absolute right-2.5 top-2.5 h-8 w-8 bg-paper/80 hover:bg-white transition"
              liked={isLiked}
              label={isLiked ? copy.common.unlike : copy.common.like}
              onClick={() => onToggleLike(group.id)}
            />
          </article>
        );
        })}
      </section>
    </div>
  );
}

function ImageViewerModal({
  isOpen,
  onClose,
  title,
  coverUrl,
  demoUrl
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  coverUrl: string;
  demoUrl: string;
}) {
  const [activeTab, setActiveTab] = useState<"demo" | "cover">("demo");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-fade-in text-white"
      role="dialog"
      aria-modal="true"
    >
      {/* 顶部控制栏 */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm md:text-base truncate max-w-[160px] md:max-w-md">
            {title}
          </span>
          {/* 切换展示图 */}
          <div className="flex items-center rounded-full bg-white/10 p-0.5 text-xs">
            <button
              className={cn(
                "rounded-full px-3 py-1 font-medium transition",
                activeTab === "demo" ? "bg-white text-ink shadow" : "text-white/70 hover:text-white"
              )}
              onClick={() => setActiveTab("demo")}
              type="button"
            >
              高清教学分解图
            </button>
            <button
              className={cn(
                "rounded-full px-3 py-1 font-medium transition",
                activeTab === "cover" ? "bg-white text-ink shadow" : "text-white/70 hover:text-white"
              )}
              onClick={() => setActiveTab("cover")}
              type="button"
            >
              标准动作封面
            </button>
          </div>
        </div>

        {/* 缩放与关闭按钮 */}
        <div className="flex items-center gap-2">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
            disabled={zoom <= 0.6}
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
            title="缩小"
            type="button"
          >
            <ZoomOut size={16} />
          </button>
          <span className="min-w-12 text-center text-xs font-mono text-white/80">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
            disabled={zoom >= 3}
            onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
            title="放大"
            type="button"
          >
            <ZoomIn size={16} />
          </button>
          <button
            className="flex h-9 px-3 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-xs font-medium"
            onClick={() => setZoom(1)}
            type="button"
          >
            100%
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition ml-2"
            onClick={onClose}
            title="关闭"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* 核心全尺寸滚动预览区 */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center">
        <div
          className="transition-transform duration-200 ease-out origin-top"
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={activeTab === "demo" ? demoUrl : coverUrl}
            alt={title}
            className="max-w-full h-auto rounded-xl shadow-2xl object-contain mx-auto"
            style={{ maxHeight: zoom === 1 ? "80vh" : "none" }}
          />
        </div>
      </div>

      {/* 底部缩放提示 */}
      <footer className="h-10 shrink-0 border-t border-white/10 px-4 flex items-center justify-center text-[11px] text-white/50">
        💡 鼠标滚轮或点击右上角 +/- 自由无级缩放查看高解析度肌群定位与动作分解细节
      </footer>
    </div>
  );
}

function LibraryDetail({
  group,
  likedAt,
  onBack,
  onStart,
  onToggleLike
}: {
  group: ExerciseGroup;
  likedAt?: string;
  onBack: () => void;
  onStart: (exercisesForSession: Exercise[]) => void;
  onToggleLike: () => void;
}) {
  const primaryExercise = primaryExerciseForGroup(group);
  const sessionExercises = exerciseGroupExercises(group);
  const isPaired = sessionExercises.length > 1;
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100svh-24px)] animate-rise flex-col gap-5 pb-24 md:pb-12 max-w-3xl mx-auto">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between">
        <button
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-base font-semibold text-ink hover:text-leaf transition"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={20} strokeWidth={2.4} />
          {copy.common.back}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewerOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm border border-black/5 hover:bg-white transition"
            type="button"
          >
            <Maximize2 size={13} className="text-leaf" />
            <span>全屏大图</span>
          </button>
          <LikeButton
            className="h-9 w-9 bg-white/80 shadow-sm"
            liked={Boolean(likedAt)}
            label={likedAt ? copy.common.unlike : copy.common.like}
            onClick={onToggleLike}
          />
        </div>
      </header>

      {/* 沉浸式 Hero 图片区域（告别难看白边留白，支持点击放大） */}
      <div
        className="group relative w-full overflow-hidden rounded-3xl bg-stone-900 shadow-soft cursor-pointer aspect-[16/10] md:aspect-[16/9] max-h-[360px]"
        onClick={() => setViewerOpen(true)}
      >
        {/* 底层环境虚化，彻底解决侧边留白难看问题 */}
        <img
          src={primaryExercise.coverImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-40 scale-110"
        />

        {/* 主体高清居中封面 */}
        <img
          alt={primaryExercise.name}
          className="relative z-10 h-full w-full object-contain md:object-cover transition duration-300 group-hover:scale-[1.02]"
          src={primaryExercise.coverImage}
        />

        {/* 底部渐变暗影与悬浮信息 */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* 左上角分类气泡 */}
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
          <span className="rounded-full bg-white/95 backdrop-blur px-3 py-1 text-xs font-semibold text-leaf shadow">
            {primaryExercise.category}
          </span>
          {isPaired && (
            <span className="rounded-full bg-leaf px-2.5 py-1 text-xs font-medium text-white shadow">
              双侧对称
            </span>
          )}
        </div>

        {/* 右下角点击全屏提示气泡 */}
        <div className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-xs font-medium text-white shadow-lg transition duration-200 group-hover:bg-leaf">
          <Maximize2 size={13} />
          <span>点击全尺寸缩放 (含分解图)</span>
        </div>
      </div>

      {/* 标题与对称练习导语 */}
      <section className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">
          {group.name}
        </h1>
        <p className="text-xs md:text-sm text-muted">
          重点放松：<strong className="text-ink font-semibold">{primaryExercise.targetMuscles}</strong>
        </p>

        {isPaired && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-moss/70 px-4 py-2.5 text-xs md:text-sm font-medium text-leaf">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf text-white text-[11px] font-bold">
              ⇄
            </span>
            <span>{copy.library.pairedPracticeNotice}</span>
          </div>
        )}
      </section>

      {/* 3大核心指标卡片（拒绝干瘪长句，现代卡片化排版） */}
      <section className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-white p-3.5 border border-black/5 shadow-soft text-center space-y-1">
          <span className="text-[11px] font-medium text-muted block">单次时长</span>
          <span className="text-sm md:text-base font-bold text-ink block">
            {copy.common.durationSec(primaryExercise.duration)}
          </span>
        </div>
        <div className="rounded-2xl bg-white p-3.5 border border-black/5 shadow-soft text-center space-y-1">
          <span className="text-[11px] font-medium text-muted block">练习体态</span>
          <span className="text-sm md:text-base font-bold text-ink block">
            {primaryExercise.posture}
          </span>
        </div>
        <div className="rounded-2xl bg-white p-3.5 border border-black/5 shadow-soft text-center space-y-1">
          <span className="text-[11px] font-medium text-muted block">拉伸强度</span>
          <span className="text-sm md:text-base font-bold text-leaf block">
            {primaryExercise.intensity}
          </span>
        </div>
      </section>

      {/* 动作步骤分解（现代步骤时间线） */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <ClipboardList size={18} className="text-leaf" />
            动作要领分解
          </h2>
          <button
            onClick={() => setViewerOpen(true)}
            className="text-xs font-semibold text-leaf hover:underline flex items-center gap-1"
            type="button"
          >
            <Maximize2 size={12} />
            查看原图图谱
          </button>
        </div>

        <div className="space-y-2.5">
          {primaryExercise.instructions.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-black/5 shadow-soft transition hover:border-moss"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf text-xs font-bold text-white shadow-sm mt-0.5">
                {index + 1}
              </div>
              <p className="text-sm leading-relaxed text-ink/90 flex-1 font-normal">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 安全防线与发力感受 */}
      <section className="rounded-2xl bg-coral/10 p-4 border border-coral/20 space-y-2">
        <h3 className="text-sm font-bold text-[#a85f51] flex items-center gap-1.5">
          <ShieldCheck size={16} />
          {copy.player.safetyTitle}
        </h3>
        <ul className="space-y-1.5 text-xs leading-relaxed text-ink/80 pl-1">
          {primaryExercise.safetyTips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-coral font-bold">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 底部悬浮固定开始按钮 */}
      <div className="sticky bottom-3 z-20 pt-2">
        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-leaf to-[#5d7f60] px-6 text-base md:text-lg font-bold text-white shadow-[0_8px_20px_rgba(111,143,114,0.35)] transition duration-150 hover:shadow-[0_10px_24px_rgba(111,143,114,0.45)] hover:-translate-y-0.5 active:translate-y-0.5"
          onClick={() => onStart(sessionExercises)}
          type="button"
        >
          <Play size={18} fill="currentColor" />
          <span>立即跟练 ({copy.common.durationSec(primaryExercise.duration * sessionExercises.length)})</span>
        </button>
      </div>

      {/* 全屏全尺寸图片缩放 Modal */}
      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={group.name}
        coverUrl={primaryExercise.coverImage}
        demoUrl={primaryExercise.demoPageImage}
      />
    </div>
  );
}

function GalleryScreen({
  onOpenGroup
}: {
  onOpenGroup: (groupId: string) => void;
}) {
  const [filter, setFilter] = useState<ExerciseCategory | "全部">("全部");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    return filter === "全部"
      ? exercises
      : exercises.filter((e) => e.category === filter);
  }, [filter]);

  function copyText(text: string, id: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="animate-rise space-y-6">
      <header className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-moss/80 px-3 py-1 text-xs font-semibold text-leaf">
          <Images size={14} />
          资源与动效管理中心
        </div>
        <h1 className="text-3xl font-semibold tracking-normal text-ink">动作图库与资产映射</h1>
        <p className="text-sm text-muted">
          所有图片与动画均遵循统一的英文 ID 命名规则，放入指定目录即可在全端（Web / iOS / Android / AI 插件）100% 自动装配生效。
        </p>
      </header>

      {/* 规范与目录指南卡片 */}
      <section className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-soft space-y-4">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          📁 资产应该放在哪里？（开发者与设计团队交付指南）
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl bg-paper p-3.5 space-y-1.5 border border-black/5">
            <span className="font-semibold text-leaf">1. 动作封面卡片图 (Cover)</span>
            <p className="text-muted font-mono break-all text-[11px]">public/assets/exercises/covers/&#123;id&#125;.png</p>
            <p className="text-ink/70 leading-relaxed">用于动作库列表、推荐页封面与小缩略图。尺寸推荐 400x300 或 1:1 正方形。</p>
          </div>
          <div className="rounded-xl bg-paper p-3.5 space-y-1.5 border border-black/5">
            <span className="font-semibold text-leaf">2. 动作演示大图 (Demo)</span>
            <p className="text-muted font-mono break-all text-[11px]">public/assets/exercises/demos/&#123;id&#125;.png</p>
            <p className="text-ink/70 leading-relaxed">用于动作详情页大图与分解步骤演示。高清清晰无背景或浅色底色。</p>
          </div>
          <div className="rounded-xl bg-paper p-3.5 space-y-1.5 border border-black/5">
            <span className="font-semibold text-leaf">3. 动态动画 (Lottie / GIF)</span>
            <p className="text-muted font-mono break-all text-[11px]">public/assets/exercises/animations/&#123;id&#125;.json</p>
            <p className="text-ink/70 leading-relaxed">跟练倒计时中的动态演示。支持 Lottie (.json) 或标准动图 (.gif / .webp)。</p>
          </div>
        </div>
        <div className="rounded-lg bg-moss/50 px-3.5 py-2.5 text-xs text-ink/80 flex items-center gap-2">
          <span>💡 <strong>智能匹配机制</strong>：系统已配置基于 ID 的自动映射，例如动作为 <code>neck_side_tilt_left</code>，只要放入 <code>neck_side_tilt_left.png</code> 或 <code>neck_side_tilt_left.json</code> 就会被系统自动加载！</span>
        </div>
      </section>

      {/* 分类筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["全部", ...exerciseCategories] as const).map((cat) => (
          <button
            key={cat}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
              filter === cat ? "bg-leaf text-white shadow-sm" : "bg-white/80 text-muted hover:bg-moss/40"
            )}
            onClick={() => setFilter(cat)}
            type="button"
          >
            {cat} {cat === "全部" ? `(${exercises.length})` : `(${exercises.filter(e => e.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* 动作资产列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => {
          const groupId = groupIdForExercise(exercise.id);
          const isCopied = copiedId === exercise.id;
          return (
            <div key={exercise.id} className="rounded-2xl border border-black/5 bg-white/90 p-4 shadow-soft flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-ink text-base">{exercise.name}</h3>
                    <p className="text-xs text-muted mt-0.5">{exercise.category} · {exercise.targetMuscles}</p>
                  </div>
                  <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs text-ink/70 font-medium">
                    {exercise.posture}
                  </span>
                </div>

                {/* ID pill & copy button */}
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-paper px-2.5 py-1.5 border border-black/5">
                  <span className="font-mono text-xs text-ink/80 truncate">ID: {exercise.id}</span>
                  <button
                    onClick={() => copyText(exercise.id, exercise.id)}
                    className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-leaf hover:underline shrink-0"
                    type="button"
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    {isCopied ? "已复制" : "复制ID"}
                  </button>
                </div>
              </div>

              {/* Media assets status */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Cover preview */}
                <div className="rounded-xl bg-paper/80 p-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>封面图</span>
                    <span className="text-leaf font-semibold">已就绪</span>
                  </div>
                  <div className="relative h-20 w-full overflow-hidden rounded-lg bg-white border border-black/5 grid place-items-center">
                    <img
                      src={exercise.coverImage}
                      alt={exercise.name}
                      className="h-full w-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-muted truncate">{exercise.id}.png</p>
                </div>

                {/* Demo preview */}
                <div className="rounded-xl bg-paper/80 p-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>演示图</span>
                    <span className="text-leaf font-semibold">已就绪</span>
                  </div>
                  <div className="relative h-20 w-full overflow-hidden rounded-lg bg-white border border-black/5 grid place-items-center">
                    <img
                      src={exercise.demoPageImage}
                      alt={exercise.name}
                      className="h-full w-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-muted truncate">{exercise.id}.png</p>
                </div>
              </div>

              {/* Animation placeholder state */}
              <div className="rounded-xl bg-moss/30 p-2.5 text-xs text-ink/70 flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <Sparkles size={13} className="text-leaf shrink-0" />
                  <span className="truncate">动画：待放入 {exercise.id}.json</span>
                </div>
                {groupId && (
                  <button
                    onClick={() => onOpenGroup(groupId)}
                    className="text-xs font-semibold text-leaf hover:underline shrink-0 ml-1"
                    type="button"
                  >
                    在动作库查看 ➔
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// Duolingo 风格游戏化弹窗与成就组件
// ==========================================

// 1. 连续打卡星光历程弹窗 (Streak Calendar Modal)
function StreakCalendarModal({
  isOpen,
  onClose,
  streak,
  sessions
}: {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  sessions: CompletedSession[];
}) {
  if (!isOpen) return null;

  // 生成当前月打卡状态
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const sessionDates = new Set(sessions.map((s) => s.date));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl border-4 border-[#FAF7F0] space-y-5 animate-spring-up">
        {/* 顶部关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition"
          type="button"
        >
          <X size={16} />
        </button>

        {/* 萌趣头部 */}
        <div className="text-center space-y-1 pt-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-500 shadow-inner">
            <Flame size={36} className="fill-amber-500 animate-bounce" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-ink">
            {streak} 天连续打卡！
          </h3>
          <p className="text-xs text-muted">
            {streak > 0
              ? "太棒了！你的久坐脊椎正在感激你的坚持！"
              : "今天还没有开始打卡，做一次 30 秒拉伸即刻点亮！"}
          </p>
        </div>

        {/* 本月打卡星光微矩阵 */}
        <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-100/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span>📅 {currentYear}年{currentMonth}月 打卡星图</span>
            <span className="text-amber-600">已点亮 {sessions.length} 天</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
            {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
              <span key={w} className="text-stone-400 font-medium pb-0.5">
                {w}
              </span>
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = dayNum === today.getDate();
              const isDone = sessionDates.has(dateStr);
              return (
                <div
                  key={dayNum}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full font-bold text-[11px] transition-transform",
                    isDone
                      ? "bg-amber-400 text-white shadow-[0_2px_0_#d97706] scale-105"
                      : isToday
                      ? "border-2 border-dashed border-amber-400 text-amber-600 bg-white"
                      : "text-stone-400 bg-white/70"
                  )}
                >
                  {isDone ? "🔥" : dayNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* 里程碑进度条 */}
        <div className="rounded-2xl bg-paper p-3.5 space-y-1.5 text-xs">
          <div className="flex justify-between font-semibold text-ink">
            <span>下一个里程碑：7日坚持勋章</span>
            <span className="text-leaf">{Math.min(7, streak)}/7 天</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-leaf transition-all duration-500"
              style={{ width: `${Math.min(100, (streak / 7) * 100)}%` }}
            />
          </div>
        </div>

        {/* 确认大按钮 */}
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-leaf py-3 text-base font-bold text-white shadow-[0_4px_0_#4f6e52] active:translate-y-1 active:shadow-none transition"
          type="button"
        >
          太棒了，继续保持！
        </button>
      </div>
    </div>
  );
}

// 2. 身体电量与健康小结弹窗 (Energy Station Detail Modal)
function EnergyDetailModal({
  isOpen,
  onClose,
  todaySec,
  sessions
}: {
  isOpen: boolean;
  onClose: () => void;
  todaySec: number;
  sessions: CompletedSession[];
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl border-4 border-[#FAF7F0] space-y-5 animate-spring-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition"
          type="button"
        >
          <X size={16} />
        </button>

        <div className="text-center space-y-1 pt-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-inner">
            <Zap size={36} className="fill-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-ink">
            {todaySec > 0 ? "工位电量 100% 满格！" : "工位电量待充电 🔋"}
          </h3>
          <p className="text-xs text-muted">
            微拉伸促进肩颈深层血液循环，快速化解伏案疲劳
          </p>
        </div>

        {/* 核心指标展板 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-paper p-3.5 text-center space-y-0.5 border border-black/5">
            <span className="text-[11px] font-medium text-muted">今日拉伸时长</span>
            <span className="text-xl font-bold text-ink block">{formatDuration(todaySec)}</span>
          </div>
          <div className="rounded-2xl bg-paper p-3.5 text-center space-y-0.5 border border-black/5">
            <span className="text-[11px] font-medium text-muted">累计打卡组数</span>
            <span className="text-xl font-bold text-leaf block">{sessions.length} 组</span>
          </div>
        </div>

        {/* 舒展部位收益 */}
        <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100 space-y-2 text-xs">
          <span className="font-semibold text-emerald-900 block">🌿 身体获益清单：</span>
          <ul className="space-y-1.5 text-emerald-800">
            <li className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              <span>释放颈深伸肌群紧张，预防“富贵包”</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              <span>唤醒沉睡菱形肌，改善伏案圆肩驼背</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              <span>恢复下腰背腰椎曲度，减轻坐骨压力</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-leaf py-3 text-base font-bold text-white shadow-[0_4px_0_#4f6e52] active:translate-y-1 active:shadow-none transition"
          type="button"
        >
          收到，身体舒服多了！
        </button>
      </div>
    </div>
  );
}

// 3. 工位成就勋章馆弹窗 (Achievements Modal)
function AchievementsModal({
  isOpen,
  onClose,
  streak,
  sessionsCount
}: {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  sessionsCount: number;
}) {
  if (!isOpen) return null;

  const achievements = [
    {
      id: "first_move",
      title: "初出茅庐",
      desc: "完成第 1 次微运动拉伸打卡",
      icon: "🌟",
      unlocked: sessionsCount >= 1,
      progress: `${Math.min(1, sessionsCount)}/1`
    },
    {
      id: "streak_3",
      title: "三日星火",
      desc: "连续打卡达到 3 天",
      icon: "🔥",
      unlocked: streak >= 3,
      progress: `${Math.min(3, streak)}/3`
    },
    {
      id: "sessions_5",
      title: "能量满格",
      desc: "累计完成 5 组工位微循环",
      icon: "⚡",
      unlocked: sessionsCount >= 5,
      progress: `${Math.min(5, sessionsCount)}/5`
    },
    {
      id: "habit_master",
      title: "工位脊椎救星",
      desc: "连续打卡达到 7 天",
      icon: "👑",
      unlocked: streak >= 7,
      progress: `${Math.min(7, streak)}/7`
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl border-4 border-[#FAF7F0] space-y-5 animate-spring-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition"
          type="button"
        >
          <X size={16} />
        </button>

        <div className="text-center space-y-1 pt-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-500 shadow-inner">
            <Trophy size={36} className="fill-amber-400 text-amber-500 animate-bounce" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-ink">
            工位成就勋章馆
          </h3>
          <p className="text-xs text-muted">
            每坚持一次微拉伸，都在解锁更健康的体态勋章！
          </p>
        </div>

        {/* 勋章列表 */}
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-3 border transition",
                item.unlocked
                  ? "bg-amber-50/50 border-amber-200 shadow-sm"
                  : "bg-stone-50 border-stone-100 opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm",
                  item.unlocked ? "bg-amber-300" : "bg-stone-200 grayscale"
                )}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-ink">{item.title}</h4>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      item.unlocked
                        ? "bg-amber-200 text-amber-900"
                        : "bg-stone-200 text-stone-600"
                    )}
                  >
                    {item.unlocked ? "已解锁 ✅" : item.progress}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-leaf py-3 text-base font-bold text-white shadow-[0_4px_0_#4f6e52] active:translate-y-1 active:shadow-none transition"
          type="button"
        >
          继续开练，解锁更多！
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 主个人主页 (ProfileScreen) - Duolingo 风格
// ==========================================
function ProfileScreen({
  preferences,
  sessions,
  abandonedSessions,
  todaySec,
  streak,
  onEdit,
  onReplay,
  onSignOut
}: {
  preferences: Preferences;
  sessions: CompletedSession[];
  abandonedSessions: AbandonedSession[];
  todaySec: number;
  streak: number;
  onEdit: () => void;
  onReplay: (exerciseIds: string[], targetAreas: string[], plannedDurationSec: number) => void;
  onSignOut?: () => void;
}) {
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [energyModalOpen, setEnergyModalOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [sessions]
  );
  const sortedAbandonedSessions = useMemo(
    () => [...abandonedSessions].sort((a, b) => b.abandonedAt.localeCompare(a.abandonedAt)),
    [abandonedSessions]
  );

  return (
    <div className="animate-rise space-y-6 max-w-2xl mx-auto pb-16">
      {/* 1. 多邻国吉祥物形象与问候卡片 */}
      <section className="flex items-center justify-between rounded-[28px] bg-white p-5 shadow-soft border-2 border-black/5">
        <div className="flex items-center gap-4">
          {/* 吉祥物头像 */}
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-moss/70 border-2 border-white shadow-md grid place-items-center">
              <img
                src={getAsset("/assets/ip/ip-1.png")}
                alt="吉祥物"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-bold ring-2 ring-white">
              ✓
            </span>
          </div>

          {/* 用户称号与等级 */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink">微运动探索者</h1>
              <span className="rounded-full bg-sun/80 px-2 py-0.5 text-[11px] font-bold text-amber-900 shadow-sm">
                Lv.1 萌新
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              今日工位电量：
              <span className={todaySec > 0 ? "font-bold text-leaf ml-1" : "font-bold text-amber-600 ml-1"}>
                {todaySec > 0 ? "100% 充满 ⚡️" : "待充电 🔋"}
              </span>
            </p>
          </div>
        </div>

        {/* 连续打卡小火苗胶囊（点击呼出弹窗） */}
        <button
          onClick={() => setStreakModalOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-sm hover:scale-105 active:scale-95 transition"
          type="button"
        >
          <Flame size={16} className="fill-amber-500 text-amber-500 animate-pulse" />
          <span>{streak} 天</span>
        </button>
      </section>

      {/* 2. 核心大眼球卡片 A：🔥 连续打卡周星轨 (点击弹窗详情) */}
      <section
        onClick={() => setStreakModalOpen(true)}
        className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-amber-50 to-[#FFF7E8] p-5 shadow-soft border-2 border-amber-200/80 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-white shadow-[0_3px_0_#d97706]">
              <Flame size={20} className="fill-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-950">连续打卡星轨</h2>
              <p className="text-xs text-amber-800/80 mt-0.5">
                {streak > 0 ? `🔥 连续 ${streak} 天点亮工位能量！` : "开始今天的 30 秒打卡吧！"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
            <span>日历详情</span>
            <ChevronRight size={15} />
          </div>
        </div>

        {/* 7日能量球周里程碑 */}
        <div className="mt-4 pt-3 border-t border-amber-200/60 flex justify-between px-1">
          {[...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const isDone = sortedSessions.some((s) => s.date === dateStr);
            const isToday = i === 6;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-amber-800/70">
                  {["日", "一", "二", "三", "四", "五", "六"][d.getDay()]}
                </span>
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-bold transition-transform shadow-sm",
                    isDone
                      ? "bg-amber-400 text-white shadow-[0_3px_0_#b45309] scale-105"
                      : isToday
                      ? "border-2 border-dashed border-amber-400 bg-white text-amber-600"
                      : "bg-white/80 text-stone-400"
                  )}
                >
                  {isDone ? "🔥" : d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. 核心大眼球卡片 B：⚡️ 充电站与微健康报告 (点击弹窗详情) */}
      <section
        onClick={() => setEnergyModalOpen(true)}
        className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-leaf to-[#567a5a] p-5 shadow-soft text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur shadow-sm">
              <Zap size={20} className="fill-yellow-300 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">工位能量充电站</h2>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                {todaySec > 0 ? "⚡ 今日电量已蓄满！活力充沛" : "🔋 今日电量较低，做组微拉伸即刻唤醒"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-white/90 group-hover:translate-x-1 transition-transform">
            <span>健康分析</span>
            <ChevronRight size={15} />
          </div>
        </div>

        {/* 动态电池卡与双数值 */}
        <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-sm">
            <span className="text-[10px] text-white/70 block">今日累计</span>
            <span className="text-base font-bold text-white block mt-0.5">{formatDuration(todaySec)}</span>
          </div>
          <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-sm">
            <span className="text-[10px] text-white/70 block">累计总时长</span>
            <span className="text-base font-bold text-white block mt-0.5">
              {formatDuration(totalCompletedSec(sessions))}
            </span>
          </div>
          <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-sm">
            <span className="text-[10px] text-white/70 block">打卡组数</span>
            <span className="text-base font-bold text-yellow-300 block mt-0.5">{sessions.length} 组</span>
          </div>
        </div>
      </section>

      {/* 4. 成就勋章展台 (点击弹出成就馆) */}
      <section
        onClick={() => setAchievementsModalOpen(true)}
        className="flex items-center justify-between rounded-[24px] bg-white p-4 shadow-soft border-2 border-black/5 cursor-pointer hover:border-amber-300 transition"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-500 shadow-sm">
            <Trophy size={22} className="fill-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">工位成就勋章</h3>
            <p className="text-xs text-muted mt-0.5">
              已解锁 {sessions.length >= 1 ? "1" : "0"}/4 个勋章，点击查看全部
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm ring-2 ring-white">
              🌟
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-sm grayscale ring-2 ring-white">
              🔥
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-sm grayscale ring-2 ring-white">
              ⚡
            </span>
          </div>
          <ChevronRight size={16} className="text-stone-400" />
        </div>
      </section>

      {/* 5. 习惯配置胶囊卡 */}
      <section className="rounded-[24px] bg-white p-5 shadow-soft border-2 border-black/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={17} className="text-leaf" />
            <h3 className="font-bold text-sm text-ink">我的微运动习惯设定</h3>
          </div>
          <button
            onClick={onEdit}
            className="text-xs font-bold text-leaf hover:underline"
            type="button"
          >
            自定义调整
          </button>
        </div>

        {/* 活泼微胶囊标签 */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="rounded-xl bg-amber-50 border border-amber-200/80 px-3 py-1.5 text-xs font-semibold text-amber-900">
            ⏱️ {preferences.durationMin} 分钟 ({preferences.sessionDurationSec} 秒)
          </span>
          <span className="rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-900">
            🎯 {preferences.targetAreas.join("、") || "全身体态"}
          </span>
          <span className="rounded-xl bg-sky-50 border border-sky-200/80 px-3 py-1.5 text-xs font-semibold text-sky-900">
            🪑 {preferences.space}
          </span>
          <span className="rounded-xl bg-purple-50 border border-purple-200/80 px-3 py-1.5 text-xs font-semibold text-purple-900">
            ⚡ {preferences.intensity}
          </span>
        </div>
      </section>

      {/* 6. 打卡足迹抽屉 (可折叠查看往期打卡) */}
      <section className="rounded-[24px] bg-white p-5 shadow-soft border-2 border-black/5 space-y-3">
        <button
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="flex w-full items-center justify-between text-left"
          type="button"
        >
          <div className="flex items-center gap-2">
            <Calendar size={17} className="text-leaf" />
            <h3 className="font-bold text-sm text-ink">
              往期打卡足迹 ({sortedSessions.length} 次)
            </h3>
          </div>
          <span className="text-xs font-semibold text-leaf flex items-center gap-1">
            {historyExpanded ? "收起" : "展开明细"}
            <ChevronRight
              size={14}
              className={cn("transition-transform", historyExpanded && "rotate-90")}
            />
          </span>
        </button>

        {historyExpanded && (
          <div className="space-y-3 pt-2 animate-fade-in">
            {sortedSessions.length === 0 ? (
              <p className="rounded-2xl bg-paper p-4 text-center text-xs text-muted">
                还没有完成过微运动，快去首页启动第一次打卡吧！
              </p>
            ) : (
              sortedSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl bg-paper p-3.5 border border-black/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-ink block">{session.date}</span>
                    <span className="text-muted text-[11px] block mt-0.5">
                      {copy.common.targetPriority(areaLabels(session.targetAreas))} · {formatDuration(session.actualCompletedSec)}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      onReplay(session.exerciseIds, session.targetAreas, session.plannedDurationSec)
                    }
                    className="rounded-full bg-white px-3 py-1.5 font-bold text-leaf shadow-sm border border-black/5 hover:bg-moss/40 transition shrink-0"
                    type="button"
                  >
                    再练一次
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* 7. 多邻国 3D 物理按键风格操作按钮 */}
      <div className="space-y-3 pt-2">
        <button
          className="w-full rounded-2xl bg-leaf py-3.5 text-base font-bold text-white shadow-[0_5px_0_#4f6e52] hover:translate-y-[2px] hover:shadow-[0_3px_0_#4f6e52] active:translate-y-[5px] active:shadow-none transition-all"
          onClick={onEdit}
          type="button"
        >
          {copy.profile.editPreferences}
        </button>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-100 py-3 text-xs font-semibold text-stone-600 hover:bg-red-50 hover:text-red-600 transition"
          onClick={() => (onSignOut ? onSignOut() : supabase.auth.signOut())}
          type="button"
        >
          <LogOut size={14} />
          退出登录
        </button>
      </div>

      {/* 弹窗组件挂载 */}
      <StreakCalendarModal
        isOpen={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        streak={streak}
        sessions={sessions}
      />
      <EnergyDetailModal
        isOpen={energyModalOpen}
        onClose={() => setEnergyModalOpen(false)}
        todaySec={todaySec}
        sessions={sessions}
      />
      <AchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
        streak={streak}
        sessionsCount={sessions.length}
      />
    </div>
  );
}

function ExerciseImage({
  exercise,
  large = false,
  immersive = false
}: {
  exercise: Exercise;
  large?: boolean;
  immersive?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imageSrc = exercise.coverImage;

  useEffect(() => {
    setFailed(false);
  }, [exercise.id, imageSrc]);

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[8px]",
        immersive
          ? "w-full bg-white shadow-soft"
          : large
            ? "w-full bg-white shadow-soft"
            : "h-24 w-28 bg-moss/70"
      )}
    >
      {!failed ? (
        <img
          alt={exercise.name}
          className={immersive || large ? "block h-auto w-full" : "h-full w-full object-cover"}
          onError={() => setFailed(true)}
          src={imageSrc}
        />
      ) : large || immersive ? (
        <div aria-label={copy.player.imagePlaceholder} className="h-full w-full bg-white" />
      ) : (
        <span className="px-3 text-center text-xs leading-5 text-leaf">{copy.player.imagePlaceholder}</span>
      )}
    </div>
  );
}

export default App;

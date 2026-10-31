-- 1. 创建偏好设置表 (Preferences)
CREATE TABLE public.preferences (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    duration_min INTEGER NOT NULL,
    session_duration_sec INTEGER NOT NULL,
    target_areas TEXT[] NOT NULL,
    space TEXT NOT NULL,
    intensity TEXT NOT NULL,
    movement_mode TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON public.preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. 创建已完成运动表 (Completed Sessions)
CREATE TABLE public.completed_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    source TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    date DATE NOT NULL,
    planned_duration_sec INTEGER NOT NULL,
    actual_completed_sec INTEGER NOT NULL,
    movement_count INTEGER NOT NULL,
    target_areas TEXT[] NOT NULL,
    exercise_ids TEXT[] NOT NULL
);
ALTER TABLE public.completed_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completed sessions" ON public.completed_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completed sessions" ON public.completed_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. 创建喜欢的动作表 (Liked Exercises)
CREATE TABLE public.liked_exercises (
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    group_id TEXT NOT NULL,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id)
);
ALTER TABLE public.liked_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own liked exercises" ON public.liked_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own liked exercises" ON public.liked_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own liked exercises" ON public.liked_exercises FOR DELETE USING (auth.uid() = user_id);

-- 4. 废弃的运动表 (Abandoned Sessions)
CREATE TABLE public.abandoned_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    abandoned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    date DATE NOT NULL,
    planned_duration_sec INTEGER NOT NULL,
    actual_completed_sec INTEGER NOT NULL,
    completed_movement_count INTEGER NOT NULL,
    movement_count INTEGER NOT NULL,
    target_areas TEXT[] NOT NULL,
    exercise_ids TEXT[] NOT NULL,
    current_exercise_index INTEGER NOT NULL
);
ALTER TABLE public.abandoned_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own abandoned sessions" ON public.abandoned_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own abandoned sessions" ON public.abandoned_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

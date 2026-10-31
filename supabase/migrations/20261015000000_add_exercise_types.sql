ALTER TABLE public.preferences ADD COLUMN IF NOT EXISTS exercise_types TEXT[] DEFAULT '{"拉伸"}';

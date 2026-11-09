import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cdpgjujgovomsqsgxzqz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BBFoLf-tOardisfL_YRYLw_m3ZUK1R3';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);


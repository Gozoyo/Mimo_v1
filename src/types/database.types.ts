export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      preferences: {
        Row: {
          user_id: string;
          duration_min: number;
          session_duration_sec: number;
          exercise_types: string[];
          target_areas: string[];
          space: string;
          intensity: string;
          movement_mode: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          duration_min: number;
          session_duration_sec: number;
          exercise_types?: string[];
          target_areas: string[];
          space: string;
          intensity: string;
          movement_mode?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          duration_min?: number;
          session_duration_sec?: number;
          exercise_types?: string[];
          target_areas?: string[];
          space?: string;
          intensity?: string;
          movement_mode?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      completed_sessions: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          completed_at: string;
          date: string;
          planned_duration_sec: number;
          actual_completed_sec: number;
          movement_count: number;
          target_areas: string[];
          exercise_ids: string[];
        };
        Insert: {
          id: string;
          user_id: string;
          source: string;
          completed_at: string;
          date: string;
          planned_duration_sec: number;
          actual_completed_sec: number;
          movement_count: number;
          target_areas: string[];
          exercise_ids: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: string;
          completed_at?: string;
          date?: string;
          planned_duration_sec?: number;
          actual_completed_sec?: number;
          movement_count?: number;
          target_areas?: string[];
          exercise_ids?: string[];
        };
        Relationships: [];
      };
      liked_exercises: {
        Row: {
          user_id: string;
          group_id: string;
          liked_at: string;
        };
        Insert: {
          user_id: string;
          group_id: string;
          liked_at?: string;
        };
        Update: {
          user_id?: string;
          group_id?: string;
          liked_at?: string;
        };
        Relationships: [];
      };
      abandoned_sessions: {
        Row: {
          id: string;
          user_id: string;
          abandoned_at: string;
          date: string;
          planned_duration_sec: number;
          actual_completed_sec: number;
          completed_movement_count: number;
          movement_count: number;
          target_areas: string[];
          exercise_ids: string[];
          current_exercise_index: number;
        };
        Insert: {
          id: string;
          user_id: string;
          abandoned_at: string;
          date: string;
          planned_duration_sec: number;
          actual_completed_sec: number;
          completed_movement_count: number;
          movement_count: number;
          target_areas: string[];
          exercise_ids: string[];
          current_exercise_index: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          abandoned_at?: string;
          date?: string;
          planned_duration_sec?: number;
          actual_completed_sec?: number;
          completed_movement_count?: number;
          movement_count?: number;
          target_areas?: string[];
          exercise_ids?: string[];
          current_exercise_index?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

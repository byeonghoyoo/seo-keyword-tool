import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

// Client for browser-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database types
export interface Database {
  public: {
    Tables: {
      analysis_jobs: {
        Row: {
          id: string;
          target_url: string;
          domain: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          progress: number;
          current_phase: string;
          keywords_found: number;
          processed_keywords: number;
          total_keywords: number;
          current_keyword: string | null;
          analysis_options: Record<string, any>;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          target_url: string;
          domain: string;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          progress?: number;
          current_phase?: string;
          keywords_found?: number;
          processed_keywords?: number;
          total_keywords?: number;
          current_keyword?: string | null;
          analysis_options?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          target_url?: string;
          domain?: string;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          progress?: number;
          current_phase?: string;
          keywords_found?: number;
          processed_keywords?: number;
          total_keywords?: number;
          current_keyword?: string | null;
          analysis_options?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
        };
      };
      keyword_results: {
        Row: {
          id: string;
          job_id: string;
          keyword: string;
          position: number;
          page: number;
          type: 'organic' | 'ad' | 'shopping' | 'local';
          url: string;
          title: string;
          snippet: string | null;
          search_volume: number | null;
          competition: 'low' | 'medium' | 'high' | null;
          estimated_cpc: number | null;
          previous_position: number | null;
          discovered_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          keyword: string;
          position: number;
          page: number;
          type: 'organic' | 'ad' | 'shopping' | 'local';
          url: string;
          title: string;
          snippet?: string | null;
          search_volume?: number | null;
          competition?: 'low' | 'medium' | 'high' | null;
          estimated_cpc?: number | null;
          previous_position?: number | null;
          discovered_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          keyword?: string;
          position?: number;
          page?: number;
          type?: 'organic' | 'ad' | 'shopping' | 'local';
          url?: string;
          title?: string;
          snippet?: string | null;
          search_volume?: number | null;
          competition?: 'low' | 'medium' | 'high' | null;
          estimated_cpc?: number | null;
          previous_position?: number | null;
          discovered_at?: string;
          created_at?: string;
        };
      };
      analysis_logs: {
        Row: {
          id: string;
          job_id: string;
          level: 'info' | 'warning' | 'error' | 'success';
          message: string;
          phase: string | null;
          timestamp: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          level: 'info' | 'warning' | 'error' | 'success';
          message: string;
          phase?: string | null;
          timestamp?: string;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          level?: 'info' | 'warning' | 'error' | 'success';
          message?: string;
          phase?: string | null;
          timestamp?: string;
          metadata?: Record<string, any> | null;
        };
      };
    };
  };
}
-- SEO Keyword Discovery Tool Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analysis Jobs Table
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_phase TEXT DEFAULT 'analyzing',
  keywords_found INTEGER DEFAULT 0,
  processed_keywords INTEGER DEFAULT 0,
  total_keywords INTEGER DEFAULT 0,
  current_keyword TEXT,
  analysis_options JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Keyword Results Table
CREATE TABLE IF NOT EXISTS keyword_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER NOT NULL,
  page INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'organic' CHECK (type IN ('organic', 'ad', 'shopping', 'local')),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  snippet TEXT,
  search_volume INTEGER,
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  estimated_cpc DECIMAL(10,2),
  previous_position INTEGER,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis Logs Table
CREATE TABLE IF NOT EXISTS analysis_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
  message TEXT NOT NULL,
  phase TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created_at ON analysis_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_results_job_id ON keyword_results(job_id);
CREATE INDEX IF NOT EXISTS idx_keyword_results_keyword ON keyword_results(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_results_position ON keyword_results(position);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_job_id ON analysis_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_timestamp ON analysis_logs(timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_analysis_jobs_updated_at 
  BEFORE UPDATE ON analysis_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_logs ENABLE ROW LEVEL SECURITY;

-- Allow public access for demo purposes (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on analysis_jobs" ON analysis_jobs FOR ALL USING (true);
CREATE POLICY "Allow all operations on keyword_results" ON keyword_results FOR ALL USING (true);
CREATE POLICY "Allow all operations on analysis_logs" ON analysis_logs FOR ALL USING (true);

-- Create a function to get analysis statistics
CREATE OR REPLACE FUNCTION get_analysis_statistics()
RETURNS TABLE (
  total_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT,
  total_keywords BIGINT,
  avg_keywords_per_job NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_jobs,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::BIGINT as completed_jobs,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::BIGINT as failed_jobs,
    COALESCE(SUM(keywords_found), 0)::BIGINT as total_keywords,
    COALESCE(AVG(keywords_found), 0)::NUMERIC as avg_keywords_per_job
  FROM analysis_jobs;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old jobs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_jobs(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analysis_jobs 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old
  AND status IN ('completed', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
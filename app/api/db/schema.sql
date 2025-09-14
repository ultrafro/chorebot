-- Create the rooms table
-- This SQL should be run in your Supabase SQL editor to set up the database schema

-- Drop existing table if it exists (WARNING: This will delete all data!)
DROP TABLE IF EXISTS rooms CASCADE;

CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hostid TEXT NOT NULL,
  hostpeerid TEXT DEFAULT NULL,
  currentcontrollingclientid TEXT DEFAULT NULL,
  info JSONB DEFAULT '{}'
);

-- Create an index on hostid for faster queries
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(hostid);

-- Create an index on currentcontrollingclientid for faster queries
CREATE INDEX IF NOT EXISTS idx_rooms_controlling_client ON rooms(currentcontrollingclientid);

-- Note: removed updated_at timestamp and related trigger since it's not in the required schema

-- Enable Row Level Security (RLS) for additional security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows service role to do everything
-- (our API routes will use the service role key)
CREATE POLICY "Service role can do everything" ON rooms
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

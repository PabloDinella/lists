-- Tasks table for GTD app
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('inbox', 'next', 'waiting', 'scheduled', 'someday', 'completed', 'trashed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  project TEXT,
  area TEXT,
  tags TEXT[],
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_project ON tasks(project);
CREATE INDEX idx_tasks_area ON tasks(area);

-- Row level security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy for users to only access their own tasks
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL
  USING (auth.uid() = user_id);

-- Projects table for GTD app
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'on_hold', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  area TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for projects table
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_area ON projects(area);

-- Enable RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy for users to only access their own projects
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL
  USING (auth.uid() = user_id);

-- Areas of focus table for GTD app
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for areas table
CREATE INDEX idx_areas_user_id ON areas(user_id);

-- Enable RLS for areas
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- Policy for users to only access their own areas
CREATE POLICY "Users can manage their own areas" ON areas
  FOR ALL
  USING (auth.uid() = user_id);

-- Function for audit log
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at columns and triggers
ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_modified_column();

ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE TRIGGER update_projects_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_modified_column();

ALTER TABLE areas ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE TRIGGER update_areas_timestamp BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION update_modified_column();
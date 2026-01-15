-- Create enum types
CREATE TYPE monitor_status AS ENUM ('up', 'down', 'degraded');
CREATE TYPE incident_status AS ENUM ('open', 'resolved');

-- Users table (extends Supabase auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_password TEXT,
  smtp_from_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Monitors table
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  check_interval INTEGER DEFAULT 300, -- 5 minutes in seconds
  timeout INTEGER DEFAULT 30,
  status monitor_status DEFAULT 'up',
  last_check TIMESTAMP WITH TIME ZONE,
  last_status_change TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Monitor checks (history of checks)
CREATE TABLE monitor_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status monitor_status NOT NULL,
  response_time INTEGER, -- in milliseconds
  status_code INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status incident_status DEFAULT 'open',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  email_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Status page settings
CREATE TABLE status_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  show_incidents BOOLEAN DEFAULT true,
  custom_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Status page monitors (which monitors to show on status page)
CREATE TABLE status_page_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_page_id UUID NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_monitors_user_id ON monitors(user_id);
CREATE INDEX idx_monitors_is_active ON monitors(is_active);
CREATE INDEX idx_monitor_checks_monitor_id ON monitor_checks(monitor_id);
CREATE INDEX idx_monitor_checks_checked_at ON monitor_checks(checked_at DESC);
CREATE INDEX idx_incidents_monitor_id ON incidents(monitor_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_email_sent ON notifications(email_sent);
CREATE INDEX idx_status_pages_user_id ON status_pages(user_id);
CREATE INDEX idx_status_pages_slug ON status_pages(slug);
CREATE INDEX idx_status_page_monitors_status_page_id ON status_page_monitors(status_page_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_page_monitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for monitors
CREATE POLICY "Users can view their own monitors" ON monitors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create monitors" ON monitors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own monitors" ON monitors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own monitors" ON monitors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for monitor_checks
CREATE POLICY "Users can view their monitor checks" ON monitor_checks FOR SELECT 
  USING (monitor_id IN (SELECT id FROM monitors WHERE user_id = auth.uid()));

-- RLS Policies for incidents
CREATE POLICY "Users can view their incidents" ON incidents FOR SELECT 
  USING (monitor_id IN (SELECT id FROM monitors WHERE user_id = auth.uid()));

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for status_pages
CREATE POLICY "Users can view their status pages" ON status_pages FOR SELECT 
  USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can create status pages" ON status_pages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own status pages" ON status_pages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own status pages" ON status_pages FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for status_page_monitors
CREATE POLICY "Anyone can view public status page monitors" ON status_page_monitors FOR SELECT 
  USING (status_page_id IN (SELECT id FROM status_pages WHERE is_public = true) OR 
         status_page_id IN (SELECT id FROM status_pages WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS saved_looks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  look_data JSONB NOT NULL,
  search_query TEXT,
  celebrity_name TEXT,
  total_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_looks_user_id ON saved_looks(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_looks_created_at ON saved_looks(created_at DESC);

alter publication supabase_realtime add table saved_looks;
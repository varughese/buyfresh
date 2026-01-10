-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id TEXT PRIMARY KEY,
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on id for fast lookups (id is already indexed as PRIMARY KEY, but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_shopping_lists_id ON shopping_lists(id);

-- Create index on created_at for potential cleanup queries
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_at ON shopping_lists(created_at);


ALTER TABLE public.materials
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;

-- Nella query/GUI puoi impostare nullable a piacere, qui si preferisce nullable per backward compatibility

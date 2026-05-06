-- Drop existing foreign key constraints if they exist
ALTER TABLE public.estimate_stratigraphies 
DROP CONSTRAINT IF EXISTS estimate_stratigraphies_original_stratigraphy_id_fkey CASCADE;

ALTER TABLE public.estimate_stratigraphies 
DROP CONSTRAINT IF EXISTS estimate_stratigraphies_stratigraphy_id_fkey CASCADE;

-- Recreate foreign key constraints with ON DELETE SET NULL
-- This ensures that when a stratigraphy is deleted from the main table,
-- the estimate_stratigraphies records are preserved but the reference is set to NULL
ALTER TABLE public.estimate_stratigraphies 
ADD CONSTRAINT estimate_stratigraphies_original_stratigraphy_id_fkey 
FOREIGN KEY (original_stratigraphy_id) 
REFERENCES public.stratigraphies(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public.estimate_stratigraphies 
ADD CONSTRAINT estimate_stratigraphies_stratigraphy_id_fkey 
FOREIGN KEY (stratigraphy_id) 
REFERENCES public.stratigraphies(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add comment to explain the behavior
COMMENT ON CONSTRAINT estimate_stratigraphies_original_stratigraphy_id_fkey 
ON public.estimate_stratigraphies IS 
'Foreign key with ON DELETE SET NULL - when a stratigraphy is deleted from main table, estimate stratigraphies are preserved as snapshots';
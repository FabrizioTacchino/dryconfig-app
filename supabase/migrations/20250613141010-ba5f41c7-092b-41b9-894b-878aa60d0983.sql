
-- Add new columns to estimate_stratigraphies table for independent snapshots
ALTER TABLE public.estimate_stratigraphies 
ADD COLUMN stratigraphy_data jsonb DEFAULT NULL,
ADD COLUMN layers_data jsonb DEFAULT NULL,
ADD COLUMN prices_updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN is_snapshot boolean DEFAULT false,
ADD COLUMN original_stratigraphy_id uuid DEFAULT NULL;

-- Add comment to clarify the purpose of new columns
COMMENT ON COLUMN public.estimate_stratigraphies.stratigraphy_data IS 'Complete snapshot of stratigraphy data at time of insertion';
COMMENT ON COLUMN public.estimate_stratigraphies.layers_data IS 'Complete snapshot of layers and materials data';
COMMENT ON COLUMN public.estimate_stratigraphies.prices_updated_at IS 'Timestamp of last price update';
COMMENT ON COLUMN public.estimate_stratigraphies.is_snapshot IS 'Flag indicating if this is an independent copy';
COMMENT ON COLUMN public.estimate_stratigraphies.original_stratigraphy_id IS 'Reference to original stratigraphy for price updates';

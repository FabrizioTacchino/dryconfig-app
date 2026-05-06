-- Add comprehensive cost breakdown columns to stratigraphies table
ALTER TABLE stratigraphies ADD COLUMN IF NOT EXISTS material_cost_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE stratigraphies ADD COLUMN IF NOT EXISTS labor_cost_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE stratigraphies ADD COLUMN IF NOT EXISTS screw_cost_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE stratigraphies ADD COLUMN IF NOT EXISTS corner_cost_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE stratigraphies ADD COLUMN IF NOT EXISTS tape_cost_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE stratigraphies ADD COLUMN IF NOT EXISTS putty_cost_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE stratigraphies ADD COLUMN IF NOT EXISTS accessories_cost_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE stratigraphies ADD COLUMN IF NOT EXISTS comprehensive_cost_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE stratigraphies ADD COLUMN IF NOT EXISTS installation_time_per_sqm NUMERIC DEFAULT 0;

-- Update existing stratigraphies with calculated costs using the comprehensive function
SELECT update_comprehensive_costs();

-- Add comment for documentation
COMMENT ON COLUMN stratigraphies.material_cost_per_sqm IS 'Cost of materials per square meter';
COMMENT ON COLUMN stratigraphies.labor_cost_per_sqm IS 'Labor cost per square meter based on installation time and hourly rate';
COMMENT ON COLUMN stratigraphies.screw_cost_per_sqm IS 'Cost of screws per square meter';
COMMENT ON COLUMN stratigraphies.corner_cost_per_sqm IS 'Cost of corner accessories per square meter';
COMMENT ON COLUMN stratigraphies.tape_cost_per_sqm IS 'Cost of tape accessories per square meter';
COMMENT ON COLUMN stratigraphies.putty_cost_per_sqm IS 'Cost of putty/stucco accessories per square meter';
COMMENT ON COLUMN stratigraphies.accessories_cost_per_sqm IS 'Total cost of accessories per square meter';
COMMENT ON COLUMN stratigraphies.comprehensive_cost_per_sqm IS 'Total comprehensive cost per square meter including all components';
COMMENT ON COLUMN stratigraphies.installation_time_per_sqm IS 'Total installation time in minutes per square meter';